import { router, useLocalSearchParams, useNavigation } from "expo-router";
import { View, Image, StyleSheet, ScrollView, ActivityIndicator, useColorScheme, TouchableOpacity } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { PlantDetailTrefle, PlantTrefle } from "@/models/PlanTrefle";
import { useEffect, useLayoutEffect, useState, useCallback } from "react";
import { PlantService } from "@/services/plantsService";
import { ThemedView } from "@/components/ThemedView";
import { PlantInfo } from "@/models/PlantInfo";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import Ionicons from "@expo/vector-icons/build/Ionicons";
import PlantWateringChart from "@/components/PlantWateringChart";
import { UserPlant } from "@/models/Plant";
import { useAuth } from "@/hooks/useAuthContext";
import { Colors } from "@/constants/Colors";
import { useFocusEffect } from '@react-navigation/native';

export default function PlantDetails() {
  // Recibe los parámetros por router
  const params = useLocalSearchParams();
  const { id } = params;
  const [userPlant, setUserPlant] = useState<UserPlant | null>(null);
  const [loading, setLoading] = useState(true);
  const colorScheme = useColorScheme() ?? "light";
  const { getUserId, accessToken, refreshToken, setTokens } = useAuth();
  const cardBackground = colorScheme === "dark" ? "#222" : "#fff";
  const [showMenu, setShowMenu] = useState(false);

  const fetchPlant = useCallback(async () => {
    if (!id || !accessToken) return;
    try {
      const data = await PlantService.getUserPlantById(Number(id), accessToken);
      setUserPlant(data);
    } catch (error) {
      console.error("Error fetching plant details:", error);
    } finally {
      setLoading(false);
    }
  }, [id, accessToken]);

  useEffect(() => {
    fetchPlant();
  }, [fetchPlant]);

  // Refetch when returning to this screen (e.g., after creating a post)
  useFocusEffect(
    useCallback(() => {
      fetchPlant();
    }, [fetchPlant])
  );

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

  const goToPostDetails = (postId: number) => {
    router.push({
      pathname: "/post-details",
      params: { id: postId }
    });
  }

  const handleAdd = () => {
    setShowMenu(!showMenu);
  };

  const handleCreatePost = () => {
    setShowMenu(false);
    router.push({
      pathname: '/post-form',
      params: { plant_id: userPlant.plant_id, plantName: userPlant.common_name }
    });
  };

  return (
    <View style={{ flex: 1 }}
    >
      <ParallaxScrollView
        headerImage={
          <Image
            source={{ uri: userPlant.custom_image ? userPlant.custom_image : userPlant.image }}
            style={{ width: '100%', height: 250 }} // Ocupa todo el header
            resizeMode="cover"
          />
        }
        headerBackgroundColor={{ light: '#4CAF50', dark: '#222' }}
      >
        <ThemedView style={styles.container}>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <ThemedText type="title" style={{ textAlign: 'center' }}>
              {userPlant.custom_name || userPlant.common_name!.charAt(0).toUpperCase() + userPlant.common_name!.slice(1)}
            </ThemedText>
            {userPlant.custom_name &&
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
          <ThemedText type="title2">📋 Basic Information</ThemedText>
          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>Family:</ThemedText>
            <ThemedText style={styles.infoValue}>{userPlant.perenual_details!.family || 'N/A'}</ThemedText>
          </View>
          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>Genus:</ThemedText>
            <ThemedText style={styles.infoValue}>{userPlant.perenual_details!.genus || 'N/A'}</ThemedText>
          </View>
          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>Type:</ThemedText>
            <ThemedText style={styles.infoValue}>{userPlant.perenual_details!.type || 'N/A'}</ThemedText>
          </View>
          {userPlant.perenual_details!.cultivar && (
            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>Cultivar:</ThemedText>
              <ThemedText style={styles.infoValue}>{userPlant.perenual_details!.cultivar}</ThemedText>
            </View>
          )}
          {userPlant.perenual_details!.origin && userPlant.perenual_details!.origin.length > 0 && (
            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>Origin:</ThemedText>
              <ThemedText style={styles.infoValue}>{userPlant.perenual_details!.origin.join(', ')}</ThemedText>
            </View>
          )}
        </ThemedView>

        {/* Descripción */}
        {userPlant.perenual_details!.description && (
          <ThemedView style={[styles.card, { backgroundColor: cardBackground }]}>
            <ThemedText type="title2">📝 Description</ThemedText>
            <ThemedText style={styles.description}>{userPlant.perenual_details!.description}</ThemedText>
          </ThemedView>
        )}

        {/* Dimensiones */}
        {userPlant.perenual_details!.dimensions && userPlant.perenual_details!.dimensions.length > 0 && (
          <ThemedView style={[styles.card, { backgroundColor: cardBackground }]}>
            <ThemedText type="title2">📏 Dimensions</ThemedText>
            {userPlant.perenual_details!.dimensions.map((dimension, index) => (
              <View key={index} style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>{dimension.type}:</ThemedText>
                <ThemedText style={styles.infoValue}>
                  {dimension.min_value === dimension.max_value
                    ? `${dimension.min_value} ${dimension.unit}`
                    : `${dimension.min_value} - ${dimension.max_value} ${dimension.unit}`
                  }
                </ThemedText>
              </View>
            ))}
          </ThemedView>
        )}

        {/* Anatomía de la planta */}
        {userPlant.perenual_details!.plant_anatomy && userPlant.perenual_details!.plant_anatomy.length > 0 && (
          <ThemedView style={[styles.card, { backgroundColor: cardBackground }]}>
            <ThemedText type="title2">🌿 Plant Anatomy</ThemedText>
            {userPlant.perenual_details!.plant_anatomy.map((anatomy, index) => (
              <View key={index} style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>{anatomy.part.charAt(0).toUpperCase() + anatomy.part.slice(1)}:</ThemedText>
                <ThemedText style={styles.infoValue}>{anatomy.color.join(', ')}</ThemedText>
              </View>
            ))}
          </ThemedView>
        )}

        {/* Hardiness */}
        {userPlant.perenual_details!.hardiness && (
          <ThemedView style={[styles.card, { backgroundColor: cardBackground }]}>
            <ThemedText type="title2">❄️ Cold Resistance</ThemedText>
            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>Zone:</ThemedText>
              <ThemedText style={styles.infoValue}>
                {userPlant.perenual_details!.hardiness.min === userPlant.perenual_details!.hardiness.max
                  ? userPlant.perenual_details!.hardiness.min
                  : `${userPlant.perenual_details!.hardiness.min} - ${userPlant.perenual_details!.hardiness.max}`
                }
              </ThemedText>
            </View>
            <ThemedText style={[styles.description, { fontSize: 12, fontStyle: 'italic', color: '#666' }]}>
              Zone {userPlant.perenual_details!.hardiness.min === userPlant.perenual_details!.hardiness.max ? userPlant.perenual_details!.hardiness.min : `${userPlant.perenual_details!.hardiness.min}-${userPlant.perenual_details!.hardiness.max}`} indicates the minimum winter temperature this plant can survive. Lower numbers = colder climates.
            </ThemedText>
          </ThemedView>
        )}

        {/* Características de cuidado */}
        <ThemedView style={[styles.card, { backgroundColor: cardBackground }]}>
          <ThemedText type="title2">🌱 Care Information</ThemedText>
          <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" }}>
            {[
              userPlant.perenual_details!.care_level && { label: "🪴 Care Level", value: userPlant.perenual_details!.care_level },
              userPlant.perenual_details!.cycle && { label: "🔄 Cycle", value: userPlant.perenual_details!.cycle },
              userPlant.perenual_details!.growth_rate && { label: "📈 Growth Rate", value: userPlant.perenual_details!.growth_rate },
              userPlant.perenual_details!.maintenance && { label: "🛠️ Maintenance", value: userPlant.perenual_details!.maintenance },
              userPlant.perenual_details!.watering && { label: "💧 Watering", value: userPlant.perenual_details!.watering },
              userPlant.perenual_details!.drought_tolerant !== undefined && { label: "🌵 Drought Tolerant", value: userPlant.perenual_details!.drought_tolerant ? 'Yes' : 'No' },
              userPlant.perenual_details!.salt_tolerant !== undefined && { label: "🧂 Salt Tolerant", value: userPlant.perenual_details!.salt_tolerant ? 'Yes' : 'No' },
              userPlant.perenual_details!.indoor !== undefined && { label: "🏠 Indoor", value: userPlant.perenual_details!.indoor ? 'Yes' : 'No' },
              userPlant.perenual_details!.tropical !== undefined && { label: "🌴 Tropical", value: userPlant.perenual_details!.tropical ? 'Yes' : 'No' },
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

        {/* Características físicas */}
        <ThemedView style={[styles.card, { backgroundColor: cardBackground }]}>
          <ThemedText type="title2">🌸 Physical Characteristics</ThemedText>
          <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" }}>
            {[
              userPlant.perenual_details!.flowers !== undefined && { label: "🌼 Flowers", value: userPlant.perenual_details!.flowers ? 'Yes' : 'No' },
              userPlant.perenual_details!.cones !== undefined && { label: "🌲 Cones", value: userPlant.perenual_details!.cones ? 'Yes' : 'No' },
              userPlant.perenual_details!.fruits !== undefined && { label: "🍎 Fruits", value: userPlant.perenual_details!.fruits ? 'Yes' : 'No' },
              userPlant.perenual_details!.leaf !== undefined && { label: "🍃 Leaf", value: userPlant.perenual_details!.leaf ? 'Yes' : 'No' },
              userPlant.perenual_details!.thorny !== undefined && { label: "🌵 Thorny", value: userPlant.perenual_details!.thorny ? 'Yes' : 'No' },
              userPlant.perenual_details!.seeds !== undefined && { label: "🌰 Seeds", value: userPlant.perenual_details!.seeds ? 'Yes' : 'No' },
              userPlant.perenual_details!.flowering_season && { label: "🌸 Flowering Season", value: userPlant.perenual_details!.flowering_season },
              userPlant.perenual_details!.harvest_season && { label: "🌾 Harvest Season", value: userPlant.perenual_details!.harvest_season },
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

        {/* Características de uso */}
        <ThemedView style={[styles.card, { backgroundColor: cardBackground }]}>
          <ThemedText type="title2">🍽️ Usage & Safety</ThemedText>
          <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" }}>
            {[
              userPlant.perenual_details!.edible_fruit !== undefined && { label: "🍏 Edible Fruit", value: userPlant.perenual_details!.edible_fruit ? 'Yes' : 'No' },
              userPlant.perenual_details!.edible_leaf !== undefined && { label: "🥬 Edible Leaf", value: userPlant.perenual_details!.edible_leaf ? 'Yes' : 'No' },
              userPlant.perenual_details!.cuisine !== undefined && { label: "🍽️ Cuisine", value: userPlant.perenual_details!.cuisine ? 'Yes' : 'No' },
              userPlant.perenual_details!.medicinal !== undefined && { label: "💊 Medicinal", value: userPlant.perenual_details!.medicinal ? 'Yes' : 'No' },
              userPlant.perenual_details!.poisonous_to_humans !== undefined && { label: "☠️ Poisonous to Humans", value: userPlant.perenual_details!.poisonous_to_humans ? 'Yes' : 'No' },
              userPlant.perenual_details!.poisonous_to_pets !== undefined && { label: "🐾 Poisonous to Pets", value: userPlant.perenual_details!.poisonous_to_pets ? 'Yes' : 'No' },
              userPlant.perenual_details!.invasive !== undefined && { label: "🚫 Invasive", value: userPlant.perenual_details!.invasive ? 'Yes' : 'No' },
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

        {/* Propagación */}
        {userPlant.perenual_details!.propagation && userPlant.perenual_details!.propagation.length > 0 && (
          <ThemedView style={[styles.card, { backgroundColor: cardBackground }]}>
            <ThemedText type="title2">🌱 Propagation Methods</ThemedText>
            <View style={styles.tagContainer}>
              {userPlant.perenual_details!.propagation.map((method, index) => (
                <View key={index} style={styles.tag}>
                  <ThemedText style={styles.tagText}>{method}</ThemedText>
                </View>
              ))}
            </View>
          </ThemedView>
        )}

        {/* Atracciones (si hay) */}
        {userPlant.perenual_details!.attracts && userPlant.perenual_details!.attracts.length > 0 && (
          <ThemedView style={[styles.card, { backgroundColor: cardBackground }]}>
            <ThemedText type="title2">🦋 Attracts</ThemedText>
            <View style={styles.tagContainer}>
              {userPlant.perenual_details!.attracts.map((attraction, index) => (
                <View key={index} style={styles.tag}>
                  <ThemedText style={styles.tagText}>{attraction}</ThemedText>
                </View>
              ))}
            </View>
          </ThemedView>
        )}
        {userPlant.perenual_details!.watering_general_benchmark && (
          <ThemedView style={[styles.card, { backgroundColor: cardBackground }]}>
            <ThemedText type="title2">💧 Watering Information</ThemedText>
            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>Frequency:</ThemedText>
              <ThemedText style={styles.infoValue}>{userPlant.perenual_details!.watering || 'N/A'}</ThemedText>
            </View>
            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>Every:</ThemedText>
              <ThemedText style={styles.infoValue}>
                {userPlant.perenual_details!.watering_general_benchmark.value} {userPlant.perenual_details!.watering_general_benchmark.unit}
              </ThemedText>
            </View>
            {userPlant.perenual_details!.watering_long && (
              <ThemedText style={styles.description}>{userPlant.perenual_details!.watering_long}</ThemedText>
            )}
          </ThemedView>
        )}

        {userPlant.perenual_details!.sunlight && userPlant.perenual_details!.sunlight.length > 0 && (
          <ThemedView style={[
            styles.card,
            { backgroundColor: cardBackground }
          ]}>
            <ThemedText type="title2">☀️ Sunlight Requirements</ThemedText>
            <View style={styles.tagContainer}>
              {userPlant.perenual_details!.sunlight.map((lightType, index) => (
                <View key={index} style={styles.tag}>
                  <ThemedText style={styles.tagText}>{lightType}</ThemedText>
                </View>
              ))}
            </View>
            {userPlant.perenual_details!.sunlight_long && (
              <ThemedText style={styles.description}>{userPlant.perenual_details!.sunlight_long}</ThemedText>
            )}
          </ThemedView>
        )}
        {(userPlant.perenual_details!.pruning_month && userPlant.perenual_details!.pruning_month.length > 0) || userPlant.perenual_details!.pruning && (
          <ThemedView style={[
            styles.card,
            { backgroundColor: cardBackground }
          ]}>
            <ThemedText type="title2">✂️ Pruning Information</ThemedText>
            {userPlant.perenual_details!.pruning_month && userPlant.perenual_details!.pruning_month.length > 0 && (
              <View>
                <View style={styles.infoRow}>
                  <ThemedText style={styles.infoLabel}>Best months:</ThemedText>
                </View>
                <View style={styles.tagContainer}>
                  {userPlant.perenual_details!.pruning_month.map((month, index) => (
                    <View key={index} style={styles.tag}>
                      <ThemedText style={styles.tagText}>{month}</ThemedText>
                    </View>
                  ))}
                </View>
              </View>
            )}
            {userPlant.perenual_details!.pruning && (
              <ThemedText style={styles.description}>{userPlant.perenual_details!.pruning}</ThemedText>
            )}
          </ThemedView>
        )}

        {/* Guías de cuidado */}
        {userPlant.perenual_details!.care_guides && typeof userPlant.perenual_details!.care_guides === 'object' && userPlant.perenual_details!.care_guides.data && userPlant.perenual_details!.care_guides.data.length > 0 && (
          <ThemedView style={[styles.card, { backgroundColor: cardBackground }]}>
            <ThemedText type="title2">📖 Care Guides</ThemedText>
            {userPlant.perenual_details!.care_guides.data.map((guide: any, guideIndex: number) => (
              <View key={guideIndex}>
                {guide.section && guide.section.map((section: any, sectionIndex: number) => (
                  <View key={sectionIndex} style={styles.careGuideSection}>
                    <ThemedText style={styles.careGuideTitle}>
                      {section.type.charAt(0).toUpperCase() + section.type.slice(1)}
                    </ThemedText>
                    <ThemedText style={styles.description}>{section.description}</ThemedText>
                  </View>
                ))}
              </View>
            ))}
          </ThemedView>
        )}
        {userPlant.posts && userPlant.posts.length > 0 && (
          <>
            <ThemedText type="title2">Posts</ThemedText>
            <View>
              {userPlant.posts.map((post) => (
                <TouchableOpacity
                  key={post.id}
                  onPress={() => goToPostDetails(post.id!)}
                  style={[styles.card, { backgroundColor: cardBackground }]}
                >
                  <ThemedText type="title2" style={{ color: "#4CAF50" }}>
                    {post.title}
                  </ThemedText>
                  <ThemedText type="default" style={{ fontSize: 12 }}>
                    Autor: {post.author} | {new Date(post.created_at!).toLocaleDateString()}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {userPlant.posts && userPlant.posts.length == 0 && (
          <ThemedText type="default">No posts for this plant.</ThemedText>
        )}
      </ParallaxScrollView>
      {/* Menú desplegable */}
      {showMenu && (
        <View style={styles.menuContainer}>
          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: Colors.light.tint }]}
            onPress={handleCreatePost}
          >
            <Ionicons name="create" size={20} color="#333" />
            <ThemedText style={styles.menuText}>Create Post</ThemedText>
          </TouchableOpacity>
        </View>
      )}

      {/* Overlay para cerrar el menú al tocar fuera */}
      {showMenu && (
        <TouchableOpacity
          style={styles.overlay}
          onPress={() => setShowMenu(false)}
          activeOpacity={1}
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={handleAdd}>
        <Ionicons
          name={showMenu ? "close" : "add"}
          size={24}
          color="#333"
        />
      </TouchableOpacity>
    </View>
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
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  infoLabel: {
    fontWeight: 'bold',
    minWidth: 100,
    marginRight: 8,
  },
  infoValue: {
    flex: 1,
  },
  description: {
    marginTop: 8,
    lineHeight: 20,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  tag: {
    backgroundColor: '#e8f5e8',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 12,
    color: '#2e7d2e',
    fontWeight: '500',
  },
  careGuideSection: {
    marginBottom: 16,
  },
  careGuideTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
    color: '#4CAF50',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.light.tint,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    zIndex: 1000, // Asegura que esté por encima de otros elementos
  },
  menuContainer: {
    position: 'absolute',
    bottom: 100, // Justo encima del FAB
    right: 20,
    backgroundColor: 'transparent',
    borderRadius: 8,
    zIndex: 999,
    gap: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 25,
    minWidth: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    gap: 8,
  },
  menuText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 998,
  },
});