import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";

import { colors } from "../../constants/theme";
import { radius, spacing } from "../../constants/layout";

// Shared image manager used in both place and journey forms.
export default function EditableImageManager({
  label = "Photos",
  images = [],
  onAddImages,
  onReplaceImage,
  onRemoveImage,
  onRemoveAllImages,
  disabled = false,
  emptyTitle = "Add photos",
  emptyHint = "Tap to choose or take one",
  addMoreLabel = "Add more",
  removeAllLabel = "Remove all",
  coverLabel = "Cover",
  helperText = "Tap the main photo to add more. Use the small buttons on each thumbnail to replace or remove one image.",
  stageHeight = 190,
}) {
  // Remove empty values and duplicate URIs before rendering.
  const safeImages = [
    ...new Set((Array.isArray(images) ? images : []).filter(Boolean)),
  ];

  // Use the first image as the main preview.
  const coverImage = safeImages[0] || null;

  return (
    <View style={styles.field}>
      <View style={styles.labelRow}>
        <Feather name="image" size={15} color={colors.textSecondary} />
        <Text style={styles.label}>{label}</Text>
      </View>

      <Pressable
        style={[
          styles.imageStage,
          {
            height: coverImage ? stageHeight : Math.max(150, stageHeight - 40),
          },
          disabled && styles.disabledSurface,
        ]}
        onPress={disabled ? undefined : onAddImages}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={
          coverImage
            ? `Edit ${label.toLowerCase()}`
            : `Add ${label.toLowerCase()}`
        }
      >
        {coverImage ? (
          <>
            {/* Render the main preview image. */}
            <Image source={{ uri: coverImage }} style={styles.imageStageImage} />

            {/* Show the edit icon on the main preview. */}
            <View style={styles.stageTopRightBadge}>
              <Feather name="edit-2" size={15} color={colors.textDark} />
            </View>

            {/* Show the current number of selected images. */}
            <View style={styles.stageBottomLeftBadge}>
              <Feather name="image" size={12} color={colors.textPrimary} />
              <Text style={styles.stageBottomLeftBadgeText}>
                {safeImages.length} photo{safeImages.length === 1 ? "" : "s"}
              </Text>
            </View>
          </>
        ) : (
          <>
            {/* Show the add icon when no images are selected. */}
            <View style={styles.stageTopRightBadge}>
              <Feather name="plus" size={16} color={colors.textDark} />
            </View>

            {/* Render the empty state. */}
            <View style={styles.emptyState}>
              <View style={styles.emptyStateIconWrap}>
                <Ionicons
                  name="images-outline"
                  size={20}
                  color={colors.textSecondary}
                />
              </View>

              <Text style={styles.emptyStateTitle}>{emptyTitle}</Text>
              <Text style={styles.emptyStateHint}>{emptyHint}</Text>
            </View>
          </>
        )}
      </Pressable>

      {safeImages.length > 0 ? (
        <>
          {/* Render buttons for adding more images or removing all images. */}
          <View style={styles.actionRow}>
            <Pressable
              style={[styles.actionChip, disabled && styles.disabledSurface]}
              onPress={disabled ? undefined : onAddImages}
              disabled={disabled}
              accessibilityRole="button"
              accessibilityLabel={`Add more ${label.toLowerCase()}`}
            >
              <Feather
                name="plus"
                size={14}
                color={colors.textSecondary}
                style={styles.actionIcon}
              />
              <Text style={styles.actionChipText}>{addMoreLabel}</Text>
            </Pressable>

            <Pressable
              style={[styles.actionChip, disabled && styles.disabledSurface]}
              onPress={disabled ? undefined : onRemoveAllImages}
              disabled={disabled}
              accessibilityRole="button"
              accessibilityLabel={`Remove all ${label.toLowerCase()}`}
            >
              <Feather
                name="trash-2"
                size={14}
                color={colors.textSecondary}
                style={styles.actionIcon}
              />
              <Text style={styles.actionChipText}>{removeAllLabel}</Text>
            </Pressable>
          </View>

          {/* Render thumbnail previews for all selected images. */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.thumbRow}
          >
            {safeImages.map((uri, index) => {
              const isCover = index === 0;

              return (
                <View key={`${uri}-${index}`} style={styles.thumbCard}>
                  <Image source={{ uri }} style={styles.thumbImage} />

                  {/* Mark the first image as the cover image. */}
                  {isCover ? (
                    <View style={styles.coverPill}>
                      <Text style={styles.coverPillText}>{coverLabel}</Text>
                    </View>
                  ) : null}

                  <View style={styles.thumbOverlayActions}>
                    <Pressable
                      style={styles.thumbOverlayButton}
                      onPress={
                        disabled ? undefined : () => onReplaceImage?.(index)
                      }
                      disabled={disabled}
                      accessibilityRole="button"
                      accessibilityLabel={`Replace photo ${index + 1}`}
                    >
                      {/* Replace the selected image. */}
                      <Feather
                        name="refresh-cw"
                        size={13}
                        color={colors.textDark}
                      />
                    </Pressable>

                    <Pressable
                      style={[
                        styles.thumbOverlayButton,
                        styles.thumbOverlayDeleteButton,
                      ]}
                      onPress={
                        disabled ? undefined : () => onRemoveImage?.(index)
                      }
                      disabled={disabled}
                      accessibilityRole="button"
                      accessibilityLabel={`Remove photo ${index + 1}`}
                    >
                      {/* Remove the selected image. */}
                      <Feather name="x" size={14} color={colors.textDark} />
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </ScrollView>

          {/* Show helper text below the image list. */}
          <Text style={styles.helperText}>{helperText}</Text>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    marginBottom: spacing.md,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 14,
    marginLeft: spacing.sm,
  },
  imageStage: {
    borderRadius: radius.xxl - 2,
    backgroundColor: colors.surfaceAlt,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    borderWidth: 1,
    borderColor: colors.borderSoft,
    marginBottom: spacing.md,
  },
  imageStageImage: {
    width: "100%",
    height: "100%",
  },
  stageTopRightBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accent,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  stageBottomLeftBadge: {
    position: "absolute",
    left: 12,
    bottom: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(16,37,27,0.82)",
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  stageBottomLeftBadgeText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 6,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  emptyStateIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surfaceMuted,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  emptyStateTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
  },
  emptyStateHint: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: "center",
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: spacing.sm,
  },
  actionChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  actionChipText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },
  actionIcon: {
    marginRight: 6,
  },
  thumbRow: {
    paddingRight: 6,
    marginBottom: 8,
  },
  thumbCard: {
    width: 126,
    height: 126,
    marginRight: 12,
    position: "relative",
  },
  thumbImage: {
    width: "100%",
    height: "100%",
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceAlt,
  },
  coverPill: {
    position: "absolute",
    left: 8,
    top: 8,
    backgroundColor: "rgba(16,37,27,0.82)",
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  coverPillText: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: "700",
  },
  thumbOverlayActions: {
    position: "absolute",
    right: 8,
    bottom: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  thumbOverlayButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.accent,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  thumbOverlayDeleteButton: {
    backgroundColor: colors.accent,
  },
  helperText: {
    color: colors.textDim,
    fontSize: 12,
    lineHeight: 18,
  },
  disabledSurface: {
    opacity: 0.65,
  },
});