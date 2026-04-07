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
import MapView, { Polyline } from "react-native-maps";
import { Feather, Ionicons } from "@expo/vector-icons";

import WildMarker from "../maps/WildMarker";
import ImageGalleryModal from "./shared/ImageGalleryModal";
import ModalActionRow from "./shared/ModalActionRow";
import ModalCardShell from "./shared/ModalCardShell";
import ModalHeader from "./shared/ModalHeader";
import InfoPill from "../ui/InfoPill";
import useImageGallery from "../../hooks/useImageGallery";
import { colors } from "../../constants/theme";
import { radius, spacing } from "../../constants/layout";
import {
  ROUTE_LINE_COLOR,
  formatDistanceKm,
  formatDuration,
  getMapRegionForPoints,
  getRouteLocationLine,
} from "../../utils/travel";

export default function JourneyPreviewModal({
  route,
  onClose,
  onEditJourney,
  onDeleteJourney,
  onAddJourneyPhotos,
}) {
  const previewPoints = route?.routePoints || [];
  const previewFallbackPoint =
    route?.endLatitude != null && route?.endLongitude != null
      ? {
          latitude: Number(route.endLatitude),
          longitude: Number(route.endLongitude),
        }
      : null;

  const previewRegion = useMemo(() => {
    return getMapRegionForPoints(previewPoints, previewFallbackPoint);
  }, [previewPoints, previewFallbackPoint]);

  const firstPreviewPoint = previewPoints[0] || previewFallbackPoint || null;
  const lastPreviewPoint =
    previewPoints[previewPoints.length - 1] || previewFallbackPoint || null;

  const snapshotUri = route?.snapshotUri || null;

  const journeyImages = useMemo(() => {
    const rawImages = Array.isArray(route?.images) ? route.images : [];
    const filtered = rawImages.filter(Boolean);

    if (!snapshotUri) {
      return [...new Set(filtered)];
    }

    return [...new Set(filtered.filter((uri) => uri !== snapshotUri))];
  }, [route?.images, snapshotUri]);

  const gallerySourceItems = useMemo(() => {
    const items = [];

    if (snapshotUri) {
      items.push({
        uri: snapshotUri,
        type: "snapshot",
        label: "Route snapshot",
      });
    }

    journeyImages.forEach((uri) => {
      items.push({
        uri,
        type: "photo",
        label: "Journey photo",
      });
    });

    return items;
  }, [snapshotUri, journeyImages]);

  const {
    galleryItems,
    galleryVisible,
    previewImageIndex,
    setPreviewImageIndex,
    openGalleryAt,
    closeGallery,
    showPreviousItem,
    showNextItem,
  } = useImageGallery(gallerySourceItems, route?.id);

  const photoGalleryStartIndex = snapshotUri ? 1 : 0;

  const openJourneyPhotosGallery = () => {
    if (journeyImages.length > 0) {
      openGalleryAt(photoGalleryStartIndex);
      return;
    }

    if (snapshotUri) {
      openGalleryAt(0);
    }
  };

  const closeAll = () => {
    closeGallery();
    onClose();
  };

  return (
    <>
      <Modal
        visible={Boolean(route)}
        transparent
        animationType="fade"
        onRequestClose={closeAll}
      >
        <ModalCardShell>
          <ModalHeader
            title="Journey preview"
            onClose={closeAll}
            closeLabel="Close journey preview"
            titleStyle={styles.previewHeaderTitle}
          />

          <ScrollView showsVerticalScrollIndicator={false}>
            {snapshotUri ? (
              <View style={styles.heroImageWrap}>
                <Image source={{ uri: snapshotUri }} style={styles.heroImage} />

                <View style={styles.heroBadge}>
                  <Ionicons
                    name="map-outline"
                    size={14}
                    color={colors.textDark}
                  />
                  <Text style={styles.heroBadgeText}>Route snapshot</Text>
                </View>
              </View>
            ) : previewPoints.length > 0 || previewFallbackPoint ? (
              <View style={styles.journeyPreviewMapWrap}>
                <MapView
                  key={route?.id || "journey-preview-map"}
                  style={styles.map}
                  initialRegion={previewRegion}
                  scrollEnabled={false}
                  zoomEnabled={false}
                  pitchEnabled={false}
                  rotateEnabled={false}
                  toolbarEnabled={false}
                >
                  {previewPoints.length > 0 ? (
                    <Polyline
                      coordinates={previewPoints}
                      strokeColor={ROUTE_LINE_COLOR}
                      strokeWidth={4}
                    />
                  ) : null}

                  {firstPreviewPoint ? (
                    <WildMarker
                      coordinate={firstPreviewPoint}
                      title="Start"
                      description="Journey start"
                      size={28}
                    />
                  ) : null}

                  {lastPreviewPoint ? (
                    <WildMarker
                      coordinate={lastPreviewPoint}
                      title="Finish"
                      description="Journey finish"
                      size={28}
                    />
                  ) : null}
                </MapView>

                <View style={styles.heroBadge}>
                  <Ionicons
                    name="trail-sign-outline"
                    size={14}
                    color={colors.textDark}
                  />
                  <Text style={styles.heroBadgeText}>Live route preview</Text>
                </View>
              </View>
            ) : (
              <View style={styles.previewMainFallback}>
                <Ionicons
                  name="trail-sign-outline"
                  size={40}
                  color={colors.textPrimary}
                />
              </View>
            )}

            <Text style={styles.previewPlaceTitle}>{route?.title}</Text>

            {getRouteLocationLine(route || {}) ? (
              <View style={styles.inlineRow}>
                <Ionicons
                  name="location-outline"
                  size={14}
                  color={colors.textSecondary}
                />
                <Text style={styles.previewPlaceMeta}>
                  {getRouteLocationLine(route)}
                </Text>
              </View>
            ) : null}

            <View style={styles.journeyPreviewMetaRow}>
              <InfoPill
                icon="navigate-outline"
                label={formatDistanceKm(Number(route?.distanceKm || 0))}
                style={styles.metaPillItem}
              />

              <InfoPill
                icon="clock"
                iconSet="feather"
                label={formatDuration(Number(route?.durationMinutes || 0))}
                style={styles.metaPillItem}
              />
            </View>

            <Text style={styles.previewNote}>
              {route?.note || "Saved from your finished live route."}
            </Text>

            <View style={styles.photosHeaderRow}>
              <View style={styles.photosTitleGroup}>
                <Text style={styles.photosTitle}>Journey photos</Text>

                {(journeyImages.length > 0 || snapshotUri) && (
                  <InfoPill
                    icon="images-outline"
                    variant="accent"
                    label={`${journeyImages.length}`}
                    onPress={openJourneyPhotosGallery}
                    accessibilityLabel={`Open gallery with ${
                      journeyImages.length
                    } journey photo${journeyImages.length === 1 ? "" : "s"}`}
                    style={styles.photosBadge}
                  />
                )}
              </View>

              <Pressable
                style={styles.addPhotosButton}
                onPress={() => onAddJourneyPhotos?.(route)}
              >
                <Ionicons
                  name="images-outline"
                  size={15}
                  color={colors.textDark}
                />
                <Text style={styles.addPhotosButtonText}>Add photos</Text>
              </Pressable>
            </View>

            {journeyImages.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.photosRow}
              >
                {journeyImages.map((imageUri, index) => (
                  <Pressable
                    key={`${imageUri}-${index}`}
                    onPress={() => openGalleryAt(photoGalleryStartIndex + index)}
                    style={styles.photoThumbWrap}
                    accessibilityRole="button"
                    accessibilityLabel={`Open journey photo ${index + 1}`}
                  >
                    <Image source={{ uri: imageUri }} style={styles.photoThumb} />
                  </Pressable>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.photosEmptyCard}>
                <Ionicons
                  name="image-outline"
                  size={18}
                  color={colors.textMuted}
                />
                <Text style={styles.photosEmptyText}>
                  No extra photos yet for this journey.
                </Text>
              </View>
            )}
          </ScrollView>

          <ModalActionRow
            leftAction={{
              label: "Edit journey",
              onPress: () => {
                const currentRoute = route;
                closeAll();
                onEditJourney(currentRoute);
              },
              iconName: "edit-2",
              variant: "accent",
              accessibilityLabel: "Edit journey",
            }}
            rightAction={{
              label: "Delete",
              onPress: () => {
                const currentRoute = route;
                closeAll();
                onDeleteJourney(currentRoute.id);
              },
              iconName: "trash-2",
              variant: "muted",
              accessibilityLabel: "Delete journey",
            }}
          />
        </ModalCardShell>
      </Modal>

      <ImageGalleryModal
        visible={galleryVisible}
        onClose={closeGallery}
        items={galleryItems}
        index={previewImageIndex}
        onChangeIndex={setPreviewImageIndex}
        onPrevious={showPreviousItem}
        onNext={showNextItem}
        previousLabel="Previous image"
        nextLabel="Next image"
        selectLabelPrefix="Select image"
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
  heroImageWrap: {
    height: 260,
    borderRadius: radius.xxl - 2,
    overflow: "hidden",
    marginBottom: spacing.lg - 2,
    position: "relative",
    backgroundColor: colors.surfaceAlt,
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroBadge: {
    position: "absolute",
    left: 12,
    bottom: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  heroBadgeText: {
    color: colors.textDark,
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 6,
  },
  journeyPreviewMapWrap: {
    height: 260,
    borderRadius: radius.xxl - 2,
    overflow: "hidden",
    marginBottom: spacing.lg - 2,
    position: "relative",
    backgroundColor: colors.surfaceAlt,
  },
  map: {
    width: "100%",
    height: "100%",
  },
  previewMainFallback: {
    width: "100%",
    height: 220,
    borderRadius: radius.xxl - 2,
    backgroundColor: colors.surfaceAlt,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.lg - 2,
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
  journeyPreviewMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 6,
    marginBottom: 6,
  },
  metaPillItem: {
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  previewNote: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 10,
    marginBottom: spacing.md,
  },
  photosHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  photosTitleGroup: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
    marginRight: spacing.sm,
  },
  photosTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "700",
  },
  photosBadge: {
    marginLeft: 10,
  },
  addPhotosButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addPhotosButtonText: {
    color: colors.textDark,
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 6,
  },
  photosRow: {
    paddingBottom: spacing.xs,
  },
  photoThumbWrap: {
    marginRight: spacing.sm,
    borderRadius: radius.xl,
    overflow: "hidden",
  },
  photoThumb: {
    width: 108,
    height: 108,
    borderRadius: radius.xl,
  },
  photosEmptyCard: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.xl,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  photosEmptyText: {
    color: colors.textMuted,
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
  },
});