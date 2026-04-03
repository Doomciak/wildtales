import { StatusBar } from "expo-status-bar";
import { useRef } from "react";
import {
  Animated,
  ImageBackground,
  PanResponder,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function WelcomeScreen({ onContinue }) {
  const translateY = useRef(new Animated.Value(0)).current;
  const completedRef = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 6,
      onPanResponderMove: (_, gesture) => {
        if (gesture.dy < 0) {
          const limitedValue = Math.max(gesture.dy, -150);
          translateY.setValue(limitedValue);
        }
      },
      onPanResponderRelease: (_, gesture) => {
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

        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 8,
        }).start();
      },
      onPanResponderTerminate: () => {
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
      source={require("../assets/images/welcome-hero.jpg")}
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
              {...panResponder.panHandlers}
            >
              <View style={styles.sliderArrows}>
                <Text style={styles.sliderArrowSmall}>⌃</Text>
                <Text style={styles.sliderArrowLarge}>⌃</Text>
              </View>

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
    backgroundColor: "#10251B",
  },
  welcomeImage: {
    resizeMode: "cover",
  },
  welcomeOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(10, 22, 16, 0.34)",
  },
  welcomeContent: {
    flex: 1,
    justifyContent: "space-between",
    paddingTop: 96,
    paddingBottom: 54,
    paddingHorizontal: 28,
  },
  welcomeTitle: {
    color: "#FFFFFF",
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
  sliderArrowSmall: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 24,
    lineHeight: 24,
    marginBottom: -6,
  },
  sliderArrowLarge: {
    color: "#FFFFFF",
    fontSize: 30,
    lineHeight: 30,
  },
  sliderButton: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: "#F4F7F3",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  sliderButtonText: {
    color: "#173226",
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  sliderHint: {
    marginTop: 16,
    color: "rgba(255,255,255,0.88)",
    fontSize: 14,
    fontWeight: "600",
  },
});