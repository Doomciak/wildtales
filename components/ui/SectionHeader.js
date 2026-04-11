import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "../../constants/theme";

// Section header with an optional action on the right.
export default function SectionHeader({
  title,
  actionLabel = "View all",
  onPress,
}) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>

      {/* Only render the action when a press handler is provided. */}
      {onPress ? (
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
        >
          <Text style={styles.link}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: "700",
  },
  link: {
    color: "#A7BBB0",
    fontSize: 14,
  },
});