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
  // This controls whether the marker view should still be tracked by the map.
  // It is turned on briefly when something changes so the custom SVG updates properly.
  const [tracksViewChanges, setTracksViewChanges] = useState(true);

  useEffect(() => {
    // Re-enable tracking when marker position or size changes.
    setTracksViewChanges(true);

    // After a short delay, turn it off again to avoid unnecessary re-renders
    // and improve map performance.
    const timeout = setTimeout(() => {
      setTracksViewChanges(false);
    }, 800);

    // Clean up the timeout if the component updates again or gets removed.
    return () => clearTimeout(timeout);
  }, [coordinate?.latitude, coordinate?.longitude, size]);

  return (
    <Marker
      coordinate={coordinate} // location where the marker should appear
      title={title} // optional title shown by the map
      description={description} // optional extra text for the marker
      onPress={onPress} // runs when the marker is tapped
      tracksViewChanges={tracksViewChanges} // keeps SVG refreshing only when needed
      anchor={{ x: 0.5, y: 0.92 }} // makes the bottom of the icon point to the exact spot
    >
      {/* Wrapper keeps the custom marker at the right size */}
      <View
        style={[styles.markerWrap, { width: size, height: size }]}
        collapsable={false}
      >
        {/* Custom SVG used instead of the default map pin */}
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