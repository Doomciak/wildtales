import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MapView, { Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import * as Network from "expo-network";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import WildMarker from "../../components/maps/WildMarker";
import InfoPill from "../../components/ui/InfoPill";
import ScreenHeader from "../../components/ui/ScreenHeader";
import { colors } from "../../constants/theme";
import { radius, screen, spacing } from "../../constants/layout";
import {
  ROUTE_LINE_COLOR,
  formatDistanceKm,
  formatDuration,
} from "../../utils/travel";
import useSafetyTrip from "./logic/useSafetyTrip";

// Screen for safety tracking, trip controls, and recent location logs.
export default function SafetyScreen({ onTripFinished }) {
  const {
    contact,
    tripActive,
    tripId,
    retryingUploads,
    updatesMessage,
    routeCoords,
    liveRegion,
    routeDistanceKm,
    routeDurationMinutes,
    latestPlaceName,
    visibleLogs,
    latestRoutePoint,
    smsFallbackTestActive,

    chooseContact,
    startTrip,
    stopTrip,
    retryPendingUploads,
    sendLatestLocationSms,
    triggerSmsFallbackTest,
    getShortStatus,
    getStatusIcon,
  } = useSafetyTrip({ onTripFinished });

  const networkState = Network.useNetworkState();
  const isOffline =
    networkState.isConnected === false ||
    networkState.isInternetReachable === false;

  const mapRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);

  // Check whether the live map region contains valid numeric values.
  const hasValidRegion = useMemo(() => {
    return Boolean(
      liveRegion &&
        Number.isFinite(liveRegion.latitude) &&
        Number.isFinite(liveRegion.longitude) &&
        Number.isFinite(liveRegion.latitudeDelta) &&
        Number.isFinite(liveRegion.longitudeDelta) &&
        liveRegion.latitudeDelta > 0 &&
        liveRegion.longitudeDelta > 0
    );
  }, [liveRegion]);

  // Only show the map when route data, the latest point, and region values are ready.
  const canRenderMap =
    routeCoords.length > 0 && latestRoutePoint && hasValidRegion;

  // Only draw a route line when there is more than one point.
  const hasRouteLine = routeCoords.length > 1;

  useEffect(() => {
    if (!canRenderMap || !mapRef.current || !mapReady) {
      return;
    }

    // Refit the map after it becomes ready so the full route stays visible.
    const frameId = requestAnimationFrame(() => {
      if (routeCoords.length > 1) {
        mapRef.current?.fitToCoordinates(routeCoords, {
          edgePadding: {
            top: 60,
            right: 60,
            bottom: 60,
            left: 60,
          },
          animated: true,
        });
        return;
      }

      // Fall back to a simple region animation when there is only one point.
      mapRef.current?.animateToRegion(liveRegion, 400);
    });

    return () => cancelAnimationFrame(frameId);
  }, [canRenderMap, routeCoords, mapReady, tripId, liveRegion]);

  useEffect(() => {
    // Reset map readiness when the route can no longer be displayed.
    if (!canRenderMap) {
      setMapReady(false);
    }
  }, [canRenderMap]);

  // Capture a route snapshot before stopping the trip.
  async function handleStopTripPress() {
    let snapshotUri = null;

    try {
      // Save a snapshot file from the current map view when available.
      if (canRenderMap && mapReady && mapRef.current?.takeSnapshot) {
        snapshotUri = await mapRef.current.takeSnapshot({
          width: 1200,
          height: 800,
          format: "png",
          quality: 1,
          result: "file",
        });
      }
    } catch (error) {
      console.log("Route snapshot error:", error);
    }

    await stopTrip({ snapshotUri });
  }

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      <ScreenHeader
        title="Safety"
        subtitle="Track your trip, keep route updates, and send help faster if needed."
        maxWidth={300}
      />

      <View style={styles.card}>
        <View style={styles.cardTitleRow}>
          <Ionicons
            name="people-outline"
            size={18}
            color={colors.textPrimary}
          />
          <Text style={styles.cardTitle}>Safety contact</Text>
        </View>

        {contact ? (
          <>
            <Text style={styles.mainText}>{contact.name}</Text>
            <Text style={styles.subText}>{contact.phone}</Text>
          </>
        ) : (
          <Text style={styles.subText}>No contact selected yet.</Text>
        )}

        <Pressable style={styles.primaryButton} onPress={chooseContact}>
          <View style={styles.buttonContent}>
            <Ionicons
              name="person-add-outline"
              size={16}
              color={colors.textDark}
            />
            <Text style={styles.primaryButtonText}>
              {contact ? "Change contact" : "Choose contact"}
            </Text>
          </View>
        </Pressable>
      </View>

      <View style={styles.card}>
        <View style={styles.cardTitleRow}>
          <Ionicons
            name="shield-checkmark-outline"
            size={18}
            color={colors.textPrimary}
          />
          <Text style={styles.cardTitle}>Trip status</Text>
        </View>

        <View style={styles.statusRow}>
          <View
            style={[
              styles.tripStatusPill,
              tripActive
                ? styles.tripStatusPillActive
                : styles.tripStatusPillInactive,
            ]}
          >
            <View
              style={[
                styles.tripStatusDot,
                tripActive
                  ? styles.tripStatusDotActive
                  : styles.tripStatusDotInactive,
              ]}
            />
            <Text
              style={[
                styles.tripStatusText,
                tripActive
                  ? styles.tripStatusTextActive
                  : styles.tripStatusTextInactive,
              ]}
            >
              {tripActive ? "Trip is active" : "Trip is not active"}
            </Text>
          </View>
        </View>

        {isOffline ? (
          <View style={styles.offlineInfoBox}>
            <Ionicons
              name="cloud-offline-outline"
              size={14}
              color={colors.textSecondary}
              style={styles.statusIcon}
            />
            <Text style={styles.offlineInfoText}>
              Signal is weak or offline right now. Route points still save on
              this device and online updates will retry when connection returns.
            </Text>
          </View>
        ) : null}

        <View style={styles.row}>
          <Pressable
            style={[
              styles.primaryButtonSmall,
              tripActive && styles.disabledButton,
            ]}
            onPress={startTrip}
            disabled={tripActive}
          >
            <View style={styles.buttonContent}>
              <Ionicons name="play-outline" size={16} color={colors.textDark} />
              <Text style={styles.primaryButtonText}>Start trip</Text>
            </View>
          </Pressable>

          <Pressable
            style={[
              styles.secondaryButtonSmall,
              !tripActive && styles.disabledButtonDark,
            ]}
            onPress={handleStopTripPress}
            disabled={!tripActive}
          >
            <View style={styles.buttonContent}>
              <Ionicons
                name="stop-outline"
                size={16}
                color={colors.textSecondary}
              />
              <Text style={styles.secondaryButtonText}>Stop trip</Text>
            </View>
          </Pressable>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardTitleRow}>
          <Ionicons name="map-outline" size={18} color={colors.textPrimary} />
          <Text style={styles.cardTitle}>Live route</Text>
        </View>

        {routeCoords.length === 0 ? (
          <Text style={styles.subText}>
            No tracked route yet. Start a trip and let the app record location.
          </Text>
        ) : canRenderMap ? (
          <>
            <View style={styles.mapWrap}>
              <MapView
                key={`live-route-${tripId || "none"}`}
                ref={mapRef}
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                initialRegion={liveRegion}
                onMapReady={() => setMapReady(true)}
              >
                {hasRouteLine ? (
                  <Polyline
                    coordinates={routeCoords}
                    strokeColor={ROUTE_LINE_COLOR}
                    strokeWidth={4}
                  />
                ) : null}

                {latestRoutePoint ? (
                  <WildMarker
                    coordinate={latestRoutePoint}
                    title="Latest location"
                    description="Most recent tracked point"
                    size={34}
                  />
                ) : null}
              </MapView>
            </View>

            {isOffline ? (
              <View style={styles.offlineInfoBox}>
                <Ionicons
                  name="cloud-offline-outline"
                  size={14}
                  color={colors.textSecondary}
                  style={styles.statusIcon}
                />
                <Text style={styles.offlineInfoText}>
                  The route is still being recorded. If map tiles do not load,
                  your line and latest point will appear properly again when
                  signal returns.
                </Text>
              </View>
            ) : null}

            <View style={styles.statsRow}>
              <InfoPill
                icon="location-outline"
                label={latestPlaceName}
                fullWidth
                numberOfLines={1}
                style={styles.statPillWide}
              />

              <InfoPill
                icon="navigate-outline"
                label={formatDistanceKm(routeDistanceKm)}
                style={styles.statPillItem}
              />

              <InfoPill
                icon="clock"
                iconSet="feather"
                label={formatDuration(routeDurationMinutes)}
                style={styles.statPillItem}
              />
            </View>
          </>
        ) : (
          <>
            {/* Fall back while route data exists but the live map is still getting ready. */}
            <View style={styles.offlineMapCard}>
              <Ionicons
                name="locate-outline"
                size={18}
                color={colors.textMuted}
              />
              <Text style={styles.offlineMapTitle}>Preparing live route</Text>
              <Text style={styles.offlineMapText}>
                The app has route data, but the map is still getting ready.
                Keep walking for a few seconds and it should appear.
              </Text>
            </View>

            <View style={styles.statsRow}>
              <InfoPill
                icon="location-outline"
                label={latestPlaceName}
                fullWidth
                numberOfLines={1}
                style={styles.statPillWide}
              />

              <InfoPill
                icon="navigate-outline"
                label={formatDistanceKm(routeDistanceKm)}
                style={styles.statPillItem}
              />

              <InfoPill
                icon="clock"
                iconSet="feather"
                label={formatDuration(routeDurationMinutes)}
                style={styles.statPillItem}
              />
            </View>
          </>
        )}
      </View>

      <View style={styles.card}>
        <View style={styles.cardTitleRow}>
          <MaterialCommunityIcons
            name="send-circle-outline"
            size={18}
            color={colors.textPrimary}
          />
          <Text style={styles.cardTitle}>Updates</Text>
        </View>

        <Text style={styles.subText}>
          The app will first try to send your safety update online. If that does not
          work after a few tries or after waiting a little while, it can open a text
          message with your latest saved location instead.
        </Text>

        <Text style={styles.subText}>
          The test button below uses a short 20 second timer only for testing.
        </Text>

        <View style={styles.updatesButtonsColumn}>
          <Pressable
            style={[
              styles.primaryButtonFull,
              retryingUploads && styles.disabledButton,
            ]}
            onPress={retryPendingUploads}
            disabled={retryingUploads}
          >
            <View style={styles.buttonContent}>
              {/* Swap the icon for a loader while uploads are retrying. */}
              {retryingUploads ? (
                <ActivityIndicator size="small" color={colors.textDark} />
              ) : (
                <Ionicons
                  name="refresh-outline"
                  size={16}
                  color={colors.textDark}
                />
              )}
              <Text style={styles.primaryButtonText}>
                {retryingUploads ? "Retrying..." : "Retry online update"}
              </Text>
            </View>
          </Pressable>

          <Pressable
            style={[
              styles.secondaryButtonFull,
              smsFallbackTestActive && styles.disabledButtonDark,
            ]}
            onPress={triggerSmsFallbackTest}
            disabled={smsFallbackTestActive}
          >
            <View style={styles.buttonContent}>
              <Ionicons
                name="beaker-outline"
                size={16}
                color={colors.textSecondary}
              />
              <Text style={styles.secondaryButtonText}>
                {smsFallbackTestActive
                  ? "Fallback test running..."
                  : "Run fallback test"}
              </Text>
            </View>
          </Pressable>

          <Pressable
            style={styles.secondaryButtonFull}
            onPress={sendLatestLocationSms}
          >
            <View style={styles.buttonContent}>
              <Ionicons
                name="chatbubble-outline"
                size={16}
                color={colors.textSecondary}
              />
              <Text style={styles.secondaryButtonText}>Send text update</Text>
            </View>
          </Pressable>
        </View>

        {updatesMessage ? (
          <View style={styles.updatesMessageBox}>
            <Feather
              name="info"
              size={13}
              color={colors.textSecondary}
              style={styles.statusIcon}
            />
            <Text style={styles.updatesMessageText}>{updatesMessage}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.card}>
        <View style={styles.cardTitleRow}>
          <Feather name="clock" size={18} color={colors.textPrimary} />
          <Text style={styles.cardTitle}>Recent logs</Text>
        </View>

        {visibleLogs.length === 0 ? (
          <Text style={styles.subText}>No location logs yet.</Text>
        ) : (
          visibleLogs.map((log) => (
            <View key={log.id} style={styles.logItem}>
              <View style={styles.logTopRow}>
                <View style={styles.inlineRow}>
                  <Feather
                    name="crosshair"
                    size={13}
                    color={colors.textPrimary}
                  />
                  <Text style={styles.mainTextSpaced}>
                    {Number(log.latitude).toFixed(2)},{" "}
                    {Number(log.longitude).toFixed(2)}
                  </Text>
                </View>

                <View style={styles.statusBadge}>
                  <Feather
                    name={getStatusIcon(log)}
                    size={12}
                    color="#B7C8BE"
                    style={styles.statusIcon}
                  />
                  <Text style={styles.statusText}>{getShortStatus(log)}</Text>
                </View>
              </View>

              {log.placeName ? (
                <View style={styles.inlineRow}>
                  <Ionicons
                    name="location-outline"
                    size={13}
                    color={colors.textMuted}
                  />
                  <Text style={styles.subTextInline}>{log.placeName}</Text>
                </View>
              ) : null}

              <Text style={styles.subText}>
                {new Date(log.recordedAt).toLocaleString()}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingTop: screen.topPadding,
    paddingBottom: screen.bottomSpacing,
    paddingHorizontal: spacing.xl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxxl,
    padding: 18,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  cardTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "700",
    marginLeft: spacing.sm,
  },
  mainText: {
    color: colors.textPrimary,
    fontSize: 15,
    marginBottom: spacing.xs,
  },
  mainTextSpaced: {
    color: colors.textPrimary,
    fontSize: 15,
    marginBottom: spacing.xs,
    marginLeft: spacing.sm,
  },
  subText: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: spacing.sm,
  },
  subTextInline: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: spacing.sm,
    marginLeft: spacing.sm,
    flexShrink: 1,
  },
  row: {
    flexDirection: "row",
    marginTop: spacing.sm,
  },
  inlineRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: spacing.xs,
  },
  primaryButtonSmall: {
    flex: 1,
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingVertical: 14,
    alignItems: "center",
    marginRight: 5,
    minHeight: 48,
    justifyContent: "center",
  },
  primaryButtonFull: {
    width: "100%",
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: colors.textDark,
    fontSize: 14,
    fontWeight: "700",
    marginLeft: spacing.sm,
  },
  secondaryButtonSmall: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    paddingVertical: 14,
    alignItems: "center",
    marginLeft: 5,
    minHeight: 48,
    justifyContent: "center",
  },
  secondaryButtonFull: {
    width: "100%",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: "600",
    marginLeft: spacing.sm,
  },
  updatesButtonsColumn: {
    marginTop: spacing.sm,
    gap: 10,
  },
  disabledButton: {
    opacity: 0.55,
  },
  disabledButtonDark: {
    opacity: 0.55,
  },
  statusRow: {
    marginBottom: 6,
  },
  tripStatusPill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  tripStatusPillActive: {
    backgroundColor: "rgba(52,199,89,0.14)",
  },
  tripStatusPillInactive: {
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  tripStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  tripStatusDotActive: {
    backgroundColor: colors.success,
  },
  tripStatusDotInactive: {
    backgroundColor: colors.textDim,
  },
  tripStatusText: {
    fontSize: 13,
    fontWeight: "700",
  },
  tripStatusTextActive: {
    color: "#DDF7E5",
  },
  tripStatusTextInactive: {
    color: colors.textSecondary,
  },
  offlineInfoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  offlineInfoText: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
  },
  mapWrap: {
    height: 280,
    borderRadius: radius.xxl - 2,
    overflow: "hidden",
    marginBottom: spacing.md,
  },
  map: {
    width: "100%",
    height: "100%",
  },
  offlineMapCard: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.xl,
    padding: 16,
    marginBottom: spacing.md,
  },
  offlineMapTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "700",
    marginTop: 8,
    marginBottom: 6,
  },
  offlineMapText: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  statPillWide: {
    marginBottom: spacing.sm,
  },
  statPillItem: {
    marginRight: spacing.sm,
    marginBottom: spacing.xs,
  },
  updatesMessageBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: spacing.md,
  },
  updatesMessageText: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
  },
  logItem: {
    borderTopWidth: 1,
    borderTopColor: "#264437",
    paddingTop: spacing.md,
    marginTop: spacing.md,
  },
  logTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  statusIcon: {
    marginRight: 5,
  },
  statusText: {
    color: "#B7C8BE",
    fontSize: 12,
    marginTop: 1,
  },
});