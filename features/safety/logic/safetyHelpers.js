import * as Network from "expo-network";

import {
  buildJourneyTitleFromTrip,
  getPathDistanceKm,
} from "../../../utils/travel";
import { AUTO_SMS_MAX_AGE_MS } from "./safetyConfig";

// Check whether the device currently has no usable internet connection.
export async function isDeviceOffline() {
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

// Decide whether the automatic SMS fallback should be opened for a log.
export function shouldOpenAutoText(log) {
  if (!log) {
    return false;
  }

  // Do not open the fallback if the log was already sent successfully.
  if (log.sendStatus === "sent") {
    return false;
  }

  // Do not open the fallback again if SMS was already used.
  if (log.sentVia === "sms") {
    return false;
  }

  const failedAttempts = Number(log.sendAttempts || 0);
  const ageMs = Date.now() - new Date(log.recordedAt).getTime();

  // Open the fallback when the upload failed several times
  // or when the log has been pending for too long.
  return failedAttempts >= 3 || ageMs >= AUTO_SMS_MAX_AGE_MS;
}

// Return a short label for the current send state.
export function getShortStatus(log) {
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

// Return the icon name that matches the current send state.
export function getStatusIcon(log) {
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

// Build a summary object from the recorded trip logs and route points.
export function buildFinishedTripSummary({ tripLogs, routeCoords }) {
  // Keep only logs that contain valid coordinates.
  const validTripLogs = tripLogs.filter(
    (log) => log.latitude != null && log.longitude != null
  );

  // Stop if there are no valid points to build a trip from.
  if (!validTripLogs.length) {
    return null;
  }

  // Use the provided route coordinates if available.
  // Otherwise, build the route from the saved logs.
  const coords =
    routeCoords.length > 0
      ? routeCoords
      : validTripLogs.map((log) => ({
          latitude: Number(log.latitude),
          longitude: Number(log.longitude),
        }));

  const firstLog = validTripLogs[0];
  const lastLog = validTripLogs[validTripLogs.length - 1];

  // Read the start and end timestamps from the trip logs.
  const startedAt = new Date(firstLog.recordedAt).getTime();
  const endedAt = new Date(lastLog.recordedAt).getTime();

  // Calculate the total distance and trip duration.
  const distanceKm = getPathDistanceKm(coords);
  const durationMinutes = Math.max(
    1,
    Math.round((endedAt - startedAt) / 60000)
  );

  // Build readable start and end place names for the saved journey.
  const startPlaceName = firstLog.placeName || "Starting point";
  const endPlaceName = lastLog.placeName || startPlaceName || "Tracked journey";

  // Return the finished trip data in the format used by the journey form.
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