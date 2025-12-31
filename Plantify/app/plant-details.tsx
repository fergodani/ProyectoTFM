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
        console.log(data);
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
      title: userPlant?.common_name
        ? userPlant.common_name!.charAt(0).toUpperCase() + userPlant.common_name!.slice(1)
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
          source={{ uri: userPlant.image!! }}
          style={{ width: '100%', height: 250 }} // Ocupa todo el header
          resizeMode="cover"
        />
      }
      headerBackgroundColor={{ light: '#4CAF50', dark: '#222' }}
    >
      <ThemedView style={styles.container}>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <ThemedText type="title" style={{ textAlign: 'center' }}>
            { userPlant.custom_name || userPlant.common_name!.charAt(0).toUpperCase() + userPlant.common_name!.slice(1)}
          </ThemedText>
          { userPlant.custom_name &&
            <ThemedText type="subtitle" style={{ textAlign: 'center', fontStyle: 'italic' }}>
              ({userPlant.common_name!.charAt(0).toUpperCase() + userPlant.common_name!.slice(1)})
            </ThemedText>

          }
          <ThemedText type="default">{userPlant.perenual_details!.scientific_name}</ThemedText>
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
        <ThemedText type="title2">{userPlant.perenual_details!.description}</ThemedText>
      </ThemedView>
      <ThemedView style={[styles.card, { backgroundColor: cardBackground }]}>
        <ThemedText type="title2">🌱 Plant Details</ThemedText>
        <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" }}>
          {[
            userPlant.perenual_details!.care_level && { label: "🪴 Care Level", value: userPlant.perenual_details!.care_level },
            userPlant.perenual_details!.cones && { label: "🌲 Cones", value: userPlant.perenual_details!.cones },
            userPlant.perenual_details!.cuisine && { label: "🍽️ Cuisine", value: userPlant.perenual_details!.cuisine },
            userPlant.perenual_details!.cycle && { label: "🔄 Cycle", value: userPlant.perenual_details!.cycle },
            userPlant.perenual_details!.drought_tolerant && { label: "🌵 Drought Tolerant", value: userPlant.perenual_details!.drought_tolerant },
            userPlant.perenual_details!.edible_fruit && { label: "🍏 Edible Fruit", value: userPlant.perenual_details!.edible_fruit },
            userPlant.perenual_details!.edible_leaf && { label: "🥬 Edible Leaf", value: userPlant.perenual_details!.edible_leaf },
            userPlant.perenual_details!.flowering_season && { label: "🌸 Flowering Season", value: userPlant.perenual_details!.flowering_season },
            userPlant.perenual_details!.flowers && { label: "🌼 Flowers", value: userPlant.perenual_details!.flowers },
            userPlant.perenual_details!.fruits && { label: "🍎 Fruits", value: userPlant.perenual_details!.fruits },
            userPlant.perenual_details!.growth_rate && { label: "📈 Growth Rate", value: userPlant.perenual_details!.growth_rate },
            userPlant.perenual_details!.harvest_season && { label: "🌾 Harvest Season", value: userPlant.perenual_details!.harvest_season },
            userPlant.perenual_details!.indoor && { label: "🏠 Indoor", value: userPlant.perenual_details!.indoor },
            userPlant.perenual_details!.invasive && { label: "🚫 Invasive", value: userPlant.perenual_details!.invasive },
            userPlant.perenual_details!.leaf && { label: "🍃 Leaf", value: userPlant.perenual_details!.leaf },
            userPlant.perenual_details!.maintenance && { label: "🛠️ Maintenance", value: userPlant.perenual_details!.maintenance },
            userPlant.perenual_details!.medicinal && { label: "💊 Medicinal", value: userPlant.perenual_details!.medicinal },
            userPlant.perenual_details!.pest_susceptibility && { label: "🐛 Pest Susceptibility", value: userPlant.perenual_details!.pest_susceptibility },
            userPlant.perenual_details!.poisonous_to_humans && { label: "☠️ Poisonous to Humans", value: userPlant.perenual_details!.poisonous_to_humans },
            userPlant.perenual_details!.poisonous_to_pets && { label: "🐾 Poisonous to Pets", value: userPlant.perenual_details!.poisonous_to_pets },
            userPlant.perenual_details!.pruning_month && { label: "🗓️ Pruning Month", value: userPlant.perenual_details!.pruning_month },
            userPlant.perenual_details!.salt_tolerant && { label: "🧂 Salt Tolerant", value: userPlant.perenual_details!.salt_tolerant },
            userPlant.perenual_details!.soil && { label: "🌱 Soil", value: userPlant.perenual_details!.soil },
            userPlant.perenual_details!.thorny && { label: "🌵 Thorny", value: userPlant.perenual_details!.thorny },
            userPlant.perenual_details!.tropical && { label: "🌴 Tropical", value: userPlant.perenual_details!.tropical },
            userPlant.perenual_details!.watering && { label: "💧 Watering", value: userPlant.perenual_details!.watering },
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
      {userPlant.perenual_details!.watering_general_benchmark && (
        <ThemedView style={[styles.card, { backgroundColor: cardBackground }]}>
          <ThemedText type="title2">💧 Watering Frequency</ThemedText>

          {userPlant.perenual_details!.watering && (
            <ThemedView style={[{ backgroundColor: cardBackground }]}>
              <ThemedText type="default">{userPlant.perenual_details!.watering_long}</ThemedText>
            </ThemedView>
          )}
        </ThemedView>
      )}

      {userPlant.perenual_details!.sunlight_long && (
        <ThemedView style={[
          styles.card,
          { backgroundColor: cardBackground }
        ]}>
          <ThemedText type="title2">☀️ Sunlight</ThemedText>
          <ThemedText type="default">{userPlant.perenual_details!.sunlight_long}</ThemedText>
        </ThemedView>
      )}
      {userPlant.perenual_details!.pruning && (
        <ThemedView style={[
          styles.card,
          { backgroundColor: cardBackground }
        ]}>
          <ThemedText type="title2">✂️ Pruning</ThemedText>
          <ThemedText type="default">{userPlant.perenual_details!.pruning}</ThemedText>
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