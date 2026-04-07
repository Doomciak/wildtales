import { useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { Directory, File, Paths } from "expo-file-system";

import {
  buildJourneyTitleFromTrip,
  formatDistanceKm,
  formatDuration,
  getDistanceKm,
  getPathDistanceKm,
  getRouteLocationLine,
} from "../utils/travel";
import {
  deletePlaceFromDb,
  deleteRouteFromDb,
  getActiveTripSession,
  getAllPlaces,
  getAllRoutes,
  getLocationLogsForTrip,
  MANAGED_MEDIA_FOLDER_NAME,
  savePlaceToDb,
  saveRouteToDb,
  setupDatabase,
} from "../db";

function parseImages(imagesValue, legacyImage) {
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

  if (!parsedImages.length && legacyImage) {
    parsedImages = [legacyImage];
  }

  return [...new Set(parsedImages)];
}

function parseRoutePoints(routePointsValue) {
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

function getPlaceDetails(place) {
  const savedCity = typeof place?.city === "string" ? place.city.trim() : "";
  const savedCountry =
    typeof place?.country === "string" ? place.country.trim() : "";

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

function buildPlaceForUi(place) {
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

function buildRouteForUi(route) {
  const images = parseImages(route.images, route.image);

  return {
    ...route,
    images,
    coverImage: images[0] || null,
    snapshotUri: route.snapshotUri || null,
    routePoints: parseRoutePoints(route.routePoints),
  };
}

function buildActiveRouteLink(places, tripLogs) {
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

function buildCoordinateFallbackName(latitude, longitude) {
  return `${Number(latitude).toFixed(5)}, ${Number(longitude).toFixed(5)}`;
}

function getAppImageDirectory() {
  const directory = new Directory(Paths.document, MANAGED_MEDIA_FOLDER_NAME);

  if (!directory.exists) {
    directory.create({
      idempotent: true,
      intermediates: true,
    });
  }

  return directory;
}

function isManagedAppImageUri(uri) {
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

function buildManagedImageName(uri, index = 0, prefix = "image") {
  const extension = getFileExtensionFromUri(uri);
  const timestamp = Date.now();
  const randomPart = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${timestamp}-${index}-${randomPart}${extension}`;
}

function deleteManagedFileQuietly(uri) {
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

function deleteManagedFilesQuietly(uris = []) {
  [...new Set((uris || []).filter(Boolean))].forEach((uri) => {
    deleteManagedFileQuietly(uri);
  });
}

function getManagedPlaceMediaUris(place) {
  const uiPlace = buildPlaceForUi(place);
  return uiPlace.images.filter(isManagedAppImageUri);
}

function getManagedRouteMediaUris(route) {
  const uiRoute = buildRouteForUi(route);
  const mediaUris = [
    ...(uiRoute.images || []).filter(isManagedAppImageUri),
    uiRoute.snapshotUri,
  ].filter(isManagedAppImageUri);

  return [...new Set(mediaUris)];
}

function getRemovedManagedUris(previousUris = [], nextUris = []) {
  const nextSet = new Set(nextUris.filter(isManagedAppImageUri));
  return previousUris.filter((uri) => isManagedAppImageUri(uri) && !nextSet.has(uri));
}

async function persistDraftImages(imageUris = [], prefix = "place") {
  const uniqueUris = [...new Set((imageUris || []).filter(Boolean))];
  const directory = getAppImageDirectory();
  const copiedUris = [];
  const newlyCopiedUris = [];
  const cache = new Map();

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

async function persistSingleDraftFile(uri, prefix = "route-snapshot") {
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

export default function useTravelApp() {
  const [showWelcome, setShowWelcome] = useState(true);
  const [activeTab, setActiveTab] = useState("home");

  const [places, setPlaces] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("All");
  const [selectedCity, setSelectedCity] = useState("All");

  const [title, setTitle] = useState("");
  const [placeName, setPlaceName] = useState("");
  const [note, setNote] = useState("");
  const [images, setImages] = useState([]);
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");

  const [editingPlace, setEditingPlace] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [activeRouteLink, setActiveRouteLink] = useState(null);

  const [editingRoute, setEditingRoute] = useState(null);
  const [editingRouteTitle, setEditingRouteTitle] = useState("");
  const [editingRouteNote, setEditingRouteNote] = useState("");
  const [savingRouteEdit, setSavingRouteEdit] = useState(false);

  const [finishedTripDraft, setFinishedTripDraft] = useState(null);
  const [finishedTripTitle, setFinishedTripTitle] = useState("");
  const [finishedTripNote, setFinishedTripNote] = useState("");
  const [saveTripModalVisible, setSaveTripModalVisible] = useState(false);
  const [savingTripChoice, setSavingTripChoice] = useState(false);

  useEffect(() => {
    initialiseApp();
  }, []);

  useEffect(() => {
    loadActiveRouteLink();

    const interval = setInterval(() => {
      loadActiveRouteLink();
    }, 15000);

    return () => clearInterval(interval);
  }, [places]);

  async function initialiseApp() {
    try {
      await setupDatabase();

      const [placeRows, routeRows] = await Promise.all([
        loadPlaces(),
        loadRoutes(),
      ]);

      await loadActiveRouteLink(placeRows);

      return { placeRows, routeRows };
    } catch (error) {
      console.log("Initialise app error:", error);
      return { placeRows: [], routeRows: [] };
    } finally {
      setLoading(false);
    }
  }

  async function loadPlaces() {
    try {
      const rows = await getAllPlaces();
      setPlaces(rows);
      return rows;
    } catch (error) {
      console.log("Load places error:", error);
      return [];
    }
  }

  async function loadRoutes() {
    try {
      const rows = await getAllRoutes();
      const parsedRoutes = rows.map(buildRouteForUi);
      setRoutes(parsedRoutes);
      return parsedRoutes;
    } catch (error) {
      console.log("Load routes error:", error);
      return [];
    }
  }

  async function loadActiveRouteLink(placesOverride = null) {
    try {
      const activeTrip = await getActiveTripSession();

      if (!activeTrip) {
        setActiveRouteLink(null);
        return null;
      }

      const tripLogs = await getLocationLogsForTrip(activeTrip.id);

      const placesSource = Array.isArray(placesOverride)
        ? placesOverride
        : await getAllPlaces();

      const placesForUi = placesSource.map(buildPlaceForUi);
      const nextLink = buildActiveRouteLink(placesForUi, tripLogs);

      setActiveRouteLink(nextLink);
      return nextLink;
    } catch (error) {
      console.log("Load active route link error:", error);
      return null;
    }
  }

  function clearForm() {
    setTitle("");
    setPlaceName("");
    setNote("");
    setImages([]);
    setLatitude(null);
    setLongitude(null);
    setCity("");
    setCountry("");
    setEditingPlace(null);
  }

  function cancelEditing() {
    clearForm();
    setActiveTab("places");
  }

  function startEditing(place) {
    const uiPlace = buildPlaceForUi(place);

    setEditingPlace(uiPlace);
    setTitle(uiPlace.title);
    setPlaceName(uiPlace.placeName || "");
    setNote(uiPlace.note);
    setImages(uiPlace.images || []);
    setLatitude(uiPlace.latitude ?? null);
    setLongitude(uiPlace.longitude ?? null);
    setCity(uiPlace.city || "");
    setCountry(uiPlace.country || "");
    setActiveTab("add");
  }

  async function savePlace() {
    const cleanTitle = title.trim();
    const cleanNote = note.trim();

    if (!cleanTitle || !cleanNote) {
      Alert.alert("Missing details", "Please enter both a title and a note.");
      return;
    }

    let newlyCopiedUris = [];

    try {
      const previousManagedUris = editingPlace
        ? getManagedPlaceMediaUris(editingPlace)
        : [];

      const persistedImages = await persistDraftImages(images, "place");
      const stableImages = persistedImages.stableUris;
      newlyCopiedUris = persistedImages.newlyCopiedUris;

      await savePlaceToDb(
        {
          title: cleanTitle,
          placeName: String(placeName || "").trim() || null,
          note: cleanNote,
          image: stableImages[0] || null,
          images: stableImages,
          latitude,
          longitude,
          city: String(city || "").trim() || null,
          country: String(country || "").trim() || null,
        },
        editingPlace?.id || null
      );

      const removedManagedUris = getRemovedManagedUris(
        previousManagedUris,
        stableImages
      );

      deleteManagedFilesQuietly(removedManagedUris);

      clearForm();
      setActiveTab("places");

      const placeRows = await loadPlaces();
      await loadActiveRouteLink(placeRows);
    } catch (error) {
      console.log("Save place error:", error);

      deleteManagedFilesQuietly(newlyCopiedUris);

      Alert.alert("Save failed", "We could not save this place.");
    }
  }

  function removePlace(id) {
    Alert.alert("Delete place", "Are you sure you want to remove this memory?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const placeToDelete = places.find((place) => place.id === id);
            const managedUris = placeToDelete
              ? getManagedPlaceMediaUris(placeToDelete)
              : [];

            await deletePlaceFromDb(id);
            deleteManagedFilesQuietly(managedUris);

            const [placeRows] = await Promise.all([loadPlaces(), loadRoutes()]);
            await loadActiveRouteLink(placeRows);

            if (editingPlace?.id === id) {
              clearForm();
            }
          } catch (error) {
            console.log("Delete place error:", error);
            Alert.alert("Delete failed", "We could not remove this place.");
          }
        },
      },
    ]);
  }

  function startEditingJourney(route) {
    const cleanRoute = buildRouteForUi(route);

    setEditingRoute(cleanRoute);
    setEditingRouteTitle(
      String(cleanRoute.title || "").trim() ||
        buildJourneyTitleFromTrip(cleanRoute)
    );
    setEditingRouteNote(cleanRoute.note || "");
  }

  function closeRouteEditing() {
    setEditingRoute(null);
    setEditingRouteTitle("");
    setEditingRouteNote("");
    setSavingRouteEdit(false);
  }

  async function saveRouteChanges() {
    if (!editingRoute || savingRouteEdit) {
      return;
    }

    const cleanTitle = String(editingRouteTitle || "").trim();
    const cleanNote = String(editingRouteNote || "").trim();

    if (!cleanTitle) {
      Alert.alert("Missing title", "Please enter a title for the journey.");
      return;
    }

    try {
      setSavingRouteEdit(true);

      await saveRouteToDb(
        {
          ...editingRoute,
          title: cleanTitle,
          note: cleanNote || null,
        },
        editingRoute.id
      );

      await loadRoutes();
      closeRouteEditing();
    } catch (error) {
      console.log("Save route changes error:", error);
      Alert.alert("Save failed", "We could not update this journey.");
      setSavingRouteEdit(false);
    }
  }

  function removeRoute(id) {
    Alert.alert(
      "Delete journey",
      "Are you sure you want to remove this saved journey?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const routeToDelete = routes.find((route) => route.id === id);
              const managedUris = routeToDelete
                ? getManagedRouteMediaUris(routeToDelete)
                : [];

              await deleteRouteFromDb(id);
              deleteManagedFilesQuietly(managedUris);

              await loadRoutes();

              if (editingRoute?.id === id) {
                closeRouteEditing();
              }
            } catch (error) {
              console.log("Delete route error:", error);
              Alert.alert("Delete failed", "We could not remove this journey.");
            }
          },
        },
      ]
    );
  }

  async function pickFromLibrary() {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Permission needed",
          "Please allow access to your photo library."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: 10,
      });

      if (!result.canceled && result.assets?.length) {
        const newUris = result.assets.map((asset) => asset.uri).filter(Boolean);
        setImages((current) => [...new Set([...current, ...newUris])]);
      }
    } catch (error) {
      console.log("Library picker error:", error);
      Alert.alert("Photos error", "We could not open your photo library.");
    }
  }

  async function takePhoto() {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();

      if (!permission.granted) {
        Alert.alert("Permission needed", "Please allow access to your camera.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        setImages((current) => [...new Set([...current, result.assets[0].uri])]);
      }
    } catch (error) {
      console.log("Camera picker error:", error);
      Alert.alert("Camera error", "We could not take a photo right now.");
    }
  }

  function openImageOptions() {
    Alert.alert("Photos", "Choose how you want to add photos.", [
      { text: "Take photo", onPress: takePhoto },
      { text: "Choose from library", onPress: pickFromLibrary },
      { text: "Cancel", style: "cancel" },
    ]);
  }

  function confirmRemoveAllImages() {
    if (!images.length) {
      return;
    }

    Alert.alert("Remove photos", "Remove all photos from this place?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => setImages([]),
      },
    ]);
  }

  async function saveJourneyPhotoUris(route, newUris) {
    if (!route || !newUris?.length) {
      return;
    }

    let newlyCopiedUris = [];

    try {
      const mergedUris = [...new Set([...(route.images || []), ...newUris])];
      const persistedImages = await persistDraftImages(
        mergedUris,
        "route-photo"
      );

      newlyCopiedUris = persistedImages.newlyCopiedUris;

      await saveRouteToDb(
        {
          ...route,
          snapshotUri: route.snapshotUri || null,
          image: persistedImages.stableUris[0] || null,
          images: persistedImages.stableUris,
        },
        route.id
      );

      await loadRoutes();
    } catch (error) {
      console.log("Save journey photos error:", error);

      deleteManagedFilesQuietly(newlyCopiedUris);

      Alert.alert("Photos error", "We could not save journey photos.");
    }
  }

  async function pickJourneyPhotosFromLibrary(route) {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Permission needed",
          "Please allow access to your photo library."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: 10,
      });

      if (!result.canceled && result.assets?.length) {
        const newUris = result.assets.map((asset) => asset.uri).filter(Boolean);
        await saveJourneyPhotoUris(route, newUris);
      }
    } catch (error) {
      console.log("Journey library picker error:", error);
      Alert.alert("Photos error", "We could not open your photo library.");
    }
  }

  async function takeJourneyPhoto(route) {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();

      if (!permission.granted) {
        Alert.alert("Permission needed", "Please allow access to your camera.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        await saveJourneyPhotoUris(route, [result.assets[0].uri]);
      }
    } catch (error) {
      console.log("Journey camera picker error:", error);
      Alert.alert("Camera error", "We could not take a photo right now.");
    }
  }

  function openJourneyPhotoOptions(route) {
    if (!route) {
      return;
    }

    Alert.alert("Journey photos", "Choose how you want to add photos.", [
      { text: "Take photo", onPress: () => takeJourneyPhoto(route) },
      {
        text: "Choose from library",
        onPress: () => pickJourneyPhotosFromLibrary(route),
      },
      { text: "Cancel", style: "cancel" },
    ]);
  }

  async function getCurrentLocation() {
    try {
      setLocationLoading(true);

      const permission = await Location.requestForegroundPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Permission needed",
          "Please allow location access to save where this memory happened."
        );
        return;
      }

      let position = null;

      try {
        position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
      } catch (error) {
        console.log("Current position error:", error);
      }

      if (!position) {
        position = await Location.getLastKnownPositionAsync({
          maxAge: 1000 * 60 * 30,
          requiredAccuracy: 1000,
        });
      }

      if (!position) {
        Alert.alert(
          "Location not found",
          "We could not get your location right now. Try again in a moment."
        );
        return;
      }

      const newLatitude = position.coords.latitude;
      const newLongitude = position.coords.longitude;
      const fallbackPlaceName = buildCoordinateFallbackName(
        newLatitude,
        newLongitude
      );

      setLatitude(newLatitude);
      setLongitude(newLongitude);
      setPlaceName(fallbackPlaceName);

      if (!title.trim()) {
        setTitle("Pinned place");
      }

      try {
        const results = await Location.reverseGeocodeAsync({
          latitude: newLatitude,
          longitude: newLongitude,
        });

        if (results.length > 0) {
          const first = results[0];

          const detectedCity =
            first.city || first.district || first.subregion || first.region || "";

          const detectedCountry = first.country || "";

          const detectedName =
            [detectedCity, detectedCountry].filter(Boolean).join(", ") ||
            first.name ||
            first.street ||
            fallbackPlaceName;

          setCity(detectedCity);
          setCountry(detectedCountry);
          setPlaceName(detectedName);

          if (!title.trim()) {
            setTitle(detectedCity || detectedName);
          }
        }
      } catch (error) {
        console.log("Reverse geocode error:", error);
      }
    } catch (error) {
      console.log("Location error:", error);
      Alert.alert(
        "Location error",
        "Something went wrong while reading location."
      );
    } finally {
      setLocationLoading(false);
    }
  }

  function clearLocation() {
    setLatitude(null);
    setLongitude(null);
    setPlaceName("");
    setCity("");
    setCountry("");
  }

  function handleTripFinished(tripSummary) {
    if (!tripSummary) {
      return;
    }

    const suggestedTitle =
      String(tripSummary.title || "").trim() ||
      buildJourneyTitleFromTrip(tripSummary);

    setFinishedTripDraft({
      ...tripSummary,
      title: suggestedTitle,
      snapshotUri: tripSummary.snapshotUri || null,
      images: Array.isArray(tripSummary.images) ? tripSummary.images : [],
    });
    setFinishedTripTitle(suggestedTitle);
    setFinishedTripNote("");
    setSaveTripModalVisible(true);
  }

  function closeFinishedTripModal() {
    setSaveTripModalVisible(false);
    setFinishedTripDraft(null);
    setFinishedTripTitle("");
    setFinishedTripNote("");
    setSavingTripChoice(false);
  }

  async function saveFinishedTripAsJourney() {
    if (!finishedTripDraft || savingTripChoice) {
      return;
    }

    let newSnapshotUri = null;

    try {
      setSavingTripChoice(true);

      const routeTitle =
        String(finishedTripTitle || "").trim() ||
        buildJourneyTitleFromTrip(finishedTripDraft);

      const persistedSnapshot = await persistSingleDraftFile(
        finishedTripDraft.snapshotUri,
        "route-snapshot"
      );

      newSnapshotUri = persistedSnapshot.newlyCopiedUri;

      await saveRouteToDb({
        ...finishedTripDraft,
        snapshotUri: persistedSnapshot.stableUri,
        title: routeTitle,
        note: String(finishedTripNote || "").trim() || null,
        images: Array.isArray(finishedTripDraft.images)
          ? finishedTripDraft.images
          : [],
      });

      await loadRoutes();
      closeFinishedTripModal();
      setActiveTab("journeys");
    } catch (error) {
      console.log("Save finished trip as journey error:", error);

      if (newSnapshotUri) {
        deleteManagedFileQuietly(newSnapshotUri);
      }

      Alert.alert("Save failed", "We could not save this journey.");
      setSavingTripChoice(false);
    }
  }

  const placesWithDetails = useMemo(() => {
    return places.map(buildPlaceForUi);
  }, [places]);

  const countries = useMemo(() => {
    const uniqueCountries = [
      ...new Set(
        placesWithDetails
          .map((place) => place.country)
          .filter((value) => value && value.trim())
      ),
    ];

    return ["All", ...uniqueCountries];
  }, [placesWithDetails]);

  const cities = useMemo(() => {
    const source =
      selectedCountry === "All"
        ? placesWithDetails
        : placesWithDetails.filter((place) => place.country === selectedCountry);

    const uniqueCities = [
      ...new Set(
        source.map((place) => place.city).filter((value) => value && value.trim())
      ),
    ];

    return ["All", ...uniqueCities];
  }, [placesWithDetails, selectedCountry]);

  useEffect(() => {
    if (!countries.includes(selectedCountry)) {
      setSelectedCountry("All");
    }
  }, [countries, selectedCountry]);

  useEffect(() => {
    if (!cities.includes(selectedCity)) {
      setSelectedCity("All");
    }
  }, [cities, selectedCity]);

  const filteredPlaces = useMemo(() => {
    const query = search.trim().toLowerCase();

    return placesWithDetails.filter((place) => {
      const matchesSearch =
        !query ||
        String(place.title).toLowerCase().includes(query) ||
        String(place.note).toLowerCase().includes(query) ||
        String(place.placeName || "").toLowerCase().includes(query) ||
        String(place.city || "").toLowerCase().includes(query) ||
        String(place.country || "").toLowerCase().includes(query);

      const matchesCountry =
        selectedCountry === "All" || place.country === selectedCountry;

      const matchesCity = selectedCity === "All" || place.city === selectedCity;

      return matchesSearch && matchesCountry && matchesCity;
    });
  }, [placesWithDetails, search, selectedCountry, selectedCity]);

  const mapPlaces = useMemo(() => {
    return filteredPlaces.filter(
      (place) => place.latitude != null && place.longitude != null
    );
  }, [filteredPlaces]);

  const routesSorted = useMemo(() => {
    return [...routes].sort((a, b) => {
      const firstTime = new Date(a.endedAt || a.startedAt || 0).getTime();
      const secondTime = new Date(b.endedAt || b.startedAt || 0).getTime();
      return secondTime - firstTime;
    });
  }, [routes]);

  const latestRoute = routesSorted[0] || null;
  const recentRoutes = routesSorted.slice(0, 3);

  const hasActiveFilters =
    selectedCountry !== "All" ||
    selectedCity !== "All" ||
    search.trim().length > 0;

  const finishedTripDistanceText = finishedTripDraft
    ? formatDistanceKm(Number(finishedTripDraft.distanceKm || 0))
    : "";

  const finishedTripDurationText = finishedTripDraft
    ? formatDuration(Number(finishedTripDraft.durationMinutes || 0))
    : "";

  const finishedTripLocationLine = finishedTripDraft
    ? getRouteLocationLine(finishedTripDraft)
    : "";

  return {
    showWelcome,
    setShowWelcome,
    activeTab,
    setActiveTab,
    loading,

    title,
    note,
    images,
    placeName,
    latitude,
    longitude,
    locationLoading,
    setTitle,
    setNote,

    editingPlace,
    editingRoute,
    editingRouteTitle,
    setEditingRouteTitle,
    editingRouteNote,
    setEditingRouteNote,
    savingRouteEdit,

    placesWithDetails,
    filteredPlaces,
    mapPlaces,
    routes,
    routesSorted,
    recentRoutes,
    latestRoute,
    activeRouteLink,

    search,
    setSearch,
    countries,
    cities,
    selectedCountry,
    selectedCity,
    hasActiveFilters,
    setSelectedCountry,
    setSelectedCity,

    saveTripModalVisible,
    finishedTripDraft,
    finishedTripTitle,
    setFinishedTripTitle,
    finishedTripNote,
    setFinishedTripNote,
    savingTripChoice,
    finishedTripDistanceText,
    finishedTripDurationText,
    finishedTripLocationLine,

    savePlace,
    cancelEditing,
    openImageOptions,
    confirmRemoveAllImages,
    getCurrentLocation,
    clearLocation,
    removePlace,
    startEditing,

    removeRoute,
    startEditingJourney,
    closeRouteEditing,
    saveRouteChanges,
    openJourneyPhotoOptions,

    handleTripFinished,
    closeFinishedTripModal,
    saveFinishedTripAsJourney,

    clearForm,
  };
}