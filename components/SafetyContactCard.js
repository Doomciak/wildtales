import { Pressable, StyleSheet, Text, View } from "react-native";

export default function SafetyContactCard({ contact, onChooseContact }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Safety contact</Text>

      {contact ? (
        <>
          <Text style={styles.mainText}>{contact.name}</Text>
          <Text style={styles.subText}>{contact.phone}</Text>
        </>
      ) : (
        <Text style={styles.subText}>No contact selected yet.</Text>
      )}

      <Pressable style={styles.primaryButton} onPress={onChooseContact}>
        <Text style={styles.primaryButtonText}>
          {contact ? "Change contact" : "Choose contact"}
        </Text>
      </Pressable>
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
  subText: {
    color: "#A9BBB0",
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 8,
  },
  primaryButton: {
    backgroundColor: "#F4F7F3",
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  primaryButtonText: {
    color: "#183126",
    fontSize: 14,
    fontWeight: "700",
  },
});