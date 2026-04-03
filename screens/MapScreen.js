import { ScrollView, StyleSheet, Text, View } from "react-native";
import MapView, { Marker } from "react-native-maps";

import EmptyStateCard from "../components/EmptyStateCard";
import ScreenHeader from "../components/ScreenHeader";

export default function MapScreen({ places }) {
  const defaultRegion = {
    latitude: 54.5,
    longitude: -3.5,
    latitudeDelta: 8,
    longitudeDelta: 8,
  };

  const firstPlace = places[0];

  const region = firstPlace
    ? {
        latitude: firstPlace.latitude,
        longitude: firstPlace.longitude,
        latitudeDelta: 2,
        longitudeDelta: 2,
      }
    : defaultRegion;

  return (
    <View style={styles.mapScreen}>
      <ScreenHeader eyebrow="Your memories" title="Map" />

      {places.length === 0 ? (
        <EmptyStateCard
          title="No saved coordinates yet"
          text="Add a place with location and it will appear on the map."
        />
      ) : (
        <>
          <View style={styles.mapWrap}>
            <MapView style={styles.map} initialRegion={region}>
              {places.map((place) => (
                <Marker
                  key={place.id}
                  coordinate={{
                    latitude: place.latitude,
                    longitude: place.longitude,
                  }}
                  title={place.title}
                  description={place.note}
                />
              ))}
            </MapView>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.mapCardsRow}
          >
            {places.map((place) => (
              <View key={place.id} style={styles.mapPlaceCard}>
                <Text style={styles.mapPlaceTitle}>{place.title}</Text>

                {place.placeName ? (
                  <Text style={styles.mapPlaceName}>{place.placeName}</Text>
                ) : null}

                <Text style={styles.mapPlaceNote} numberOfLines={2}>
                  {place.note}
                </Text>

                <Text style={styles.mapPlaceCoords}>
                  {place.latitude.toFixed(3)}, {place.longitude.toFixed(3)}
                </Text>
              </View>
            ))}
          </ScrollView>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  mapScreen: {
    flex: 1,
    paddingTop: 70,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  mapWrap: {
    flex: 1,
    minHeight: 380,
    borderRadius: 28,
    overflow: "hidden",
    marginBottom: 16,
  },
  map: {
    width: "100%",
    height: "100%",
  },
  mapCardsRow: {
    paddingRight: 8,
  },
  mapPlaceCard: {
    width: 220,
    backgroundColor: "#183328",
    borderRadius: 22,
    padding: 16,
    marginRight: 12,
  },
  mapPlaceTitle: {
    color: "#F6FAF7",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  mapPlaceName: {
    color: "#DCE8E0",
    fontSize: 13,
    marginBottom: 6,
  },
  mapPlaceNote: {
    color: "#A9BBB0",
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 10,
  },
  mapPlaceCoords: {
    color: "#DCE8E0",
    fontSize: 12,
  },
});