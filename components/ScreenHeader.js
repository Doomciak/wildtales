import { StyleSheet, Text, View } from "react-native";

export default function ScreenHeader({ eyebrow, title, rightSlot = null }) {
  return (
    <View style={styles.header}>
      <View style={styles.textWrap}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.title}>{title}</Text>
      </View>

      {rightSlot ? <View>{rightSlot}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  textWrap: {
    flex: 1,
    paddingRight: 16,
  },
  eyebrow: {
    color: "#93A89A",
    fontSize: 14,
    marginBottom: 6,
  },
  title: {
    color: "#F6FAF7",
    fontSize: 34,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});