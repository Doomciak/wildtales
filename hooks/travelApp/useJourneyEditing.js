import { useState } from "react";
import { Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";

import { deleteRouteFromDb, saveRouteToDb } from "../../db";
import { buildJourneyTitleFromTrip } from "../../utils/travel";
import {
  buildRouteForUi,
  deleteManagedFilesQuietly,
  persistDraftImages,
} from "./helpers";

// Manage editing, saving, and photo updates for saved journeys.
export default function useJourneyEditing({ loadRoutes }) {
  const [editingRoute, setEditingRoute] = useState(null);
  const [editingRouteTitle, setEditingRouteTitle] = useState("");
  const [editingRouteNote, setEditingRouteNote] = useState("");
  const [editingRouteImages, setEditingRouteImages] = useState([]);
  const [savingRouteEdit, setSavingRouteEdit] = useState(false);

  // Load the selected journey into editing state.
  function startEditingJourney(route) {
    const cleanRoute = buildRouteForUi(route);

    setEditingRoute(cleanRoute);
    setEditingRouteTitle(
      String(cleanRoute.title || "").trim() ||
        buildJourneyTitleFromTrip(cleanRoute)
    );
    setEditingRouteNote(cleanRoute.note || "");
    setEditingRouteImages(
      Array.isArray(cleanRoute.images) ? cleanRoute.images : []
    );
  }

  // Reset the journey editing state.
  function closeRouteEditing() {
    setEditingRoute(null);
    setEditingRouteTitle("");
    setEditingRouteNote("");
    setEditingRouteImages([]);
    setSavingRouteEdit(false);
  }

  // Add new image URIs to the current editing list.
  function appendEditingImageUris(newUris = []) {
    const safeUris = (newUris || []).filter(Boolean);

    if (!safeUris.length) {
      return;
    }

    setEditingRouteImages((current) => [
      ...new Set([...(current || []), ...safeUris]),
    ]);
  }

  // Replace one image URI in the current editing list.
  function replaceEditingImageUriAt(index, nextUri) {
    if (index < 0 || !nextUri) {
      return;
    }

    setEditingRouteImages((current) => {
      const nextImages = [...(current || [])];

      if (index >= nextImages.length) {
        return nextImages;
      }

      nextImages[index] = nextUri;

      return [...new Set(nextImages.filter(Boolean))];
    });
  }

  // Remove one image from the editing list after confirmation.
  function removeEditingImageAt(index) {
    if (index < 0) {
      return;
    }

    Alert.alert("Remove photo", "Remove this photo from the journey?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          setEditingRouteImages((current) =>
            (current || []).filter((_, currentIndex) => currentIndex !== index)
          );
        },
      },
    ]);
  }

  // Remove all images from the editing list after confirmation.
  function confirmRemoveAllEditingImages() {
    if (!editingRouteImages.length) {
      return;
    }

    Alert.alert("Remove photos", "Remove all photos from this journey?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => setEditingRouteImages([]),
      },
    ]);
  }

  // Pick one or more images from the library for the journey being edited.
  async function pickEditingPhotosFromLibrary() {
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
        mediaTypes: ["images"],
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: 10,
      });

      if (!result.canceled && result.assets?.length) {
        const newUris = result.assets.map((asset) => asset.uri).filter(Boolean);
        appendEditingImageUris(newUris);
      }
    } catch (error) {
      console.log("Journey library picker error:", error);
      Alert.alert("Photos error", "We could not open your photo library.");
    }
  }

  // Take one new photo for the journey being edited.
  async function takeEditingPhoto() {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();

      if (!permission.granted) {
        Alert.alert("Permission needed", "Please allow access to your camera.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        appendEditingImageUris([result.assets[0].uri]);
      }
    } catch (error) {
      console.log("Journey camera picker error:", error);
      Alert.alert("Camera error", "We could not take a photo right now.");
    }
  }

  // Replace one editing image with a photo from the library.
  async function replaceEditingPhotoFromLibrary(index) {
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
        mediaTypes: ["images"],
        allowsMultipleSelection: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        replaceEditingImageUriAt(index, result.assets[0].uri);
      }
    } catch (error) {
      console.log("Replace journey photo from library error:", error);
      Alert.alert("Photos error", "We could not open your photo library.");
    }
  }

  // Replace one editing image with a new camera photo.
  async function replaceEditingPhotoFromCamera(index) {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();

      if (!permission.granted) {
        Alert.alert("Permission needed", "Please allow access to your camera.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        replaceEditingImageUriAt(index, result.assets[0].uri);
      }
    } catch (error) {
      console.log("Replace journey photo from camera error:", error);
      Alert.alert("Camera error", "We could not take a photo right now.");
    }
  }

  // Open the add-photo options for the journey being edited.
  function openJourneyEditImageOptions() {
    Alert.alert("Journey photos", "Choose how you want to add photos.", [
      { text: "Take photo", onPress: takeEditingPhoto },
      {
        text: "Choose from library",
        onPress: pickEditingPhotosFromLibrary,
      },
      { text: "Cancel", style: "cancel" },
    ]);
  }

  // Open the edit options for one selected journey photo.
  function openReplaceJourneyEditImageOptions(index) {
    if (index < 0 || index >= editingRouteImages.length) {
      return;
    }

    Alert.alert("Edit photo", "What would you like to do with this photo?", [
      {
        text: "Replace from camera",
        onPress: () => replaceEditingPhotoFromCamera(index),
      },
      {
        text: "Replace from library",
        onPress: () => replaceEditingPhotoFromLibrary(index),
      },
      {
        text: "Remove photo",
        style: "destructive",
        onPress: () => removeEditingImageAt(index),
      },
      { text: "Cancel", style: "cancel" },
    ]);
  }

  // Save the current journey changes to the database.
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

    let newlyCopiedUris = [];

    try {
      setSavingRouteEdit(true);

      const persistedImages = await persistDraftImages(
        editingRouteImages,
        "route-photo"
      );

      newlyCopiedUris = persistedImages.newlyCopiedUris;

      await saveRouteToDb(
        {
          ...editingRoute,
          title: cleanTitle,
          note: cleanNote || null,
          image: persistedImages.stableUris[0] || null,
          images: persistedImages.stableUris,
          snapshotUri: editingRoute.snapshotUri || null,
        },
        editingRoute.id
      );

      await loadRoutes();
      closeRouteEditing();
    } catch (error) {
      console.log("Save route changes error:", error);

      // Remove files copied during a failed save attempt.
      deleteManagedFilesQuietly(newlyCopiedUris);

      Alert.alert("Save failed", "We could not update this journey.");
      setSavingRouteEdit(false);
    }
  }

  // Delete one saved journey after confirmation.
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
              await deleteRouteFromDb(id);
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

  // Save additional photo URIs for an existing journey.
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

      // Remove copied files again if saving the added photos fails.
      deleteManagedFilesQuietly(newlyCopiedUris);

      Alert.alert("Photos error", "We could not save journey photos.");
    }
  }

  // Pick one or more new photos from the library for an existing journey.
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
        mediaTypes: ["images"],
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

  // Take one new photo for an existing journey.
  async function takeJourneyPhoto(route) {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();

      if (!permission.granted) {
        Alert.alert("Permission needed", "Please allow access to your camera.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
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

  // Open the add-photo options for an existing journey.
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

  return {
    editingRoute,
    editingRouteTitle,
    setEditingRouteTitle,
    editingRouteNote,
    setEditingRouteNote,
    editingRouteImages,
    savingRouteEdit,

    startEditingJourney,
    closeRouteEditing,
    saveRouteChanges,
    removeRoute,

    openJourneyEditImageOptions,
    openReplaceJourneyEditImageOptions,
    removeEditingImageAt,
    confirmRemoveAllEditingImages,

    openJourneyPhotoOptions,
  };
}