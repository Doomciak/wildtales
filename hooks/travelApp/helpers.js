import { Directory, File, Paths } from "expo-file-system";

import { MANAGED_MEDIA_FOLDER_NAME } from "../../db";
import { getDistanceKm, getPathDistanceKm } from "../../utils/travel";

// Parse the stored images field into a clean images array.
export function parseImages(imagesValue, legacyImage) {
  let parsedImages = [];

  if (Array.isArray(imagesValue)) {
    parsedImages = imagesValue.filter(Boolean);
  } else if (typeof imagesValue === "string" && imagesValue.trim()) {
    try {
      const parsed = JSON.parse(imagesValue);

      if (Array.isArray(parsed)) {
        parsedImages = parsed.filter(Boolean);
      }
    } catch (error) {
      console.log("Parse images error:", error);
    }
  }

  // Fall back to the older single image field when needed.
  if (!parsedImages.length && legacyImage) {
    parsedImages = [legacyImage];
  }

  return [...new Set(parsedImages)];
}

// Parse stored route points into a clean coordinates array.
export function parseRoutePoints(routePointsValue) {
  if (Array.isArray(routePointsValue)) {
    return routePointsValue
      .filter(
        (point) => point && point.latitude != null && point.longitude != null
      )
      .map((point) => ({
        latitude: Number(point.latitude),
        longitude: Number(point.longitude),
      }));
  }

  if (typeof routePointsValue === "string" && routePointsValue.trim()) {
    try {
      const parsed = JSON.parse(routePointsValue);

      if (Array.isArray(parsed)) {
        return parsed
          .filter(
            (point) => point && point.latitude != null && point.longitude != null
          )
          .map((point) => ({
            latitude: Number(point.latitude),
            longitude: Number(point.longitude),
          }));
      }
    } catch (error) {
      console.log("Parse route points error:", error);
    }
  }

  return [];
}

// Read city and country values from a place object.
function getPlaceDetails(place) {
  const savedCity = typeof place?.city === "string" ? place.city.trim() : "";
  const savedCountry =
    typeof place?.country === "string" ? place.country.trim() : "";

  // Use saved city and country values when they already exist.
  if (savedCity || savedCountry) {
    return {
      city: savedCity,
      country: savedCountry,
    };
  }

  const rawPlaceName = String(place?.placeName || "").trim();

  if (!rawPlaceName) {
    return {
      city: "",
      country: "",
    };
  }

  // Split the place name into separate text parts.
  const parts = rawPlaceName
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 1) {
    return {
      city: parts[0],
      country: "",
    };
  }

  return {
    city: parts[0] || "",
    country: parts[parts.length - 1] || "",
  };
}

// Build a place object in the format used by the UI.
export function buildPlaceForUi(place) {
  const details = getPlaceDetails(place);
  const images = parseImages(place.images, place.image);

  return {
    ...place,
    images,
    coverImage: images[0] || null,
    city: place.city || details.city || "",
    country: place.country || details.country || "",
  };
}

// Build a route object in the format used by the UI.
export function buildRouteForUi(route) {
  const images = parseImages(route.images, route.image);

  return {
    ...route,
    images,
    coverImage: images[0] || null,
    snapshotUri: route.snapshotUri || null,
    routePoints: parseRoutePoints(route.routePoints),
  };
}

// Build a suggested link between active trip logs and a saved place.
export function buildActiveRouteLink(places, tripLogs) {
  const validLogs = tripLogs.filter(
    (log) => log.latitude != null && log.longitude != null
  );

  if (!validLogs.length) {
    return null;
  }

  const coords = validLogs.map((log) => ({
    latitude: Number(log.latitude),
    longitude: Number(log.longitude),
  }));

  const latestLog = validLogs[validLogs.length - 1];
  const latestPoint = coords[coords.length - 1];
  const totalDistanceKm = getPathDistanceKm(coords);

  const startedAt = new Date(validLogs[0].recordedAt).getTime();
  const endedAt = new Date(latestLog.recordedAt).getTime();
  const durationMinutes = Math.max(
    1,
    Math.round((endedAt - startedAt) / 60000)
  );

  let matchedPlace = null;
  let nearestDistanceKm = Number.POSITIVE_INFINITY;

  // Find the nearest saved place to the latest tracked point.
  places.forEach((place) => {
    if (place.latitude == null || place.longitude == null) {
      return;
    }

    const distanceKm = getDistanceKm(
      {
        latitude: Number(place.latitude),
        longitude: Number(place.longitude),
      },
      latestPoint
    );

    if (distanceKm < nearestDistanceKm) {
      nearestDistanceKm = distanceKm;
      matchedPlace = place;
    }
  });

  // Try a text match if the nearest place is still too far away.
  if (!matchedPlace || nearestDistanceKm > 25) {
    const latestPlaceText = String(latestLog.placeName || "").toLowerCase();

    matchedPlace =
      places.find((place) => {
        const cityText = String(place.city || "").trim().toLowerCase();
        const countryText = String(place.country || "").trim().toLowerCase();

        return (
          (cityText && latestPlaceText.includes(cityText)) ||
          (countryText && latestPlaceText.includes(countryText))
        );
      }) || null;
  }

  return {
    placeId: matchedPlace?.id || null,
    label:
      matchedPlace?.placeName ||
      [matchedPlace?.city, matchedPlace?.country].filter(Boolean).join(", ") ||
      latestLog.placeName ||
      matchedPlace?.title ||
      "your saved place",
    totalDistanceKm,
    durationMinutes,
    startedAt: validLogs[0].recordedAt,
    endedAt: latestLog.recordedAt,
  };
}

// Build a text label from latitude and longitude values.
export function buildCoordinateFallbackName(latitude, longitude) {
  return `${Number(latitude).toFixed(5)}, ${Number(longitude).toFixed(5)}`;
}

// Return the app folder used for managed media files.
function getAppImageDirectory() {
  const directory = new Directory(Paths.document, MANAGED_MEDIA_FOLDER_NAME);

  // Create the folder if it does not exist yet.
  if (!directory.exists) {
    directory.create({
      idempotent: true,
      intermediates: true,
    });
  }

  return directory;
}

// Check whether a URI belongs to the app-managed media folder.
export function isManagedAppImageUri(uri) {
  if (!uri) {
    return false;
  }

  try {
    const directory = new Directory(Paths.document, MANAGED_MEDIA_FOLDER_NAME);
    return String(uri).startsWith(directory.uri);
  } catch {
    return false;
  }
}

// Read the file extension from a URI.
function getFileExtensionFromUri(uri) {
  const cleanUri = String(uri || "").split("?")[0];
  const lastDotIndex = cleanUri.lastIndexOf(".");

  if (lastDotIndex === -1) {
    return ".jpg";
  }

  const extension = cleanUri.slice(lastDotIndex).toLowerCase();

  if (!extension || extension.length > 10) {
    return ".jpg";
  }

  return extension;
}

// Build a unique file name for a managed media file.
function buildManagedImageName(uri, index = 0, prefix = "image") {
  const extension = getFileExtensionFromUri(uri);
  const timestamp = Date.now();
  const randomPart = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${timestamp}-${index}-${randomPart}${extension}`;
}

// Delete one managed file if it exists.
export function deleteManagedFileQuietly(uri) {
  try {
    if (!uri || !isManagedAppImageUri(uri)) {
      return;
    }

    const file = new File(uri);

    if (file.exists) {
      file.delete();
    }
  } catch (error) {
    console.log("Delete managed file error:", error);
  }
}

// Delete multiple managed files.
export function deleteManagedFilesQuietly(uris = []) {
  [...new Set((uris || []).filter(Boolean))].forEach((uri) => {
    deleteManagedFileQuietly(uri);
  });
}

// Return managed image URIs used by a place.
export function getManagedPlaceMediaUris(place) {
  const uiPlace = buildPlaceForUi(place);
  return uiPlace.images.filter(isManagedAppImageUri);
}

// Return managed media URIs used by a route.
export function getManagedRouteMediaUris(route) {
  const uiRoute = buildRouteForUi(route);
  const mediaUris = [
    ...(uiRoute.images || []).filter(isManagedAppImageUri),
    uiRoute.snapshotUri,
  ].filter(isManagedAppImageUri);

  return [...new Set(mediaUris)];
}

// Return managed URIs that were removed between two versions.
export function getRemovedManagedUris(previousUris = [], nextUris = []) {
  const nextSet = new Set(nextUris.filter(isManagedAppImageUri));

  return previousUris.filter(
    (uri) => isManagedAppImageUri(uri) && !nextSet.has(uri)
  );
}

// Copy draft images into the app-managed media folder.
export async function persistDraftImages(imageUris = [], prefix = "place") {
  const uniqueUris = [...new Set((imageUris || []).filter(Boolean))];
  const directory = getAppImageDirectory();
  const copiedUris = [];
  const newlyCopiedUris = [];
  const cache = new Map();

  // Copy only files that are not already managed by the app.
  for (let index = 0; index < uniqueUris.length; index += 1) {
    const uri = uniqueUris[index];

    if (cache.has(uri)) {
      copiedUris.push(cache.get(uri));
      continue;
    }

    if (isManagedAppImageUri(uri)) {
      cache.set(uri, uri);
      copiedUris.push(uri);
      continue;
    }

    const fileName = buildManagedImageName(uri, index, prefix);
    const destinationFile = new File(directory, fileName);
    const sourceFile = new File(uri);

    sourceFile.copy(destinationFile);

    cache.set(uri, destinationFile.uri);
    copiedUris.push(destinationFile.uri);
    newlyCopiedUris.push(destinationFile.uri);
  }

  return {
    stableUris: copiedUris,
    newlyCopiedUris,
  };
}

// Copy one file into the app-managed media folder.
export async function persistSingleDraftFile(uri, prefix = "route-snapshot") {
  if (!uri) {
    return {
      stableUri: null,
      newlyCopiedUri: null,
    };
  }

  if (isManagedAppImageUri(uri)) {
    return {
      stableUri: uri,
      newlyCopiedUri: null,
    };
  }

  const directory = getAppImageDirectory();
  const fileName = buildManagedImageName(uri, 0, prefix);
  const destinationFile = new File(directory, fileName);
  const sourceFile = new File(uri);

  sourceFile.copy(destinationFile);

  return {
    stableUri: destinationFile.uri,
    newlyCopiedUri: destinationFile.uri,
  };
}