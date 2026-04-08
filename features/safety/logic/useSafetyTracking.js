import { useEffect, useRef } from "react";
import * as Location from "expo-location";

import {
  getLocationLogsForTrip,
  getRecentLocationLogs,
  saveLocationLog,
} from "../../../db";
import { BACKGROUND_LOCATION_TASK } from "./locationTask";
import {
  appendMeaningfulCoordinate,
  buildPendingLocationLog,
  buildPlaceNameFromCoords,
  getCleanPointFromCoords,
} from "./trackingHelpers";
import {
  BACKGROUND_TRACK_DISTANCE_INTERVAL_METERS,
  BACKGROUND_TRACK_TIME_INTERVAL_MS,
  LIVE_REFRESH_INTERVAL_MS,
  LIVE_TRACK_DISTANCE_INTERVAL_METERS,
  LIVE_TRACK_TIME_INTERVAL_MS,
} from "./safetyConfig";

export default function useSafetyTracking({
  tripActive,
  tripId,
  setTripId,
  setLogs,
  setTripLogs,
  routeCoords,
  setRouteCoords,
  setNowTimestamp,
  onUploadLog,
  onWatchError,
}) {
  const watchRef = useRef(null);
  const liveRefreshRef = useRef(null);
  const routeCoordsRef = useRef([]);
  const tripIdRef = useRef(null);

  // Update both the local ref and state with the current trip id.
  function setCurrentTripId(nextTripId) {
    tripIdRef.current = nextTripId;
    setTripId(nextTripId);
  }

  // Update both the local ref and state with the current route coordinates.
  function setRouteState(nextCoords) {
    routeCoordsRef.current = nextCoords;
    setRouteCoords(nextCoords);
  }

  // Keep the trip id ref in sync with state.
  useEffect(() => {
    tripIdRef.current = tripId;
  }, [tripId]);

  // Keep the route coordinates ref in sync with state.
  useEffect(() => {
    routeCoordsRef.current = routeCoords;
  }, [routeCoords]);

  useEffect(() => {
    stopLiveRefreshOnly();

    // Start the live refresh interval while a trip is active.
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

  // Stop the live location watcher.
  function stopWatchingOnly() {
    if (watchRef.current) {
      watchRef.current.remove();
      watchRef.current = null;
    }
  }

  // Stop the live refresh interval.
  function stopLiveRefreshOnly() {
    if (liveRefreshRef.current) {
      clearInterval(liveRefreshRef.current);
      liveRefreshRef.current = null;
    }
  }

  // Start Expo background location updates if they are not running yet.
  async function ensureBackgroundTrackingStarted() {
    try {
      const alreadyStarted = await Location.hasStartedLocationUpdatesAsync(
        BACKGROUND_LOCATION_TASK
      );

      if (alreadyStarted) {
        return true;
      }

      await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
        accuracy: Location.Accuracy.High,
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

  // Stop Expo background location updates.
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

  // Reload the recent location logs from the database.
  async function refreshLogs() {
    try {
      const recentLogs = await getRecentLocationLogs();
      setLogs(recentLogs);
    } catch (error) {
      console.log("Refresh logs error:", error);
    }
  }

  // Reload the trip route and rebuild route coordinates from saved logs.
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
        const timestamp = new Date(log.recordedAt).getTime();

        // Skip logs that do not contain valid coordinates.
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
          return allCoords;
        }

        return appendMeaningfulCoordinate(allCoords, {
          latitude,
          longitude,
          accuracy: null,
          timestamp: Number.isFinite(timestamp) ? timestamp : Date.now(),
        });
      }, []);

      setRouteState(coords);
    } catch (error) {
      console.log("Refresh route error:", error);
    }
  }

  // Read the current GPS position and fall back to the last known position if needed.
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

  // Save one accepted tracking point for the active trip.
  async function saveTrackedPoint(position, currentTripId) {
    const nextPoint = getCleanPointFromCoords(
      position?.coords,
      position?.timestamp || Date.now()
    );

    // Stop if the position cannot be turned into a valid point.
    if (!nextPoint) {
      return false;
    }

    const nextRouteCoords = appendMeaningfulCoordinate(
      routeCoordsRef.current,
      nextPoint
    );

    // Stop if the point was rejected by the route filters.
    if (nextRouteCoords === routeCoordsRef.current) {
      return false;
    }

    setRouteState(nextRouteCoords);
    setNowTimestamp(Date.now());

    // Build a readable place name for the saved point.
    const placeName = await buildPlaceNameFromCoords(
      nextPoint.latitude,
      nextPoint.longitude,
      "Reverse geocode watch error:"
    );
    const recordedAt = new Date(
      position?.timestamp || Date.now()
    ).toISOString();

    // Save the point as a location log in the database.
    const newLogId = await saveLocationLog({
      tripId: currentTripId,
      latitude: nextPoint.latitude,
      longitude: nextPoint.longitude,
      placeName,
      recordedAt,
    });

    // Build the saved log object for local state and upload handling.
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

    // Upload the saved log immediately when an upload handler is provided.
    if (typeof onUploadLog === "function") {
      onUploadLog(savedLog)
        .then(() => refreshLogs())
        .catch((error) => {
          console.log("Immediate upload error:", error);
        });
    }

    return true;
  }

  // Capture one immediate tracking point for the current trip.
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

  // Start the live GPS watcher for the current trip.
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

          // Pass the watcher error to the parent callback if provided.
          if (typeof onWatchError === "function") {
            onWatchError(error);
          }
        }
      }
    );
  }

  return {
    tripIdRef,
    routeCoordsRef,

    setCurrentTripId,
    setRouteState,

    stopWatchingOnly,
    stopLiveRefreshOnly,

    ensureBackgroundTrackingStarted,
    stopBackgroundTracking,

    refreshLogs,
    refreshRoute,
    getBestPosition,
    saveTrackedPoint,
    captureImmediateTripPoint,
    beginWatching,
  };
}