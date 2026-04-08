import { StyleSheet, View } from "react-native";

import { colors } from "../../../constants/theme";
import { radius, spacing } from "../../../constants/layout";

// This wraps modal content in a dark overlay
// and places it inside a styled card container.
export default function ModalCardShell({ children, overlayStyle, cardStyle }) {
  return (
    <View style={[styles.overlay, overlayStyle]}>
      {/* Card area where the modal content is rendered */}
      <View style={[styles.card, cardStyle]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlayDark,
    justifyContent: "center",
    padding: spacing.xl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxxl + 2,
    padding: 18,
    maxHeight: "88%",
  },
});