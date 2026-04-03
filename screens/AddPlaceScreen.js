import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import ScreenHeader from "../components/ScreenHeader";

export default function AddPlaceScreen({
  title,
  setTitle,
  note,
  setNote,
  image,
  placeName,
  latitude,
  longitude,
  locationLoading,
  onSavePlace,
  onCancel,
  onOpenImageOptions,
  onRemoveImage,
  onGetLocation,
  onClearLocation,
  isEditing,
}) {
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      <ScreenHeader
        eyebrow={isEditing ? "Edit memory" : "New memory"}
        title={isEditing ? "Update place" : "Add a place"}
      />

      <View style={styles.formCard}>
        <Text style={styles.inputLabel}>Place title</Text>
        <TextInput
          style={styles.input}
          placeholder="Forest trail"
          placeholderTextColor="#8fa297"
          value={title}
          onChangeText={setTitle}
        />

        <Text style={styles.inputLabel}>Short note</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder="What made this place special?"
          placeholderTextColor="#8fa297"
          value={note}
          onChangeText={setNote}
          multiline
          textAlignVertical="top"
        />

        <Text style={styles.inputLabel}>Photo</Text>

        {image ? (
          <View style={styles.previewWrap}>
            <Image source={{ uri: image }} style={styles.previewImage} />

            <View style={styles.previewButtons}>
              <Pressable
                style={styles.smallActionButton}
                onPress={onOpenImageOptions}
              >
                <Text style={styles.smallActionButtonText}>Change photo</Text>
              </Pressable>

              <Pressable
                style={styles.smallGhostButton}
                onPress={onRemoveImage}
              >
                <Text style={styles.smallGhostButtonText}>Remove</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable style={styles.imagePickerButton} onPress={onOpenImageOptions}>
            <Text style={styles.imagePickerButtonText}>Add a photo</Text>
          </Pressable>
        )}

        <Text style={styles.inputLabel}>Location</Text>

        {latitude != null && longitude != null ? (
          <View style={styles.locationCard}>
            {placeName ? (
              <Text style={styles.locationPlaceName}>{placeName}</Text>
            ) : null}

            <Text style={styles.locationText}>
              {latitude.toFixed(3)}, {longitude.toFixed(3)}
            </Text>

            <View style={styles.previewButtons}>
              <Pressable
                style={styles.smallActionButton}
                onPress={onGetLocation}
                disabled={locationLoading}
              >
                <Text style={styles.smallActionButtonText}>
                  {locationLoading ? "Finding..." : "Refresh location"}
                </Text>
              </Pressable>

              <Pressable
                style={styles.smallGhostButton}
                onPress={onClearLocation}
              >
                <Text style={styles.smallGhostButtonText}>Clear</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable
            style={styles.imagePickerButton}
            onPress={onGetLocation}
            disabled={locationLoading}
          >
            <Text style={styles.imagePickerButtonText}>
              {locationLoading ? "Finding location..." : "Use current location"}
            </Text>
          </Pressable>
        )}

        <Pressable style={styles.primaryButton} onPress={onSavePlace}>
          <Text style={styles.primaryButtonText}>
            {isEditing ? "Update place" : "Save place"}
          </Text>
        </Pressable>

        {isEditing ? (
          <Pressable style={styles.secondaryButton} onPress={onCancel}>
            <Text style={styles.secondaryButtonText}>Cancel editing</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.tipCard}>
        <Text style={styles.tipTitle}>Location enabled</Text>
        <Text style={styles.tipText}>
          The app now tries to detect a readable place name from coordinates.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingTop: 70,
    paddingBottom: 28,
    paddingHorizontal: 20,
  },
  formCard: {
    backgroundColor: "#183328",
    borderRadius: 28,
    padding: 20,
    marginBottom: 18,
  },
  inputLabel: {
    color: "#DCE8E0",
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#224234",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: "#F6FAF7",
    fontSize: 15,
    marginBottom: 18,
  },
  textarea: {
    minHeight: 130,
  },
  imagePickerButton: {
    backgroundColor: "#224234",
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 18,
  },
  imagePickerButtonText: {
    color: "#F6FAF7",
    fontSize: 15,
    fontWeight: "600",
  },
  previewWrap: {
    marginBottom: 18,
  },
  previewImage: {
    width: "100%",
    height: 220,
    borderRadius: 20,
    marginBottom: 12,
  },
  previewButtons: {
    flexDirection: "row",
    gap: 10,
  },
  smallActionButton: {
    flex: 1,
    backgroundColor: "#DCE8E0",
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: "center",
  },
  smallActionButtonText: {
    color: "#183126",
    fontSize: 14,
    fontWeight: "700",
  },
  smallGhostButton: {
    flex: 1,
    backgroundColor: "#274033",
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: "center",
  },
  smallGhostButtonText: {
    color: "#DCE8E0",
    fontSize: 14,
    fontWeight: "600",
  },
  locationCard: {
    backgroundColor: "#224234",
    borderRadius: 20,
    padding: 16,
    marginBottom: 18,
  },
  locationPlaceName: {
    color: "#F6FAF7",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  locationText: {
    color: "#F6FAF7",
    fontSize: 14,
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: "#F4F7F3",
    borderRadius: 999,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 4,
  },
  primaryButtonText: {
    color: "#183126",
    fontSize: 15,
    fontWeight: "700",
  },
  secondaryButton: {
    marginTop: 12,
    alignItems: "center",
    paddingVertical: 12,
  },
  secondaryButtonText: {
    color: "#B7C8BE",
    fontSize: 14,
    fontWeight: "600",
  },
  tipCard: {
    backgroundColor: "#142B20",
    borderRadius: 24,
    padding: 18,
  },
  tipTitle: {
    color: "#F6FAF7",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  tipText: {
    color: "#A9BBB0",
    fontSize: 14,
    lineHeight: 21,
  },
});