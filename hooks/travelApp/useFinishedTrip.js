import { useState } from "react";
import { Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";

import { deleteLocationLogsForTrip, saveRouteToDb } from "../../db";
import {
  buildJourneyTitleFromTrip,
  formatDistanceKm,
  formatDuration,
  getRouteLocationLine,
} from "../../utils/travel";
import {
  deleteManagedFileQuietly,
  deleteManagedFilesQuietly,
  persistDraftImages,
  persistSingleDraftFile,
} from "./helpers";

// Manage the finished-trip draft before it is saved as a journey.
export default function useFinishedTrip({ loadRoutes, setActiveTab }) {
  const [finishedTripDraft, setFinishedTripDraft] = useState(null);
  const [finishedTripTitle, setFinishedTripTitle] = useState("");
  const [finishedTripNote, setFinishedTripNote] = useState("");
  const [saveTripModalVisible, setSaveTripModalVisible] = useState(false);
  const [savingTripChoice, setSavingTripChoice] = useState(false);

  // Build the finished trip draft and open the save modal.
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

  // Reset the finished trip modal state.
  function closeFinishedTripModal() {
    setSaveTripModalVisible(false);
    setFinishedTripDraft(null);
    setFinishedTripTitle("");
    setFinishedTripNote("");
    setSavingTripChoice(false);
  }

  // Add new image URIs to the current draft.
  function appendFinishedTripImageUris(newUris = []) {
    const safeUris = (newUris || []).filter(Boolean);

    if (!safeUris.length) {
      return;
    }

    setFinishedTripDraft((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        images: [...new Set([...(current.images || []), ...safeUris])],
      };
    });
  }

  // Replace one image URI in the current draft.
  function replaceFinishedTripImageUriAt(index, nextUri) {
    if (index < 0 || !nextUri) {
      return;
    }

    setFinishedTripDraft((current) => {
      if (!current) {
        return current;
      }

      const nextImages = [...(current.images || [])];

      if (index >= nextImages.length) {
        return current;
      }

      nextImages[index] = nextUri;

      return {
        ...current,
        images: [...new Set(nextImages.filter(Boolean))],
      };
    });
  }

  // Remove one image from the current draft after confirmation.
  function removeFinishedTripImageAt(index) {
    if (!finishedTripDraft?.images?.length) {
      return;
    }

    Alert.alert("Remove photo", "Remove this photo from the journey?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          setFinishedTripDraft((current) => {
            if (!current) {
              return current;
            }

            return {
              ...current,
              images: (current.images || []).filter(
                (_, currentIndex) => currentIndex !== index
              ),
            };
          });
        },
      },
    ]);
  }

  // Remove all images from the current draft after confirmation.
  function confirmRemoveAllFinishedTripImages() {
    if (!finishedTripDraft?.images?.length) {
      return;
    }

    Alert.alert("Remove photos", "Remove all photos from this journey draft?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          setFinishedTripDraft((current) => {
            if (!current) {
              return current;
            }

            return {
              ...current,
              images: [],
            };
          });
        },
      },
    ]);
  }

  // Pick one or more photos from the library.
  async function pickFinishedTripPhotosFromLibrary() {
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
        appendFinishedTripImageUris(newUris);
      }
    } catch (error) {
      console.log("Finished trip library picker error:", error);
      Alert.alert("Photos error", "We could not open your photo library.");
    }
  }

  // Take one new photo with the camera.
  async function takeFinishedTripPhoto() {
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
        appendFinishedTripImageUris([result.assets[0].uri]);
      }
    } catch (error) {
      console.log("Finished trip camera picker error:", error);
      Alert.alert("Camera error", "We could not take a photo right now.");
    }
  }

  // Replace one draft photo with a library image.
  async function replaceFinishedTripPhotoFromLibrary(index) {
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
        replaceFinishedTripImageUriAt(index, result.assets[0].uri);
      }
    } catch (error) {
      console.log("Replace finished trip photo from library error:", error);
      Alert.alert("Photos error", "We could not open your photo library.");
    }
  }

  // Replace one draft photo with a new camera image.
  async function replaceFinishedTripPhotoFromCamera(index) {
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
        replaceFinishedTripImageUriAt(index, result.assets[0].uri);
      }
    } catch (error) {
      console.log("Replace finished trip photo from camera error:", error);
      Alert.alert("Camera error", "We could not take a photo right now.");
    }
  }

  // Open the add-photo options for the draft.
  function openFinishedTripImageOptions() {
    Alert.alert("Journey photos", "Choose how you want to add photos.", [
      { text: "Take photo", onPress: takeFinishedTripPhoto },
      {
        text: "Choose from library",
        onPress: pickFinishedTripPhotosFromLibrary,
      },
      { text: "Cancel", style: "cancel" },
    ]);
  }

  // Open the edit options for one draft photo.
  function openReplaceFinishedTripImageOptions(index) {
    if (!finishedTripDraft?.images?.length) {
      return;
    }

    Alert.alert("Edit photo", "What would you like to do with this photo?", [
      {
        text: "Replace from camera",
        onPress: () => replaceFinishedTripPhotoFromCamera(index),
      },
      {
        text: "Replace from library",
        onPress: () => replaceFinishedTripPhotoFromLibrary(index),
      },
      {
        text: "Remove photo",
        style: "destructive",
        onPress: () => removeFinishedTripImageAt(index),
      },
      { text: "Cancel", style: "cancel" },
    ]);
  }

  // Save the finished trip draft as a journey in the database.
  async function saveFinishedTripAsJourney() {
    if (!finishedTripDraft || savingTripChoice) {
      return;
    }

    let newSnapshotUri = null;
    let newlyCopiedImageUris = [];
    let routeSaved = false;

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

      const persistedImages = await persistDraftImages(
        Array.isArray(finishedTripDraft.images) ? finishedTripDraft.images : [],
        "route-photo"
      );

      newlyCopiedImageUris = persistedImages.newlyCopiedUris;

      await saveRouteToDb({
        ...finishedTripDraft,
        snapshotUri: persistedSnapshot.stableUri,
        title: routeTitle,
        note: String(finishedTripNote || "").trim() || null,
        image: persistedImages.stableUris[0] || null,
        images: persistedImages.stableUris,
      });

      routeSaved = true;

      // Remove the raw tracking logs once the final journey was saved.
      if (finishedTripDraft.tripId) {
        try {
          await deleteLocationLogsForTrip(finishedTripDraft.tripId);
        } catch (error) {
          console.log("Delete finished trip logs error:", error);
        }
      }

      await loadRoutes();
      closeFinishedTripModal();
      setActiveTab("journeys");
    } catch (error) {
      console.log("Save finished trip as journey error:", error);

      // Remove files copied during this save attempt if the route was not saved.
      if (!routeSaved) {
        if (newSnapshotUri) {
          deleteManagedFileQuietly(newSnapshotUri);
        }

        deleteManagedFilesQuietly(newlyCopiedImageUris);
      }

      Alert.alert("Save failed", "We could not save this journey.");
      setSavingTripChoice(false);
    }
  }

  // Build the formatted distance text shown in the draft summary.
  const finishedTripDistanceText = finishedTripDraft
    ? formatDistanceKm(Number(finishedTripDraft.distanceKm || 0))
    : "";

  // Build the formatted duration text shown in the draft summary.
  const finishedTripDurationText = finishedTripDraft
    ? formatDuration(Number(finishedTripDraft.durationMinutes || 0))
    : "";

  // Build the formatted location line shown in the draft summary.
  const finishedTripLocationLine = finishedTripDraft
    ? getRouteLocationLine(finishedTripDraft)
    : "";

  return {
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

    handleTripFinished,
    closeFinishedTripModal,
    saveFinishedTripAsJourney,

    openFinishedTripImageOptions,
    openReplaceFinishedTripImageOptions,
    removeFinishedTripImageAt,
    confirmRemoveAllFinishedTripImages,
  };
}