import * as Location from "expo-location";

// Maximum GPS accuracy accepted when creating a point.
export const MAX_ACCEPTED_ACCURACY_METERS = 35;

// Minimum distance required between two saved points.
export const MIN_POINT_DISTANCE_METERS = 10;

// Maximum accepted speed used to ignore unrealistic jumps.
export const MAX_JUMP_SPEED_METERS_PER_SECOND = 20;

// Maximum time allowed for reverse geocoding before falling back to coordinates.
export const PLACE_NAME_TIMEOUT_MS = 1500;

// Format coordinates into a readable text label.
export function buildCoordinateLabel(latitude, longitude) {
  return `${Number(latitude).toFixed(5)}, ${Number(longitude).toFixed(5)}`;
}

// Convert degrees to radians for distance calculations.
function toRadians(value) {
  return (value * Math.PI) / 180;
}

// Calculate the distance in meters between two coordinate points.
export function getDistanceMeters(pointA, pointB) {
  if (!pointA || !pointB) {
    return 0;
  }

  const earthRadius = 6371000;
  const latDiff = toRadians(pointB.latitude - pointA.latitude);
  const lonDiff = toRadians(pointB.longitude - pointA.longitude);
  const lat1 = toRadians(pointA.latitude);
  const lat2 = toRadians(pointB.latitude);

  const a =
    Math.sin(latDiff / 2) * Math.sin(latDiff / 2) +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(lonDiff / 2) *
      Math.sin(lonDiff / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadius * c;
}

// Build a cleaned point object from raw Expo location coordinates.
export function getCleanPointFromCoords(coords, timestamp = Date.now()) {
  const latitude = Number(coords?.latitude);
  const longitude = Number(coords?.longitude);
  const accuracy = Number(coords?.accuracy);

  // Stop when the coordinates are missing or invalid.
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  // Stop when the accuracy is worse than the allowed limit.
  if (Number.isFinite(accuracy) && accuracy > MAX_ACCEPTED_ACCURACY_METERS) {
    return null;
  }

  return {
    latitude,
    longitude,
    accuracy: Number.isFinite(accuracy) ? accuracy : null,
    timestamp: Number.isFinite(timestamp) ? timestamp : Date.now(),
  };
}

// Decide whether a new point should be kept.
export function shouldKeepPoint(lastPoint, nextPoint) {
  if (!nextPoint) {
    return false;
  }

  // Always keep the first valid point.
  if (!lastPoint) {
    return true;
  }

  // Ignore identical coordinates.
  if (
    lastPoint.latitude === nextPoint.latitude &&
    lastPoint.longitude === nextPoint.longitude
  ) {
    return false;
  }

  const distance = getDistanceMeters(lastPoint, nextPoint);

  // Ignore points that are too close to the previous one.
  if (distance < MIN_POINT_DISTANCE_METERS) {
    return false;
  }

  const lastTimestamp = Number(lastPoint.timestamp);
  const nextTimestamp = Number(nextPoint.timestamp);

  // Ignore points that would require an unrealistic travel speed.
  if (Number.isFinite(lastTimestamp) && Number.isFinite(nextTimestamp)) {
    const seconds = Math.max(1, (nextTimestamp - lastTimestamp) / 1000);
    const speed = distance / seconds;

    if (speed > MAX_JUMP_SPEED_METERS_PER_SECOND) {
      return false;
    }
  }

  return true;
}

// Add a new point only when it passes the keep checks.
export function appendMeaningfulCoordinate(current, nextPoint) {
  const safeCurrent = Array.isArray(current) ? current : [];
  const lastPoint = safeCurrent[safeCurrent.length - 1];

  if (!shouldKeepPoint(lastPoint, nextPoint)) {
    return safeCurrent;
  }

  return [...safeCurrent, nextPoint];
}

// Build a new pending location log object.
export function buildPendingLocationLog({
  id,
  tripId,
  latitude,
  longitude,
  placeName,
  recordedAt,
}) {
  return {
    id,
    tripId,
    latitude,
    longitude,
    placeName,
    recordedAt,
    sendStatus: "pending",
    sendAttempts: 0,
    lastAttemptAt: null,
    sentVia: null,
  };
}

// Build a readable place name from coordinates.
export async function buildPlaceNameFromCoords(
  latitude,
  longitude,
  errorLabel = "Reverse geocode error:"
) {
  const fallbackName = buildCoordinateLabel(latitude, longitude);

  try {
    const timeoutToken = Symbol("place-name-timeout");

    // Run reverse geocoding with a timeout fallback.
    const result = await Promise.race([
      Location.reverseGeocodeAsync({
        latitude,
        longitude,
      }),
      new Promise((resolve) => {
        setTimeout(() => resolve(timeoutToken), PLACE_NAME_TIMEOUT_MS);
      }),
    ]);

    // Fall back to coordinates when geocoding times out or returns nothing.
    if (result === timeoutToken || !Array.isArray(result) || !result.length) {
      return fallbackName;
    }

    const first = result[0];

    const cityLabel = first.city
      ? [first.city, first.country].filter(Boolean).join(", ")
      : null;

    // Return the most useful readable label first,
    // using coordinates only as the final fallback.
    return (
      cityLabel ||
      first.district ||
      first.subregion ||
      first.region ||
      first.name ||
      first.street ||
      first.country ||
      fallbackName
    );
  } catch (error) {
    console.log(errorLabel, error);
    return fallbackName;
  }
}