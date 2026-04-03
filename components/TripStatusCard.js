import { Pressable, StyleSheet, Text, View } from "react-native";

export default function TripStatusCard({
  tripActive,
  onStartTrip,
  onStopTrip,
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Trip status</Text>
      <Text style={styles.mainText}>
        {tripActive ? "Trip is active" : "Trip is not active"}
      </Text>

      <View style={styles.row}>
        <Pressable
          style={[styles.primaryButtonSmall, tripActive && styles.disabledButton]}
          onPress={onStartTrip}
          disabled={tripActive}
        >
          <Text style={styles.primaryButtonText}>Start trip</Text>
        </Pressable>

        <Pressable
          style={[
            styles.secondaryButtonSmall,
            !tripActive && styles.disabledButtonDark,
          ]}
          onPress={onStopTrip}
          disabled={!tripActive}
        >
          <Text style={styles.secondaryButtonText}>Stop trip</Text>
        </Pressable>
      </View>
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
  mainText: {
    color: "#F6FAF7",
    fontSize: 15,
    marginBottom: 4,
  },
  row: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  primaryButtonSmall: {
    flex: 1,
    backgroundColor: "#F4F7F3",
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#183126",
    fontSize: 14,
    fontWeight: "700",
  },
  secondaryButtonSmall: {
    flex: 1,
    backgroundColor: "#274033",
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#DCE8E0",
    fontSize: 14,
    fontWeight: "600",
  },
  disabledButton: {
    opacity: 0.55,
  },
  disabledButtonDark: {
    opacity: 0.55,
  },
});