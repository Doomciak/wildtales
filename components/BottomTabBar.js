import { Pressable, StyleSheet, Text, View } from "react-native";

const tabs = [
  { key: "home", label: "Home" },
  { key: "map", label: "Map" },
  { key: "safety", label: "Safety" },
  { key: "add", label: "Add Place" },
];

export default function BottomTabBar({ activeTab, onSelectTab }) {
  return (
    <View style={styles.tabBar}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;

        return (
          <Pressable
            key={tab.key}
            style={[styles.tabButton, isActive && styles.tabActive]}
            onPress={() => onSelectTab(tab.key)}
          >
            <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 24,
    backgroundColor: "#10251B",
    borderTopWidth: 1,
    borderTopColor: "#183328",
  },
  tabButton: {
    flex: 1,
    backgroundColor: "#183328",
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: "#F4F7F3",
  },
  tabLabel: {
    color: "#D3DED7",
    fontSize: 12,
    fontWeight: "600",
  },
  tabLabelActive: {
    color: "#183126",
  },
});