import * as TaskManager from "expo-task-manager";

import { sendLocationLogToApi } from "../../api";
import {
  getActiveTripSession,
  incrementLocationLogAttempt,
  markLocationLogSent,
  saveLocationLog,
} from "../../db";
import {
  buildPendingLocationLog,
  buildPlaceNameFromCoords,
  getCleanPointFromCoords,
  shouldKeepPoint,
} from "./trackingHelpers";

export const BACKGROUND_LOCATION_TASK = "wildtales-background-location-task";

let lastBackgroundPoint = null;
let lastBackgroundTripId = null;

async function tryUploadLog(log) {
  try {
    await sendLocationLogToApi(log);
    await markLocationLogSent(log.id, "api");
  } catch (error) {
    console.log("Background upload error:", error);
    await incrementLocationLogAttempt(log.id);
  }
}

TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    console.log("Background location task error:", error);
    return;
  }

  try {
    const activeTrip = await getActiveTripSession();

    if (!activeTrip?.id) {
      lastBackgroundTripId = null;
      lastBackgroundPoint = null;
      return;
    }

    if (lastBackgroundTripId !== activeTrip.id) {
      lastBackgroundTripId = activeTrip.id;
      lastBackgroundPoint = null;
    }

    const locations = data?.locations ?? [];

    for (const location of locations) {
      const nextPoint = getCleanPointFromCoords(location?.coords);

      if (!shouldKeepPoint(lastBackgroundPoint, nextPoint)) {
        continue;
      }

      lastBackgroundPoint = nextPoint;

      const placeName = await buildPlaceNameFromCoords(
        nextPoint.latitude,
        nextPoint.longitude,
        "Background reverse geocode error:"
      );
      const recordedAt = new Date(
        location?.timestamp || Date.now()
      ).toISOString();

      const newLogId = await saveLocationLog({
        tripId: activeTrip.id,
        latitude: nextPoint.latitude,
        longitude: nextPoint.longitude,
        placeName,
        recordedAt,
      });

      const savedLog = buildPendingLocationLog({
        id: newLogId,
        tripId: activeTrip.id,
        latitude: nextPoint.latitude,
        longitude: nextPoint.longitude,
        placeName,
        recordedAt,
      });

      await tryUploadLog(savedLog);
    }
  } catch (taskError) {
    console.log("Background location task run error:", taskError);
  }
});