import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Marker } from "react-native-maps";

import TrackingMarker from "../../assets/images/tracking.svg";

export default function WildMarker({
  coordinate,
  title,
  description,
  size = 34,
  onPress,
}) {
  // Keep marker updates on briefly so the custom SVG refreshes properly.
  // After that, turn them off again to avoid extra map re-renders.
  const [tracksViewChanges, setTracksViewChanges] = useState(true);

  useEffect(() => {
    // Re-enable view tracking whenever the marker moves or its size changes.
    setTracksViewChanges(true);

    // Turn tracking back off after a short delay for better performance.
    const timeout = setTimeout(() => {
      setTracksViewChanges(false);
    }, 800);

    // Clear the timeout if the marker updates again or unmounts.
    return () => clearTimeout(timeout);
  }, [coordinate?.latitude, coordinate?.longitude, size]);

  return (
    <Marker
      coordinate={coordinate}
      title={title}
      description={description}
      onPress={onPress}
      tracksViewChanges={tracksViewChanges}
      // Position the marker so the tip of the icon matches the map location.
      anchor={{ x: 0.5, y: 0.92 }}
    >
      {/* Fixed wrapper helps the custom SVG render at the correct size. */}
      <View
        style={[styles.markerWrap, { width: size, height: size }]}
        collapsable={false}
      >
        <TrackingMarker width={size} height={size} />
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  markerWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
});