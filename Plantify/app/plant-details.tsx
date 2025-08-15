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

export default function PlantDetails() {
  // Recibe los parámetros por router
  const params = useLocalSearchParams();
  const { id } = params;
  const [userPlant, setUserPlant] = useState<UserPlant | null>(null);
  const [loading, setLoading] = useState(true);
  const colorScheme = useColorScheme() ?? "light";
  const { getUserId, accessToken, refreshToken, setTokens } = useAuth();
  const cardBackground = colorScheme === "dark" ? "#222" : "#fff"; // O los colores que prefieras

  useEffect(() => {
    const fetchPlant = async () => {
      try {
        const data = await PlantService.getUserPlantById(Number(id), accessToken!);
        setUserPlant(data);
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
      title: userPlant?.plant.common_name
        ? userPlant.plant.common_name.charAt(0).toUpperCase() + userPlant.plant.common_name.slice(1)
        : "Detalles de la planta",
    });
  }, [navigation, userPlant]);

  if (loading) {
    return <ActivityIndicator size="large" style={{ marginTop: 32 }} />;
  }

  if (!userPlant) {
    return <ThemedText type="title">No plant found.</ThemedText>;
  }

  return (
    <ParallaxScrollView
      headerImage={
        <Image
          source={{ uri: userPlant.plant.image!! }}
          style={{ width: '100%', height: 250 }} // Ocupa todo el header
          resizeMode="cover"
        />
      }
      headerBackgroundColor={{ light: '#4CAF50', dark: '#222' }}
    >
      <ThemedView style={styles.container}>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <ThemedText type="title" style={{ textAlign: 'center' }}>
            {userPlant.plant.common_name
              ? userPlant.plant.common_name.charAt(0).toUpperCase() + userPlant.plant.common_name.slice(1)
              : ""}
          </ThemedText>
          <ThemedText type="default">{userPlant.plant.scientific_name}</ThemedText>
        </View>
        <TouchableOpacity
          key={userPlant.id}
          onPress={() => {
            router.replace({
              pathname: `/plant-settings`,
              params: { plant: JSON.stringify(userPlant) }
            })
          }}
          style={{ justifyContent: 'flex-end' }}
        >
          <Ionicons name="settings-outline" size={24} color={"#bfd8c5ff"} />
        </TouchableOpacity>
      </ThemedView>
      <ThemedView style={[styles.card, { backgroundColor: cardBackground }]}>
        <ThemedText type="title2">🌱 Plant Details</ThemedText>
        <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" }}>
          {[
            userPlant.plant.care_level && { label: "🪴 Care Level", value: userPlant.plant.care_level },
            userPlant.plant.cones && { label: "🌲 Cones", value: userPlant.plant.cones },
            userPlant.plant.cuisine && { label: "🍽️ Cuisine", value: userPlant.plant.cuisine },
            userPlant.plant.cycle && { label: "🔄 Cycle", value: userPlant.plant.cycle },
            userPlant.plant.drought_tolerant && { label: "🌵 Drought Tolerant", value: userPlant.plant.drought_tolerant },
            userPlant.plant.edible_fruit && { label: "🍏 Edible Fruit", value: userPlant.plant.edible_fruit },
            userPlant.plant.edible_leaf && { label: "🥬 Edible Leaf", value: userPlant.plant.edible_leaf },
            userPlant.plant.flowering_season && { label: "🌸 Flowering Season", value: userPlant.plant.flowering_season },
            userPlant.plant.flowers && { label: "🌼 Flowers", value: userPlant.plant.flowers },
            userPlant.plant.fruiting_season && { label: "🍒 Fruiting Season", value: userPlant.plant.fruiting_season },
            userPlant.plant.fruits && { label: "🍎 Fruits", value: userPlant.plant.fruits },
            userPlant.plant.growth_rate && { label: "📈 Growth Rate", value: userPlant.plant.growth_rate },
            userPlant.plant.harvest_method && { label: "🧺 Harvest Method", value: userPlant.plant.harvest_method },
            userPlant.plant.harvest_season && { label: "🌾 Harvest Season", value: userPlant.plant.harvest_season },
            userPlant.plant.indoor && { label: "🏠 Indoor", value: userPlant.plant.indoor },
            userPlant.plant.invasive && { label: "🚫 Invasive", value: userPlant.plant.invasive },
            userPlant.plant.leaf && { label: "🍃 Leaf", value: userPlant.plant.leaf },
            userPlant.plant.maintenance && { label: "🛠️ Maintenance", value: userPlant.plant.maintenance },
            userPlant.plant.medicinal && { label: "💊 Medicinal", value: userPlant.plant.medicinal },
            userPlant.plant.pest_susceptibility && { label: "🐛 Pest Susceptibility", value: userPlant.plant.pest_susceptibility },
            userPlant.plant.poisonous_to_humans && { label: "☠️ Poisonous to Humans", value: userPlant.plant.poisonous_to_humans },
            userPlant.plant.poisonous_to_pets && { label: "🐾 Poisonous to Pets", value: userPlant.plant.poisonous_to_pets },
            userPlant.plant.pruning_month && { label: "🗓️ Pruning Month", value: userPlant.plant.pruning_month },
            userPlant.plant.rare && { label: "🦄 Rare", value: userPlant.plant.rare },
            userPlant.plant.salt_tolerant && { label: "🧂 Salt Tolerant", value: userPlant.plant.salt_tolerant },
            userPlant.plant.soil && { label: "🌱 Soil", value: userPlant.plant.soil },
            userPlant.plant.thorny && { label: "🌵 Thorny", value: userPlant.plant.thorny },
            userPlant.plant.tropical && { label: "🌴 Tropical", value: userPlant.plant.tropical },
            userPlant.plant.watering && { label: "💧 Watering", value: userPlant.plant.watering },
            userPlant.plant.sun && { label: "🌞 Sun", value: userPlant.plant.sun },
            userPlant.plant.edible && { label: "🥗 Edible", value: userPlant.plant.edible },
            userPlant.plant.hardiness && { label: "❄️ Hardiness", value: userPlant.plant.hardiness },
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
      {userPlant.plant.watering_period && userPlant.plant.watering_period.length > 0 && (
        <ThemedView style={[styles.card, { backgroundColor: cardBackground }]}>
          <ThemedText type="title2">💧 Watering Frequency</ThemedText>
          <PlantWateringChart periods={userPlant.plant.watering_period} />
          {userPlant.plant.watering_long && (
            <ThemedView style={[{ backgroundColor: cardBackground }]}>
              <ThemedText type="default">{userPlant.plant.watering_long}</ThemedText>
            </ThemedView>
          )}
        </ThemedView>
      )}

      {userPlant.plant.sunlight && (
        <ThemedView style={[
          styles.card,
          { backgroundColor: cardBackground }
        ]}>
          <ThemedText type="title2">☀️ Sunlight</ThemedText>
          <ThemedText type="default">{userPlant.plant.sunlight}</ThemedText>
        </ThemedView>
      )}
      {userPlant.plant.pruning && (
        <ThemedView style={[
          styles.card,
          { backgroundColor: cardBackground }
        ]}>
          <ThemedText type="title2">✂️ Pruning</ThemedText>
          <ThemedText type="default">{userPlant.plant.pruning}</ThemedText>
        </ThemedView>
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