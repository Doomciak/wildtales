import { useMemo, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MapView, { PROVIDER_GOOGLE } from "react-native-maps";
import * as Network from "expo-network";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import WildMarker from "../../components/maps/WildMarker";
import PlacePreviewModal from "../../components/modals/PlacePreviewModal";
import ActionIconButton from "../../components/ui/ActionIconButton";
import CollectionControls from "../../components/ui/CollectionControls";
import EmptyStateCard from "../../components/ui/EmptyStateCard";
import InfoPill from "../../components/ui/InfoPill";
import ScreenHeader from "../../components/ui/ScreenHeader";
import { colors } from "../../constants/theme";
import { radius, screen, spacing } from "../../constants/layout";
import {
  formatDistanceKm,
  getMapRegionForPoints,
  getPlaceLocationText,
} from "../../utils/travel";

// Screen for browsing saved places either as a list or on the map.
export default function PlacesScreen({
  places,
  totalPlaces,
  mapPlaces,
  search,
  setSearch,
  onRemovePlace,
  onEditPlace,
  countries,
  cities,
  selectedCountry,
  selectedCity,
  onSelectCountry,
  onSelectCity,
  onClearFilters,
  hasActiveFilters,
  activeRouteLink,
}) {
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState("list");
  const [previewPlace, setPreviewPlace] = useState(null);

  // Use network state to decide whether the map can be shown safely.
  const networkState = Network.useNetworkState();
  const isOffline =
    networkState.isConnected === false ||
    networkState.isInternetReachable === false;

  // Count how many filters are currently different from their default values.
  const activeFilterCount =
    (selectedCountry !== "All" ? 1 : 0) + (selectedCity !== "All" ? 1 : 0);

  const mapRegion = useMemo(() => {
    // Only keep places that actually have coordinates.
    const validMapPlaces = mapPlaces.filter(
      (place) => place.latitude != null && place.longitude != null
    );

    // Use the first valid place as a fallback focus point when needed.
    const fallbackPoint =
      validMapPlaces[0] &&
      validMapPlaces[0].latitude != null &&
      validMapPlaces[0].longitude != null
        ? {
            latitude: Number(validMapPlaces[0].latitude),
            longitude: Number(validMapPlaces[0].longitude),
          }
        : null;

    const points = validMapPlaces.map((place) => ({
      latitude: Number(place.latitude),
      longitude: Number(place.longitude),
    }));

    return getMapRegionForPoints(points, fallbackPoint);
  }, [mapPlaces]);

  // Extra check before trying to mount the map.
  const hasValidMapRegion = useMemo(() => {
    return Boolean(
      mapRegion &&
        Number.isFinite(mapRegion.latitude) &&
        Number.isFinite(mapRegion.longitude) &&
        Number.isFinite(mapRegion.latitudeDelta) &&
        Number.isFinite(mapRegion.longitudeDelta)
    );
  }, [mapRegion]);

  // Only render the map when the device is online and the region is usable.
  const canRenderMap = !isOffline && mapPlaces.length > 0 && hasValidMapRegion;

  // Change the map key when markers change so the map can remount cleanly.
  const mapKey = useMemo(() => {
    return `places-map-${mapPlaces.map((place) => place.id).join("-") || "empty"}`;
  }, [mapPlaces]);

  return (
    <>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <ScreenHeader
          title="Places"
          subtitle="Browse your saved memories, open them quickly, or explore them on the map."
        />

        <View style={styles.segmentWrap}>
          <Pressable
            style={[
              styles.segmentButton,
              viewMode === "list" && styles.segmentButtonActive,
            ]}
            onPress={() => setViewMode("list")}
          >
            <Ionicons
              name="list-outline"
              size={16}
              color={
                viewMode === "list" ? colors.textDark : colors.textSecondary
              }
            />
            <Text
              style={[
                styles.segmentText,
                viewMode === "list" && styles.segmentTextActive,
              ]}
            >
              List
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.segmentButton,
              viewMode === "map" && styles.segmentButtonActive,
            ]}
            onPress={() => setViewMode("map")}
          >
            <Ionicons
              name="map-outline"
              size={16}
              color={
                viewMode === "map" ? colors.textDark : colors.textSecondary
              }
            />
            <Text
              style={[
                styles.segmentText,
                viewMode === "map" && styles.segmentTextActive,
              ]}
            >
              Map
            </Text>
          </Pressable>
        </View>

        <CollectionControls
          search={search}
          onChangeSearch={setSearch}
          searchPlaceholder="Search places"
          showControls={showFilters}
          onToggleControls={() => setShowFilters((current) => !current)}
          activeCount={activeFilterCount}
          hasActiveControls={hasActiveFilters}
          onClear={onClearFilters}
          summary={`Showing ${places.length} of ${totalPlaces} places`}
          toggleAccessibilityLabel="Open place filters and sorting"
          sections={[
            {
              key: "country",
              title: "Country",
              options: countries,
              selectedValue: selectedCountry,
              onSelect: onSelectCountry,
            },
            {
              key: "city",
              title: "City",
              options: cities,
              selectedValue: selectedCity,
              onSelect: onSelectCity,
            },
          ]}
        />

        {viewMode === "map" ? (
          mapPlaces.length === 0 ? (
            <EmptyStateCard
              icon="map-outline"
              title="No map points yet"
              text="Save a place with location and it will appear here."
            />
          ) : !canRenderMap ? (
            <>
              {/* Fall back to an offline message when map data exists but the map cannot be used. */}
              <View style={styles.offlineMapCard}>
                <Ionicons
                  name="cloud-offline-outline"
                  size={20}
                  color={colors.textMuted}
                />
                <Text style={styles.offlineMapTitle}>Map unavailable offline</Text>
                <Text style={styles.offlineMapText}>
                  This feature does not work offline right now. Your saved
                  places, notes, and photos still work on this device.
                </Text>
              </View>

              {/* Keep place cards available so previews still work without the map. */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.mapCardsRow}
              >
                {mapPlaces.map((place) => (
                  <View key={place.id} style={styles.mapPlaceCard}>
                    <Pressable
                      style={styles.mapPlaceMain}
                      onPress={() => setPreviewPlace(place)}
                    >
                      <Text style={styles.mapPlaceTitle}>{place.title}</Text>

                      {getPlaceLocationText(place) ? (
                        <Text style={styles.mapPlaceName}>
                          {getPlaceLocationText(place)}
                        </Text>
                      ) : null}

                      <Text style={styles.mapPlaceNote} numberOfLines={2}>
                        {place.note}
                      </Text>
                    </Pressable>

                    <View style={styles.mapPlaceActions}>
                      <ActionIconButton
                        icon="edit-2"
                        onPress={() => onEditPlace(place)}
                        accessibilityLabel={`Edit ${place.title}`}
                      />

                      <ActionIconButton
                        icon="trash-2"
                        onPress={() => onRemovePlace(place.id)}
                        accessibilityLabel={`Delete ${place.title}`}
                        variant="danger"
                        style={styles.mapActionButton}
                      />
                    </View>
                  </View>
                ))}
              </ScrollView>
            </>
          ) : (
            <>
              {/* Show markers for every place that has valid coordinates. */}
              <View style={styles.mapWrapLarge}>
                <MapView
                  key={mapKey}
                  provider={PROVIDER_GOOGLE}
                  style={styles.map}
                  initialRegion={mapRegion}
                >
                  {mapPlaces.map((place) => (
                    <WildMarker
                      key={place.id}
                      coordinate={{
                        latitude: Number(place.latitude),
                        longitude: Number(place.longitude),
                      }}
                      title={place.title}
                      description={place.note}
                      size={30}
                      onPress={() => setPreviewPlace(place)}
                    />
                  ))}
                </MapView>
              </View>

              {/* Keep matching cards below the map for quick preview and actions. */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.mapCardsRow}
              >
                {mapPlaces.map((place) => (
                  <View key={place.id} style={styles.mapPlaceCard}>
                    <Pressable
                      style={styles.mapPlaceMain}
                      onPress={() => setPreviewPlace(place)}
                    >
                      <Text style={styles.mapPlaceTitle}>{place.title}</Text>

                      {getPlaceLocationText(place) ? (
                        <Text style={styles.mapPlaceName}>
                          {getPlaceLocationText(place)}
                        </Text>
                      ) : null}

                      <Text style={styles.mapPlaceNote} numberOfLines={2}>
                        {place.note}
                      </Text>
                    </Pressable>

                    <View style={styles.mapPlaceActions}>
                      <ActionIconButton
                        icon="edit-2"
                        onPress={() => onEditPlace(place)}
                        accessibilityLabel={`Edit ${place.title}`}
                      />

                      <ActionIconButton
                        icon="trash-2"
                        onPress={() => onRemovePlace(place.id)}
                        accessibilityLabel={`Delete ${place.title}`}
                        variant="danger"
                        style={styles.mapActionButton}
                      />
                    </View>
                  </View>
                ))}
              </ScrollView>
            </>
          )
        ) : places.length === 0 ? (
          <EmptyStateCard
            icon="map-marker-path"
            iconSet="material-community"
            title="No places found"
            text="Try another search, change filters, or add a new place."
          />
        ) : (
          places.map((place) => {
            const placeLocationText = getPlaceLocationText(place);
            const hasLiveRoute =
              !!activeRouteLink && activeRouteLink.placeId === place.id;

            return (
              <View key={place.id} style={styles.placeListCard}>
                {/* Main card press opens the full place preview */}
                <Pressable
                  style={styles.placeListMain}
                  onPress={() => setPreviewPlace(place)}
                >
                  {place.coverImage ? (
                    <Image
                      source={{ uri: place.coverImage }}
                      style={styles.placeListImage}
                    />
                  ) : (
                    // If no image exist, use the first letter of the place title as a fallback.
                    <View style={[styles.placeListImage, styles.placeListFallback]}>
                      <Text style={styles.placeListLetter}>
                        {String(place.title).charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}

                  <View style={styles.placeListBody}>
                    <Text style={styles.placeListTitle} numberOfLines={1}>
                      {place.title}
                    </Text>

                    {placeLocationText ? (
                      <View style={styles.inlineRowNoMargin}>
                        <Ionicons
                          name="location-outline"
                          size={13}
                          color={colors.textMuted}
                        />
                        <Text style={styles.placeListMeta} numberOfLines={1}>
                          {placeLocationText}
                        </Text>
                      </View>
                    ) : null}

                    <Text style={styles.placeListNote} numberOfLines={2}>
                      {place.note}
                    </Text>

                    {/* Show a few compact pills for photos or linked live route info. */}
                    <View style={styles.placeListPills}>
                      {place.images?.length > 0 ? (
                        <InfoPill
                          icon="image"
                          iconSet="feather"
                          label={`${place.images.length} photo${
                            place.images.length === 1 ? "" : "s"
                          }`}
                          onPress={() => setPreviewPlace(place)}
                          accessibilityLabel={`Open ${place.images.length} photos for ${place.title}`}
                          style={styles.placePillItem}
                        />
                      ) : null}

                      {hasLiveRoute && activeRouteLink ? (
                        <InfoPill
                          icon="navigate"
                          label={formatDistanceKm(activeRouteLink.totalDistanceKm)}
                          variant="accent"
                          style={styles.placePillItem}
                        />
                      ) : null}
                    </View>
                  </View>
                </Pressable>

                <View style={styles.placeListActions}>
                  <ActionIconButton
                    icon="edit-2"
                    onPress={() => onEditPlace(place)}
                    accessibilityLabel={`Edit ${place.title}`}
                  />

                  <ActionIconButton
                    icon="trash-2"
                    onPress={() => onRemovePlace(place.id)}
                    accessibilityLabel={`Delete ${place.title}`}
                    variant="danger"
                    style={styles.placeActionButton}
                  />
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      <PlacePreviewModal
        place={previewPlace}
        onClose={() => setPreviewPlace(null)}
        onEditPlace={onEditPlace}
        onDeletePlace={onRemovePlace}
        activeRouteLink={activeRouteLink}
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
  segmentWrap: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: 6,
    marginBottom: spacing.lg,
  },
  segmentButton: {
    flex: 1,
    borderRadius: radius.md,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  segmentButtonActive: {
    backgroundColor: colors.accent,
  },
  segmentText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
  segmentTextActive: {
    color: colors.textDark,
    fontWeight: "700",
  },
  mapWrapLarge: {
    height: 390,
    borderRadius: 28,
    overflow: "hidden",
    marginBottom: spacing.lg,
  },
  map: {
    width: "100%",
    height: "100%",
  },
  offlineMapCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxxl,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  offlineMapTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "700",
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  offlineMapText: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
  },
  mapCardsRow: {
    paddingRight: spacing.sm,
  },
  mapPlaceCard: {
    width: 236,
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: 18,
    marginRight: spacing.md,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "stretch",
  },
  mapPlaceMain: {
    flex: 1,
    minWidth: 0,
  },
  mapPlaceTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },
  mapPlaceName: {
    color: colors.textSecondary,
    fontSize: 13,
    marginBottom: 6,
  },
  mapPlaceNote: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  mapPlaceActions: {
    alignSelf: "stretch",
    justifyContent: "center",
    marginLeft: spacing.sm,
  },
  mapActionButton: {
    marginTop: spacing.sm,
  },
  placeListCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxxl,
    padding: 14,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    overflow: "hidden",
  },
  placeListMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    minWidth: 0,
  },
  placeListImage: {
    width: 108,
    height: 108,
    borderRadius: radius.xl,
    marginRight: 14,
  },
  placeListFallback: {
    backgroundColor: "#29463A",
    alignItems: "center",
    justifyContent: "center",
  },
  placeListLetter: {
    color: colors.textPrimary,
    fontSize: 30,
    fontWeight: "700",
  },
  placeListBody: {
    flex: 1,
    minWidth: 0,
  },
  placeListTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: spacing.xs,
  },
  inlineRowNoMargin: {
    flexDirection: "row",
    alignItems: "center",
  },
  placeListMeta: {
    color: colors.textMuted,
    fontSize: 12,
    marginLeft: 6,
    marginBottom: 6,
    flexShrink: 1,
  },
  placeListNote: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 10,
  },
  placeListPills: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 4,
  },
  placePillItem: {
    marginRight: spacing.sm,
    marginBottom: 6,
  },
  placeListActions: {
    alignSelf: "stretch",
    justifyContent: "center",
    marginLeft: spacing.sm,
  },
  placeActionButton: {
    marginTop: spacing.sm,
  },
});