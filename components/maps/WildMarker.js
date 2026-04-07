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
  const [tracksViewChanges, setTracksViewChanges] = useState(true);

  useEffect(() => {
    setTracksViewChanges(true);

    const timeout = setTimeout(() => {
      setTracksViewChanges(false);
    }, 800);

    return () => clearTimeout(timeout);
  }, [coordinate?.latitude, coordinate?.longitude, size]);

  return (
    <Marker
      coordinate={coordinate}
      title={title}
      description={description}
      onPress={onPress}
      tracksViewChanges={tracksViewChanges}
      anchor={{ x: 0.5, y: 0.92 }}
    >
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