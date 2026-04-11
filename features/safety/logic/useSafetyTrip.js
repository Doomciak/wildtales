import { useEffect, useMemo, useState } from "react";
import { Alert, AppState } from "react-native";
import * as Contacts from "expo-contacts";
import * as Location from "expo-location";

import { getMapRegionForPoints, getPathDistanceKm } from "../../../utils/travel";
import {
  getActiveTripSession,
  getRecentLocationLogs,
  getSafetyContact,
  saveSafetyContact,
  startTripSession,
  stopTripSession,
} from "../../../db";
import useSafetyTracking from "./useSafetyTracking";
import useSafetyFallback from "./useSafetyFallback";
import {
  buildFinishedTripSummary,
  getShortStatus,
  getStatusIcon,
  isDeviceOffline,
} from "./safetyHelpers";

export default function useSafetyTrip({ onTripFinished } = {}) {
  const [contact, setContact] = useState(null);
  const [tripActive, setTripActive] = useState(false);
  const [tripId, setTripId] = useState(null);
  const [logs, setLogs] = useState([]);
  const [tripLogs, setTripLogs] = useState([]);
  const [routeCoords, setRouteCoords] = useState([]);
  const [updatesMessage, setUpdatesMessage] = useState("");
  const [nowTimestamp, setNowTimestamp] = useState(Date.now());

  // Handle live tracking, watchers, and route refresh logic.
  const tracking = useSafetyTracking({
    tripActive,
    tripId,
    setTripId,
    setLogs,
    setTripLogs,
    routeCoords,
    setRouteCoords,
    setNowTimestamp,
    onUploadLog: async (log) => fallback.uploadSingleLog(log),
    onWatchError: () => {
      setUpdatesMessage(
        "Location tracking hit a problem, but the trip is still active."
      );
    },
  });

  // Handle retries, silent sync checks, and SMS fallback logic.
  const fallback = useSafetyFallback({
    contact,
    tripActive,
    tripId,
    refreshLogs: tracking.refreshLogs,
    setTripLogs,
    setUpdatesMessage,
    setNowTimestamp,
    getBestPosition: tracking.getBestPosition,
    routeCoordsRef: tracking.routeCoordsRef,
    setRouteState: tracking.setRouteState,
  });

  useEffect(() => {
    loadInitialData();

    const subscription = AppState.addEventListener("change", (nextState) => {
      // Refresh trip data when the app returns to the foreground.
      if (nextState === "active") {
        const currentTripId = tracking.tripIdRef.current;

        setNowTimestamp(Date.now());
        tracking.refreshLogs();

        if (currentTripId) {
          tracking.refreshRoute(currentTripId);
          fallback.runAutoMaintenance();
        }
      }
    });

    return () => {
      tracking.stopWatchingOnly();
      fallback.stopAutoCheckOnly();
      tracking.stopLiveRefreshOnly();
      fallback.stopFallbackTestOnly();
      subscription.remove();
    };
  }, []);

  // Load the saved contact, recent logs, and any active trip from local storage.
  async function loadInitialData() {
    try {
      const [savedContact, recentLogs, activeTrip] = await Promise.all([
        getSafetyContact(),
        getRecentLocationLogs(),
        getActiveTripSession(),
      ]);

      setContact(savedContact);
      setLogs(recentLogs);

      // Restore trip state if a trip was already active on this device.
      if (activeTrip) {
        tracking.setCurrentTripId(activeTrip.id);
        setTripActive(true);
        setNowTimestamp(Date.now());
        setUpdatesMessage("Trip restored from saved device data.");
        await tracking.refreshRoute(activeTrip.id);
        await tracking.ensureBackgroundTrackingStarted();
        await tracking.beginWatching(activeTrip.id);
        await fallback.runAutoMaintenance();
      } else {
        tracking.setCurrentTripId(null);
        tracking.setRouteState([]);
        setTripLogs([]);
      }
    } catch (error) {
      console.log("Load safety data error:", error);
    }
  }

  // Open the contact picker and save the selected safety contact.
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

      // Save the selected contact for future trips.
      await saveSafetyContact(cleanContact);

      setContact(cleanContact);
      setUpdatesMessage("Safety contact updated.");
    } catch (error) {
      console.log("Choose contact error:", error);
      Alert.alert("Contact error", "We could not choose that contact.");
    }
  }

  // Start a new trip session and begin route tracking.
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

      fallback.resetFallbackState();

      // Create a new trip session in the database.
      newTripId = await startTripSession();

      tracking.setCurrentTripId(newTripId);
      setTripActive(true);
      setTripLogs([]);
      tracking.setRouteState([]);
      setNowTimestamp(Date.now());

      // Start background tracking when permission is available.
      const backgroundStarted = hasBackgroundPermission
        ? await tracking.ensureBackgroundTrackingStarted()
        : false;

      setUpdatesMessage(
        backgroundStarted
          ? offline
            ? "Trip started. Background route tracking is active and online uploads will retry when signal returns."
            : "Trip started. Background route tracking is active."
          : hasBackgroundPermission
          ? "Trip started. Route tracking is active, but background tracking may be limited when the phone is locked."
          : "Trip started. Live route is tracking. To improve tracking when the phone is locked or in your pocket, allow background location on Android."
      );

      // Capture the first point and start the live watcher.
      await tracking.captureImmediateTripPoint(newTripId);
      await tracking.beginWatching(newTripId);
      await tracking.refreshLogs();
      await fallback.runAutoMaintenance();
    } catch (error) {
      console.log("Start trip error:", error);

      // Reset trip state if starting the trip fails.
      tracking.stopWatchingOnly();
      fallback.stopAutoCheckOnly();
      tracking.stopLiveRefreshOnly();
      fallback.stopFallbackTestOnly();
      await tracking.stopBackgroundTracking();

      if (newTripId) {
        await stopTripSession(newTripId);
      }

      tracking.setCurrentTripId(null);
      setTripActive(false);
      setTripLogs([]);
      tracking.setRouteState([]);
      setNowTimestamp(Date.now());
      setUpdatesMessage("");

      Alert.alert("Trip error", "We could not start tracking this trip.");
    }
  }

  // Stop the current trip and build the final trip summary.
  async function stopTrip(extraData = {}) {
    try {
      const currentTripId = tracking.tripIdRef.current;
      const baseSummary = buildFinishedTripSummary({
        tripLogs,
        routeCoords,
      });

      // Keep the finished trip linked to its raw trip logs
      // so they can be cleaned up after the journey is saved.
      const finishedTrip = baseSummary
        ? {
            ...baseSummary,
            tripId: currentTripId,
            ...extraData,
          }
        : null;

      tracking.stopWatchingOnly();
      fallback.stopAutoCheckOnly();
      tracking.stopLiveRefreshOnly();
      fallback.stopFallbackTestOnly();
      await tracking.stopBackgroundTracking();

      if (currentTripId) {
        await stopTripSession(currentTripId);
      }

      fallback.resetFallbackState();
      setTripActive(false);
      tracking.setCurrentTripId(null);
      setTripLogs([]);
      tracking.setRouteState([]);
      setNowTimestamp(Date.now());
      setUpdatesMessage("Trip stopped.");

      await tracking.refreshLogs();

      // Pass the finished trip summary back to the parent screen.
      if (finishedTrip && typeof onTripFinished === "function") {
        onTripFinished(finishedTrip);
      }
    } catch (error) {
      console.log("Stop trip error:", error);
      Alert.alert("Stop error", "We could not stop this trip properly.");
    }
  }

  // Read the latest point from the current route.
  const latestRoutePoint = routeCoords[routeCoords.length - 1] || null;

  // Build the map region for the current route.
  const liveRegion = useMemo(() => {
    if (!routeCoords.length) {
      return null;
    }

    return getMapRegionForPoints(routeCoords, latestRoutePoint);
  }, [routeCoords, latestRoutePoint]);

  // Calculate the total route distance.
  const routeDistanceKm = useMemo(() => {
    return getPathDistanceKm(routeCoords);
  }, [routeCoords]);

  // Calculate the trip duration in minutes.
  const routeDurationMinutes = useMemo(() => {
    if (!tripLogs.length) {
      return 0;
    }

    const startedAt = new Date(tripLogs[0].recordedAt).getTime();
    const lastRecordedAt = new Date(
      tripLogs[tripLogs.length - 1].recordedAt
    ).getTime();

    // Use the current time while the trip is still active.
    const endedAt = tripActive ? nowTimestamp : lastRecordedAt;

    return Math.max(1, Math.round((endedAt - startedAt) / 60000));
  }, [tripLogs, tripActive, nowTimestamp]);

  // Read the latest known place name from the trip logs.
  const latestPlaceName =
    tripLogs[tripLogs.length - 1]?.placeName || "Current tracked area";

  // Limit the visible logs shown in the UI.
  const visibleLogs = logs.slice(0, 10);

  return {
    contact,
    tripActive,
    tripId,
    logs,
    tripLogs,
    routeCoords,
    retryingUploads: fallback.retryingUploads,
    updatesMessage,
    nowTimestamp,
    smsFallbackTestActive: fallback.smsFallbackTestActive,

    latestRoutePoint,
    liveRegion,
    routeDistanceKm,
    routeDurationMinutes,
    latestPlaceName,
    visibleLogs,

    chooseContact,
    startTrip,
    stopTrip,
    retryPendingUploads: fallback.retryPendingUploads,
    sendLatestLocationSms: fallback.sendLatestLocationSms,
    refreshLogs: tracking.refreshLogs,
    refreshRoute: tracking.refreshRoute,
    triggerSmsFallbackTest: fallback.triggerSmsFallbackTest,
    getShortStatus,
    getStatusIcon,
  };
}