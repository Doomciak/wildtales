import { useState } from "react";
import {
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  Feather,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";

import PlacePreviewModal from "../../components/modals/PlacePreviewModal";
import JourneyPreviewModal from "../../components/modals/JourneyPreviewModal";
import { colors } from "../../constants/theme";
import { radius, screen, spacing } from "../../constants/layout";
import {
  formatDistanceKm,
  formatDuration,
  formatJourneyDate,
  getPlaceLocationText,
  getRouteLocationLine,
} from "../../utils/travel";

export default function HomeScreen({
  featuredPlace,
  recentPlaces,
  totalPlaces,
  totalRoutes,
  activeRouteLink,
  latestRoute,
  onOpenPlaces,
  onOpenRoutes,
  onOpenAdd,
  onEditPlace,
  onEditRoute,
  onRemoveRoute,
  onSaveRouteAsPlace,
}) {
  const [previewPlace, setPreviewPlace] = useState(null);
  const [previewRoute, setPreviewRoute] = useState(null);

  return (
    <>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.homeTopArea}>
          <Text style={styles.homeTitle}>WildTales</Text>
          <Text style={styles.homeSubtitle}>
            A simple home for your memories, saved places, routes, and live trip
            updates.
          </Text>
        </View>

        {activeRouteLink ? (
          <View style={styles.liveRouteStrip}>
            <View style={styles.inlineRow}>
              <Ionicons
                name="navigate-outline"
                size={16}
                color={colors.textDark}
              />
              <Text style={styles.liveRouteStripTitle}>
                Live route near {activeRouteLink.label}
              </Text>
            </View>

            <Text style={styles.liveRouteStripText}>
              {formatDistanceKm(activeRouteLink.totalDistanceKm)} •{" "}
              {formatDuration(activeRouteLink.durationMinutes)}
            </Text>
          </View>
        ) : null}

        <View style={styles.overviewStatsRow}>
          <View style={styles.overviewStatCard}>
            <Text style={styles.overviewStatNumber}>{totalPlaces}</Text>
            <Text style={styles.overviewStatLabel}>Saved places</Text>
          </View>

          <View style={[styles.overviewStatCard, styles.overviewStatCardLast]}>
            <Text style={styles.overviewStatNumber}>{totalRoutes}</Text>
            <Text style={styles.overviewStatLabel}>Saved routes</Text>
          </View>
        </View>

        <View style={styles.quickActionsRow}>
          <Pressable style={styles.quickActionPrimary} onPress={onOpenAdd}>
            <Ionicons
              name="add-circle-outline"
              size={18}
              color={colors.textDark}
            />
            <Text style={styles.quickActionPrimaryText}>Add place</Text>
          </Pressable>

          <Pressable style={styles.quickActionSecondary} onPress={onOpenPlaces}>
            <Ionicons
              name="images-outline"
              size={18}
              color={colors.textSecondary}
            />
            <Text style={styles.quickActionSecondaryText}>Open places</Text>
          </Pressable>
        </View>

        {featuredPlace ? (
          <Pressable
            style={styles.featuredHomeCard}
            onPress={() => setPreviewPlace(featuredPlace)}
          >
            {featuredPlace.coverImage ? (
              <ImageBackground
                source={{ uri: featuredPlace.coverImage }}
                style={styles.featuredHomeImage}
                imageStyle={styles.featuredHomeImageStyle}
              >
                <View style={styles.featuredHomeOverlay} />
                <View style={styles.featuredHomeContent}>
                  <Text style={styles.heroLabel}>Featured memory</Text>
                  <Text style={styles.heroTitle}>{featuredPlace.title}</Text>

                  {getPlaceLocationText(featuredPlace) ? (
                    <View style={styles.inlineRow}>
                      <Ionicons
                        name="location-outline"
                        size={14}
                        color={colors.textSecondary}
                      />
                      <Text style={styles.heroPlaceName}>
                        {getPlaceLocationText(featuredPlace)}
                      </Text>
                    </View>
                  ) : null}

                  <Text style={styles.heroSubtitle} numberOfLines={2}>
                    {featuredPlace.note}
                  </Text>
                </View>
              </ImageBackground>
            ) : (
              <View style={styles.featuredHomeFallback}>
                <Text style={styles.heroLabel}>Featured memory</Text>
                <Text style={styles.heroTitle}>{featuredPlace.title}</Text>
                <Text style={styles.heroSubtitle} numberOfLines={2}>
                  {featuredPlace.note}
                </Text>
              </View>
            )}
          </Pressable>
        ) : (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconWrap}>
              <MaterialCommunityIcons
                name="map-marker-path"
                size={24}
                color={colors.textSecondary}
              />
            </View>
            <Text style={styles.emptyTitle}>No places yet</Text>
            <Text style={styles.emptyText}>
              Start by saving your first place and it will appear here.
            </Text>
          </View>
        )}

        {latestRoute ? (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Latest journey</Text>
              <Pressable onPress={onOpenRoutes}>
                <Text style={styles.sectionLink}>View all</Text>
              </Pressable>
            </View>

            <View style={styles.latestJourneyCard}>
              <View style={styles.latestJourneyTop}>
                <View style={styles.latestJourneyTextWrap}>
                  <Text style={styles.latestJourneyTitle} numberOfLines={1}>
                    {latestRoute.title}
                  </Text>

                  {getRouteLocationLine(latestRoute) ? (
                    <Text
                      style={styles.latestJourneyLocation}
                      numberOfLines={1}
                    >
                      {getRouteLocationLine(latestRoute)}
                    </Text>
                  ) : null}
                </View>

                <Text style={styles.latestJourneyDate}>
                  {formatJourneyDate(
                    latestRoute.endedAt || latestRoute.startedAt
                  )}
                </Text>
              </View>

              <View style={styles.journeyMetaRow}>
                <View style={styles.journeyMetaPill}>
                  <Ionicons
                    name="navigate-outline"
                    size={13}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.journeyMetaPillText}>
                    {formatDistanceKm(Number(latestRoute.distanceKm || 0))}
                  </Text>
                </View>

                <View style={styles.journeyMetaPill}>
                  <Feather
                    name="clock"
                    size={13}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.journeyMetaPillText}>
                    {formatDuration(Number(latestRoute.durationMinutes || 0))}
                  </Text>
                </View>
              </View>

              <View style={styles.latestJourneyActions}>
                <Pressable
                  style={styles.placePrimaryAction}
                  onPress={() => setPreviewRoute(latestRoute)}
                >
                  <Feather name="eye" size={14} color={colors.textDark} />
                  <Text style={styles.placePrimaryActionText}>Preview</Text>
                </Pressable>

                <Pressable
                  style={styles.placeSecondaryAction}
                  onPress={() => onEditRoute(latestRoute)}
                >
                  <Feather
                    name="edit-2"
                    size={14}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.placeSecondaryActionText}>Edit</Text>
                </Pressable>

                <Pressable
                  style={styles.placeDeleteAction}
                  onPress={() => onRemoveRoute(latestRoute.id)}
                >
                  <Feather
                    name="trash-2"
                    size={14}
                    color={colors.textSecondary}
                  />
                </Pressable>
              </View>
            </View>
          </>
        ) : null}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent memories</Text>
          <Pressable onPress={onOpenPlaces}>
            <Text style={styles.sectionLink}>View all</Text>
          </Pressable>
        </View>

        {recentPlaces.length === 0
          ? null
          : recentPlaces.map((place) => (
              <Pressable
                key={place.id}
                style={styles.homeMiniCard}
                onPress={() => setPreviewPlace(place)}
              >
                {place.coverImage ? (
                  <Image
                    source={{ uri: place.coverImage }}
                    style={styles.homeMiniImage}
                  />
                ) : (
                  <View style={[styles.homeMiniImage, styles.homeMiniFallback]}>
                    <Text style={styles.homeMiniLetter}>
                      {String(place.title).charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}

                <View style={styles.homeMiniBody}>
                  <Text style={styles.homeMiniTitle} numberOfLines={1}>
                    {place.title}
                  </Text>
                  {getPlaceLocationText(place) ? (
                    <Text style={styles.homeMiniMeta} numberOfLines={1}>
                      {getPlaceLocationText(place)}
                    </Text>
                  ) : null}
                  <Text style={styles.homeMiniNote} numberOfLines={2}>
                    {place.note}
                  </Text>
                </View>

                <View style={styles.homeMiniActions}>
                  <Pressable
                    style={styles.homeMiniActionButton}
                    onPress={() => setPreviewPlace(place)}
                  >
                    <Feather name="eye" size={14} color={colors.textDark} />
                  </Pressable>

                  <Pressable
                    style={styles.homeMiniGhostButton}
                    onPress={() => onEditPlace(place)}
                  >
                    <Feather
                      name="edit-2"
                      size={14}
                      color={colors.textSecondary}
                    />
                  </Pressable>
                </View>
              </Pressable>
            ))}

        <Pressable style={styles.routesShortcutCard} onPress={onOpenRoutes}>
          <View style={styles.inlineRow}>
            <Ionicons
              name="trail-sign-outline"
              size={18}
              color={colors.textSecondary}
            />
            <Text style={styles.routesShortcutTitle}>Your saved routes</Text>
          </View>
          <Text style={styles.routesShortcutText}>
            Open routes to preview, edit, delete, or save finished journeys as
            places.
          </Text>
        </Pressable>
      </ScrollView>

      <PlacePreviewModal
        place={previewPlace}
        onClose={() => setPreviewPlace(null)}
        onEditPlace={onEditPlace}
        activeRouteLink={activeRouteLink}
      />

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
  homeTopArea: {
    marginBottom: 22,
  },
  homeTitle: {
    color: colors.textPrimary,
    fontSize: 36,
    fontWeight: "800",
    marginBottom: spacing.sm,
    letterSpacing: 0.3,
  },
  homeSubtitle: {
    color: colors.textSoft,
    fontSize: 14,
    lineHeight: 20,
    maxWidth: 320,
  },
  inlineRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  liveRouteStrip: {
    backgroundColor: colors.accent,
    borderRadius: radius.xl + 2,
    padding: spacing.lg,
    marginBottom: 18,
  },
  liveRouteStripTitle: {
    color: colors.textDark,
    fontSize: 15,
    fontWeight: "700",
    marginLeft: spacing.sm,
    flexShrink: 1,
  },
  liveRouteStripText: {
    color: "#365142",
    fontSize: 13,
    marginTop: spacing.sm,
  },
  overviewStatsRow: {
    flexDirection: "row",
    marginBottom: spacing.lg,
  },
  overviewStatCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.xxl,
    padding: 18,
    marginRight: spacing.sm,
  },
  overviewStatCardLast: {
    marginRight: 0,
  },
  overviewStatNumber: {
    color: colors.textPrimary,
    fontSize: 30,
    fontWeight: "800",
    marginBottom: spacing.xs,
  },
  overviewStatLabel: {
    color: colors.textMuted,
    fontSize: 13,
  },
  quickActionsRow: {
    flexDirection: "row",
    marginBottom: 18,
  },
  quickActionPrimary: {
    flex: 1,
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginRight: 6,
  },
  quickActionPrimaryText: {
    color: colors.textDark,
    fontSize: 14,
    fontWeight: "700",
    marginLeft: spacing.sm,
  },
  quickActionSecondary: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginLeft: 6,
  },
  quickActionSecondaryText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: "600",
    marginLeft: spacing.sm,
  },
  featuredHomeCard: {
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: colors.surface,
    marginBottom: 22,
  },
  featuredHomeImage: {
    minHeight: 280,
    justifyContent: "flex-end",
  },
  featuredHomeImageStyle: {
    borderRadius: 28,
  },
  featuredHomeOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlayImage,
  },
  featuredHomeContent: {
    padding: 22,
  },
  featuredHomeFallback: {
    minHeight: 220,
    padding: 22,
    justifyContent: "flex-end",
  },
  heroLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    marginBottom: spacing.sm,
  },
  heroTitle: {
    color: colors.white,
    fontSize: 32,
    fontWeight: "800",
    marginBottom: spacing.sm,
  },
  heroPlaceName: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: 6,
    marginLeft: spacing.sm,
    flexShrink: 1,
  },
  heroSubtitle: {
    color: "#EAF3ED",
    fontSize: 15,
    lineHeight: 21,
    marginBottom: 6,
    marginTop: 2,
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
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: "700",
  },
  sectionLink: {
    color: "#A7BBB0",
    fontSize: 14,
  },
  latestJourneyCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    overflow: "hidden",
  },
  latestJourneyTop: {
    marginBottom: spacing.md,
  },
  latestJourneyTextWrap: {
    marginBottom: spacing.sm,
    minWidth: 0,
  },
  latestJourneyTitle: {
    color: colors.white,
    fontSize: 20,
    fontWeight: "800",
    marginBottom: spacing.xs,
  },
  latestJourneyLocation: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  latestJourneyDate: {
    color: colors.textDim,
    fontSize: 12,
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
  latestJourneyActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    marginTop: 2,
  },
  placePrimaryAction: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  placePrimaryActionText: {
    color: colors.textDark,
    fontSize: 13,
    fontWeight: "700",
    marginLeft: 6,
  },
  placeSecondaryAction: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  placeSecondaryActionText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 6,
  },
  placeDeleteAction: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  homeMiniCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl,
    padding: 14,
    marginBottom: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
  },
  homeMiniImage: {
    width: 82,
    height: 82,
    borderRadius: radius.lg,
    marginRight: 14,
  },
  homeMiniFallback: {
    backgroundColor: "#29463A",
    alignItems: "center",
    justifyContent: "center",
  },
  homeMiniLetter: {
    color: colors.textPrimary,
    fontSize: 26,
    fontWeight: "700",
  },
  homeMiniBody: {
    flex: 1,
    marginRight: 10,
    minWidth: 0,
  },
  homeMiniTitle: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: "700",
    marginBottom: spacing.xs,
  },
  homeMiniMeta: {
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: 6,
  },
  homeMiniNote: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  homeMiniActions: {
    justifyContent: "space-between",
    alignSelf: "stretch",
  },
  homeMiniActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  homeMiniGhostButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  routesShortcutCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl,
    padding: 18,
    marginTop: 6,
  },
  routesShortcutTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "700",
    marginLeft: spacing.sm,
  },
  routesShortcutText: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 10,
  },
});