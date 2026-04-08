import { managedMediaDirectory } from "./core";

// Safely returns an array of non-empty strings from either
// an existing array or a JSON string representation of one.
export function safeJsonStringArray(value) {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value
      .filter((item) => typeof item === "string" && item.trim())
      .map((item) => item.trim());
  }

  try {
    const parsed = JSON.parse(value);

    return Array.isArray(parsed)
      ? parsed
          .filter((item) => typeof item === "string" && item.trim())
          .map((item) => item.trim())
      : [];
  } catch {
    return [];
  }
}

// Safely returns an array from either an existing array
// or a JSON string representation of one.
export function safeJsonArray(value) {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value;
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// Removes empty values, converts all entries to strings,
// trims whitespace, and keeps only unique values.
export function uniqueStrings(values) {
  return [...new Set(values.filter(Boolean).map((value) => String(value).trim()))];
}

// Checks whether the given URI points to a local file.
export function isLocalFileUri(uri) {
  return typeof uri === "string" && uri.startsWith("file://");
}

// Checks whether the file URI belongs to the app's managed media folder.
export function isManagedMediaUri(uri) {
  return isLocalFileUri(uri) && uri.startsWith(managedMediaDirectory.uri);
}

// Combines a single image value with an image array
// and returns a cleaned list of unique image paths.
export function normaliseIncomingImages(images, image) {
  const arrayImages = Array.isArray(images) ? images : safeJsonStringArray(images);
  return uniqueStrings([image, ...arrayImages]);
}

// Builds the image fields used when saving a record.
export function buildImageFields(data = {}) {
  const imageUris = normaliseIncomingImages(data.images, data.image);

  return {
    image: imageUris[0] || null,
    imagesJson: JSON.stringify(imageUris),
    imageUris,
  };
}

// Returns all image file URIs associated with a place record.
export function getPlaceFileUris(row) {
  if (!row) {
    return [];
  }

  return uniqueStrings([row.image, ...safeJsonStringArray(row.images)]);
}

// Returns all file URIs associated with a route record,
// including the route snapshot and any attached images.
export function getRouteFileUris(row) {
  if (!row) {
    return [];
  }

  return uniqueStrings([
    row.snapshotUri,
    row.image,
    ...safeJsonStringArray(row.images),
  ]);
}

// Converts a raw database row into a structured place object.
export function serialisePlaceRow(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    title: row.title,
    placeName: row.placeName,
    note: row.note,
    image: row.image,
    images: safeJsonStringArray(row.images),
    latitude: row.latitude,
    longitude: row.longitude,
    city: row.city,
    country: row.country,
    syncStatus: row.syncStatus,
    remoteId: row.remoteId,
    lastSyncedAt: row.lastSyncedAt,
  };
}

// Converts a raw database row into a structured route object.
export function serialiseRouteRow(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    title: row.title,
    note: row.note,
    image: row.image,
    images: safeJsonStringArray(row.images),
    snapshotUri: row.snapshotUri || null,
    startPlaceName: row.startPlaceName,
    endPlaceName: row.endPlaceName,
    startLatitude: row.startLatitude,
    startLongitude: row.startLongitude,
    endLatitude: row.endLatitude,
    endLongitude: row.endLongitude,
    distanceKm: row.distanceKm,
    durationMinutes: row.durationMinutes,
    startedAt: row.startedAt,
    endedAt: row.endedAt,
    routePoints: safeJsonArray(row.routePoints),
    linkedPlaceId: row.linkedPlaceId,
    syncStatus: row.syncStatus,
    remoteId: row.remoteId,
    lastSyncedAt: row.lastSyncedAt,
  };
}