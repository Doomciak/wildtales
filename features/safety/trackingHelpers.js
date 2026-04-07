import * as Location from "expo-location";

export const MAX_ACCEPTED_ACCURACY_METERS = 120;
export const MIN_POINT_DISTANCE_METERS = 3;
export const PLACE_NAME_TIMEOUT_MS = 1500;

export function buildCoordinateLabel(latitude, longitude) {
  return `${Number(latitude).toFixed(5)}, ${Number(longitude).toFixed(5)}`;
}

function toRadians(value) {
  return (value * Math.PI) / 180;
}

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

export function getCleanPointFromCoords(coords) {
  const latitude = Number(coords?.latitude);
  const longitude = Number(coords?.longitude);
  const accuracy = Number(coords?.accuracy);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  if (Number.isFinite(accuracy) && accuracy > MAX_ACCEPTED_ACCURACY_METERS) {
    return null;
  }

  return {
    latitude,
    longitude,
  };
}

export function shouldKeepPoint(lastPoint, nextPoint) {
  if (!nextPoint) {
    return false;
  }

  if (!lastPoint) {
    return true;
  }

  if (
    lastPoint.latitude === nextPoint.latitude &&
    lastPoint.longitude === nextPoint.longitude
  ) {
    return false;
  }

  return getDistanceMeters(lastPoint, nextPoint) >= MIN_POINT_DISTANCE_METERS;
}

export function appendMeaningfulCoordinate(current, nextPoint) {
  const safeCurrent = Array.isArray(current) ? current : [];
  const lastPoint = safeCurrent[safeCurrent.length - 1];

  if (!shouldKeepPoint(lastPoint, nextPoint)) {
    return safeCurrent;
  }

  return [...safeCurrent, nextPoint];
}

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

export async function buildPlaceNameFromCoords(
  latitude,
  longitude,
  errorLabel = "Reverse geocode error:"
) {
  const fallbackName = buildCoordinateLabel(latitude, longitude);

  try {
    const timeoutToken = Symbol("place-name-timeout");

    const result = await Promise.race([
      Location.reverseGeocodeAsync({
        latitude,
        longitude,
      }),
      new Promise((resolve) => {
        setTimeout(() => resolve(timeoutToken), PLACE_NAME_TIMEOUT_MS);
      }),
    ]);

    if (result === timeoutToken || !Array.isArray(result) || !result.length) {
      return fallbackName;
    }

    const first = result[0];

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
    console.log(errorLabel, error);
    return fallbackName;
  }
}