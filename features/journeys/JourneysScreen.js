import { useMemo, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";

import JourneyPreviewModal from "../../components/modals/JourneyPreviewModal";
import CollectionControls from "../../components/ui/CollectionControls";
import EmptyStateCard from "../../components/ui/EmptyStateCard";
import InfoPill from "../../components/ui/InfoPill";
import ScreenHeader from "../../components/ui/ScreenHeader";
import { colors } from "../../constants/theme";
import { radius, screen, spacing } from "../../constants/layout";
import {
  formatDistanceKm,
  formatDuration,
  formatJourneyDate,
  getRouteLocationLine,
} from "../../utils/travel";

// Helper to make sure journey images always end up as a clean array.
// Some routes may already store images as an array,
// while others may still have them as a JSON string.
function getJourneyImages(route) {
  if (Array.isArray(route?.images)) {
    return route.images.filter(Boolean);
  }

  if (typeof route?.images === "string" && route.images.trim()) {
    try {
      const parsed = JSON.parse(route.images);
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } catch (error) {
      return [];
    }
  }

  return [];
}

export default function JourneysScreen({
  routes,
  onRemoveRoute,
  onEditRoute,
  onAddJourneyPhotos,
}) {
  // Keeps track of which journey is currently opened in the preview modal.
  const [previewRoute, setPreviewRoute] = useState(null);

  // Search and filter state used by the collection controls.
  const [search, setSearch] = useState("");
  const [showControls, setShowControls] = useState(false);
  const [selectedPhotoFilter, setSelectedPhotoFilter] = useState("All");
  const [selectedSort, setSelectedSort] = useState("Newest");

  const normalizedRoutes = useMemo(() => {
    // First prepare the routes so each one has a reliable images array.
    const preparedRoutes = routes.map((route) => ({
      ...route,
      images: getJourneyImages(route),
    }));

    // Apply search and photo filters before sorting.
    const filteredRoutes = preparedRoutes.filter((route) => {
      const query = search.trim().toLowerCase();

      const matchesSearch =
        !query ||
        route.title?.toLowerCase().includes(query) ||
        route.note?.toLowerCase().includes(query) ||
        getRouteLocationLine(route)?.toLowerCase().includes(query);

      const imageCount = route.images?.length || 0;

      const matchesPhotoFilter =
        selectedPhotoFilter === "All" ||
        (selectedPhotoFilter === "With photos" && imageCount > 0) ||
        (selectedPhotoFilter === "Without photos" && imageCount === 0);

      return matchesSearch && matchesPhotoFilter;
    });

    // Sort the filtered journeys based on the currently selected option.
    const sortedRoutes = [...filteredRoutes].sort((a, b) => {
      if (selectedSort === "Oldest") {
        return (
          new Date(a.endedAt || a.startedAt).getTime() -
          new Date(b.endedAt || b.startedAt).getTime()
        );
      }

      if (selectedSort === "Longest") {
        return Number(b.distanceKm || 0) - Number(a.distanceKm || 0);
      }

      // Newest is the default sort.
      return (
        new Date(b.endedAt || b.startedAt).getTime() -
        new Date(a.endedAt || a.startedAt).getTime()
      );
    });

    return sortedRoutes;
  }, [routes, search, selectedPhotoFilter, selectedSort]);

  // Used to show how many filter or sort options are currently active.
  const activeControlCount =
    (selectedPhotoFilter !== "All" ? 1 : 0) +
    (selectedSort !== "Newest" ? 1 : 0);

  function clearJourneyControls() {
    setSearch("");
    setSelectedPhotoFilter("All");
    setSelectedSort("Newest");
  }

  return (
    <>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <ScreenHeader
          title="Journeys"
          subtitle="Keep the journeys you completed and turn them into memories."
          maxWidth={300}
        />

        <CollectionControls
          search={search}
          onChangeSearch={setSearch}
          searchPlaceholder="Search journeys"
          showControls={showControls}
          onToggleControls={() => setShowControls((current) => !current)}
          activeCount={activeControlCount}
          hasActiveControls={search.trim().length > 0 || activeControlCount > 0}
          onClear={clearJourneyControls}
          summary={`Showing ${normalizedRoutes.length} of ${routes.length} journeys`}
          toggleAccessibilityLabel="Open journey filters and sorting"
          sections={[
            {
              key: "photos",
              title: "Photos",
              options: ["All", "With photos", "Without photos"],
              selectedValue: selectedPhotoFilter,
              onSelect: setSelectedPhotoFilter,
            },
            {
              key: "sort",
              title: "Sort by",
              options: ["Newest", "Oldest", "Longest"],
              selectedValue: selectedSort,
              onSelect: setSelectedSort,
            },
          ]}
        />

        {normalizedRoutes.length === 0 ? (
          <EmptyStateCard
            icon="trail-sign-outline"
            title="No routes yet"
            text="Finish a live trip and save it to keep your routes here."
          />
        ) : (
          normalizedRoutes.map((route) => {
            const routeLocationLine = getRouteLocationLine(route);
            const journeyImages = route.images || [];
            const snapshotUri = route.snapshotUri || null;
            const imageCount = journeyImages.length;

            return (
              <View key={route.id} style={styles.journeyCard}>
                {/* Pressing the main card area opens the full journey preview */}
                <Pressable
                  style={styles.journeyMain}
                  onPress={() => setPreviewRoute(route)}
                >
                  <View style={styles.heroWrap}>
                    {snapshotUri ? (
                      // Show the saved route snapshot when it exists.
                      <Image
                        source={{ uri: snapshotUri }}
                        style={styles.heroImage}
                      />
                    ) : (
                      // Fallback shown when no snapshot has been saved for this journey.
                      <View style={styles.heroFallback}>
                        <Ionicons
                          name="trail-sign-outline"
                          size={28}
                          color={colors.textSecondary}
                        />
                        <Text style={styles.heroFallbackText}>
                          No route snapshot yet
                        </Text>
                      </View>
                    )}

                    {/* Quick summary pills placed over the image area */}
                    <View style={styles.heroBadgeRow}>
                      <InfoPill
                        icon="navigate-outline"
                        variant="accent"
                        label={formatDistanceKm(Number(route.distanceKm || 0))}
                        style={styles.heroBadgeItem}
                      />

                      <InfoPill
                        icon="clock"
                        iconSet="feather"
                        variant="accent"
                        label={formatDuration(Number(route.durationMinutes || 0))}
                        style={styles.heroBadgeItem}
                      />

                      {imageCount > 0 ? (
                        <InfoPill
                          icon="images-outline"
                          variant="accent"
                          label={`${imageCount} photo${imageCount === 1 ? "" : "s"}`}
                          onPress={() => setPreviewRoute(route)}
                          accessibilityLabel={`Open ${imageCount} photos for ${route.title}`}
                          style={styles.heroBadgeItem}
                        />
                      ) : null}
                    </View>
                  </View>

                  <View style={styles.journeyTopRow}>
                    <View style={styles.journeyTitleWrap}>
                      <Text style={styles.journeyTitle}>{route.title}</Text>

                      {/* Only show the location line when route location data exists */}
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

                  {/* Extra route details repeated below the note for quick scanning */}
                  <View style={styles.journeyMetaRow}>
                    <InfoPill
                      icon="navigate-outline"
                      label={formatDistanceKm(Number(route.distanceKm || 0))}
                      style={styles.metaPillItem}
                    />

                    <InfoPill
                      icon="clock"
                      iconSet="feather"
                      label={formatDuration(Number(route.durationMinutes || 0))}
                      style={styles.metaPillItem}
                    />
                  </View>
                </Pressable>

                {/* Row of direct actions for editing, adding photos, or deleting */}
                <View style={styles.journeyActionRow}>
                  <Pressable
                    style={styles.secondaryAction}
                    onPress={() => onEditRoute(route)}
                  >
                    <Feather
                      name="edit-2"
                      size={14}
                      color={colors.textSecondary}
                      style={styles.actionIcon}
                    />
                    <Text style={styles.secondaryActionText}>Edit</Text>
                  </Pressable>

                  <Pressable
                    style={styles.secondaryAction}
                    onPress={() => onAddJourneyPhotos?.(route)}
                  >
                    <Ionicons
                      name="images-outline"
                      size={15}
                      color={colors.textSecondary}
                      style={styles.actionIcon}
                    />
                    <Text style={styles.secondaryActionText}>Add photos</Text>
                  </Pressable>

                  <Pressable
                    style={styles.dangerAction}
                    onPress={() => onRemoveRoute(route.id)}
                  >
                    <Feather
                      name="trash-2"
                      size={14}
                      color={colors.textSecondary}
                      style={styles.actionIcon}
                    />
                    <Text style={styles.dangerActionText}>Delete</Text>
                  </Pressable>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Separate modal used to preview the currently selected route */}
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
  journeyCard: {
    backgroundColor: colors.surface,
    borderRadius: 28,
    marginBottom: spacing.lg,
    overflow: "hidden",
  },
  journeyMain: {
    minWidth: 0,
  },
  heroWrap: {
    height: 196,
    backgroundColor: colors.surfaceAlt,
    position: "relative",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroFallback: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
  },
  heroFallbackText: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 8,
    textAlign: "center",
  },
  heroBadgeRow: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  heroBadgeItem: {
    marginRight: spacing.sm,
    marginBottom: spacing.xs,
  },
  journeyTopRow: {
    paddingHorizontal: 18,
    paddingTop: 18,
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
    paddingHorizontal: 18,
  },
  journeyMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: spacing.md,
    paddingHorizontal: 18,
  },
  metaPillItem: {
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  journeyActionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 18,
    paddingBottom: 18,
    marginTop: 2,
  },
  secondaryAction: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  secondaryActionText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },
  dangerAction: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  dangerActionText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },
  actionIcon: {
    marginRight: 6,
  },
});