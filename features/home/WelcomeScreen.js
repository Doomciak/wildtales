import { useRef } from "react";
import {
  Animated,
  ImageBackground,
  PanResponder,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";

import { colors, shadows } from "../../constants/theme";

// Welcome screen shown before entering the main app.
// The user swipes the button upward to continue.
export default function WelcomeScreen({ onContinue }) {
  // Controls the vertical movement of the swipe button.
  const translateY = useRef(new Animated.Value(0)).current;

  // Used to avoid resetting the animation after the screen has already completed.
  const completedRef = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      // Start handling the gesture only when the vertical movement is noticeable.
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 6,

      onPanResponderMove: (_, gesture) => {
        // Only allow upward dragging.
        if (gesture.dy < 0) {
          // Limit how far the button can be dragged upward.
          const limitedValue = Math.max(gesture.dy, -150);
          translateY.setValue(limitedValue);
        }
      },

      onPanResponderRelease: (_, gesture) => {
        // If the user swipes far enough, finish the animation and enter the app.
        if (gesture.dy <= -110) {
          completedRef.current = true;

          Animated.timing(translateY, {
            toValue: -150,
            duration: 170,
            useNativeDriver: true,
          }).start(() => {
            onContinue();
          });

          return;
        }

        // If the swipe was too short, move the button back to the start position.
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 8,
        }).start();
      },

      onPanResponderTerminate: () => {
        // Reset the button if the gesture gets interrupted before completion.
        if (!completedRef.current) {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 8,
          }).start();
        }
      },
    })
  ).current;

  return (
    <ImageBackground
      source={require("../../assets/images/welcome-hero.jpg")}
      style={styles.welcomeScreen}
      imageStyle={styles.welcomeImage}
    >
      <StatusBar style="light" />
      <View style={styles.welcomeOverlay} />

      <View style={styles.welcomeContent}>
        <View>
          <Text style={styles.welcomeTitle}>Explore Your Favorite Journey</Text>
          <Text style={styles.welcomeSubtitle}>
            Capture places, follow your route, and travel with confidence.
          </Text>
        </View>

        <View style={styles.welcomeBottom}>
          <View style={styles.sliderTrack}>
            <Animated.View
              style={[
                styles.sliderThumbWrap,
                {
                  transform: [{ translateY }],
                },
              ]}
              // Attach swipe gesture handlers to the draggable button
              {...panResponder.panHandlers}
            >
              {/* Arrow hint above the button to show the swipe direction */}
              <View style={styles.sliderArrows}>
                <Ionicons
                  name="chevron-up"
                  size={22}
                  color="rgba(255,255,255,0.74)"
                />
                <Ionicons
                  name="chevron-up"
                  size={28}
                  color={colors.white}
                  style={styles.sliderArrowIconLarge}
                />
              </View>

              {/* Main swipe control the user drags upward to continue */}
              <View style={styles.sliderButton}>
                <Text style={styles.sliderButtonText}>GO</Text>
              </View>
            </Animated.View>
          </View>

          <Text style={styles.sliderHint}>Swipe up to enter</Text>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  welcomeScreen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  welcomeImage: {
    resizeMode: "cover",
  },
  welcomeOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlayWelcome,
  },
  welcomeContent: {
    flex: 1,
    justifyContent: "space-between",
    paddingTop: 96,
    paddingBottom: 54,
    paddingHorizontal: 28,
  },
  welcomeTitle: {
    color: colors.white,
    fontSize: 42,
    fontWeight: "800",
    lineHeight: 48,
    maxWidth: 280,
  },
  welcomeSubtitle: {
    color: "rgba(255,255,255,0.92)",
    fontSize: 16,
    lineHeight: 24,
    marginTop: 14,
    maxWidth: 260,
  },
  welcomeBottom: {
    alignItems: "center",
    justifyContent: "flex-end",
  },
  sliderTrack: {
    width: 96,
    height: 210,
    borderRadius: 48,
    backgroundColor: "rgba(255,255,255,0.14)",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 10,
    overflow: "hidden",
  },
  sliderThumbWrap: {
    alignItems: "center",
  },
  sliderArrows: {
    alignItems: "center",
    marginBottom: 8,
  },
  sliderArrowIconLarge: {
    marginTop: -8,
  },
  sliderButton: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.floating,
  },
  sliderButtonText: {
    color: "#173226",
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  sliderHint: {
    marginTop: 16,
    color: "rgba(255,255,255,0.88)",
    fontSize: 14,
    fontWeight: "600",
  },
});