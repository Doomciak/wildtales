import { useState } from "react";
import { Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";

import { deletePlaceFromDb, savePlaceToDb } from "../../db";
import {
  buildCoordinateFallbackName,
  buildPlaceForUi,
  deleteManagedFilesQuietly,
  persistDraftImages,
} from "./helpers";

export default function usePlaceForm({
  places,
  setActiveTab,
  loadPlaces,
  loadRoutes,
  loadActiveRouteLink,
}) {
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

  // Reset all place form fields.
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

  // Cancel editing and return to the places tab.
  function cancelEditing() {
    clearForm();
    setActiveTab("places");
  }

  // Load the selected place into form state.
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

  // Save the current place form to the database.
  async function savePlace() {
    const cleanTitle = title.trim();
    const cleanNote = note.trim();

    if (!cleanTitle || !cleanNote) {
      Alert.alert("Missing details", "Please enter both a title and a note.");
      return;
    }

    let newlyCopiedUris = [];

    try {
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

      clearForm();
      setActiveTab("places");

      const placeRows = await loadPlaces();
      await loadRoutes();
      await loadActiveRouteLink(placeRows);
    } catch (error) {
      console.log("Save place error:", error);

      // Delete files copied during this failed save attempt.
      deleteManagedFilesQuietly(newlyCopiedUris);

      Alert.alert("Save failed", "We could not save this place.");
    }
  }

  // Delete one saved place after confirmation.
  function removePlace(id) {
    Alert.alert("Delete place", "Are you sure you want to remove this memory?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deletePlaceFromDb(id);

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

  // Add new image URIs to the current image list.
  function appendImageUris(newUris = []) {
    const safeUris = (newUris || []).filter(Boolean);

    if (!safeUris.length) {
      return;
    }

    setImages((current) => [...new Set([...(current || []), ...safeUris])]);
  }

  // Replace one image URI in the current image list.
  function replaceImageUriAt(index, nextUri) {
    if (index < 0 || !nextUri) {
      return;
    }

    setImages((current) => {
      const nextImages = [...(current || [])];

      if (index >= nextImages.length) {
        return nextImages;
      }

      nextImages[index] = nextUri;

      return [...new Set(nextImages.filter(Boolean))];
    });
  }

  // Pick one or more images from the photo library.
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
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: 10,
      });

      if (!result.canceled && result.assets?.length) {
        const newUris = result.assets.map((asset) => asset.uri).filter(Boolean);
        appendImageUris(newUris);
      }
    } catch (error) {
      console.log("Library picker error:", error);
      Alert.alert("Photos error", "We could not open your photo library.");
    }
  }

  // Take one new photo with the camera.
  async function takePhoto() {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();

      if (!permission.granted) {
        Alert.alert("Permission needed", "Please allow access to your camera.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        appendImageUris([result.assets[0].uri]);
      }
    } catch (error) {
      console.log("Camera picker error:", error);
      Alert.alert("Camera error", "We could not take a photo right now.");
    }
  }

  // Replace one image with a photo from the library.
  async function replaceImageFromLibrary(index) {
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
        mediaTypes: ['images'],
        allowsMultipleSelection: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        replaceImageUriAt(index, result.assets[0].uri);
      }
    } catch (error) {
      console.log("Replace from library error:", error);
      Alert.alert("Photos error", "We could not open your photo library.");
    }
  }

  // Replace one image with a new camera photo.
  async function replaceImageFromCamera(index) {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();

      if (!permission.granted) {
        Alert.alert("Permission needed", "Please allow access to your camera.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        replaceImageUriAt(index, result.assets[0].uri);
      }
    } catch (error) {
      console.log("Replace from camera error:", error);
      Alert.alert("Camera error", "We could not take a photo right now.");
    }
  }

  // Open the add-photo options.
  function openImageOptions() {
    Alert.alert("Photos", "Choose how you want to add photos.", [
      { text: "Take photo", onPress: takePhoto },
      { text: "Choose from library", onPress: pickFromLibrary },
      { text: "Cancel", style: "cancel" },
    ]);
  }

  // Open the edit options for one selected photo.
  function openReplaceImageOptions(index) {
    if (index < 0 || index >= images.length) {
      return;
    }

    Alert.alert("Edit photo", "What would you like to do with this photo?", [
      {
        text: "Replace from camera",
        onPress: () => replaceImageFromCamera(index),
      },
      {
        text: "Replace from library",
        onPress: () => replaceImageFromLibrary(index),
      },
      {
        text: "Remove photo",
        style: "destructive",
        onPress: () => removeImageAtIndex(index),
      },
      { text: "Cancel", style: "cancel" },
    ]);
  }

  // Remove one selected image after confirmation.
  function removeImageAtIndex(index) {
    if (index < 0 || index >= images.length) {
      return;
    }

    Alert.alert("Remove photo", "Remove this photo from the place?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          setImages((current) =>
            (current || []).filter((_, currentIndex) => currentIndex !== index)
          );
        },
      },
    ]);
  }

  // Remove all selected images after confirmation.
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

  // Read the current device location and fill the place location fields.
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

      // Fall back to the most recent known position when needed.
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

  // Clear all saved location fields from the form.
  function clearLocation() {
    setLatitude(null);
    setLongitude(null);
    setPlaceName("");
    setCity("");
    setCountry("");
  }

  return {
    title,
    setTitle,
    placeName,
    setPlaceName,
    note,
    setNote,
    images,
    setImages,
    latitude,
    setLatitude,
    longitude,
    setLongitude,
    city,
    setCity,
    country,
    setCountry,

    editingPlace,
    locationLoading,

    clearForm,
    cancelEditing,
    startEditing,
    savePlace,
    removePlace,

    pickFromLibrary,
    takePhoto,
    openImageOptions,
    openReplaceImageOptions,
    removeImageAtIndex,
    confirmRemoveAllImages,

    getCurrentLocation,
    clearLocation,
  };
}