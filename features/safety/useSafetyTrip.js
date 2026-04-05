import { useEffect, useMemo, useRef, useState } from "react";
import { Alert } from "react-native";
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
  getLocationLogsForTrip,
  getPendingLocationLogs,
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

const AUTO_SMS_MAX_AGE_MS = 5 * 60 * 1000;
const AUTO_CHECK_INTERVAL_MS = 30000;
const LIVE_REFRESH_INTERVAL_MS = 15000;

function buildCoordinateLabel(latitude, longitude) {
  return `${Number(latitude).toFixed(5)}, ${Number(longitude).toFixed(5)}`;
}

function appendUniqueCoordinate(current, nextPoint) {
  const lastPoint = current[current.length - 1];

  if (
    lastPoint &&
    lastPoint.latitude === nextPoint.latitude &&
    lastPoint.longitude === nextPoint.longitude
  ) {
    return current;
  }

  return [...current, nextPoint];
}

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

  const watchRef = useRef(null);
  const autoCheckRef = useRef(null);
  const liveRefreshRef = useRef(null);
  const autoSmsTriggeredIdsRef = useRef(new Set());
  const autoMaintenanceBusyRef = useRef(false);
  const syncBusyRef = useRef(false);

  useEffect(() => {
    loadInitialData();

    return () => {
      stopWatchingOnly();
      stopAutoCheckOnly();
      stopLiveRefreshOnly();
    };
  }, []);

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
        setTripId(activeTrip.id);
        setTripActive(true);
        setNowTimestamp(Date.now());
        setUpdatesMessage("Trip restored from saved device data.");
        await refreshRoute(activeTrip.id);
        await beginWatching(activeTrip.id);
      } else {
        setRouteCoords([]);
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

  async function buildPlaceName(latitude, longitude) {
    const fallbackName = buildCoordinateLabel(latitude, longitude);

    try {
      const results = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (results.length === 0) {
        return fallbackName;
      }

      const first = results[0];

      return (
        [first.city, first.country].filter(Boolean).join(", ") ||
        first.district ||
        first.subregion ||
        first.region ||
        first.name ||
        first.street ||
        fallbackName
      );
    } catch (error) {
      console.log("Reverse geocode watch error:", error);
      return fallbackName;
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
        setRouteCoords([]);
        setTripLogs([]);
        return;
      }

      const currentTripLogs = await getLocationLogsForTrip(currentTripId);
      setTripLogs(currentTripLogs);

      const coords = currentTripLogs
        .filter(
          (log) =>
            log.latitude != null &&
            log.longitude != null &&
            Number.isFinite(Number(log.latitude)) &&
            Number.isFinite(Number(log.longitude))
        )
        .map((log) => ({
          latitude: Number(log.latitude),
          longitude: Number(log.longitude),
        }));

      setRouteCoords(coords);
    } catch (error) {
      console.log("Refresh route error:", error);
    }
  }

  async function getBestPosition() {
    let position = null;

    try {
      position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
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

  async function captureImmediateTripPoint(currentTripId) {
    try {
      const position = await getBestPosition();

      if (!position) {
        return;
      }

      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;
      const placeName = await buildPlaceName(latitude, longitude);
      const recordedAt = new Date().toISOString();

      const newLogId = await saveLocationLog({
        tripId: currentTripId,
        latitude,
        longitude,
        placeName,
        recordedAt,
      });

      const savedLog = {
        id: newLogId,
        tripId: currentTripId,
        latitude,
        longitude,
        placeName,
        recordedAt,
        sendStatus: "pending",
        sendAttempts: 0,
        lastAttemptAt: null,
        sentVia: null,
      };

      const immediatePoint = { latitude, longitude };

      setRouteCoords([immediatePoint]);
      setTripLogs([savedLog]);
      setNowTimestamp(Date.now());

      await uploadSingleLog(savedLog);
      await refreshLogs();
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
      `Last known location: ${Number(log.latitude).toFixed(2)}, ${Number(
        log.longitude
      ).toFixed(2)}\n` +
      `${log.placeName ? `Place: ${log.placeName}\n` : ""}` +
      `Recorded: ${new Date(log.recordedAt).toLocaleString()}`;

    await SMS.sendSMSAsync([contact.phone], message);

    if (log.id) {
      await markLocationLogSmsPrepared(log.id);
    }

    await refreshLogs();
    return true;
  }

  async function checkAutoSmsFallback() {
    try {
      if (!tripActive || !contact) {
        return;
      }

      const pendingLogs = await getPendingLocationLogs();

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

      const latestSavedLog = pendingLogs[pendingLogs.length - 1] || fallbackLog;
      const smsOpened = await sendSmsForLog(latestSavedLog);

      if (smsOpened) {
        setUpdatesMessage(
          "Text update opened because online sending was delayed."
        );
      }
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
          "Online updates are unavailable while you are offline."
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
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 30000,
        distanceInterval: 20,
      },
      async (position) => {
        try {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;
          const placeName = await buildPlaceName(latitude, longitude);
          const recordedAt = new Date().toISOString();

          const newLogId = await saveLocationLog({
            tripId: currentTripId,
            latitude,
            longitude,
            placeName,
            recordedAt,
          });

          const savedLog = {
            id: newLogId,
            tripId: currentTripId,
            latitude,
            longitude,
            placeName,
            recordedAt,
            sendStatus: "pending",
            sendAttempts: 0,
            lastAttemptAt: null,
            sentVia: null,
          };

          const nextPoint = { latitude, longitude };

          setRouteCoords((current) => appendUniqueCoordinate(current, nextPoint));
          setTripLogs((current) => [...current, savedLog]);
          setNowTimestamp(Date.now());

          await uploadSingleLog(savedLog);
          await refreshLogs();
        } catch (error) {
          console.log("Watch callback error:", error);
        }
      },
      (reason) => {
        console.log("Watch position error:", reason);
        setUpdatesMessage("Location tracking could not continue on this device.");
      }
    );
  }

  async function startTrip() {
    try {
      if (tripActive) {
        return;
      }

      if (!contact) {
        Alert.alert("Choose contact", "Please choose a safety contact first.");
        return;
      }

      const offline = await isDeviceOffline();

      if (offline) {
        setUpdatesMessage("This feature does not work while you are offline.");
        Alert.alert(
          "Offline",
          "Trip tracking is unavailable offline in this version."
        );
        return;
      }

      const permission = await Location.requestForegroundPermissionsAsync();

      if (!permission.granted) {
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

      autoSmsTriggeredIdsRef.current.clear();
      setUpdatesMessage("Trip started. Live route is now tracking.");

      const newTripId = await startTripSession();

      setTripId(newTripId);
      setTripActive(true);
      setRouteCoords([]);
      setTripLogs([]);
      setNowTimestamp(Date.now());

      await captureImmediateTripPoint(newTripId);
      await beginWatching(newTripId);
      await refreshLogs();
      await syncPendingUploadsSilently();
    } catch (error) {
      console.log("Start trip error:", error);
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

  async function stopTrip() {
    try {
      const finishedTrip = buildFinishedTripSummary();

      stopWatchingOnly();
      stopAutoCheckOnly();
      stopLiveRefreshOnly();

      if (tripId) {
        await stopTripSession(tripId);
      }

      setTripActive(false);
      setTripId(null);
      setRouteCoords([]);
      setTripLogs([]);
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
      let latestLog = await getLatestPendingLocationLog();

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
    getShortStatus,
    getStatusIcon,
  };
}