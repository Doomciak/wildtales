import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, AppState } from "react-native";
import * as Contacts from "expo-contacts";
import * as SMS from "expo-sms";
import * as Location from "expo-location";
import * as Network from "expo-network";

import { sendLocationLogToApi, syncPendingLocationLogs } from "../../api";
import {
  buildJourneyTitleFromTrip,
  getPathDistanceKm,
  getMapRegionForPoints,
} from "../../utils/travel";
import {
  getActiveTripSession,
  getLatestLocationLog,
  getLatestPendingLocationLog,
  getLatestPendingLocationLogForTrip,
  getLocationLogsForTrip,
  getPendingLocationLogs,
  getPendingLocationLogsForTrip,
  getRecentLocationLogs,
  getSafetyContact,
  incrementLocationLogAttempt,
  markLocationLogSent,
  markLocationLogSmsPrepared,
  saveLocationLog,
  saveSafetyContact,
  startTripSession,
  stopTripSession,
} from "../../db";
import { BACKGROUND_LOCATION_TASK } from "./locationTask";
import {
  appendMeaningfulCoordinate,
  buildCoordinateLabel,
  buildPendingLocationLog,
  buildPlaceNameFromCoords,
  getCleanPointFromCoords,
} from "./trackingHelpers";

const AUTO_SMS_MAX_AGE_MS = 5 * 60 * 1000;
const AUTO_CHECK_INTERVAL_MS = 15000;
const LIVE_REFRESH_INTERVAL_MS = 5000;

const LIVE_TRACK_TIME_INTERVAL_MS = 5000;
const LIVE_TRACK_DISTANCE_INTERVAL_METERS = 5;

const BACKGROUND_TRACK_TIME_INTERVAL_MS = 8000;
const BACKGROUND_TRACK_DISTANCE_INTERVAL_METERS = 8;

const TEST_FALLBACK_DELAY_MS = 20000;

async function isDeviceOffline() {
  try {
    const state = await Network.getNetworkStateAsync();

    return (
      state.isConnected === false || state.isInternetReachable === false
    );
  } catch (error) {
    console.log("Network state error:", error);
    return false;
  }
}

export default function useSafetyTrip({ onTripFinished } = {}) {
  const [contact, setContact] = useState(null);
  const [tripActive, setTripActive] = useState(false);
  const [tripId, setTripId] = useState(null);
  const [logs, setLogs] = useState([]);
  const [tripLogs, setTripLogs] = useState([]);
  const [routeCoords, setRouteCoords] = useState([]);
  const [retryingUploads, setRetryingUploads] = useState(false);
  const [updatesMessage, setUpdatesMessage] = useState("");
  const [nowTimestamp, setNowTimestamp] = useState(Date.now());
  const [smsFallbackTestActive, setSmsFallbackTestActive] = useState(false);

  const watchRef = useRef(null);
  const autoCheckRef = useRef(null);
  const liveRefreshRef = useRef(null);
  const smsFallbackTestTimeoutRef = useRef(null);
  const autoSmsTriggeredIdsRef = useRef(new Set());
  const autoMaintenanceBusyRef = useRef(false);
  const syncBusyRef = useRef(false);
  const routeCoordsRef = useRef([]);
  const tripIdRef = useRef(null);

  function setCurrentTripId(nextTripId) {
    tripIdRef.current = nextTripId;
    setTripId(nextTripId);
  }

  function setRouteState(nextCoords) {
    routeCoordsRef.current = nextCoords;
    setRouteCoords(nextCoords);
  }

  useEffect(() => {
    tripIdRef.current = tripId;
  }, [tripId]);

  useEffect(() => {
    loadInitialData();

    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        const currentTripId = tripIdRef.current;

        setNowTimestamp(Date.now());
        refreshLogs();

        if (currentTripId) {
          refreshRoute(currentTripId);
          runAutoMaintenance();
        }
      }
    });

    return () => {
      stopWatchingOnly();
      stopAutoCheckOnly();
      stopLiveRefreshOnly();
      stopFallbackTestOnly();
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    routeCoordsRef.current = routeCoords;
  }, [routeCoords]);

  useEffect(() => {
    stopAutoCheckOnly();

    if (tripActive && tripId) {
      autoCheckRef.current = setInterval(() => {
        runAutoMaintenance();
      }, AUTO_CHECK_INTERVAL_MS);
    }

    return () => {
      stopAutoCheckOnly();
    };
  }, [tripActive, tripId, contact]);

  useEffect(() => {
    stopLiveRefreshOnly();

    if (tripActive && tripId) {
      liveRefreshRef.current = setInterval(() => {
        setNowTimestamp(Date.now());
        refreshLogs();
        refreshRoute(tripId);
      }, LIVE_REFRESH_INTERVAL_MS);
    }

    return () => {
      stopLiveRefreshOnly();
    };
  }, [tripActive, tripId]);

  async function loadInitialData() {
    try {
      const savedContact = await getSafetyContact();
      const recentLogs = await getRecentLocationLogs();
      const activeTrip = await getActiveTripSession();

      setContact(savedContact);
      setLogs(recentLogs);

      if (activeTrip) {
        setCurrentTripId(activeTrip.id);
        setTripActive(true);
        setNowTimestamp(Date.now());
        setUpdatesMessage("Trip restored from saved device data.");
        await refreshRoute(activeTrip.id);
        await ensureBackgroundTrackingStarted();
        await beginWatching(activeTrip.id);
        await runAutoMaintenance();
      } else {
        setCurrentTripId(null);
        setRouteState([]);
        setTripLogs([]);
      }
    } catch (error) {
      console.log("Load safety data error:", error);
    }
  }

  function stopWatchingOnly() {
    if (watchRef.current) {
      watchRef.current.remove();
      watchRef.current = null;
    }
  }

  function stopAutoCheckOnly() {
    if (autoCheckRef.current) {
      clearInterval(autoCheckRef.current);
      autoCheckRef.current = null;
    }
  }

  function stopLiveRefreshOnly() {
    if (liveRefreshRef.current) {
      clearInterval(liveRefreshRef.current);
      liveRefreshRef.current = null;
    }
  }

  function stopFallbackTestOnly() {
    if (smsFallbackTestTimeoutRef.current) {
      clearTimeout(smsFallbackTestTimeoutRef.current);
      smsFallbackTestTimeoutRef.current = null;
    }

    setSmsFallbackTestActive(false);
  }

  async function ensureBackgroundTrackingStarted() {
    try {
      const alreadyStarted = await Location.hasStartedLocationUpdatesAsync(
        BACKGROUND_LOCATION_TASK
      );

      if (alreadyStarted) {
        return true;
      }

      await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: BACKGROUND_TRACK_TIME_INTERVAL_MS,
        distanceInterval: BACKGROUND_TRACK_DISTANCE_INTERVAL_METERS,
        pausesUpdatesAutomatically: false,
        showsBackgroundLocationIndicator: false,
        foregroundService: {
          notificationTitle: "WildTales trip tracking",
          notificationBody:
            "WildTales is keeping your route updated while your trip is active.",
          killServiceOnDestroy: false,
        },
      });

      return true;
    } catch (error) {
      console.log("Start background tracking error:", error);
      return false;
    }
  }

  async function stopBackgroundTracking() {
    try {
      const alreadyStarted = await Location.hasStartedLocationUpdatesAsync(
        BACKGROUND_LOCATION_TASK
      );

      if (!alreadyStarted) {
        return;
      }

      await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
    } catch (error) {
      console.log("Stop background tracking error:", error);
    }
  }

  async function chooseContact() {
    try {
      const permission = await Contacts.requestPermissionsAsync();

      if (permission.status !== "granted") {
        Alert.alert("Permission needed", "Please allow access to contacts.");
        return;
      }

      const picked = await Contacts.presentContactPickerAsync();

      if (!picked) {
        return;
      }

      const phoneNumber =
        picked.phoneNumbers && picked.phoneNumbers.length > 0
          ? picked.phoneNumbers[0].number
          : null;

      if (!phoneNumber) {
        Alert.alert("No phone number", "That contact has no phone number.");
        return;
      }

      const cleanContact = {
        name: picked.name || "Unnamed contact",
        phone: phoneNumber,
      };

      await saveSafetyContact(cleanContact);
      setContact(cleanContact);
      setUpdatesMessage("Safety contact updated.");
    } catch (error) {
      console.log("Choose contact error:", error);
      Alert.alert("Contact error", "We could not choose that contact.");
    }
  }

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

  async function refreshLogs() {
    try {
      const recentLogs = await getRecentLocationLogs();
      setLogs(recentLogs);
    } catch (error) {
      console.log("Refresh logs error:", error);
    }
  }

  async function refreshRoute(currentTripId) {
    try {
      if (!currentTripId) {
        setRouteState([]);
        setTripLogs([]);
        return;
      }

      const currentTripLogs = await getLocationLogsForTrip(currentTripId);
      setTripLogs(currentTripLogs);

      const coords = currentTripLogs.reduce((allCoords, log) => {
        const latitude = Number(log.latitude);
        const longitude = Number(log.longitude);

        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
          return allCoords;
        }

        return appendMeaningfulCoordinate(allCoords, {
          latitude,
          longitude,
        });
      }, []);

      setRouteState(coords);
    } catch (error) {
      console.log("Refresh route error:", error);
    }
  }

  async function getBestPosition() {
    let position = null;

    try {
      position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
    } catch (error) {
      console.log("Get current position error:", error);
    }

    if (!position) {
      position = await Location.getLastKnownPositionAsync({
        maxAge: 1000 * 60 * 30,
        requiredAccuracy: 1000,
      });
    }

    return position;
  }

  async function saveTrackedPoint(position, currentTripId) {
    const nextPoint = getCleanPointFromCoords(position?.coords);

    if (!nextPoint) {
      return false;
    }

    const nextRouteCoords = appendMeaningfulCoordinate(
      routeCoordsRef.current,
      nextPoint
    );

    if (nextRouteCoords === routeCoordsRef.current) {
      return false;
    }

    setRouteState(nextRouteCoords);
    setNowTimestamp(Date.now());

    const placeName = await buildPlaceNameFromCoords(
      nextPoint.latitude,
      nextPoint.longitude,
      "Reverse geocode watch error:"
    );
    const recordedAt = new Date().toISOString();

    const newLogId = await saveLocationLog({
      tripId: currentTripId,
      latitude: nextPoint.latitude,
      longitude: nextPoint.longitude,
      placeName,
      recordedAt,
    });

    const savedLog = buildPendingLocationLog({
      id: newLogId,
      tripId: currentTripId,
      latitude: nextPoint.latitude,
      longitude: nextPoint.longitude,
      placeName,
      recordedAt,
    });

    setTripLogs((current) => [...current, savedLog]);
    await refreshLogs();

    uploadSingleLog(savedLog)
      .then(() => refreshLogs())
      .catch((error) => {
        console.log("Immediate upload error:", error);
      });

    return true;
  }

  async function captureImmediateTripPoint(currentTripId) {
    try {
      const position = await getBestPosition();

      if (!position) {
        return;
      }

      await saveTrackedPoint(position, currentTripId);
    } catch (error) {
      console.log("Immediate trip point error:", error);
    }
  }

  function shouldOpenAutoText(log) {
    if (!log) {
      return false;
    }

    if (log.sendStatus === "sent") {
      return false;
    }

    if (log.sentVia === "sms") {
      return false;
    }

    const failedAttempts = Number(log.sendAttempts || 0);
    const ageMs = Date.now() - new Date(log.recordedAt).getTime();

    return failedAttempts >= 3 || ageMs >= AUTO_SMS_MAX_AGE_MS;
  }

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

    if (log.id) {
      await markLocationLogSmsPrepared(log.id);
    }

    await refreshLogs();
    return true;
  }

  async function checkAutoSmsFallback() {
    try {
      if (!tripActive || !contact || !tripId) {
        return;
      }

      const pendingLogs = await getPendingLocationLogsForTrip(tripId);

      if (!pendingLogs.length) {
        return;
      }

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

      autoSmsTriggeredIdsRef.current.delete(fallbackLog.id);
    } catch (error) {
      console.log("Auto text fallback error:", error);
    }
  }

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

  async function beginWatching(currentTripId) {
    stopWatchingOnly();

    watchRef.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: LIVE_TRACK_TIME_INTERVAL_MS,
        distanceInterval: LIVE_TRACK_DISTANCE_INTERVAL_METERS,
      },
      async (position) => {
        try {
          await saveTrackedPoint(position, currentTripId);
        } catch (error) {
          console.log("Watch callback error:", error);
          setUpdatesMessage(
            "Location tracking hit a problem, but the trip is still active."
          );
        }
      }
    );
  }

  async function startTrip() {
    let newTripId = null;

    try {
      if (tripActive) {
        return;
      }

      if (!contact) {
        Alert.alert("Choose contact", "Please choose a safety contact first.");
        return;
      }

      const foregroundPermission =
        await Location.requestForegroundPermissionsAsync();

      if (!foregroundPermission.granted) {
        Alert.alert(
          "Permission needed",
          "Please allow location access before starting a trip."
        );
        return;
      }

      const servicesEnabled = await Location.hasServicesEnabledAsync();

      if (!servicesEnabled) {
        Alert.alert(
          "Location off",
          "Please turn on location services before starting a trip."
        );
        return;
      }

      const backgroundPermission =
        await Location.requestBackgroundPermissionsAsync();

      const hasBackgroundPermission = backgroundPermission.granted;
      const offline = await isDeviceOffline();

      autoSmsTriggeredIdsRef.current.clear();
      stopFallbackTestOnly();

      newTripId = await startTripSession();

      setCurrentTripId(newTripId);
      setTripActive(true);
      setTripLogs([]);
      setRouteState([]);
      setNowTimestamp(Date.now());

      const backgroundStarted = hasBackgroundPermission
        ? await ensureBackgroundTrackingStarted()
        : false;

      setUpdatesMessage(
        backgroundStarted
          ? offline
            ? "Trip started. Background route tracking is active and online uploads will retry when signal returns."
            : "Trip started. Background route tracking is active."
          : hasBackgroundPermission
          ? "Trip started. Live route is tracking, but background tracking could not start on this device."
          : "Trip started. Live route is tracking. To keep tracking in your pocket, allow background location on Android."
      );

      await captureImmediateTripPoint(newTripId);
      await beginWatching(newTripId);
      await refreshLogs();
      await runAutoMaintenance();
    } catch (error) {
      console.log("Start trip error:", error);

      stopWatchingOnly();
      stopAutoCheckOnly();
      stopLiveRefreshOnly();
      stopFallbackTestOnly();
      await stopBackgroundTracking();

      if (newTripId) {
        await stopTripSession(newTripId);
      }

      setCurrentTripId(null);
      setTripActive(false);
      setTripLogs([]);
      setRouteState([]);
      setNowTimestamp(Date.now());
      setUpdatesMessage("");

      Alert.alert("Trip error", "We could not start tracking this trip.");
    }
  }

  function buildFinishedTripSummary() {
    const validTripLogs = tripLogs.filter(
      (log) => log.latitude != null && log.longitude != null
    );

    if (!validTripLogs.length) {
      return null;
    }

    const coords =
      routeCoords.length > 0
        ? routeCoords
        : validTripLogs.map((log) => ({
            latitude: Number(log.latitude),
            longitude: Number(log.longitude),
          }));

    const firstLog = validTripLogs[0];
    const lastLog = validTripLogs[validTripLogs.length - 1];

    const startedAt = new Date(firstLog.recordedAt).getTime();
    const endedAt = new Date(lastLog.recordedAt).getTime();

    const distanceKm = getPathDistanceKm(coords);
    const durationMinutes = Math.max(
      1,
      Math.round((endedAt - startedAt) / 60000)
    );

    const startPlaceName = firstLog.placeName || "Starting point";
    const endPlaceName = lastLog.placeName || startPlaceName || "Tracked journey";

    return {
      title: buildJourneyTitleFromTrip(startPlaceName, endPlaceName),
      note: "",
      startPlaceName,
      endPlaceName,
      startLatitude: Number(coords[0]?.latitude ?? firstLog.latitude),
      startLongitude: Number(coords[0]?.longitude ?? firstLog.longitude),
      endLatitude: Number(
        coords[coords.length - 1]?.latitude ?? lastLog.latitude
      ),
      endLongitude: Number(
        coords[coords.length - 1]?.longitude ?? lastLog.longitude
      ),
      distanceKm,
      durationMinutes,
      startedAt: firstLog.recordedAt,
      endedAt: lastLog.recordedAt,
      routePoints: coords,
    };
  }

  async function stopTrip(extraData = {}) {
    try {
      const currentTripId = tripIdRef.current;
      const baseSummary = buildFinishedTripSummary();
      const finishedTrip = baseSummary ? { ...baseSummary, ...extraData } : null;

      stopWatchingOnly();
      stopAutoCheckOnly();
      stopLiveRefreshOnly();
      stopFallbackTestOnly();
      await stopBackgroundTracking();

      if (currentTripId) {
        await stopTripSession(currentTripId);
      }

      autoSmsTriggeredIdsRef.current.clear();
      setTripActive(false);
      setCurrentTripId(null);
      setTripLogs([]);
      setRouteState([]);
      setNowTimestamp(Date.now());
      setUpdatesMessage("Trip stopped.");

      await refreshLogs();

      if (finishedTrip && typeof onTripFinished === "function") {
        onTripFinished(finishedTrip);
      }
    } catch (error) {
      console.log("Stop trip error:", error);
      Alert.alert("Stop error", "We could not stop this trip properly.");
    }
  }

  async function sendLatestLocationSms() {
    try {
      let latestLog = null;

      if (tripActive && tripId) {
        latestLog = await getLatestPendingLocationLogForTrip(tripId);
      }

      if (!latestLog) {
        latestLog = await getLatestPendingLocationLog();
      }

      if (!latestLog) {
        latestLog = await getLatestLocationLog();
      }

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

      if (!testLog) {
        const position = await getBestPosition();

        if (!position) {
          Alert.alert(
            "No location",
            "We could not get a test location. Try again in a moment."
          );
          return;
        }

        const nextPoint = getCleanPointFromCoords(position?.coords);

        if (!nextPoint) {
          Alert.alert(
            "Location not ready",
            "Location accuracy is still too weak. Try again in a few seconds."
          );
          return;
        }

        const nextRouteCoords = appendMeaningfulCoordinate(
          routeCoordsRef.current,
          nextPoint
        );

        if (nextRouteCoords !== routeCoordsRef.current) {
          setRouteState(nextRouteCoords);
        }

        setNowTimestamp(Date.now());

        const placeName = await buildPlaceNameFromCoords(
          nextPoint.latitude,
          nextPoint.longitude,
          "Reverse geocode watch error:"
        );
        const recordedAt = new Date().toISOString();

        const newLogId = await saveLocationLog({
          tripId,
          latitude: nextPoint.latitude,
          longitude: nextPoint.longitude,
          placeName,
          recordedAt,
        });

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

  function getShortStatus(log) {
    if (log.sentVia === "sms") {
      return "Text opened";
    }

    if (log.sendStatus === "sent") {
      return "Sent";
    }

    if (log.sendStatus === "failed") {
      return "Failed";
    }

    return "Pending";
  }

  function getStatusIcon(log) {
    if (log.sentVia === "sms") {
      return "message-circle";
    }

    if (log.sendStatus === "sent") {
      return "check-circle";
    }

    if (log.sendStatus === "failed") {
      return "alert-circle";
    }

    return "clock";
  }

  const latestRoutePoint = routeCoords[routeCoords.length - 1] || null;

  const liveRegion = useMemo(() => {
    if (!routeCoords.length) {
      return null;
    }

    return getMapRegionForPoints(routeCoords, latestRoutePoint);
  }, [routeCoords, latestRoutePoint]);

  const routeDistanceKm = useMemo(() => {
    return getPathDistanceKm(routeCoords);
  }, [routeCoords]);

  const routeDurationMinutes = useMemo(() => {
    if (!tripLogs.length) {
      return 0;
    }

    const startedAt = new Date(tripLogs[0].recordedAt).getTime();
    const lastRecordedAt = new Date(
      tripLogs[tripLogs.length - 1].recordedAt
    ).getTime();

    const endedAt = tripActive ? nowTimestamp : lastRecordedAt;

    return Math.max(1, Math.round((endedAt - startedAt) / 60000));
  }, [tripLogs, tripActive, nowTimestamp]);

  const latestPlaceName =
    tripLogs[tripLogs.length - 1]?.placeName || "Current tracked area";

  const visibleLogs = logs.slice(0, 10);

  return {
    contact,
    tripActive,
    tripId,
    logs,
    tripLogs,
    routeCoords,
    retryingUploads,
    updatesMessage,
    nowTimestamp,
    smsFallbackTestActive,

    latestRoutePoint,
    liveRegion,
    routeDistanceKm,
    routeDurationMinutes,
    latestPlaceName,
    visibleLogs,

    chooseContact,
    startTrip,
    stopTrip,
    retryPendingUploads,
    sendLatestLocationSms,
    refreshLogs,
    refreshRoute,
    triggerSmsFallbackTest,
    getShortStatus,
    getStatusIcon,
  };
}