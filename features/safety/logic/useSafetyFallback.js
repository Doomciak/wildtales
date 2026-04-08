import { useEffect, useRef, useState } from "react";
import { Alert } from "react-native";
import * as SMS from "expo-sms";
import * as Location from "expo-location";

import { sendLocationLogToApi, syncPendingLocationLogs } from "../../../api";
import {
  getLatestLocationLog,
  getLatestPendingLocationLog,
  getLatestPendingLocationLogForTrip,
  getPendingLocationLogs,
  getPendingLocationLogsForTrip,
  incrementLocationLogAttempt,
  markLocationLogSent,
  markLocationLogSmsPrepared,
  saveLocationLog,
} from "../../../db";
import {
  appendMeaningfulCoordinate,
  buildCoordinateLabel,
  buildPendingLocationLog,
  buildPlaceNameFromCoords,
  getCleanPointFromCoords,
} from "./trackingHelpers";
import {
  AUTO_CHECK_INTERVAL_MS,
  TEST_FALLBACK_DELAY_MS,
} from "./safetyConfig";
import { isDeviceOffline, shouldOpenAutoText } from "./safetyHelpers";

export default function useSafetyFallback({
  contact,
  tripActive,
  tripId,
  refreshLogs,
  setTripLogs,
  setUpdatesMessage,
  setNowTimestamp,
  getBestPosition,
  routeCoordsRef,
  setRouteState,
}) {
  const [retryingUploads, setRetryingUploads] = useState(false);
  const [smsFallbackTestActive, setSmsFallbackTestActive] = useState(false);

  // Store the interval used for automatic maintenance checks.
  const autoCheckRef = useRef(null);

  // Store the timeout used for the fallback test.
  const smsFallbackTestTimeoutRef = useRef(null);

  // Keep track of logs that already triggered the SMS fallback.
  const autoSmsTriggeredIdsRef = useRef(new Set());

  // Prevent overlapping auto-maintenance runs.
  const autoMaintenanceBusyRef = useRef(false);

  // Prevent overlapping sync requests.
  const syncBusyRef = useRef(false);

  useEffect(() => {
    stopAutoCheckOnly();

    // Start the automatic maintenance interval while a trip is active.
    if (tripActive && tripId) {
      autoCheckRef.current = setInterval(() => {
        runAutoMaintenance();
      }, AUTO_CHECK_INTERVAL_MS);
    }

    return () => {
      stopAutoCheckOnly();
    };
  }, [tripActive, tripId, contact]);

  // Clear the automatic maintenance interval.
  function stopAutoCheckOnly() {
    if (autoCheckRef.current) {
      clearInterval(autoCheckRef.current);
      autoCheckRef.current = null;
    }
  }

  // Clear the fallback test timeout.
  function stopFallbackTestOnly() {
    if (smsFallbackTestTimeoutRef.current) {
      clearTimeout(smsFallbackTestTimeoutRef.current);
      smsFallbackTestTimeoutRef.current = null;
    }

    setSmsFallbackTestActive(false);
  }

  // Reset fallback-related state.
  function resetFallbackState() {
    autoSmsTriggeredIdsRef.current.clear();
    stopFallbackTestOnly();
  }

  // Upload one log to the API and update its send status.
  async function uploadSingleLog(log) {
    const offline = await isDeviceOffline();

    if (offline) {
      return false;
    }

    try {
      await sendLocationLogToApi(log);
      await markLocationLogSent(log.id, "api");
      return true;
    } catch (error) {
      console.log("Send log error:", error);
      await incrementLocationLogAttempt(log.id);
      return false;
    }
  }

  // Sync all pending logs without showing alerts.
  async function syncPendingUploadsSilently() {
    if (syncBusyRef.current) {
      return null;
    }

    const offline = await isDeviceOffline();

    if (offline) {
      return {
        total: 0,
        sent: 0,
        failed: 0,
        skipped: true,
      };
    }

    syncBusyRef.current = true;

    try {
      const result = await syncPendingLocationLogs();
      await refreshLogs();
      return result;
    } catch (error) {
      console.log("Silent sync error:", error);
      return null;
    } finally {
      syncBusyRef.current = false;
    }
  }

  // Open the SMS app with the selected location log.
  async function sendSmsForLog(log) {
    if (!contact) {
      Alert.alert("No contact", "Please choose a safety contact first.");
      return false;
    }

    const smsAvailable = await SMS.isAvailableAsync();

    if (!smsAvailable) {
      Alert.alert("Text unavailable", "Text messaging is not available here.");
      return false;
    }

    const message =
      `WildTales safety update\n` +
      `Last known location: ${Number(log.latitude).toFixed(5)}, ${Number(
        log.longitude
      ).toFixed(5)}\n` +
      `${log.placeName ? `Place: ${log.placeName}\n` : ""}` +
      `Recorded: ${new Date(log.recordedAt).toLocaleString()}`;

    const smsResult = await SMS.sendSMSAsync([contact.phone], message);

    if (smsResult?.result === "cancelled") {
      return false;
    }

    // Mark the log so the app knows an SMS fallback was prepared.
    if (log.id) {
      await markLocationLogSmsPrepared(log.id);
    }

    await refreshLogs();
    return true;
  }

  // Check whether any pending trip log should trigger the SMS fallback.
  async function checkAutoSmsFallback() {
    try {
      if (!tripActive || !contact || !tripId) {
        return;
      }

      const pendingLogs = await getPendingLocationLogsForTrip(tripId);

      if (!pendingLogs.length) {
        return;
      }

      // Find the newest pending log that meets the fallback conditions.
      const fallbackLog = [...pendingLogs]
        .reverse()
        .find(
          (log) =>
            !autoSmsTriggeredIdsRef.current.has(log.id) &&
            shouldOpenAutoText(log)
        );

      if (!fallbackLog) {
        return;
      }

      autoSmsTriggeredIdsRef.current.add(fallbackLog.id);

      Alert.alert(
        "Text update ready",
        "Online sending has not worked, so a text update will open with the latest saved location."
      );

      const smsOpened = await sendSmsForLog(fallbackLog);

      if (smsOpened) {
        setUpdatesMessage(
          "Text update opened because online sending was delayed."
        );
        return;
      }

      // Remove the log id again if the SMS screen did not open.
      autoSmsTriggeredIdsRef.current.delete(fallbackLog.id);
    } catch (error) {
      console.log("Auto text fallback error:", error);
    }
  }

  // Run background maintenance for pending uploads and SMS fallback checks.
  async function runAutoMaintenance() {
    if (autoMaintenanceBusyRef.current) {
      return;
    }

    autoMaintenanceBusyRef.current = true;

    try {
      await syncPendingUploadsSilently();
      await checkAutoSmsFallback();
    } catch (error) {
      console.log("Auto maintenance error:", error);
    } finally {
      autoMaintenanceBusyRef.current = false;
    }
  }

  // Retry sending pending logs and update the status message.
  async function retryPendingUploads() {
    if (retryingUploads || syncBusyRef.current) {
      return;
    }

    try {
      setRetryingUploads(true);

      const offline = await isDeviceOffline();

      if (offline) {
        setUpdatesMessage(
          "Online updates are unavailable right now, but route tracking is still saving on this device."
        );
        return;
      }

      setUpdatesMessage("Retrying pending online updates...");

      const pendingBefore = await getPendingLocationLogs();

      if (!pendingBefore.length) {
        setUpdatesMessage("Everything is already up to date.");
        return;
      }

      const result = await syncPendingUploadsSilently();
      await checkAutoSmsFallback();

      const pendingAfter = await getPendingLocationLogs();

      if (!pendingAfter.length) {
        setUpdatesMessage("Retry complete. All pending updates were sent.");
        return;
      }

      if (result && result.sent > 0) {
        setUpdatesMessage(
          `Retry complete. ${pendingAfter.length} update(s) still waiting.`
        );
        return;
      }

      setUpdatesMessage(
        "Retry finished, but updates are still waiting for signal or server response."
      );
    } catch (error) {
      console.log("Retry uploads error:", error);
      setUpdatesMessage("Retry failed. Please try again.");
    } finally {
      setRetryingUploads(false);
    }
  }

  // Open an SMS using the most useful available location log.
  async function sendLatestLocationSms() {
    try {
      let latestLog = null;

      // Read the latest pending log for the active trip first.
      if (tripActive && tripId) {
        latestLog = await getLatestPendingLocationLogForTrip(tripId);
      }

      // Fall back to any latest pending log.
      if (!latestLog) {
        latestLog = await getLatestPendingLocationLog();
      }

      // Fall back to the latest saved log.
      if (!latestLog) {
        latestLog = await getLatestLocationLog();
      }

      // Fall back to the device's last known location if no log exists yet.
      if (!latestLog) {
        const fallback = await Location.getLastKnownPositionAsync({
          maxAge: 1000 * 60 * 30,
          requiredAccuracy: 1000,
        });

        if (!fallback) {
          Alert.alert("No location", "No saved or recent location was found.");
          return;
        }

        latestLog = {
          id: null,
          latitude: fallback.coords.latitude,
          longitude: fallback.coords.longitude,
          placeName: buildCoordinateLabel(
            fallback.coords.latitude,
            fallback.coords.longitude
          ),
          recordedAt: new Date().toISOString(),
        };
      }

      const smsOpened = await sendSmsForLog(latestLog);

      if (smsOpened) {
        setUpdatesMessage("Text update opened with the latest saved location.");
      }
    } catch (error) {
      console.log("Send SMS error:", error);
      Alert.alert("Text error", "We could not open the text update.");
    }
  }

  // Start a test that forces the SMS fallback after a short delay.
  async function triggerSmsFallbackTest() {
    try {
      if (smsFallbackTestActive) {
        return;
      }

      if (!tripActive || !tripId) {
        Alert.alert(
          "Start trip first",
          "Start a trip first so the app has a live location to test."
        );
        return;
      }

      if (!contact) {
        Alert.alert("No contact", "Please choose a safety contact first.");
        return;
      }

      let testLog = await getLatestPendingLocationLogForTrip(tripId);

      // Create a new pending log if the trip does not have one yet.
      if (!testLog) {
        const position = await getBestPosition();

        if (!position) {
          Alert.alert(
            "No location",
            "We could not get a test location. Try again in a moment."
          );
          return;
        }

        // Build a clean point from the current GPS position.
        const nextPoint = getCleanPointFromCoords(position?.coords);

        if (!nextPoint) {
          Alert.alert(
            "Location not ready",
            "Location accuracy is still too weak. Try again in a few seconds."
          );
          return;
        }

        // Add the point to the current route if it passes the point checks.
        const nextRouteCoords = appendMeaningfulCoordinate(
          routeCoordsRef.current,
          nextPoint
        );

        if (nextRouteCoords !== routeCoordsRef.current) {
          setRouteState(nextRouteCoords);
        }

        setNowTimestamp(Date.now());

        // Build a readable place name for the new test log.
        const placeName = await buildPlaceNameFromCoords(
          nextPoint.latitude,
          nextPoint.longitude,
          "Reverse geocode watch error:"
        );
        const recordedAt = new Date().toISOString();

        // Save the new location log in the local database.
        const newLogId = await saveLocationLog({
          tripId,
          latitude: nextPoint.latitude,
          longitude: nextPoint.longitude,
          placeName,
          recordedAt,
        });

        // Build the new log in pending format for local state.
        testLog = buildPendingLocationLog({
          id: newLogId,
          tripId,
          latitude: nextPoint.latitude,
          longitude: nextPoint.longitude,
          placeName,
          recordedAt,
        });

        setTripLogs((current) => [...current, testLog]);
        await refreshLogs();
      }

      if (!testLog?.id) {
        Alert.alert(
          "No pending update",
          "We could not create a test update for this trip."
        );
        return;
      }

      setSmsFallbackTestActive(true);
      setUpdatesMessage(
        "Fallback test started. In 20 seconds the app will open the text fallback using a test location log."
      );

      smsFallbackTestTimeoutRef.current = setTimeout(async () => {
        try {
          // Increase the failed attempt count so the log meets the fallback rule.
          await incrementLocationLogAttempt(testLog.id);
          await incrementLocationLogAttempt(testLog.id);
          await incrementLocationLogAttempt(testLog.id);

          await refreshLogs();
          await checkAutoSmsFallback();
        } catch (error) {
          console.log("Fallback test error:", error);
          setUpdatesMessage("Fallback test failed.");
        } finally {
          smsFallbackTestTimeoutRef.current = null;
          setSmsFallbackTestActive(false);
        }
      }, TEST_FALLBACK_DELAY_MS);
    } catch (error) {
      console.log("Trigger fallback test error:", error);
      setSmsFallbackTestActive(false);
      setUpdatesMessage("Fallback test failed.");
    }
  }

  return {
    retryingUploads,
    smsFallbackTestActive,

    stopAutoCheckOnly,
    stopFallbackTestOnly,
    resetFallbackState,

    uploadSingleLog,
    runAutoMaintenance,
    retryPendingUploads,
    sendLatestLocationSms,
    triggerSmsFallbackTest,
  };
}