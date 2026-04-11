import { managedMediaDirectory } from "./core";

// Return a cleaned array of non-empty strings from either
// a real array or a JSON string version of one.
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

// Return an array from either a real array
// or a JSON string version of one.
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

// Remove empty values, trim them, and keep only unique strings.
export function uniqueStrings(values) {
  return [...new Set(values.filter(Boolean).map((value) => String(value).trim()))];
}

// Check whether the given URI points to a local file.
export function isLocalFileUri(uri) {
  return typeof uri === "string" && uri.startsWith("file://");
}

// Check whether the file URI belongs to the app's managed media folder.
export function isManagedMediaUri(uri) {
  return isLocalFileUri(uri) && uri.startsWith(managedMediaDirectory.uri);
}

// Combine a single image value with an image array
// and return a cleaned list of unique image paths.
export function normaliseIncomingImages(images, image) {
  const arrayImages = Array.isArray(images) ? images : safeJsonStringArray(images);
  return uniqueStrings([image, ...arrayImages]);
}

// Build the image fields used when saving a record.
export function buildImageFields(data = {}) {
  const imageUris = normaliseIncomingImages(data.images, data.image);

  return {
    image: imageUris[0] || null,
    imagesJson: JSON.stringify(imageUris),
    imageUris,
  };
}

// Return all image file URIs associated with a place record.
export function getPlaceFileUris(row) {
  if (!row) {
    return [];
  }

  return uniqueStrings([row.image, ...safeJsonStringArray(row.images)]);
}

// Return all file URIs associated with a route record,
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

// Convert a raw database row into a structured place object.
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

// Convert a raw database row into a structured route object.
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