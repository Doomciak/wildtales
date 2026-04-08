import { colors } from "../constants/theme";
import { map } from "../constants/layout";

export const ROUTE_LINE_COLOR = colors.routeLine;

// Safely convert a value to a number.
// If conversion fails, return null instead of an invalid number.
function toNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}
// Check that a point exists and has usable latitude and longitude values.
function isValidPoint(point) {
  return (
    point &&
    toNumber(point.latitude) !== null &&
    toNumber(point.longitude) !== null
  );
}

function normalizePoint(point) {
  // Convert any valid point into a clean numeric latitude/longitude object.
  if (!isValidPoint(point)) {
    return null;
  }

  return {
    latitude: Number(point.latitude),
    longitude: Number(point.longitude),
  };
}

// Convert degrees to radians before using trigonometric distance calculations.
export function toRadians(value) {
  return (Number(value) * Math.PI) / 180;
}

export function getDistanceKm(pointA, pointB) {
    // First make sure both points are in a clean numeric format.
  const start = normalizePoint(pointA);
  const end = normalizePoint(pointB);

  // If either point is invalid, return 0 instead of breaking calculations.
  if (!start || !end) {
    return 0;
  }

  // Haversine formula used to calculate distance between two coordinates.
  const earthRadiusKm = 6371;
  const dLat = toRadians(end.latitude - start.latitude);
  const dLon = toRadians(end.longitude - start.longitude);

  const lat1 = toRadians(start.latitude);
  const lat2 = toRadians(end.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  return earthRadiusKm * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export function getPathDistanceKm(coords = []) {
  // Total route distance is built by summing the distance
  // between each pair of neighbouring points.
  if (!Array.isArray(coords) || coords.length < 2) {
    return 0;
  }

  let total = 0;

  for (let index = 1; index < coords.length; index += 1) {
    total += getDistanceKm(coords[index - 1], coords[index]);
  }

  return total;
}

export function formatDistanceKm(distanceKm) {
  const value = Number(distanceKm);

  if (!Number.isFinite(value) || value <= 0) {
    return "0 km";
  }

  // Keep very small distances readable instead of showing long decimals.
  if (value < 0.1) {
    return "0.1 km";
  }

  if (value < 10) {
    return `${value.toFixed(1)} km`;
  }

  return `${Math.round(value)} km`;
}

export function formatDuration(durationMinutes) {
  const totalMinutes = Math.max(0, Math.round(Number(durationMinutes) || 0));

  if (totalMinutes < 1) {
    return "Just started";
  }

  if (totalMinutes < 60) {
    return `${totalMinutes} min`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (!minutes) {
    return `${hours}h`;
  }

  return `${hours}h ${minutes}m`;
}

export function getShortPlaceLabel(placeName) {
  const cleanText = String(placeName || "").trim();

  if (!cleanText) {
    return "";
  }

  // For longer location strings like "Glasgow, Scotland",
  // only use the first part for shorter labels and titles.
  return cleanText.split(",")[0].trim();
}

export function buildJourneyTitleFromTrip(tripOrStart, maybeEnd) {
  // This supports both:
  // 1. a trip object with startPlaceName and endPlaceName
  // 2. two separate start and end values
  const startPlaceName =
    typeof tripOrStart === "object" && tripOrStart !== null
      ? tripOrStart.startPlaceName
      : tripOrStart;

  const endPlaceName =
    typeof tripOrStart === "object" && tripOrStart !== null
      ? tripOrStart.endPlaceName
      : maybeEnd;

  const shortStart = getShortPlaceLabel(startPlaceName);
  const shortEnd = getShortPlaceLabel(endPlaceName);

  if (
    shortStart &&
    shortEnd &&
    shortStart.toLowerCase() !== shortEnd.toLowerCase()
  ) {
    return `${shortStart} to ${shortEnd}`;
  }

  if (shortEnd) {
    return `${shortEnd} journey`;
  }

  if (shortStart) {
    return `${shortStart} journey`;
  }

  return "Tracked journey";
}

export function formatJourneyDate(dateText) {
  if (!dateText) {
    return "";
  }

  const parsed = new Date(dateText);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return parsed.toLocaleString();
}

export function getRouteLocationLine(route = {}) {
  const startPlace = String(route.startPlaceName || "").trim();
  const endPlace = String(route.endPlaceName || "").trim();

  // If both ends are known and different, show a route line.
  if (startPlace && endPlace && startPlace !== endPlace) {
    return `${startPlace} → ${endPlace}`;
  }

  return endPlace || startPlace || "";
}

export function getMapRegionForPoints(points = [], fallbackPoint = null) {
  const validPoints = points.map(normalizePoint).filter(Boolean);
  const fallback = normalizePoint(fallbackPoint);

  // One point: use a fixed closer zoom.
  if (validPoints.length === 1) {
    return {
      latitude: validPoints[0].latitude,
      longitude: validPoints[0].longitude,
      latitudeDelta: map.singlePointDelta.latitude,
      longitudeDelta: map.singlePointDelta.longitude,
    };
  }

  // Multiple points: calculate a region that fits the whole set.
  if (validPoints.length > 1) {
    const latitudes = validPoints.map((point) => point.latitude);
    const longitudes = validPoints.map((point) => point.longitude);

    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLng = Math.min(...longitudes);
    const maxLng = Math.max(...longitudes);

    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max((maxLat - minLat) * 1.7, 0.05),
      longitudeDelta: Math.max((maxLng - minLng) * 1.7, 0.05),
    };
  }

  // If there are no usable route points, fall back to one known point if available.
  if (fallback) {
    return {
      latitude: fallback.latitude,
      longitude: fallback.longitude,
      latitudeDelta: map.fallbackPointDelta.latitude,
      longitudeDelta: map.fallbackPointDelta.longitude,
    };
  }

  // Final fallback used when no location data exists at all.
  return map.defaultRegion;
}

export function getPlaceLocationText(place = {}) {
  if (place.placeName) {
    return place.placeName;
  }

  // If no full place name exists, build one from city and country.
  return [place.city, place.country].filter(Boolean).join(", ");
}