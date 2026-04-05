import { useMemo } from "react";
import {
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
  onSaveRouteAsPlace,
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

  return (
    <Modal visible={Boolean(route)} transparent animationType="fade">
      <View style={styles.previewOverlay}>
        <View style={styles.previewModal}>
          <View style={styles.previewHeader}>
            <Text style={styles.previewHeaderTitle}>Journey preview</Text>

            <Pressable style={styles.previewCloseButton} onPress={onClose}>
              <Feather name="x" size={18} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {previewPoints.length > 0 || previewFallbackPoint ? (
              <View style={styles.journeyPreviewMapWrap}>
                <MapView style={styles.map} initialRegion={previewRegion}>
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
              <View style={styles.journeyMetaPill}>
                <Ionicons
                  name="navigate-outline"
                  size={13}
                  color={colors.textSecondary}
                />
                <Text style={styles.journeyMetaPillText}>
                  {formatDistanceKm(Number(route?.distanceKm || 0))}
                </Text>
              </View>

              <View style={styles.journeyMetaPill}>
                <Feather
                  name="clock"
                  size={13}
                  color={colors.textSecondary}
                />
                <Text style={styles.journeyMetaPillText}>
                  {formatDuration(Number(route?.durationMinutes || 0))}
                </Text>
              </View>

              {route?.linkedPlaceId ? (
                <View style={styles.journeyLinkedPill}>
                  <Ionicons
                    name="bookmark"
                    size={13}
                    color={colors.textDark}
                  />
                  <Text style={styles.journeyLinkedPillText}>
                    Saved as place
                  </Text>
                </View>
              ) : null}
            </View>

            <Text style={styles.previewNote}>
              {route?.note || "Saved from your finished live route."}
            </Text>
          </ScrollView>

          <View style={styles.previewFooterStack}>
            <View style={styles.previewFooter}>
              <Pressable style={styles.previewButtonWide} onPress={onClose}>
                <Text style={styles.previewButtonWideText}>Close</Text>
              </Pressable>

              <Pressable
                style={styles.editButtonWide}
                onPress={() => {
                  const currentRoute = route;
                  onClose();
                  onEditJourney(currentRoute);
                }}
              >
                <Text style={styles.editButtonWideText}>Edit journey</Text>
              </Pressable>
            </View>

            <View style={styles.previewFooter}>
              {route?.linkedPlaceId ? (
                <View style={styles.journeyPreviewLinkedButton}>
                  <Text style={styles.journeyPreviewLinkedButtonText}>
                    Already saved as place
                  </Text>
                </View>
              ) : (
                <Pressable
                  style={styles.editButtonWide}
                  onPress={() => {
                    const currentRoute = route;
                    onClose();
                    onSaveRouteAsPlace(currentRoute);
                  }}
                >
                  <Text style={styles.editButtonWideText}>Save as place</Text>
                </Pressable>
              )}

              <Pressable
                style={styles.dangerWideButton}
                onPress={() => {
                  const currentRoute = route;
                  onClose();
                  onDeleteJourney(currentRoute.id);
                }}
              >
                <Text style={styles.dangerWideButtonText}>Delete</Text>
              </Pressable>
            </View>
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
  journeyPreviewMapWrap: {
    height: 260,
    borderRadius: radius.xxl - 2,
    overflow: "hidden",
    marginBottom: spacing.lg - 2,
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
  journeyMetaPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  journeyMetaPillText: {
    color: colors.textSecondary,
    fontSize: 12,
    marginLeft: 6,
    fontWeight: "600",
  },
  journeyLinkedPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  journeyLinkedPillText: {
    color: colors.textDark,
    fontSize: 12,
    marginLeft: 6,
    fontWeight: "700",
  },
  previewNote: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 10,
    marginBottom: spacing.sm,
  },
  previewFooterStack: {
    marginTop: spacing.lg,
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
  journeyPreviewLinkedButton: {
    flex: 1,
    backgroundColor: colors.accentSoft,
    borderRadius: radius.pill,
    paddingVertical: 14,
    alignItems: "center",
    marginRight: 6,
    justifyContent: "center",
  },
  journeyPreviewLinkedButtonText: {
    color: colors.textDark,
    fontSize: 14,
    fontWeight: "700",
  },
  dangerWideButton: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    paddingVertical: 14,
    alignItems: "center",
    marginLeft: 6,
  },
  dangerWideButtonText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: "700",
  },
});