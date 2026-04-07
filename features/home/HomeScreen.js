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

import JourneyPreviewModal from "../../components/modals/JourneyPreviewModal";
import PlacePreviewModal from "../../components/modals/PlacePreviewModal";
import ActionIconButton from "../../components/ui/ActionIconButton";
import EmptyStateCard from "../../components/ui/EmptyStateCard";
import InfoPill from "../../components/ui/InfoPill";
import ScreenHeader from "../../components/ui/ScreenHeader";
import SectionHeader from "../../components/ui/SectionHeader";
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
  recentRoutes = [],
  totalPlaces,
  totalRoutes,
  activeRouteLink,
  latestRoute,
  onOpenPlaces,
  onOpenRoutes,
  onOpenAdd,
  onEditPlace,
  onEditRoute,
  onRemovePlace,
  onRemoveRoute,
  onAddJourneyPhotos,
}) {
  const [previewPlace, setPreviewPlace] = useState(null);
  const [previewRoute, setPreviewRoute] = useState(null);

  return (
    <>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <ScreenHeader
          title="WildTales"
          subtitle="Your travel diary for places worth remembering, routes worth keeping, and small adventures along the way."
          maxWidth={330}
        />

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
          <View style={styles.featuredHomeCard}>
            <Pressable onPress={() => setPreviewPlace(featuredPlace)}>
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
                  <Text style={styles.heroTitleFallback}>
                    {featuredPlace.title}
                  </Text>

                  {getPlaceLocationText(featuredPlace) ? (
                    <Text style={styles.heroPlaceNameFallback} numberOfLines={1}>
                      {getPlaceLocationText(featuredPlace)}
                    </Text>
                  ) : null}

                  <Text style={styles.heroSubtitleFallback} numberOfLines={2}>
                    {featuredPlace.note}
                  </Text>
                </View>
              )}
            </Pressable>

            <View style={styles.overlayActionsRow}>
              <ActionIconButton
                icon="edit-2"
                onPress={() => onEditPlace(featuredPlace)}
                accessibilityLabel="Edit featured place"
              />
              <ActionIconButton
                icon="trash-2"
                onPress={() => onRemovePlace?.(featuredPlace.id)}
                accessibilityLabel="Delete featured place"
                variant="danger"
                style={styles.overlayActionButton}
              />
            </View>
          </View>
        ) : (
          <EmptyStateCard
            icon="map-marker-path"
            iconSet="material-community"
            title="No places yet"
            text="Start by saving your first place and it will appear here."
            style={styles.emptyCard}
          />
        )}

        {latestRoute ? (
          <>
            <SectionHeader title="Latest journey" onPress={onOpenRoutes} />

            <View style={styles.latestJourneyCard}>
              <Pressable onPress={() => setPreviewRoute(latestRoute)}>
                {latestRoute.snapshotUri ? (
                  <Image
                    source={{ uri: latestRoute.snapshotUri }}
                    style={styles.latestJourneyHero}
                  />
                ) : (
                  <View style={styles.latestJourneyFallback}>
                    <Ionicons
                      name="trail-sign-outline"
                      size={26}
                      color={colors.textSecondary}
                    />
                    <Text style={styles.latestJourneyFallbackText}>
                      No route snapshot yet
                    </Text>
                  </View>
                )}

                <View style={styles.latestJourneyTop}>
                  <View style={styles.latestJourneyHeaderRow}>
                    <Text style={styles.latestJourneyTitle} numberOfLines={1}>
                      {latestRoute.title}
                    </Text>
                    <Text style={styles.latestJourneyDate}>
                      {formatJourneyDate(
                        latestRoute.endedAt || latestRoute.startedAt
                      )}
                    </Text>
                  </View>

                  {getRouteLocationLine(latestRoute) ? (
                    <Text style={styles.latestJourneyLocation} numberOfLines={1}>
                      {getRouteLocationLine(latestRoute)}
                    </Text>
                  ) : null}

                  <View style={styles.journeyMetaRow}>
                    <InfoPill
                      icon="navigate-outline"
                      label={formatDistanceKm(Number(latestRoute.distanceKm || 0))}
                      style={styles.metaPillItem}
                    />

                    <InfoPill
                      icon="clock"
                      iconSet="feather"
                      label={formatDuration(
                        Number(latestRoute.durationMinutes || 0)
                      )}
                      style={styles.metaPillItem}
                    />

                    {Array.isArray(latestRoute.images) &&
                    latestRoute.images.length > 0 ? (
                      <InfoPill
                        icon="images-outline"
                        variant="muted"
                        label={`${latestRoute.images.length} photo${
                          latestRoute.images.length === 1 ? "" : "s"
                        }`}
                        style={styles.metaPillItem}
                      />
                    ) : null}
                  </View>
                </View>
              </Pressable>

              <View style={styles.latestJourneyActions}>
                <ActionIconButton
                  icon="edit-2"
                  onPress={() => onEditRoute(latestRoute)}
                  accessibilityLabel="Edit latest journey"
                />

                <ActionIconButton
                  icon="images-outline"
                  iconSet="ionicons"
                  onPress={() => onAddJourneyPhotos?.(latestRoute)}
                  accessibilityLabel="Add photos to latest journey"
                  style={styles.latestActionButton}
                />

                <ActionIconButton
                  icon="trash-2"
                  onPress={() => onRemoveRoute(latestRoute.id)}
                  accessibilityLabel="Delete latest journey"
                  variant="danger"
                  style={styles.latestActionButton}
                />
              </View>
            </View>
          </>
        ) : null}

        <SectionHeader title="Recent journeys" onPress={onOpenRoutes} />

        {recentRoutes.length === 0 ? (
          <View style={styles.emptyMiniCard}>
            <Ionicons
              name="trail-sign-outline"
              size={18}
              color={colors.textMuted}
            />
            <Text style={styles.emptyMiniText}>No journeys saved yet.</Text>
          </View>
        ) : (
          recentRoutes.map((route) => (
            <View key={route.id} style={styles.homeMiniCard}>
              <Pressable
                style={styles.homeMiniMain}
                onPress={() => setPreviewRoute(route)}
              >
                {route.snapshotUri ? (
                  <Image
                    source={{ uri: route.snapshotUri }}
                    style={styles.homeMiniImage}
                  />
                ) : (
                  <View style={[styles.homeMiniImage, styles.homeMiniFallback]}>
                    <Ionicons
                      name="trail-sign-outline"
                      size={24}
                      color={colors.textPrimary}
                    />
                  </View>
                )}

                <View style={styles.homeMiniBody}>
                  <Text style={styles.homeMiniTitle} numberOfLines={1}>
                    {route.title}
                  </Text>

                  {getRouteLocationLine(route) ? (
                    <Text style={styles.homeMiniMeta} numberOfLines={1}>
                      {getRouteLocationLine(route)}
                    </Text>
                  ) : null}

                  <Text style={styles.homeMiniNote} numberOfLines={1}>
                    {formatDistanceKm(Number(route.distanceKm || 0))} •{" "}
                    {formatDuration(Number(route.durationMinutes || 0))}
                  </Text>
                </View>
              </Pressable>

              <View style={styles.homeMiniActions}>
                <ActionIconButton
                  icon="edit-2"
                  onPress={() => onEditRoute(route)}
                  accessibilityLabel={`Edit ${route.title}`}
                />

                <ActionIconButton
                  icon="trash-2"
                  onPress={() => onRemoveRoute(route.id)}
                  accessibilityLabel={`Delete ${route.title}`}
                  variant="danger"
                />
              </View>
            </View>
          ))
        )}

        <SectionHeader title="Recent memories" onPress={onOpenPlaces} />

        {recentPlaces.length === 0 ? (
          <View style={styles.emptyMiniCard}>
            <Ionicons
              name="images-outline"
              size={18}
              color={colors.textMuted}
            />
            <Text style={styles.emptyMiniText}>No memories saved yet.</Text>
          </View>
        ) : (
          recentPlaces.map((place) => (
            <View key={place.id} style={styles.homeMiniCard}>
              <Pressable
                style={styles.homeMiniMain}
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
              </Pressable>

              <View style={styles.homeMiniActions}>
                <ActionIconButton
                  icon="edit-2"
                  onPress={() => onEditPlace(place)}
                  accessibilityLabel={`Edit ${place.title}`}
                />

                <ActionIconButton
                  icon="trash-2"
                  onPress={() => onRemovePlace?.(place.id)}
                  accessibilityLabel={`Delete ${place.title}`}
                  variant="danger"
                />
              </View>
            </View>
          ))
        )}

        <Pressable style={styles.routesShortcutCard} onPress={onOpenRoutes}>
          <View style={styles.inlineRow}>
            <Ionicons
              name="trail-sign-outline"
              size={18}
              color={colors.textSecondary}
            />
            <Text style={styles.routesShortcutTitle}>Your saved journeys</Text>
          </View>
          <Text style={styles.routesShortcutText}>
            Revisit your routes, update them, and keep photos collected along
            the way.
          </Text>
        </Pressable>
      </ScrollView>

      <PlacePreviewModal
        place={previewPlace}
        onClose={() => setPreviewPlace(null)}
        onEditPlace={onEditPlace}
        onDeletePlace={onRemovePlace}
        activeRouteLink={activeRouteLink}
      />

      <JourneyPreviewModal
        route={previewRoute}
        onClose={() => setPreviewRoute(null)}
        onEditJourney={onEditRoute}
        onDeleteJourney={onRemoveRoute}
        onAddJourneyPhotos={onAddJourneyPhotos}
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
    position: "relative",
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
  overlayActionsRow: {
    position: "absolute",
    top: 16,
    right: 16,
    flexDirection: "row",
  },
  overlayActionButton: {
    marginLeft: spacing.sm,
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
  heroTitleFallback: {
    color: colors.textPrimary,
    fontSize: 28,
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
  heroPlaceNameFallback: {
    color: colors.textMuted,
    fontSize: 14,
    marginBottom: 8,
  },
  heroSubtitle: {
    color: "#EAF3ED",
    fontSize: 15,
    lineHeight: 21,
    marginBottom: 6,
    marginTop: 2,
  },
  heroSubtitleFallback: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 21,
    marginTop: 2,
  },
  emptyCard: {
    marginBottom: spacing.xl,
  },
  emptyMiniCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl,
    padding: 16,
    marginBottom: spacing.xl,
    flexDirection: "row",
    alignItems: "center",
  },
  emptyMiniText: {
    color: colors.textMuted,
    fontSize: 14,
    marginLeft: 10,
  },
  latestJourneyCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    overflow: "hidden",
  },
  latestJourneyHero: {
    width: "100%",
    height: 172,
    borderRadius: radius.xl,
    marginBottom: spacing.md,
  },
  latestJourneyFallback: {
    height: 172,
    borderRadius: radius.xl,
    backgroundColor: colors.surfaceAlt,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  latestJourneyFallbackText: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 8,
  },
  latestJourneyTop: {
    marginBottom: spacing.sm,
  },
  latestJourneyHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  latestJourneyTitle: {
    color: colors.white,
    fontSize: 19,
    fontWeight: "800",
    flex: 1,
    marginRight: spacing.sm,
  },
  latestJourneyLocation: {
    color: colors.textSecondary,
    fontSize: 13,
    marginBottom: spacing.sm,
  },
  latestJourneyDate: {
    color: colors.textDim,
    fontSize: 12,
    marginTop: 2,
  },
  journeyMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: spacing.sm,
  },
  metaPillItem: {
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  latestJourneyActions: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  latestActionButton: {
    marginLeft: spacing.sm,
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
  homeMiniMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
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
    alignSelf: "stretch",
    justifyContent: "center",
    marginLeft: spacing.sm,
    gap: 8,
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