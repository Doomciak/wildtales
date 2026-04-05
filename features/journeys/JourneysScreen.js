import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";

import JourneyPreviewModal from "../../components/modals/JourneyPreviewModal";
import { colors } from "../../constants/theme";
import { radius, screen, spacing } from "../../constants/layout";
import {
  formatDistanceKm,
  formatDuration,
  formatJourneyDate,
  getRouteLocationLine,
} from "../../utils/travel";

export default function JourneysScreen({
  routes,
  onRemoveRoute,
  onSaveRouteAsPlace,
  onEditRoute,
}) {
  const [previewRoute, setPreviewRoute] = useState(null);

  return (
    <>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.topArea}>
          <Text style={styles.title}>Routes</Text>
          <Text style={styles.subtitle}>
            Keep the routes you completed and turn them into memories later.
          </Text>
        </View>

        {routes.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconWrap}>
              <Ionicons
                name="trail-sign-outline"
                size={24}
                color={colors.textSecondary}
              />
            </View>
            <Text style={styles.emptyTitle}>No routes yet</Text>
            <Text style={styles.emptyText}>
              Finish a live trip and save it to keep your routes here.
            </Text>
          </View>
        ) : (
          routes.map((route) => {
            const routeLocationLine = getRouteLocationLine(route);
            const isLinkedToPlace = route.linkedPlaceId != null;

            return (
              <View key={route.id} style={styles.journeyCard}>
                <View style={styles.journeyTopRow}>
                  <View style={styles.journeyTitleWrap}>
                    <Text style={styles.journeyTitle}>{route.title}</Text>
                    {routeLocationLine ? (
                      <Text style={styles.journeyLocationLine}>
                        {routeLocationLine}
                      </Text>
                    ) : null}
                  </View>

                  <Text style={styles.journeyDateText}>
                    {formatJourneyDate(route.endedAt || route.startedAt)}
                  </Text>
                </View>

                <Text style={styles.journeyNote} numberOfLines={2}>
                  {route.note || "Saved from your finished live route."}
                </Text>

                <View style={styles.journeyMetaRow}>
                  <View style={styles.journeyMetaPill}>
                    <Ionicons
                      name="navigate-outline"
                      size={13}
                      color={colors.textSecondary}
                    />
                    <Text style={styles.journeyMetaPillText}>
                      {formatDistanceKm(Number(route.distanceKm || 0))}
                    </Text>
                  </View>

                  <View style={styles.journeyMetaPill}>
                    <Feather
                      name="clock"
                      size={13}
                      color={colors.textSecondary}
                    />
                    <Text style={styles.journeyMetaPillText}>
                      {formatDuration(Number(route.durationMinutes || 0))}
                    </Text>
                  </View>

                  {isLinkedToPlace ? (
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

                <View style={styles.journeyActionRow}>
                  <Pressable
                    style={styles.previewButtonPretty}
                    onPress={() => setPreviewRoute(route)}
                  >
                    <Feather
                      name="eye"
                      size={13}
                      color={colors.textPrimary}
                      style={styles.actionIcon}
                    />
                    <Text style={styles.previewButtonPrettyText}>Preview</Text>
                  </Pressable>

                  <Pressable
                    style={styles.deleteButtonPretty}
                    onPress={() => onEditRoute(route)}
                  >
                    <Feather
                      name="edit-2"
                      size={13}
                      color={colors.textPrimary}
                      style={styles.actionIcon}
                    />
                    <Text style={styles.deleteButtonPrettyText}>Edit</Text>
                  </Pressable>

                  {isLinkedToPlace ? (
                    <View style={styles.journeySavedButton}>
                      <Ionicons
                        name="checkmark-circle-outline"
                        size={14}
                        color={colors.textDark}
                        style={styles.actionIcon}
                      />
                      <Text style={styles.journeySavedButtonText}>
                        In journal
                      </Text>
                    </View>
                  ) : (
                    <Pressable
                      style={styles.journeyConvertButton}
                      onPress={() => onSaveRouteAsPlace(route)}
                    >
                      <Feather
                        name="bookmark"
                        size={13}
                        color={colors.textDark}
                        style={styles.actionIcon}
                      />
                      <Text style={styles.journeyConvertButtonText}>
                        Save as place
                      </Text>
                    </Pressable>
                  )}

                  <Pressable
                    style={styles.deleteButtonPretty}
                    onPress={() => onRemoveRoute(route.id)}
                  >
                    <Feather
                      name="trash-2"
                      size={13}
                      color={colors.textPrimary}
                      style={styles.actionIcon}
                    />
                    <Text style={styles.deleteButtonPrettyText}>Delete</Text>
                  </Pressable>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      <JourneyPreviewModal
        route={previewRoute}
        onClose={() => setPreviewRoute(null)}
        onEditJourney={onEditRoute}
        onDeleteJourney={onRemoveRoute}
        onSaveRouteAsPlace={onSaveRouteAsPlace}
      />
    </>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingTop: screen.topPadding,
    paddingBottom: screen.bottomSpacing,
    paddingHorizontal: spacing.xl,
  },
  topArea: {
    marginBottom: 22,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 36,
    fontWeight: "800",
    marginBottom: spacing.sm,
    letterSpacing: 0.3,
  },
  subtitle: {
    color: colors.textSoft,
    fontSize: 14,
    lineHeight: 20,
    maxWidth: 300,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl,
    padding: spacing.xl,
    alignItems: "flex-start",
  },
  emptyIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surfaceAlt,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: spacing.sm,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
  },
  journeyCard: {
    backgroundColor: colors.surface,
    borderRadius: 28,
    padding: 18,
    marginBottom: spacing.lg,
    overflow: "hidden",
  },
  journeyTopRow: {
    marginBottom: spacing.md,
  },
  journeyTitleWrap: {
    marginBottom: spacing.sm,
    minWidth: 0,
  },
  journeyTitle: {
    color: colors.white,
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 6,
  },
  journeyLocationLine: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  journeyDateText: {
    color: colors.textDim,
    fontSize: 12,
  },
  journeyNote: {
    color: "#EEF5F0",
    fontSize: 14,
    lineHeight: 21,
    marginBottom: spacing.md,
  },
  journeyMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: spacing.md,
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
  journeyActionRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  previewButtonPretty: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  previewButtonPrettyText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "700",
  },
  deleteButtonPretty: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(24,49,38,0.55)",
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  deleteButtonPrettyText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "700",
  },
  journeyConvertButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  journeyConvertButtonText: {
    color: colors.textDark,
    fontSize: 13,
    fontWeight: "700",
  },
  journeySavedButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.accentSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  journeySavedButtonText: {
    color: colors.textDark,
    fontSize: 13,
    fontWeight: "700",
  },
  actionIcon: {
    marginRight: 6,
  },
});