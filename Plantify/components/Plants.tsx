import { Garden, UserPlant } from "@/models/Plant";
import { PlantService } from "@/services/plantsService";
import React, { useEffect, useState, useRef } from "react";
import { ScrollView, Text, View, StyleSheet, TouchableOpacity, Image, useColorScheme, Pressable, Modal, ActivityIndicator, RefreshControl, Animated } from "react-native";
import { ThemedView } from "./ThemedView";
import { ThemedText } from "./ThemedText";
import { useAuth } from "@/hooks/useAuthContext";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { Colors } from "@/constants/Colors";
import Ionicons from "@expo/vector-icons/build/Ionicons";
import { UserService } from "@/services/userService";
import Button from "./Button";
import Swipeable from "react-native-gesture-handler/Swipeable";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function Plants({ gardenId }: Readonly<{ gardenId: number | null }>) {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { getUserId, accessToken, refreshToken, setTokens } = useAuth();
  const [userPlants, setUserPlants] = useState<UserPlant[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [selectedPlant, setSelectedPlant] = useState<UserPlant | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const backgroundColor = colorScheme === 'dark' ? Colors.dark.background : Colors.light.background;
  const swipeableRefs = useRef<Map<number, Swipeable>>(new Map());

  const openModal = (userPlant: UserPlant, event: any) => {
    if (modalVisible && selectedPlant?.id === userPlant.id) {
      closeModal();
      return;
    }

    // Medir la posición del botón
    event.target.measure((x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
      setMenuPosition({
        top: pageY + height - 35,
        right: 16
      });
      setSelectedPlant(userPlant);
      setModalVisible(true);
    });
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedPlant(null);
  };

  const closeConfirm = () => {
    setConfirmVisible(false);
    setSelectedPlant(null);
  };

  const fetchPlants = async () => {
    if (!getUserId()) {
      console.error("User ID not found");
      return;
    }
    try {
      setIsLoading(true);
      if (gardenId) {
        const data = await PlantService.getPlantsByGarden(gardenId, accessToken!);
        setUserPlants(data);
      } else {
        const data = await PlantService.getAllPlants(accessToken!);
        setUserPlants(data);
      }
    } catch (error: any) {
      if (error.message === 'Unauthorized') {
        // Handle token refresh logic here
        try {
          setIsLoading(true);
          const newTokens = await UserService.refreshToken(refreshToken!);
          setTokens(newTokens.access, newTokens.refresh);
          // Retry fetching plants with new access token
          if (gardenId) {
            const data = await PlantService.getPlantsByGarden(gardenId, newTokens.access);
            setUserPlants(data);
          } else {
            const data = await PlantService.getAllPlants(newTokens.access);
            setUserPlants(data);
          }
        } catch (refreshError) {
          console.error("Error refreshing tokens:", refreshError);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchPlants();
    }, [])
  );

  const handleAdd = () => {
    router.push({
      pathname: "/plant-search",
      params: { isCreating: "true", gardenId }
    });
  };

  const handleDelete = async () => {
    if (!selectedPlant) return;
    try {
      const response = await PlantService.deletePlant(selectedPlant.id, accessToken!);
      if (response) {
        setUserPlants((prev) => prev.filter((p) => p.id !== selectedPlant.id));
        // Cerrar el swipeable de la planta eliminada
        swipeableRefs.current.get(selectedPlant.id)?.close();
      }
    } catch (error) {
      console.error("Error deleting plant:", error);
    }
  };

  const handleSwipeDelete = async (plantId: number) => {
    const plant = userPlants.find(p => p.id === plantId);
    if (!plant) return;
    
    setSelectedPlant(plant);
    setConfirmVisible(true);
  };

  const renderLeftActions = (plantId: number, progress: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>) => {
    const scale = dragX.interpolate({
      inputRange: [0, 100],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View
        style={[
          styles.deleteButton,
          {
            opacity: scale,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.deleteButtonInner}
          onPress={() => handleSwipeDelete(plantId)}
        >
          <Ionicons name="trash" size={24} color="white" />
          <Text style={styles.deleteButtonText}>Eliminar</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const unitLabelsPlural = {
    "days": 'días',
    "weeks": 'semanas',
    "months": 'meses',
  };

  const unitLabelsSingular = {
    "days": 'día',
    "weeks": 'semana',
    "months": 'mes',
  };

  if (isLoading) {
    return <ActivityIndicator size="large" style={{ marginTop: 32 }} />;
  }

  const handleSettings = async (plantId: number) => {
    try {
      setIsLoading(true);
      const plantDetails = await PlantService.getUserPlantById(plantId, accessToken!);
      closeModal();
      setIsLoading(false);
      router.push({ pathname: "/plant-settings", params: { plant: JSON.stringify(plantDetails) } });
    } catch (error) {
      console.error("Error fetching plant details:", error);
      setIsLoading(false);
    }
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      { userPlants.length === 0 && (
        <View style={styles.container}>
          <ThemedText type="default">No hay plantas aquí aún. ¡Añade una nueva planta!</ThemedText>
        </View>
      )}
      <ScrollView style={styles.container}
      refreshControl={
                  <RefreshControl refreshing={isLoading} onRefresh={fetchPlants} />
                }>
        {userPlants.map((userPlant) => (
          <Swipeable
            key={userPlant.id}
            ref={(ref) => {
              if (ref) {
                swipeableRefs.current.set(userPlant.id, ref);
              }
            }}
            renderLeftActions={(progress, dragX) => renderLeftActions(userPlant.id, progress, dragX)}
            overshootLeft={false}
            overshootRight={false}
            friction={2}
            leftThreshold={1}
            rightThreshold={2000}
            activeOffsetX={[-30, 5]}
            failOffsetY={[-30, 30]}
          >
            <TouchableOpacity
              onPress={() => router.push({
                pathname: "/plant-details",
                params: { id: userPlant.id }
              })}
            >
            <ThemedView style={styles.card}>
              {userPlant.custom_image ? (
              <Image source={{ uri: userPlant.custom_image }} style={{ width: 100, height: 100, borderRadius: 8 }} />
              ) : (
              <Image
                source={{ uri: userPlant.image }}
                style={{ width: 100, height: 100, borderRadius: 8 }}
              />
              )}

              <View style={{ flex: 1, flexShrink: 1, gap: 16 }}>
                <View>
                  <ThemedText type='title2'>{userPlant.custom_name || userPlant.common_name}</ThemedText>
                </View>
                <View style={{ display: 'flex', flexDirection: 'row', gap: 2, alignContent: 'center', alignItems: 'center' }}>
                  <Ionicons accessibilityRole="image" accessibilityLabel="Riego" name="water" size={24} color={colorScheme === "dark" ? Colors.dark.text : Colors.light.text} />
                  <ThemedText type='default'>Cada {userPlant.watering_period.value} {unitLabelsPlural[userPlant.watering_period.unit as keyof typeof unitLabelsPlural]}</ThemedText>
                </View>
                <View style={{ display: 'flex', flexDirection: 'row', gap: 2, alignContent: 'center', alignItems: 'center' }}>
                  <Ionicons accessibilityRole="image" accessibilityLabel="Ubicado en" name="location" size={24} color={colorScheme === "dark" ? Colors.dark.text : Colors.light.text} />
                  <ThemedText type='default'>{userPlant.garden_name || 'Ningún sitio seleccionado'}</ThemedText>
                </View>
              </View>

              <TouchableOpacity
                style={styles.buttonMenu}
                onPress={(event) => {
                  openModal(userPlant, event);
                }}
              >
                <Ionicons accessibilityRole="image" accessibilityLabel="Menú de opciones" name="ellipsis-vertical" size={30} color={colorScheme === "dark" ? Colors.dark.text : Colors.light.text} />
              </TouchableOpacity>

            </ThemedView>
          </TouchableOpacity>
          </Swipeable>
        ))}
        <Button text="Añadir planta" onPress={handleAdd} />
        <View style={{ marginBottom: 24 }} />
      </ScrollView>

      {/* Modal de opciones del menú */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeModal}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={closeModal}>
          <View style={[styles.optionsMenu, {
            backgroundColor,
            position: 'absolute',
            top: menuPosition.top,
            right: menuPosition.right
          }]}>
            <Pressable style={{ marginBottom: 12 }} onPress={() => {
              handleSettings(selectedPlant!.id);
            }}>
              <ThemedText type="defaultSemiBold">Ajustes de la planta</ThemedText>
            </Pressable>
            <Pressable onPress={() => {
              setConfirmVisible(true);
            }}>
              <ThemedText type="defaultSemiBold" style={{ fontSize: 16, color: "red" }}>Eliminar</ThemedText>
            </Pressable>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal de confirmación de eliminación */}
      <Modal
        visible={confirmVisible}
        transparent
        animationType="fade"
        onRequestClose={closeConfirm}>
        <View style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.3)",
          justifyContent: "center",
          alignItems: "center",

        }}>
          <View style={{
            backgroundColor: backgroundColor,
            borderRadius: 12,
            padding: 24,
            minWidth: 220,
            alignItems: "center",
            margin: 36
          }}>
            <ThemedText type="title2">¿Seguro que quieres eliminar esta planta?</ThemedText>
            <ThemedText type="default">Al eliminar la planta todos los datos se eliminarán. Esta acción no podrá deshacerse.</ThemedText>
            <View style={{ display: 'flex', flexDirection: 'row', gap: 12, justifyContent: 'flex-end', width: '100%' }}>
              <Pressable style={{ marginBottom: 12 }} onPress={() => {
                closeModal();
                closeConfirm();
              }}>
                <ThemedText type="defaultSemiBold">Cancelar</ThemedText>
              </Pressable>
              <Pressable onPress={() => {
                handleDelete();
                closeModal();
                closeConfirm();
              }}>
                <ThemedText type="defaultSemiBold" style={{ color: "red" }}>Eliminar</ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  optionsMenu: {
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 10,
    padding: 16,
    minWidth: 200,
  },
  container: {
    paddingHorizontal: 16,
  },
  card: {
    padding: 16,
    marginVertical: 8,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 14,
    color: "gray",
  },
  text: {
    fontSize: 14,
    marginTop: 4,
  },
  button: {
    marginTop: 32,
    width: '100%',
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.light.tint,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonMenu: {
    position: 'absolute',
    right: 6,
    top: 12,
  },
  deleteButton: {
    backgroundColor: '#ff3b30',
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginVertical: 8,
    marginRight: 8,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    width: 100,
    height: '92%',
  },
  deleteButtonInner: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 100,
    height: '100%',
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
    marginTop: 4,
  },
});
