import { router, useLocalSearchParams, useNavigation } from "expo-router";
import { View, Image, StyleSheet, ScrollView, ActivityIndicator, useColorScheme, TouchableOpacity } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { PlantDetailTrefle, PlantTrefle } from "@/models/PlanTrefle";
import { useEffect, useLayoutEffect, useState } from "react";
import { PlantService } from "@/services/plantsService";
import { ThemedView } from "@/components/ThemedView";
import { PlantInfo } from "@/models/PlantInfo";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import Ionicons from "@expo/vector-icons/build/Ionicons";
import PlantWateringChart from "@/components/PlantWateringChart";
import { UserPlant } from "@/models/Plant";
import { useAuth } from "@/hooks/useAuthContext";

export default function PlantInfoDetails() {
  // Recibe los parámetros por router
  const params = useLocalSearchParams();
  const { id } = params;
  const [plant, setPlant] = useState<PlantInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const colorScheme = useColorScheme() ?? "light";
  const { getUserId, accessToken, refreshToken, setTokens } = useAuth();
  const cardBackground = colorScheme === "dark" ? "#222" : "#fff"; // O los colores que prefieras

  useEffect(() => {
    const fetchPlant = async () => {
      try {
        const data = await PlantService.getPlantInfoById(Number(id));
        console.log("Fetched plant data:", data);
        setPlant(data);
      } catch (error) {
        console.error("Error fetching plant details:", error);
      }
      setLoading(false);
    };
    if (id) fetchPlant();
  }, [id]);

  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({
      title: plant?.common_name
        ? plant.common_name.charAt(0).toUpperCase() + plant.common_name.slice(1)
        : "Detalles de la planta",
    });
  }, [navigation, plant]);

  if (loading) {
    return <ActivityIndicator size="large" style={{ marginTop: 32 }} />;
  }

  if (!plant) {
    return <ThemedText type="title">No plant found.</ThemedText>;
  }

  const goToPostDetails = (postId: number) => {
    router.push({
      pathname: "/post-details",
      params: { id: postId }
    });
  }

return (
  <ParallaxScrollView
    headerImage={
      <Image
        source={{ uri: plant.image!! }}
        style={{ width: '100%', height: 250 }} // Ocupa todo el header
        resizeMode="cover"
      />
    }
    headerBackgroundColor={{ light: '#4CAF50', dark: '#222' }}
  >
    <ThemedView style={styles.container}>
      <View style={{ flex: 1, alignItems: 'center' }}>
        <ThemedText type="title" style={{ textAlign: 'center' }}>
          {plant.common_name
            ? plant.common_name.charAt(0).toUpperCase() + plant.common_name.slice(1)
            : ""}
        </ThemedText>
        <ThemedText type="default">{plant.scientific_name}</ThemedText>
      </View>
    </ThemedView>
    <ThemedView style={[styles.card, { backgroundColor: cardBackground }]}>
      <ThemedText type="title2">🌱 Plant Details</ThemedText>
      <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" }}>
        {[
          plant.care_level && { label: "🪴 Care Level", value: plant.care_level },
          plant.cones && { label: "🌲 Cones", value: plant.cones },
          plant.cuisine && { label: "🍽️ Cuisine", value: plant.cuisine },
          plant.cycle && { label: "🔄 Cycle", value: plant.cycle },
          plant.drought_tolerant && { label: "🌵 Drought Tolerant", value: plant.drought_tolerant },
          plant.edible_fruit && { label: "🍏 Edible Fruit", value: plant.edible_fruit },
          plant.edible_leaf && { label: "🥬 Edible Leaf", value: plant.edible_leaf },
          plant.flowering_season && { label: "🌸 Flowering Season", value: plant.flowering_season },
          plant.flowers && { label: "🌼 Flowers", value: plant.flowers },
          plant.fruiting_season && { label: "🍒 Fruiting Season", value: plant.fruiting_season },
          plant.fruits && { label: "🍎 Fruits", value: plant.fruits },
          plant.growth_rate && { label: "📈 Growth Rate", value: plant.growth_rate },
          plant.harvest_method && { label: "🧺 Harvest Method", value: plant.harvest_method },
          plant.harvest_season && { label: "🌾 Harvest Season", value: plant.harvest_season },
          plant.indoor && { label: "🏠 Indoor", value: plant.indoor },
          plant.invasive && { label: "🚫 Invasive", value: plant.invasive },
          plant.leaf && { label: "🍃 Leaf", value: plant.leaf },
          plant.maintenance && { label: "🛠️ Maintenance", value: plant.maintenance },
          plant.medicinal && { label: "💊 Medicinal", value: plant.medicinal },
          plant.pest_susceptibility && { label: "🐛 Pest Susceptibility", value: plant.pest_susceptibility },
          plant.poisonous_to_humans && { label: "☠️ Poisonous to Humans", value: plant.poisonous_to_humans },
          plant.poisonous_to_pets && { label: "🐾 Poisonous to Pets", value: plant.poisonous_to_pets },
          plant.pruning_month && { label: "🗓️ Pruning Month", value: plant.pruning_month },
          plant.rare && { label: "🦄 Rare", value: plant.rare },
          plant.salt_tolerant && { label: "🧂 Salt Tolerant", value: plant.salt_tolerant },
          plant.soil && { label: "🌱 Soil", value: plant.soil },
          plant.thorny && { label: "🌵 Thorny", value: plant.thorny },
          plant.tropical && { label: "🌴 Tropical", value: plant.tropical },
          plant.watering && { label: "💧 Watering", value: plant.watering },
          plant.sun && { label: "🌞 Sun", value: plant.sun },
          plant.edible && { label: "🥗 Edible", value: plant.edible },
          plant.hardiness && { label: "❄️ Hardiness", value: plant.hardiness },
        ]
          .filter(Boolean)
          .map((item, idx) =>
            typeof item === "object" && item !== null ? (
              <ThemedText key={idx} style={{ width: "48%", marginBottom: 8 }}>
                {item.label}: {item.value}
              </ThemedText>
            ) : null
          )
        }
      </View>
    </ThemedView>
    {plant.watering_period && plant.watering_period.length > 0 && (
      <ThemedView style={[styles.card, { backgroundColor: cardBackground }]}>
        <ThemedText type="title2">💧 Watering Frequency</ThemedText>
        <PlantWateringChart periods={plant.watering_period} />
        {plant.watering_long && (
          <ThemedView style={[{ backgroundColor: cardBackground }]}>
            <ThemedText type="default">{plant.watering_long}</ThemedText>
          </ThemedView>
        )}
      </ThemedView>
    )}

    {plant.sunlight && (
      <ThemedView style={[
        styles.card,
        { backgroundColor: cardBackground }
      ]}>
        <ThemedText type="title2">☀️ Sunlight</ThemedText>
        <ThemedText type="default">{plant.sunlight}</ThemedText>
      </ThemedView>
    )}
    {plant.pruning && (
      <ThemedView style={[
        styles.card,
        { backgroundColor: cardBackground }
      ]}>
        <ThemedText type="title2">✂️ Pruning</ThemedText>
        <ThemedText type="default">{plant.pruning}</ThemedText>
      </ThemedView>
    )}
    {plant.posts && plant.posts.length > 0 && (
      <>
        <ThemedText type="title2">Posts</ThemedText>
        {plant.posts.map((post) => (
          <TouchableOpacity
            key={post.id}
            onPress={() => goToPostDetails(post.id)}
            style={[styles.card, { backgroundColor: cardBackground }]}
          >
            <ThemedText type="title2" style={{ color: "#4CAF50" }}>
              {post.title}
            </ThemedText>
            <ThemedText type="default" style={{ fontSize: 12 }}>
              Autor: {post.author} | {new Date(post.created_at).toLocaleDateString()}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </>
    )}
  </ParallaxScrollView>
);
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    padding: 4,
    alignItems: "center",
    display: "flex",
    flexDirection: "row",
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 16,
    marginBottom: 16,
  },
  card: {
    padding: 16,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});