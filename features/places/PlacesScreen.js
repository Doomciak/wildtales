import { useMemo, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import MapView, { PROVIDER_GOOGLE } from "react-native-maps";
import * as Network from "expo-network";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import FilterChip from "../../components/ui/FilterChip";
import WildMarker from "../../components/maps/WildMarker";
import PlacePreviewModal from "../../components/modals/PlacePreviewModal";
import { colors, shadows } from "../../constants/theme";
import { radius, screen, spacing } from "../../constants/layout";
import {
  formatDistanceKm,
  getMapRegionForPoints,
  getPlaceLocationText,
} from "../../utils/travel";

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

  const networkState = Network.useNetworkState();
  const isOffline =
    networkState.isConnected === false ||
    networkState.isInternetReachable === false;

  const activeFilterCount =
    (selectedCountry !== "All" ? 1 : 0) + (selectedCity !== "All" ? 1 : 0);

  const mapRegion = useMemo(() => {
    const validMapPlaces = mapPlaces.filter(
      (place) => place.latitude != null && place.longitude != null
    );

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

  const hasValidMapRegion = useMemo(() => {
    return Boolean(
      mapRegion &&
        Number.isFinite(mapRegion.latitude) &&
        Number.isFinite(mapRegion.longitude) &&
        Number.isFinite(mapRegion.latitudeDelta) &&
        Number.isFinite(mapRegion.longitudeDelta)
    );
  }, [mapRegion]);

  const canRenderMap =
    !isOffline && mapPlaces.length > 0 && hasValidMapRegion;

  const mapKey = useMemo(() => {
    return `places-map-${mapPlaces.map((place) => place.id).join("-") || "empty"}`;
  }, [mapPlaces]);

  return (
    <>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.topArea}>
          <Text style={styles.title}>Places</Text>
          <Text style={styles.subtitle}>
            Browse your saved places in a cleaner list, or switch to map view
            when you want the bigger picture.
          </Text>
        </View>

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

        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={18} color="#9fb2a6" />
            <TextInput
              placeholder="Search places"
              placeholderTextColor="#9fb2a6"
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
            />
            {search.trim() ? (
              <Pressable
                onPress={() => setSearch("")}
                style={styles.searchClearButton}
              >
                <Ionicons name="close-circle" size={18} color="#9fb2a6" />
              </Pressable>
            ) : null}
          </View>

          <Pressable
            style={[
              styles.filterToggleButton,
              showFilters && styles.filterToggleButtonActive,
            ]}
            onPress={() => setShowFilters((current) => !current)}
          >
            <Feather
              name="sliders"
              size={18}
              color={showFilters ? colors.textDark : colors.textSecondary}
            />

            {activeFilterCount > 0 ? (
              <View style={styles.filterCountBadge}>
                <Text style={styles.filterCountText}>{activeFilterCount}</Text>
              </View>
            ) : null}
          </Pressable>
        </View>

        {showFilters ? (
          <View style={styles.filtersDropdown}>
            <View style={styles.filtersHeader}>
              <Text style={styles.filtersTitle}>Filters</Text>

              {hasActiveFilters ? (
                <Pressable
                  style={styles.clearFiltersButton}
                  onPress={onClearFilters}
                >
                  <Text style={styles.clearFiltersText}>Clear</Text>
                </Pressable>
              ) : null}
            </View>

            <Text style={styles.filterLabel}>Country</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filtersRow}
            >
              {countries.map((item) => (
                <FilterChip
                  key={`country-${item}`}
                  label={item}
                  active={selectedCountry === item}
                  onPress={() => onSelectCountry(item)}
                />
              ))}
            </ScrollView>

            <Text style={styles.filterLabel}>City</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filtersRow}
            >
              {cities.map((item) => (
                <FilterChip
                  key={`city-${item}`}
                  label={item}
                  active={selectedCity === item}
                  onPress={() => onSelectCity(item)}
                />
              ))}
            </ScrollView>

            <Text style={styles.filterSummary}>
              Showing {places.length} of {totalPlaces} places
            </Text>
          </View>
        ) : null}

        {viewMode === "map" ? (
          mapPlaces.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconWrap}>
                <Ionicons
                  name="map-outline"
                  size={24}
                  color={colors.textSecondary}
                />
              </View>
              <Text style={styles.emptyTitle}>No map points yet</Text>
              <Text style={styles.emptyText}>
                Save a place with location and it will appear here.
              </Text>
            </View>
          ) : !canRenderMap ? (
            <>
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

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.mapCardsRow}
              >
                {mapPlaces.map((place) => (
                  <View key={place.id} style={styles.mapPlaceCard}>
                    <Pressable onPress={() => setPreviewPlace(place)}>
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
                      <Pressable
                        style={styles.mapPlaceActionPrimary}
                        onPress={() => setPreviewPlace(place)}
                      >
                        <Feather name="eye" size={13} color={colors.textDark} />
                        <Text style={styles.mapPlaceActionTextDark}>Open</Text>
                      </Pressable>

                      <Pressable
                        style={styles.mapPlaceActionGhost}
                        onPress={() => onEditPlace(place)}
                      >
                        <Feather
                          name="edit-2"
                          size={13}
                          color={colors.textSecondary}
                        />
                        <Text style={styles.mapPlaceActionTextLight}>Edit</Text>
                      </Pressable>

                      <Pressable
                        style={styles.mapPlaceActionDelete}
                        onPress={() => onRemovePlace(place.id)}
                      >
                        <Feather
                          name="trash-2"
                          size={13}
                          color={colors.textSecondary}
                        />
                      </Pressable>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </>
          ) : (
            <>
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

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.mapCardsRow}
              >
                {mapPlaces.map((place) => (
                  <View key={place.id} style={styles.mapPlaceCard}>
                    <Pressable onPress={() => setPreviewPlace(place)}>
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
                      <Pressable
                        style={styles.mapPlaceActionPrimary}
                        onPress={() => setPreviewPlace(place)}
                      >
                        <Feather name="eye" size={13} color={colors.textDark} />
                        <Text style={styles.mapPlaceActionTextDark}>Open</Text>
                      </Pressable>

                      <Pressable
                        style={styles.mapPlaceActionGhost}
                        onPress={() => onEditPlace(place)}
                      >
                        <Feather
                          name="edit-2"
                          size={13}
                          color={colors.textSecondary}
                        />
                        <Text style={styles.mapPlaceActionTextLight}>Edit</Text>
                      </Pressable>

                      <Pressable
                        style={styles.mapPlaceActionDelete}
                        onPress={() => onRemovePlace(place.id)}
                      >
                        <Feather
                          name="trash-2"
                          size={13}
                          color={colors.textSecondary}
                        />
                      </Pressable>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </>
          )
        ) : places.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconWrap}>
              <MaterialCommunityIcons
                name="map-marker-path"
                size={24}
                color={colors.textSecondary}
              />
            </View>
            <Text style={styles.emptyTitle}>No places found</Text>
            <Text style={styles.emptyText}>
              Try another search, change filters, or add a new place.
            </Text>
          </View>
        ) : (
          places.map((place) => {
            const placeLocationText = getPlaceLocationText(place);
            const hasLiveRoute =
              !!activeRouteLink && activeRouteLink.placeId === place.id;

            return (
              <View key={place.id} style={styles.placeListCard}>
                {place.coverImage ? (
                  <Image
                    source={{ uri: place.coverImage }}
                    style={styles.placeListImage}
                  />
                ) : (
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

                  <View style={styles.placeListPills}>
                    {place.images?.length > 1 ? (
                      <View style={styles.placeListPill}>
                        <Feather
                          name="image"
                          size={12}
                          color={colors.textSecondary}
                        />
                        <Text style={styles.placeListPillText}>
                          {place.images.length} photos
                        </Text>
                      </View>
                    ) : null}

                    {hasLiveRoute && activeRouteLink ? (
                      <View style={styles.placeListLivePill}>
                        <Ionicons
                          name="navigate"
                          size={12}
                          color={colors.textDark}
                        />
                        <Text style={styles.placeListLivePillText}>
                          {formatDistanceKm(activeRouteLink.totalDistanceKm)}
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  <View style={styles.placeListActions}>
                    <Pressable
                      style={styles.placePrimaryAction}
                      onPress={() => setPreviewPlace(place)}
                    >
                      <Feather name="eye" size={14} color={colors.textDark} />
                      <Text style={styles.placePrimaryActionText}>Preview</Text>
                    </Pressable>

                    <Pressable
                      style={styles.placeSecondaryAction}
                      onPress={() => onEditPlace(place)}
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
                      onPress={() => onRemovePlace(place.id)}
                    >
                      <Feather
                        name="trash-2"
                        size={14}
                        color={colors.textSecondary}
                      />
                    </Pressable>
                  </View>
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
    maxWidth: 320,
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
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: 4,
    marginRight: 10,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 15,
    height: 48,
    marginLeft: 10,
  },
  searchClearButton: {
    marginLeft: spacing.sm,
  },
  filterToggleButton: {
    width: 54,
    height: 54,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  filterToggleButtonActive: {
    backgroundColor: colors.accent,
    ...shadows.tabActive,
  },
  filterCountBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.accent,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  filterCountText: {
    color: colors.textDark,
    fontSize: 10,
    fontWeight: "700",
  },
  filtersDropdown: {
    backgroundColor: "#142B20",
    borderRadius: radius.xxxl,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  filtersHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  filtersTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "700",
  },
  clearFiltersButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  clearFiltersText: {
    color: colors.textDark,
    fontSize: 12,
    fontWeight: "700",
  },
  filterLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    marginBottom: spacing.sm,
  },
  filtersRow: {
    paddingRight: spacing.sm,
    marginBottom: spacing.md,
  },
  filterSummary: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
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
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    marginTop: 14,
  },
  mapPlaceActionPrimary: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  mapPlaceActionGhost: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  mapPlaceActionDelete: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  mapPlaceActionTextDark: {
    color: colors.textDark,
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 6,
  },
  mapPlaceActionTextLight: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 6,
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
  placeListCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxxl,
    padding: 14,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    overflow: "hidden",
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
    marginBottom: 10,
  },
  placeListPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: spacing.sm,
    marginBottom: 6,
  },
  placeListPillText: {
    color: colors.textSecondary,
    fontSize: 12,
    marginLeft: 6,
    fontWeight: "600",
  },
  placeListLivePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: spacing.sm,
    marginBottom: 6,
  },
  placeListLivePillText: {
    color: colors.textDark,
    fontSize: 12,
    marginLeft: 6,
    fontWeight: "700",
  },
  placeListActions: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
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
});