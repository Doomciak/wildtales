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

// Store the last saved point in memory to avoid saving duplicates.
let lastBackgroundPoint = null;

// Store the current trip id so the point cache can reset when the trip changes.
let lastBackgroundTripId = null;

// Try to send a saved location log to the API.
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

// Register the background task that receives location updates from Expo.
TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
  // Stop the task early if Expo returns a task error.
  if (error) {
    console.log("Background location task error:", error);
    return;
  }

  try {
    // Read the currently active trip from the local database.
    const activeTrip = await getActiveTripSession();

    // Reset cached values when there is no active trip.
    if (!activeTrip?.id) {
      lastBackgroundTripId = null;
      lastBackgroundPoint = null;
      return;
    }

    // Reset the last saved point when a new trip starts.
    if (lastBackgroundTripId !== activeTrip.id) {
      lastBackgroundTripId = activeTrip.id;
      lastBackgroundPoint = null;
    }

    // Get all location updates included in this background task run.
    const locations = data?.locations ?? [];

    // Process each received location update one by one.
    for (const location of locations) {
      // Build a simplified point object from the raw Expo location data.
      const nextPoint = getCleanPointFromCoords(
        location?.coords,
        location?.timestamp || Date.now()
      );

      // Skip the point if it should not be stored.
      if (!shouldKeepPoint(lastBackgroundPoint, nextPoint)) {
        continue;
      }

      // Update the cached last saved point.
      lastBackgroundPoint = nextPoint;

      // Convert the coordinates into a readable place name.
      const placeName = await buildPlaceNameFromCoords(
        nextPoint.latitude,
        nextPoint.longitude,
        "Background reverse geocode error:"
      );

      // Convert the recorded timestamp into ISO format.
      const recordedAt = new Date(
        location?.timestamp || Date.now()
      ).toISOString();

      // Save the location log in the local database.
      const newLogId = await saveLocationLog({
        tripId: activeTrip.id,
        latitude: nextPoint.latitude,
        longitude: nextPoint.longitude,
        placeName,
        recordedAt,
      });

      // Build the saved log object in the format expected by the API.
      const savedLog = buildPendingLocationLog({
        id: newLogId,
        tripId: activeTrip.id,
        latitude: nextPoint.latitude,
        longitude: nextPoint.longitude,
        placeName,
        recordedAt,
      });

      // Try to upload the saved log to the backend.
      await tryUploadLog(savedLog);
    }
  } catch (taskError) {
    // Catch unexpected errors during the task run.
    console.log("Background location task run error:", taskError);
  }
});