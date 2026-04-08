import { useMemo } from "react";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";

import ImageGalleryModal from "./shared/ImageGalleryModal";
import ModalActionRow from "./shared/ModalActionRow";
import ModalCardShell from "./shared/ModalCardShell";
import ModalHeader from "./shared/ModalHeader";
import useImageGallery from "../../hooks/useImageGallery";
import { colors } from "../../constants/theme";
import { radius, spacing } from "../../constants/layout";
import {
  formatDistanceKm,
  formatDuration,
  getPlaceLocationText,
} from "../../utils/travel";

// Modal used to preview one saved place in more detail.
export default function PlacePreviewModal({
  place,
  onClose,
  onEditPlace,
  onDeletePlace,
  activeRouteLink,
}) {
  // Build the list of images for this place.
  // First use the normal images array, and if that is empty,
  // fall back to the cover image.
  const previewImages = useMemo(() => {
    if (!place) {
      return [];
    }

    const images = Array.isArray(place.images)
      ? place.images.filter(Boolean)
      : [];

    if (images.length > 0) {
      return images;
    }

    if (place.coverImage) {
      return [place.coverImage];
    }

    return [];
  }, [place]);

  // Convert image URIs into the gallery item format
  // expected by the shared gallery hook and modal.
  const gallerySourceItems = useMemo(
    () =>
      previewImages.map((uri) => ({
        uri,
        type: "photo",
        label: "Place photo",
      })),
    [previewImages]
  );

  // Handle gallery state separately so this modal stays cleaner.
  const {
    galleryItems,
    galleryVisible,
    previewImageIndex,
    selectedItem,
    setPreviewImageIndex,
    openGalleryAt,
    closeGallery,
    showPreviousItem,
    showNextItem,
  } = useImageGallery(gallerySourceItems, place?.id);

  // Main image shown in the preview area.
  const selectedPreviewImage = selectedItem?.uri || null;

  // Check whether the currently active live route belongs to this place.
  const previewHasLiveRoute =
    !!activeRouteLink && activeRouteLink.placeId === place?.id;

  return (
    <>
      <Modal
        visible={Boolean(place)}
        transparent
        animationType="fade"
        onRequestClose={onClose}
      >
        <ModalCardShell>
          <ModalHeader
            title="Place preview"
            onClose={onClose}
            closeLabel="Close place preview"
            titleStyle={styles.previewHeaderTitle}
          />

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.previewImageSection}>
              {selectedPreviewImage ? (
                // Show the currently selected image if the place has photos.
                <Image
                  source={{ uri: selectedPreviewImage }}
                  style={styles.previewMainImage}
                />
              ) : (
                // If there is no image, show a simple fallback using the first letter of the place title.
                <View style={styles.previewMainFallback}>
                  <Text style={styles.previewFallbackLetter}>
                    {String(place?.title || "").charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}

              {galleryItems.length > 0 ? (
                // Small badge on the image that opens the gallery.
                <Pressable
                  style={styles.photosBadge}
                  onPress={() => openGalleryAt(previewImageIndex)}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={`Open gallery with ${galleryItems.length} photo${
                    galleryItems.length === 1 ? "" : "s"
                  }`}
                >
                  <Ionicons
                    name="images-outline"
                    size={14}
                    color={colors.textDark}
                  />
                  <Text style={styles.photosBadgeText}>{galleryItems.length}</Text>
                </Pressable>
              ) : null}
            </View>

            {galleryItems.length > 1 ? (
              // Show thumbnails only when there is more than one image.
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.previewThumbRow}
              >
                {galleryItems.map((item, index) => (
                  <Pressable
                    key={`${item.uri}-${index}`}
                    onPress={() => openGalleryAt(index)}
                    style={[
                      styles.previewThumbWrap,
                      previewImageIndex === index &&
                        styles.previewThumbWrapActive,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`Open photo ${index + 1}`}
                  >
                    <Image source={{ uri: item.uri }} style={styles.previewThumb} />
                  </Pressable>
                ))}
              </ScrollView>
            ) : null}

            <Text style={styles.previewPlaceTitle}>{place?.title}</Text>

            {/* Show the formatted place location only if it exists */}
            {getPlaceLocationText(place || {}) ? (
              <View style={styles.inlineRow}>
                <Ionicons
                  name="location-outline"
                  size={14}
                  color={colors.textSecondary}
                />
                <Text style={styles.previewPlaceMeta}>
                  {getPlaceLocationText(place)}
                </Text>
              </View>
            ) : null}

            {previewHasLiveRoute && activeRouteLink ? (
              // If this place is linked to the active live route,
              // show a short summary of that route here.
              <View style={styles.previewRouteCard}>
                <View style={styles.inlineRow}>
                  <Ionicons
                    name="navigate-outline"
                    size={15}
                    color={colors.textDark}
                  />
                  <Text style={styles.previewRouteTitle}>
                    Live route linked here
                  </Text>
                </View>

                <Text style={styles.previewRouteText}>
                  {formatDistanceKm(activeRouteLink.totalDistanceKm)} covered in{" "}
                  {formatDuration(activeRouteLink.durationMinutes)}
                </Text>
              </View>
            ) : null}

            {place?.latitude != null && place?.longitude != null ? (
              // Coordinates are shown only when the place has valid saved latitude and longitude.
              <View style={styles.inlineRow}>
                <Feather
                  name="crosshair"
                  size={13}
                  color={colors.textSecondary}
                />
                <Text style={styles.previewPlaceMeta}>
                  {Number(place.latitude).toFixed(3)},{" "}
                  {Number(place.longitude).toFixed(3)}
                </Text>
              </View>
            ) : null}

            <Text style={styles.previewNote}>{place?.note}</Text>
          </ScrollView>

          <ModalActionRow
            leftAction={{
              label: "Edit place",
              onPress: () => {
                // Keep the selected place before closing the modal
                // so it can be passed into the edit flow.
                const placeToEdit = place;
                onClose();
                onEditPlace(placeToEdit);
              },
              iconName: "edit-2",
              variant: "accent",
              accessibilityLabel: "Edit place",
            }}
            rightAction={{
              label: "Delete",
              onPress: () => {
                // Close the preview first, then delete by id.
                const currentPlace = place;
                onClose();
                onDeletePlace?.(currentPlace.id);
              },
              iconName: "trash-2",
              variant: "muted",
              accessibilityLabel: "Delete place",
            }}
          />
        </ModalCardShell>
      </Modal>

      {/* Separate image gallery opened from the preview image or thumbnails */}
      <ImageGalleryModal
        visible={galleryVisible}
        onClose={closeGallery}
        items={galleryItems}
        index={previewImageIndex}
        onChangeIndex={setPreviewImageIndex}
        onPrevious={showPreviousItem}
        onNext={showNextItem}
        previousLabel="Previous photo"
        nextLabel="Next photo"
        selectLabelPrefix="Select photo"
      />
    </>
  );
}

const styles = StyleSheet.create({
  previewHeaderTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 0,
  },
  previewImageSection: {
    position: "relative",
    marginBottom: spacing.lg - 2,
  },
  previewMainImage: {
    width: "100%",
    height: 260,
    borderRadius: radius.xxl - 2,
  },
  previewMainFallback: {
    width: "100%",
    height: 220,
    borderRadius: radius.xxl - 2,
    backgroundColor: colors.surfaceAlt,
    justifyContent: "center",
    alignItems: "center",
  },
  previewFallbackLetter: {
    color: colors.textPrimary,
    fontSize: 42,
    fontWeight: "700",
  },
  photosBadge: {
    position: "absolute",
    right: 12,
    bottom: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  photosBadgeText: {
    color: colors.textDark,
    fontSize: 13,
    fontWeight: "700",
    marginLeft: 6,
  },
  previewThumbRow: {
    paddingRight: 6,
    marginBottom: spacing.lg - 2,
  },
  previewThumbWrap: {
    borderRadius: radius.sm + 2,
    marginRight: 10,
    padding: 2,
    borderWidth: 1,
    borderColor: "transparent",
  },
  previewThumbWrapActive: {
    borderColor: colors.accent,
  },
  previewThumb: {
    width: 64,
    height: 64,
    borderRadius: radius.sm,
  },
  previewPlaceTitle: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 10,
  },
  inlineRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  previewPlaceMeta: {
    color: colors.textSecondary,
    fontSize: 14,
    marginLeft: spacing.sm,
    marginBottom: spacing.sm,
    flexShrink: 1,
  },
  previewRouteCard: {
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    padding: 14,
    marginBottom: spacing.md,
  },
  previewRouteTitle: {
    color: colors.textDark,
    fontSize: 14,
    fontWeight: "700",
    marginLeft: spacing.sm,
  },
  previewRouteText: {
    color: "#365142",
    fontSize: 13,
    marginTop: spacing.sm,
  },
  previewNote: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 10,
    marginBottom: spacing.sm,
  },
});