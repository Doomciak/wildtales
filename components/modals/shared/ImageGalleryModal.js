import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";

import { colors } from "../../../constants/theme";
import { radius, spacing } from "../../../constants/layout";

// This modal shows images in a full screen gallery view.
// It gets the current image list, selected index, navigation handlers,
// and accessibility labels through props.
export default function ImageGalleryModal({
  visible,
  onClose,
  items,
  index,
  onChangeIndex,
  onPrevious,
  onNext,
  closeLabel = "Close gallery",
  previousLabel = "Previous image",
  nextLabel = "Next image",
  selectLabelPrefix = "Select image",
}) {
  // Currently selected image based on the active index.
  const selectedItem = items[index] || null;

  // Used to decide whether gallery navigation should be shown.
  const hasMultipleItems = items.length > 1;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* Dark overlay behind the gallery so the image stands out more */}
      <View style={styles.overlay}>
        <View style={styles.header}>
          {/* Small badge showing current image number and image type */}
          <View style={styles.counterPill}>
            <Ionicons
              name={
                selectedItem?.type === "snapshot"
                  ? "map-outline"
                  : "images-outline"
              }
              size={14}
              color={colors.textPrimary}
            />
            <Text style={styles.counterText}>
              {items.length ? index + 1 : 0} / {items.length}
            </Text>
          </View>

          {/* Button for closing the gallery */}
          <Pressable
            style={styles.closeButton}
            onPress={onClose}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={closeLabel}
          >
            <Feather name="x" size={18} color={colors.white} />
          </Pressable>
        </View>

        <View style={styles.body}>
          {selectedItem ? (
            <Image
              source={{ uri: selectedItem.uri }}
              style={styles.image}
              resizeMode="contain"
            />
          ) : null}

          {/* Show previous and next controls only if there is more than one image */}
          {hasMultipleItems ? (
            <>
              <Pressable
                style={[styles.arrowButton, styles.arrowLeft]}
                onPress={onPrevious}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={previousLabel}
              >
                <Feather name="chevron-left" size={18} color={colors.white} />
              </Pressable>

              <Pressable
                style={[styles.arrowButton, styles.arrowRight]}
                onPress={onNext}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={nextLabel}
              >
                <Feather name="chevron-right" size={18} color={colors.white} />
              </Pressable>
            </>
          ) : null}
        </View>

        {/* Optional text shown under the active image */}
        {selectedItem?.label ? (
          <Text style={styles.imageLabel}>{selectedItem.label}</Text>
        ) : null}

        {/* Thumbnail list for quickly switching between gallery images */}
        {hasMultipleItems ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.thumbRow}
          >
            {items.map((item, thumbIndex) => (
              <Pressable
                key={`gallery-${item.uri}-${thumbIndex}`}
                onPress={() => onChangeIndex(thumbIndex)}
                style={[
                  styles.thumbWrap,
                  index === thumbIndex && styles.thumbWrapActive,
                ]}
                accessibilityRole="button"
                accessibilityLabel={`${selectLabelPrefix} ${thumbIndex + 1}`}
              >
                <Image source={{ uri: item.uri }} style={styles.thumb} />
              </Pressable>
            ))}
          </ScrollView>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(8, 10, 9, 0.88)",
    paddingTop: spacing.xl + 4,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  counterPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.10)",
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  counterText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "700",
    marginLeft: 6,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.10)",
    justifyContent: "center",
    alignItems: "center",
  },
  body: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  arrowButton: {
    position: "absolute",
    top: "50%",
    marginTop: -20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.10)",
    justifyContent: "center",
    alignItems: "center",
  },
  arrowLeft: {
    left: 0,
  },
  arrowRight: {
    right: 0,
  },
  imageLabel: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 12,
    textAlign: "center",
    marginTop: spacing.xs,
  },
  thumbRow: {
    paddingTop: spacing.sm,
    paddingRight: 4,
  },
  thumbWrap: {
    width: 60,
    height: 60,
    borderRadius: radius.md,
    marginRight: 10,
    padding: 2,
    borderWidth: 2,
    borderColor: "transparent",
  },
  thumbWrapActive: {
    borderColor: colors.accent,
  },
  thumb: {
    width: "100%",
    height: "100%",
    borderRadius: radius.sm,
  },
});