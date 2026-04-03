import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import EmptyStateCard from "../components/EmptyStateCard";
import FeaturedPlaceCard from "../components/FeaturedPlaceCard";
import PlaceCard from "../components/PlaceCard";
import ScreenHeader from "../components/ScreenHeader";

export default function HomeScreen({
  places,
  totalPlacesCount,
  search,
  setSearch,
  onRemovePlace,
  onEditPlace,
}) {
  const featuredPlace = places[0];

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      <ScreenHeader
        eyebrow="Travel journal"
        title="WildTales"
        rightSlot={
          <Pressable style={styles.profileButton}>
            <Text style={styles.profileText}>DS</Text>
          </Pressable>
        }
      />

      <View style={styles.searchBox}>
        <TextInput
          placeholder="Search places"
          placeholderTextColor="#9fb2a6"
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {featuredPlace ? <FeaturedPlaceCard place={featuredPlace} /> : null}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Your places</Text>
        <Text style={styles.sectionLink}>{totalPlacesCount} saved</Text>
      </View>

      {places.length === 0 ? (
        <EmptyStateCard
          title="No places yet"
          text="Add your first memory to start your travel journal."
        />
      ) : (
        places.map((place) => (
          <PlaceCard
            key={place.id}
            place={place}
            onEdit={() => onEditPlace(place)}
            onDelete={() => onRemovePlace(place.id)}
          />
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingTop: 70,
    paddingBottom: 28,
    paddingHorizontal: 20,
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#294638",
    justifyContent: "center",
    alignItems: "center",
  },
  profileText: {
    color: "#EAF2EC",
    fontWeight: "700",
  },
  searchBox: {
    backgroundColor: "#183328",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 24,
  },
  searchInput: {
    color: "#F6FAF7",
    fontSize: 15,
    height: 48,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionTitle: {
    color: "#F6FAF7",
    fontSize: 20,
    fontWeight: "700",
  },
  sectionLink: {
    color: "#A7BBB0",
    fontSize: 14,
  },
});