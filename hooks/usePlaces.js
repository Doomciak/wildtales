import { useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";

import {
  deletePlaceFromDb,
  getAllPlaces,
  savePlaceToDb,
  setupDatabase,
} from "../db";

export default function usePlaces() {
  const [places, setPlaces] = useState([]);
  const [search, setSearch] = useState("");

  const [title, setTitle] = useState("");
  const [placeName, setPlaceName] = useState("");
  const [note, setNote] = useState("");
  const [image, setImage] = useState(null);
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);

  const [loading, setLoading] = useState(true);
  const [editingPlace, setEditingPlace] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);

  useEffect(() => {
    initialiseApp();
  }, []);

  async function initialiseApp() {
    try {
      await setupDatabase();
      await loadPlaces();
    } catch (error) {
      console.log("Initialise app error:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadPlaces() {
    try {
      const rows = await getAllPlaces();
      setPlaces(rows);
    } catch (error) {
      console.log("Load places error:", error);
    }
  }

  function clearForm() {
    setTitle("");
    setPlaceName("");
    setNote("");
    setImage(null);
    setLatitude(null);
    setLongitude(null);
    setEditingPlace(null);
  }

  function cancelEditing() {
    clearForm();
  }

  function startEditing(place) {
    setEditingPlace(place);
    setTitle(place.title);
    setPlaceName(place.placeName || "");
    setNote(place.note);
    setImage(place.image || null);
    setLatitude(place.latitude ?? null);
    setLongitude(place.longitude ?? null);
  }

  async function savePlace() {
    const cleanTitle = title.trim();
    const cleanNote = note.trim();
    const cleanPlaceName = placeName.trim();

    if (!cleanTitle || !cleanNote) {
      Alert.alert("Missing details", "Please enter both a title and a note.");
      return false;
    }

    try {
      await savePlaceToDb(
        {
          title: cleanTitle,
          placeName: cleanPlaceName,
          note: cleanNote,
          image,
          latitude,
          longitude,
        },
        editingPlace?.id || null
      );

      clearForm();
      await loadPlaces();
      return true;
    } catch (error) {
      console.log("Save place error:", error);
      return false;
    }
  }

  async function removePlace(id) {
    try {
      await deletePlaceFromDb(id);
      await loadPlaces();

      if (editingPlace?.id === id) {
        clearForm();
      }
    } catch (error) {
      console.log("Delete place error:", error);
    }
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
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      console.log("Library picker error:", error);
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

      if (!result.canceled) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      console.log("Camera picker error:", error);
    }
  }

  function openImageOptions() {
    Alert.alert("Add a photo", "Choose how you want to add an image.", [
      { text: "Take photo", onPress: takePhoto },
      { text: "Choose from library", onPress: pickFromLibrary },
      { text: "Cancel", style: "cancel" },
    ]);
  }

  function removeImage() {
    setImage(null);
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

      setLatitude(newLatitude);
      setLongitude(newLongitude);

      try {
        const results = await Location.reverseGeocodeAsync({
          latitude: newLatitude,
          longitude: newLongitude,
        });

        if (results.length > 0) {
          const first = results[0];

          const detectedName =
            first.city ||
            first.district ||
            first.subregion ||
            first.region ||
            first.name ||
            first.street ||
            "Unknown place";

          setPlaceName(detectedName);

          if (!title.trim()) {
            setTitle(detectedName);
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
  }

  const filteredPlaces = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return places;
    }

    return places.filter((place) => {
      return (
        String(place.title).toLowerCase().includes(query) ||
        String(place.note).toLowerCase().includes(query) ||
        String(place.placeName || "").toLowerCase().includes(query)
      );
    });
  }, [places, search]);

  const mapPlaces = useMemo(() => {
    return places.filter(
      (place) => place.latitude != null && place.longitude != null
    );
  }, [places]);

  return {
    places,
    filteredPlaces,
    mapPlaces,
    search,
    setSearch,
    title,
    setTitle,
    placeName,
    note,
    setNote,
    image,
    latitude,
    longitude,
    loading,
    editingPlace,
    locationLoading,
    savePlace,
    removePlace,
    startEditing,
    clearForm,
    cancelEditing,
    openImageOptions,
    removeImage,
    getCurrentLocation,
    clearLocation,
  };
}