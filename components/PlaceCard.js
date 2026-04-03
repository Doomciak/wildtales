import { Image, Pressable, StyleSheet, Text, View } from "react-native";

export default function PlaceCard({ place, onEdit, onDelete }) {
  return (
    <View style={styles.placeCard}>
      {place.image ? (
        <Image source={{ uri: place.image }} style={styles.placeImage} />
      ) : (
        <View style={[styles.placeImage, styles.placeImageFallback]}>
          <Text style={styles.placeImageLetter}>
            {String(place.title).charAt(0).toUpperCase()}
          </Text>
        </View>
      )}

      <View style={styles.placeTextWrap}>
        <Text style={styles.placeTitle}>{place.title}</Text>

        {place.placeName ? (
          <Text style={styles.placeLocationName}>{place.placeName}</Text>
        ) : null}

        <Text style={styles.placeNote}>{place.note}</Text>

        {place.latitude != null && place.longitude != null ? (
          <Text style={styles.coordsText}>
            {place.latitude.toFixed(3)}, {place.longitude.toFixed(3)}
          </Text>
        ) : (
          <Text style={styles.coordsEmpty}>No location saved</Text>
        )}

        <View style={styles.actionRow}>
          <Pressable style={styles.editButton} onPress={onEdit}>
            <Text style={styles.editButtonText}>Edit</Text>
          </Pressable>

          <Pressable style={styles.deleteButton} onPress={onDelete}>
            <Text style={styles.deleteButtonText}>Delete</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  placeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#183328",
    borderRadius: 22,
    padding: 12,
    marginBottom: 14,
  },
  placeImage: {
    width: 88,
    height: 88,
    borderRadius: 18,
  },
  placeImageFallback: {
    backgroundColor: "#2A4739",
    justifyContent: "center",
    alignItems: "center",
  },
  placeImageLetter: {
    color: "#F1F7F3",
    fontSize: 28,
    fontWeight: "700",
  },
  placeTextWrap: {
    flex: 1,
    marginLeft: 14,
  },
  placeTitle: {
    color: "#F7FAF8",
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 4,
  },
  placeLocationName: {
    color: "#DCE8E0",
    fontSize: 13,
    marginBottom: 4,
  },
  placeNote: {
    color: "#A9BBB0",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  coordsText: {
    color: "#DCE8E0",
    fontSize: 12,
    marginBottom: 12,
  },
  coordsEmpty: {
    color: "#7F9689",
    fontSize: 12,
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
  },
  editButton: {
    alignSelf: "flex-start",
    backgroundColor: "#DCE8E0",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  editButtonText: {
    color: "#183126",
    fontSize: 13,
    fontWeight: "700",
  },
  deleteButton: {
    alignSelf: "flex-start",
    backgroundColor: "#274033",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  deleteButtonText: {
    color: "#DCE8E0",
    fontSize: 13,
    fontWeight: "600",
  },
});