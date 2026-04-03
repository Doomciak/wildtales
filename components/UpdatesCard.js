import { Pressable, StyleSheet, Text, View } from "react-native";

export default function UpdatesCard({ onRetry, onSendSms }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Updates</Text>
      <Text style={styles.subText}>
        The app first tries to send your location online. If that still does not
        work after 3 failed tries or about 10 minutes, it opens a text update
        with your latest saved location.
      </Text>

      <View style={styles.row}>
        <Pressable style={styles.primaryButtonSmall} onPress={onRetry}>
          <Text style={styles.primaryButtonText}>Retry online update</Text>
        </Pressable>

        <Pressable style={styles.secondaryButtonSmall} onPress={onSendSms}>
          <Text style={styles.secondaryButtonText}>Send text update</Text>
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
  subText: {
    color: "#A9BBB0",
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 8,
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
});