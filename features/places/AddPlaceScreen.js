import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";

import { colors } from "../../constants/theme";
import { radius, screen, spacing } from "../../constants/layout";

export default function AddPlaceScreen({
  title,
  note,
  images,
  placeName,
  latitude,
  longitude,
  locationLoading,
  setTitle,
  setNote,
  onSavePlace,
  onCancel,
  onOpenImageOptions,
  onRemoveAllImages,
  onGetLocation,
  onClearLocation,
  isEditing,
}) {
  const coverImage = images[0] || null;

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.addScrollContent}
    >
      <Text style={styles.addTitle}>{isEditing ? "Update place" : "Add a place"}</Text>
      <Text style={styles.addSubtitle}>
        Save the places you want to remember beautifully.
      </Text>

      <View style={styles.formCard}>
        <View style={styles.inputLabelRow}>
          <Feather name="type" size={15} color={colors.textSecondary} />
          <Text style={styles.inputLabel}>Place title</Text>
        </View>

        <TextInput
          style={styles.input}
          placeholder="Forest trail"
          placeholderTextColor={colors.textDim}
          value={title}
          onChangeText={setTitle}
        />

        <View style={styles.inputLabelRow}>
          <Feather name="edit-3" size={15} color={colors.textSecondary} />
          <Text style={styles.inputLabel}>Short note</Text>
        </View>

        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder="What made this place special?"
          placeholderTextColor={colors.textDim}
          value={note}
          onChangeText={setNote}
          multiline
          textAlignVertical="top"
        />

        <View style={styles.inputLabelRow}>
          <Feather name="image" size={15} color={colors.textSecondary} />
          <Text style={styles.inputLabel}>Photos</Text>
        </View>

        <Pressable
          style={[styles.imageStage, !coverImage && styles.imageStageCompact]}
          onPress={onOpenImageOptions}
          onLongPress={onRemoveAllImages}
        >
          {coverImage ? (
            <>
              <Image source={{ uri: coverImage }} style={styles.imageStageImage} />
              <View style={styles.imageBadgeTopRight}>
                <Feather name="edit-2" size={15} color={colors.textDark} />
              </View>

              {images.length > 1 ? (
                <View style={styles.imageCountPill}>
                  <Text style={styles.imageCountText}>{images.length} photos</Text>
                </View>
              ) : null}
            </>
          ) : (
            <>
              <View style={styles.imageBadgeTopRight}>
                <Feather name="edit-2" size={15} color={colors.textDark} />
              </View>
              <Text style={styles.imageStageTitle}>Add photos</Text>
              <Text style={styles.imageStageHint}>Tap to choose or take one</Text>
            </>
          )}
        </Pressable>

        {images.length > 1 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.addThumbsRow}
          >
            {images.map((uri, index) => (
              <Image
                key={`${uri}-${index}`}
                source={{ uri }}
                style={styles.addThumb}
              />
            ))}
          </ScrollView>
        ) : null}

        {images.length > 0 ? (
          <Text style={styles.photoRemoveHint}>
            Long press the photo area to remove all photos
          </Text>
        ) : null}

        <View style={styles.inputLabelRow}>
          <Ionicons
            name="location-outline"
            size={16}
            color={colors.textSecondary}
          />
          <Text style={styles.inputLabel}>Location</Text>
        </View>

        {latitude != null && longitude != null ? (
          <View style={styles.locationCard}>
            {placeName ? (
              <View style={styles.inlineRow}>
                <Ionicons
                  name="location-outline"
                  size={14}
                  color={colors.textPrimary}
                />
                <Text style={styles.locationPlaceName}>{placeName}</Text>
              </View>
            ) : null}

            <View style={styles.inlineRow}>
              <Feather
                name="crosshair"
                size={13}
                color={colors.textPrimary}
              />
              <Text style={styles.locationText}>
                {Number(latitude).toFixed(3)}, {Number(longitude).toFixed(3)}
              </Text>
            </View>

            <View style={styles.previewButtons}>
              <Pressable
                style={styles.smallActionButton}
                onPress={onGetLocation}
                disabled={locationLoading}
              >
                {locationLoading ? (
                  <ActivityIndicator size="small" color={colors.textDark} />
                ) : (
                  <Ionicons
                    name="locate-outline"
                    size={15}
                    color={colors.textDark}
                    style={styles.actionIcon}
                  />
                )}
                <Text style={styles.smallActionButtonText}>
                  {locationLoading ? "Finding..." : "Refresh location"}
                </Text>
              </Pressable>

              <Pressable
                style={styles.smallGhostButton}
                onPress={onClearLocation}
              >
                <Feather
                  name="x-circle"
                  size={15}
                  color={colors.textSecondary}
                  style={styles.actionIcon}
                />
                <Text style={styles.smallGhostButtonText}>Clear</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable
            style={styles.locationButton}
            onPress={onGetLocation}
            disabled={locationLoading}
          >
            <View style={styles.imagePickerContent}>
              {locationLoading ? (
                <ActivityIndicator size="small" color={colors.textPrimary} />
              ) : (
                <Ionicons
                  name="locate-outline"
                  size={18}
                  color={colors.textPrimary}
                />
              )}
              <Text style={styles.imagePickerButtonText}>
                {locationLoading ? "Finding location..." : "Use current location"}
              </Text>
            </View>
          </Pressable>
        )}

        <Pressable style={styles.primaryButton} onPress={onSavePlace}>
          <View style={styles.buttonContent}>
            <Feather name="save" size={16} color={colors.textDark} />
            <Text style={styles.primaryButtonText}>
              {isEditing ? "Update place" : "Save place"}
            </Text>
          </View>
        </Pressable>

        {isEditing ? (
          <Pressable style={styles.secondaryButton} onPress={onCancel}>
            <View style={styles.buttonContent}>
              <Feather name="x" size={15} color="#B7C8BE" />
              <Text style={styles.secondaryButtonText}>Cancel editing</Text>
            </View>
          </Pressable>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  addScrollContent: {
    paddingTop: screen.topPadding,
    paddingBottom: screen.bottomSpacing,
    paddingHorizontal: spacing.xl,
  },
  addTitle: {
    color: colors.textPrimary,
    fontSize: 34,
    fontWeight: "800",
    marginBottom: spacing.sm,
  },
  addSubtitle: {
    color: colors.textSoft,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.xxl,
    maxWidth: 280,
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: 28,
    padding: spacing.xl,
    marginBottom: 18,
  },
  inputLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  inputLabel: {
    color: colors.textSecondary,
    fontSize: 14,
    marginLeft: spacing.sm,
  },
  input: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.lg,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: colors.textPrimary,
    fontSize: 15,
    marginBottom: spacing.lg,
  },
  textarea: {
    minHeight: 130,
  },
  imageStage: {
    height: 180,
    borderRadius: radius.xl,
    backgroundColor: colors.surfaceAlt,
    marginBottom: spacing.md,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  imageStageCompact: {
    height: 145,
  },
  imageStageImage: {
    width: "100%",
    height: "100%",
  },
  imageBadgeTopRight: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.accent,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  imageStageTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
  },
  imageStageHint: {
    color: colors.textMuted,
    fontSize: 13,
  },
  imageCountPill: {
    position: "absolute",
    left: 12,
    bottom: 12,
    backgroundColor: "rgba(16,37,27,0.82)",
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  imageCountText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: "700",
  },
  addThumbsRow: {
    paddingRight: 6,
    marginBottom: 10,
  },
  addThumb: {
    width: 74,
    height: 74,
    borderRadius: radius.md,
    marginRight: 10,
  },
  photoRemoveHint: {
    color: colors.textDim,
    fontSize: 12,
    marginBottom: spacing.lg,
  },
  inlineRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  locationCard: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  locationButton: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.lg,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  locationPlaceName: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: spacing.sm,
    marginLeft: spacing.sm,
    flexShrink: 1,
  },
  locationText: {
    color: colors.textPrimary,
    fontSize: 14,
    marginBottom: spacing.md,
    marginLeft: spacing.sm,
  },
  previewButtons: {
    flexDirection: "row",
  },
  smallActionButton: {
    flex: 1,
    backgroundColor: colors.accentSoft,
    borderRadius: radius.pill,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginRight: 5,
  },
  smallActionButtonText: {
    color: colors.textDark,
    fontSize: 14,
    fontWeight: "700",
  },
  smallGhostButton: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginLeft: 5,
  },
  smallGhostButtonText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: "600",
  },
  imagePickerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  imagePickerButtonText: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "600",
    marginHorizontal: 10,
  },
  primaryButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: spacing.xs,
  },
  primaryButtonText: {
    color: colors.textDark,
    fontSize: 15,
    fontWeight: "700",
    marginLeft: spacing.sm,
  },
  secondaryButton: {
    marginTop: spacing.md,
    alignItems: "center",
    paddingVertical: 12,
  },
  secondaryButtonText: {
    color: "#B7C8BE",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: spacing.sm,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  actionIcon: {
    marginRight: 6,
  },
});