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
  return (
    <Marker
      coordinate={coordinate}
      title={title}
      description={description}
      onPress={onPress}
      tracksViewChanges={false}
    >
      <View
        style={[styles.svgMarkerWrap, { width: size, height: size }]}
        collapsable={false}
      >
        <TrackingMarker width={size} height={size} />
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  svgMarkerWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
});