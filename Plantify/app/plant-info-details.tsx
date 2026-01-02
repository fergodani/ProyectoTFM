import { router, useLocalSearchParams, useNavigation, useFocusEffect } from "expo-router";
import { View, Image, StyleSheet, ActivityIndicator, useColorScheme, TouchableOpacity } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { useEffect, useLayoutEffect, useState, useCallback } from "react";
import { PlantService } from "@/services/plantsService";
import { ThemedView } from "@/components/ThemedView";
import { PlantInfo } from "@/models/PlantInfo";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import Ionicons from "@expo/vector-icons/build/Ionicons";
import { useAuth } from "@/hooks/useAuthContext";
import { Colors } from "@/constants/Colors";

export default function PlantInfoDetails() {
  // Recibe los parámetros por router
  const params = useLocalSearchParams();
  const { id } = params;
  const [plant, setPlant] = useState<PlantInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const colorScheme = useColorScheme() ?? "light";
  const { } = useAuth();
  const cardBackground = colorScheme === "dark" ? "#222" : "#fff"; // O los colores que prefieras

  // Función para cargar los datos de la planta
  const fetchPlant = useCallback(async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const data = await PlantService.getPlantInfoById(Number(id));
      console.log("Fetched plant data:", data);
      setPlant(data);
    } catch (error) {
      console.error("Error fetching plant details:", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Efecto inicial para cargar los datos
  useEffect(() => {
    fetchPlant();
  }, [fetchPlant]);

  // Recargar datos cuando la pantalla regaina el foco
  useFocusEffect(
    useCallback(() => {
      console.log("Plant details screen focused - refreshing data");
      fetchPlant();
    }, [fetchPlant])
  );

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

  const handleAdd = () => {
    setShowMenu(!showMenu);
  };

  const handleAddToGarden = () => {
    setShowMenu(false);
    console.log(plant.default_image.original_url);
    router.push({
      pathname: "/garden-select",
      params: { 
        id, 
        watering_period: plant.watering_general_benchmark ? JSON.stringify(plant.watering_general_benchmark) : "",
        image_url: plant.default_image?.original_url || "",
        common_name: plant.common_name || "",
      }
    })
  };

  const handleCreatePost = () => {
    setShowMenu(false);
    router.push({
      pathname: '/post-form',
      params: { plantId: id, plantName: plant.common_name }
    });
  };

  return (
    <View style={{ flex: 1 }}>
      <ParallaxScrollView
        headerImage={
          <Image
            source={{ uri: plant.default_image?.original_url }}
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
        {/* Información básica */}
        <ThemedView style={[styles.card, { backgroundColor: cardBackground }]}>
          <ThemedText type="title2">📋 Basic Information</ThemedText>
          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>Family:</ThemedText>
            <ThemedText style={styles.infoValue}>{plant.family || 'N/A'}</ThemedText>
          </View>
          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>Genus:</ThemedText>
            <ThemedText style={styles.infoValue}>{plant.genus || 'N/A'}</ThemedText>
          </View>
          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>Type:</ThemedText>
            <ThemedText style={styles.infoValue}>{plant.type || 'N/A'}</ThemedText>
          </View>
          {plant.cultivar && (
            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>Cultivar:</ThemedText>
              <ThemedText style={styles.infoValue}>{plant.cultivar}</ThemedText>
            </View>
          )}
          {plant.origin && plant.origin.length > 0 && (
            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>Origin:</ThemedText>
              <ThemedText style={styles.infoValue}>{plant.origin.join(', ')}</ThemedText>
            </View>
          )}
        </ThemedView>

        {/* Descripción */}
        {plant.description && (
          <ThemedView style={[styles.card, { backgroundColor: cardBackground }]}>
            <ThemedText type="title2">📝 Description</ThemedText>
            <ThemedText style={styles.description}>{plant.description}</ThemedText>
          </ThemedView>
        )}

        {/* Dimensiones */}
        {plant.dimensions && plant.dimensions.length > 0 && (
          <ThemedView style={[styles.card, { backgroundColor: cardBackground }]}>
            <ThemedText type="title2">📏 Dimensions</ThemedText>
            {plant.dimensions.map((dimension, index) => (
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
        {plant.plant_anatomy && plant.plant_anatomy.length > 0 && (
          <ThemedView style={[styles.card, { backgroundColor: cardBackground }]}>
            <ThemedText type="title2">🌿 Plant Anatomy</ThemedText>
            {plant.plant_anatomy.map((anatomy, index) => (
              <View key={index} style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>{anatomy.part.charAt(0).toUpperCase() + anatomy.part.slice(1)}:</ThemedText>
                <ThemedText style={styles.infoValue}>{anatomy.color.join(', ')}</ThemedText>
              </View>
            ))}
          </ThemedView>
        )}

        {/* Hardiness */}
        {plant.hardiness && (
          <ThemedView style={[styles.card, { backgroundColor: cardBackground }]}>
            <ThemedText type="title2">❄️ Cold Resistance</ThemedText>
            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>Zone:</ThemedText>
              <ThemedText style={styles.infoValue}>
                {plant.hardiness.min === plant.hardiness.max 
                  ? plant.hardiness.min
                  : `${plant.hardiness.min} - ${plant.hardiness.max}`
                }
              </ThemedText>
            </View>
            <ThemedText style={[styles.description, { fontSize: 12, fontStyle: 'italic', color: '#666' }]}>
              Zone {plant.hardiness.min === plant.hardiness.max ? plant.hardiness.min : `${plant.hardiness.min}-${plant.hardiness.max}`} indicates the minimum winter temperature this plant can survive. Lower numbers = colder climates.
            </ThemedText>
          </ThemedView>
        )}

        {/* Características de cuidado */}
        <ThemedView style={[styles.card, { backgroundColor: cardBackground }]}>
          <ThemedText type="title2">🌱 Care Information</ThemedText>
          <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" }}>
            {[
              plant.care_level && { label: "🪴 Care Level", value: plant.care_level },
              plant.cycle && { label: "🔄 Cycle", value: plant.cycle },
              plant.growth_rate && { label: "📈 Growth Rate", value: plant.growth_rate },
              plant.maintenance && { label: "🛠️ Maintenance", value: plant.maintenance },
              plant.watering && { label: "💧 Watering", value: plant.watering },
              plant.drought_tolerant !== undefined && { label: "🌵 Drought Tolerant", value: plant.drought_tolerant ? 'Yes' : 'No' },
              plant.salt_tolerant !== undefined && { label: "🧂 Salt Tolerant", value: plant.salt_tolerant ? 'Yes' : 'No' },
              plant.indoor !== undefined && { label: "🏠 Indoor", value: plant.indoor ? 'Yes' : 'No' },
              plant.tropical !== undefined && { label: "🌴 Tropical", value: plant.tropical ? 'Yes' : 'No' },
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
              plant.flowers !== undefined && { label: "🌼 Flowers", value: plant.flowers ? 'Yes' : 'No' },
              plant.cones !== undefined && { label: "🌲 Cones", value: plant.cones ? 'Yes' : 'No' },
              plant.fruits !== undefined && { label: "🍎 Fruits", value: plant.fruits ? 'Yes' : 'No' },
              plant.leaf !== undefined && { label: "🍃 Leaf", value: plant.leaf ? 'Yes' : 'No' },
              plant.thorny !== undefined && { label: "🌵 Thorny", value: plant.thorny ? 'Yes' : 'No' },
              plant.seeds !== undefined && { label: "🌰 Seeds", value: plant.seeds ? 'Yes' : 'No' },
              plant.flowering_season && { label: "🌸 Flowering Season", value: plant.flowering_season },
              plant.harvest_season && { label: "🌾 Harvest Season", value: plant.harvest_season },
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
              plant.edible_fruit !== undefined && { label: "🍏 Edible Fruit", value: plant.edible_fruit ? 'Yes' : 'No' },
              plant.edible_leaf !== undefined && { label: "🥬 Edible Leaf", value: plant.edible_leaf ? 'Yes' : 'No' },
              plant.cuisine !== undefined && { label: "🍽️ Cuisine", value: plant.cuisine ? 'Yes' : 'No' },
              plant.medicinal !== undefined && { label: "💊 Medicinal", value: plant.medicinal ? 'Yes' : 'No' },
              plant.poisonous_to_humans !== undefined && { label: "☠️ Poisonous to Humans", value: plant.poisonous_to_humans ? 'Yes' : 'No' },
              plant.poisonous_to_pets !== undefined && { label: "🐾 Poisonous to Pets", value: plant.poisonous_to_pets ? 'Yes' : 'No' },
              plant.invasive !== undefined && { label: "🚫 Invasive", value: plant.invasive ? 'Yes' : 'No' },
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
        {plant.propagation && plant.propagation.length > 0 && (
          <ThemedView style={[styles.card, { backgroundColor: cardBackground }]}>
            <ThemedText type="title2">🌱 Propagation Methods</ThemedText>
            <View style={styles.tagContainer}>
              {plant.propagation.map((method, index) => (
                <View key={index} style={styles.tag}>
                  <ThemedText style={styles.tagText}>{method}</ThemedText>
                </View>
              ))}
            </View>
          </ThemedView>
        )}

        {/* Atracciones (si hay) */}
        {plant.attracts && plant.attracts.length > 0 && (
          <ThemedView style={[styles.card, { backgroundColor: cardBackground }]}>
            <ThemedText type="title2">🦋 Attracts</ThemedText>
            <View style={styles.tagContainer}>
              {plant.attracts.map((attraction, index) => (
                <View key={index} style={styles.tag}>
                  <ThemedText style={styles.tagText}>{attraction}</ThemedText>
                </View>
              ))}
            </View>
          </ThemedView>
        )}
        {plant.watering_general_benchmark && (
          <ThemedView style={[styles.card, { backgroundColor: cardBackground }]}>
            <ThemedText type="title2">💧 Watering Information</ThemedText>
            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>Frequency:</ThemedText>
              <ThemedText style={styles.infoValue}>{plant.watering || 'N/A'}</ThemedText>
            </View>
            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>Every:</ThemedText>
              <ThemedText style={styles.infoValue}>
                {plant.watering_general_benchmark.value} {plant.watering_general_benchmark.unit}
              </ThemedText>
            </View>
            {plant.watering_long && (
              <ThemedText style={styles.description}>{plant.watering_long}</ThemedText>
            )}
          </ThemedView>
        )}

        {plant.sunlight && plant.sunlight.length > 0 && (
          <ThemedView style={[
            styles.card,
            { backgroundColor: cardBackground }
          ]}>
            <ThemedText type="title2">☀️ Sunlight Requirements</ThemedText>
            <View style={styles.tagContainer}>
              {plant.sunlight.map((lightType, index) => (
                <View key={index} style={styles.tag}>
                  <ThemedText style={styles.tagText}>{lightType}</ThemedText>
                </View>
              ))}
            </View>
            {plant.sunlight_long && (
              <ThemedText style={styles.description}>{plant.sunlight_long}</ThemedText>
            )}
          </ThemedView>
        )}
        {(plant.pruning_month && plant.pruning_month.length > 0) || plant.pruning && (
          <ThemedView style={[
            styles.card,
            { backgroundColor: cardBackground }
          ]}>
            <ThemedText type="title2">✂️ Pruning Information</ThemedText>
            {plant.pruning_month && plant.pruning_month.length > 0 && (
              <View>
                <View style={styles.infoRow}>
                  <ThemedText style={styles.infoLabel}>Best months:</ThemedText>
                </View>
                <View style={styles.tagContainer}>
                  {plant.pruning_month.map((month, index) => (
                    <View key={index} style={styles.tag}>
                      <ThemedText style={styles.tagText}>{month}</ThemedText>
                    </View>
                  ))}
                </View>
              </View>
            )}
            {plant.pruning && (
              <ThemedText style={styles.description}>{plant.pruning}</ThemedText>
            )}
          </ThemedView>
        )}

        {/* Guías de cuidado */}
        {plant.care_guides && typeof plant.care_guides === 'object' && plant.care_guides.data && plant.care_guides.data.length > 0 && (
          <ThemedView style={[styles.card, { backgroundColor: cardBackground }]}>
            <ThemedText type="title2">📖 Care Guides</ThemedText>
            {plant.care_guides.data.map((guide: any, guideIndex: number) => (
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
        {plant.posts && plant.posts.length > 0 && (
          <>
            <ThemedText type="title2">Posts</ThemedText>
            {plant.posts.map((post) => (
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
          </>
        )}

        {plant.posts && plant.posts.length == 0 && (
          <ThemedText type="default">No posts for this plant.</ThemedText>
        )}
      </ParallaxScrollView>

      {/* Menú desplegable */}
      {showMenu && (
        <View style={styles.menuContainer}>
          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: Colors.light.tint }]}
            onPress={handleAddToGarden}
          >
            <Ionicons name="leaf" size={20} color="#333" />
            <ThemedText style={styles.menuText}>Add Plant</ThemedText>
          </TouchableOpacity>

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