import { useEffect, useState } from "react";
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

import { colors } from "../../constants/theme";
import { radius, spacing } from "../../constants/layout";
import {
  formatDistanceKm,
  formatDuration,
  getPlaceLocationText,
} from "../../utils/travel";

export default function PlacePreviewModal({
  place,
  onClose,
  onEditPlace,
  activeRouteLink,
}) {
  const [previewImageIndex, setPreviewImageIndex] = useState(0);

  useEffect(() => {
    setPreviewImageIndex(0);
  }, [place?.id]);

  const previewImages = place?.images || [];
  const selectedPreviewImage = previewImages[previewImageIndex] || null;
  const previewHasLiveRoute =
    !!activeRouteLink && activeRouteLink.placeId === place?.id;

  return (
    <Modal visible={Boolean(place)} transparent animationType="fade">
      <View style={styles.previewOverlay}>
        <View style={styles.previewModal}>
          <View style={styles.previewHeader}>
            <Text style={styles.previewHeaderTitle}>Place preview</Text>

            <Pressable style={styles.previewCloseButton} onPress={onClose}>
              <Feather name="x" size={18} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {selectedPreviewImage ? (
              <Image
                source={{ uri: selectedPreviewImage }}
                style={styles.previewMainImage}
              />
            ) : (
              <View style={styles.previewMainFallback}>
                <Text style={styles.previewFallbackLetter}>
                  {String(place?.title || "").charAt(0).toUpperCase()}
                </Text>
              </View>
            )}

            {previewImages.length > 1 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.previewThumbRow}
              >
                {previewImages.map((uri, index) => (
                  <Pressable
                    key={`${uri}-${index}`}
                    onPress={() => setPreviewImageIndex(index)}
                    style={[
                      styles.previewThumbWrap,
                      previewImageIndex === index &&
                        styles.previewThumbWrapActive,
                    ]}
                  >
                    <Image source={{ uri }} style={styles.previewThumb} />
                  </Pressable>
                ))}
              </ScrollView>
            ) : null}

            <Text style={styles.previewPlaceTitle}>{place?.title}</Text>

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

          <View style={styles.previewFooter}>
            <Pressable style={styles.previewButtonWide} onPress={onClose}>
              <Text style={styles.previewButtonWideText}>Close</Text>
            </Pressable>

            <Pressable
              style={styles.editButtonWide}
              onPress={() => {
                const placeToEdit = place;
                onClose();
                onEditPlace(placeToEdit);
              }}
            >
              <Text style={styles.editButtonWideText}>Edit place</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  previewOverlay: {
    flex: 1,
    backgroundColor: colors.overlayDark,
    justifyContent: "center",
    padding: spacing.xl,
  },
  previewModal: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxxl + 2,
    padding: 18,
    maxHeight: "88%",
  },
  previewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.lg - 2,
  },
  previewHeaderTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: "700",
  },
  previewCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceAlt,
    justifyContent: "center",
    alignItems: "center",
  },
  previewMainImage: {
    width: "100%",
    height: 260,
    borderRadius: radius.xxl - 2,
    marginBottom: spacing.lg - 2,
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
  previewFallbackLetter: {
    color: colors.textPrimary,
    fontSize: 42,
    fontWeight: "700",
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
  previewFooter: {
    flexDirection: "row",
    marginTop: 10,
  },
  previewButtonWide: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    paddingVertical: 14,
    alignItems: "center",
    marginRight: 6,
  },
  previewButtonWideText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: "600",
  },
  editButtonWide: {
    flex: 1,
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingVertical: 14,
    alignItems: "center",
    marginLeft: 6,
  },
  editButtonWideText: {
    color: colors.textDark,
    fontSize: 14,
    fontWeight: "700",
  },
});