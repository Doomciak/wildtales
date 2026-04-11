import * as TaskManager from "expo-task-manager";

import { sendLocationLogToApi } from "../../../api";
import {
  getActiveTripSession,
  incrementLocationLogAttempt,
  markLocationLogSent,
  saveLocationLog,
} from "../../../db";
import {
  buildPendingLocationLog,
  buildPlaceNameFromCoords,
  getCleanPointFromCoords,
  shouldKeepPoint,
} from "./trackingHelpers";

// Name of the Expo background task used for location tracking.
export const BACKGROUND_LOCATION_TASK = "wildtales-background-location-task";

// Keep the last saved point in memory to avoid duplicate logs.
let lastBackgroundPoint = null;

// Track the current trip so the cached point resets when the trip changes.
let lastBackgroundTripId = null;

// Try to upload a saved log to the API.
// If it fails, increase the retry counter in the database.
async function tryUploadLog(log) {
  try {
    await sendLocationLogToApi(log);
    await markLocationLogSent(log.id, "api");
  } catch (error) {
    console.log("Background upload error:", error);
    await incrementLocationLogAttempt(log.id);
  }
}

// Register the Expo background task that receives location updates.
TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
  // Stop early if Expo reports a task error.
  if (error) {
    console.log("Background location task error:", error);
    return;
  }

  try {
    // Read the active trip session from local storage.
    const activeTrip = await getActiveTripSession();

    // Clear cached values when there is no active trip.
    if (!activeTrip?.id) {
      lastBackgroundTripId = null;
      lastBackgroundPoint = null;
      return;
    }

    // Reset the cached point when a new trip starts.
    if (lastBackgroundTripId !== activeTrip.id) {
      lastBackgroundTripId = activeTrip.id;
      lastBackgroundPoint = null;
    }

    // Get all location updates included in this background task run.
    const locations = data?.locations ?? [];

    // Process each received location update one at a time.
    for (const location of locations) {
      // Build a simplified point from the raw Expo location data.
      const nextPoint = getCleanPointFromCoords(
        location?.coords,
        location?.timestamp || Date.now()
      );

      // Skip points that do not meet the save rules.
      if (!shouldKeepPoint(lastBackgroundPoint, nextPoint)) {
        continue;
      }

      // Update the cached last saved point.
      lastBackgroundPoint = nextPoint;

      // Try to convert the coordinates into a readable place name.
      const placeName = await buildPlaceNameFromCoords(
        nextPoint.latitude,
        nextPoint.longitude,
        "Background reverse geocode error:"
      );

      // Convert the recorded timestamp into ISO format.
      const recordedAt = new Date(
        location?.timestamp || Date.now()
      ).toISOString();

      // Save the location log locally first.
      const newLogId = await saveLocationLog({
        tripId: activeTrip.id,
        latitude: nextPoint.latitude,
        longitude: nextPoint.longitude,
        placeName,
        recordedAt,
      });

      // Build the saved log in the format expected by the API.
      const savedLog = buildPendingLocationLog({
        id: newLogId,
        tripId: activeTrip.id,
        latitude: nextPoint.latitude,
        longitude: nextPoint.longitude,
        placeName,
        recordedAt,
      });

      // Then try to upload the saved log to the backend.
      await tryUploadLog(savedLog);
    }
  } catch (taskError) {
    // Catch any unexpected error during the task run.
    console.log("Background location task run error:", taskError);
  }
});