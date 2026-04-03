import { ImageBackground, StyleSheet, Text, View } from "react-native";

export default function FeaturedPlaceCard({ place }) {
  if (!place) {
    return null;
  }

  const content = (
    <View style={styles.heroContent}>
      <Text style={styles.heroLabel}>Latest memory</Text>
      <Text style={styles.heroTitle}>{place.title}</Text>

      {place.placeName ? (
        <Text style={styles.heroPlaceName}>{place.placeName}</Text>
      ) : null}

      <Text style={styles.heroSubtitle}>{place.note}</Text>

      {place.latitude != null && place.longitude != null ? (
        <Text style={styles.heroCoords}>
          {place.latitude.toFixed(3)}, {place.longitude.toFixed(3)}
        </Text>
      ) : null}
    </View>
  );

  if (place.image) {
    return (
      <ImageBackground
        source={{ uri: place.image }}
        style={styles.heroCard}
        imageStyle={styles.heroImage}
      >
        <View style={styles.heroOverlay} />
        {content}
      </ImageBackground>
    );
  }

  return <View style={[styles.heroCard, styles.heroFallback]}>{content}</View>;
}

const styles = StyleSheet.create({
  heroCard: {
    height: 300,
    borderRadius: 28,
    overflow: "hidden",
    justifyContent: "flex-end",
    marginBottom: 24,
  },
  heroImage: {
    borderRadius: 28,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(9, 20, 15, 0.28)",
  },
  heroContent: {
    padding: 22,
  },
  heroFallback: {
    backgroundColor: "#183328",
  },
  heroLabel: {
    color: "#DCE8E0",
    fontSize: 13,
    marginBottom: 8,
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "700",
    marginBottom: 8,
  },
  heroPlaceName: {
    color: "#DCE8E0",
    fontSize: 14,
    marginBottom: 6,
  },
  heroSubtitle: {
    color: "#E3ECE5",
    fontSize: 15,
    marginBottom: 10,
  },
  heroCoords: {
    color: "#DCE8E0",
    fontSize: 13,
  },
});