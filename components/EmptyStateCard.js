import { StyleSheet, Text, View } from "react-native";

export default function EmptyStateCard({ title, text }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#183328",
    borderRadius: 24,
    padding: 20,
  },
  title: {
    color: "#F6FAF7",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  text: {
    color: "#A9BBB0",
    fontSize: 14,
    lineHeight: 21,
  },
});