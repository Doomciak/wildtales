import { StyleSheet, Text, View } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";

export default function RouteMapCard({ routeCoords }) {
  const latestRoutePoint = routeCoords[routeCoords.length - 1];

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Live route</Text>

      {routeCoords.length === 0 ? (
        <Text style={styles.subText}>
          No tracked route yet. Start a trip and let the app record location.
        </Text>
      ) : (
        <>
          <View style={styles.mapWrap}>
            <MapView
              key={`${routeCoords.length}-${latestRoutePoint.latitude}-${latestRoutePoint.longitude}`}
              style={styles.map}
              initialRegion={{
                latitude: latestRoutePoint.latitude,
                longitude: latestRoutePoint.longitude,
                latitudeDelta: 0.02,
                longitudeDelta: 0.02,
              }}
            >
              <Polyline
                coordinates={routeCoords}
                strokeColor="#6FCF97"
                strokeWidth={4}
              />

              <Marker
                coordinate={latestRoutePoint}
                title="Latest location"
                description="Most recent tracked point"
              />
            </MapView>
          </View>

          <Text style={styles.subText}>Points tracked: {routeCoords.length}</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#183328",
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
  },
  cardTitle: {
    color: "#F6FAF7",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  subText: {
    color: "#A9BBB0",
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 8,
  },
  mapWrap: {
    height: 260,
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 12,
  },
  map: {
    width: "100%",
    height: "100%",
  },
});