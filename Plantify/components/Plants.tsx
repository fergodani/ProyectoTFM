import { Garden, UserPlant } from "@/models/Plant";
import { PlantService } from "@/services/plantsService";
import React, { useEffect, useState } from "react";
import { ScrollView, Text, View, StyleSheet, TouchableOpacity, Image, useColorScheme, Pressable, Modal } from "react-native";
import { ThemedView } from "./ThemedView";
import { ThemedText } from "./ThemedText";
import { useAuth } from "@/hooks/useAuthContext";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { Colors } from "@/constants/Colors";
import Ionicons from "@expo/vector-icons/build/Ionicons";
import { UserService } from "@/services/userService";
import Button from "./Button";

export default function Plants({ gardenId }: Readonly<{ gardenId: number | null }>) {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { getUserId, accessToken, refreshToken, setTokens } = useAuth();
  const [userPlants, setUserPlants] = useState<UserPlant[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [selectedPlant, setSelectedPlant] = useState<UserPlant | null>(null);
  const backgroundColor = colorScheme === 'dark' ? Colors.dark.background : Colors.light.background;

  const openModal = (userPlant: UserPlant) => {
    if (modalVisible && selectedPlant?.id === userPlant.id) {
      closeModal();
      return;
    }
    setSelectedPlant(userPlant);
    setModalVisible(true);
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
      if (gardenId) {
        const data = await PlantService.getPlantsByGarden(gardenId, accessToken!);
        setUserPlants(data);
      } else {
        const data = await PlantService.getAllPlants(accessToken!);
        console.log(data)
        setUserPlants(data);
      }
    } catch (error: any) {
      if (error.message === 'Unauthorized') {
        // Handle token refresh logic here
        try {
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
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchPlants();
      console.log(userPlants)
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
      }
    } catch (error) {
      console.error("Error deleting plant:", error);
    }
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

  return (
    <>
      <ScrollView style={styles.container}>
        {userPlants.map((userPlant) => (
          <TouchableOpacity
            key={userPlant.id}
            onPress={() => router.push({
              pathname: "/plant-details",
              params: { id: userPlant.id }
            })}
          >
            <ThemedView style={styles.card}>
              {userPlant.plant.image && (
                <Image
                  source={{ uri: userPlant.plant.image }}
                  style={{ width: 100, height: 100, borderRadius: 8 }}
                />
              )}
              <View style={{ flex: 1, flexShrink: 1, gap: 16 }}>
                <View>
                  <ThemedText type='title2'>{userPlant.plant.common_name}</ThemedText>
                  <ThemedText type='italic'>{userPlant.plant.scientific_name}</ThemedText>
                </View>
                <View style={{ display: 'flex', flexDirection: 'row', gap: 2, alignContent: 'center', alignItems: 'center' }}>
                  <Ionicons name="water" size={24} color={colorScheme === "dark" ? Colors.dark.text : Colors.light.text} />
                  <ThemedText type='default'>Cada {userPlant.plant.watering_period[0].value == "1" ? unitLabelsSingular[userPlant.plant.watering_period[0].unit as keyof typeof unitLabelsSingular] : userPlant.plant.watering_period[0].value} {userPlant.plant.watering_period[0].value !== "1" ? unitLabelsPlural[userPlant.plant.watering_period[0].unit as keyof typeof unitLabelsPlural] : ''}</ThemedText>
                </View>
                <View style={{ display: 'flex', flexDirection: 'row', gap: 2, alignContent: 'center', alignItems: 'center' }}>
                  <Ionicons name="location" size={24} color={colorScheme === "dark" ? Colors.dark.text : Colors.light.text} />
                  <ThemedText type='default'>{userPlant.garden_name || 'Ningún sitio seleccionado'}</ThemedText>
                </View>
              </View>

              <TouchableOpacity
                style={styles.buttonMenu}
                onPress={() => {
                  openModal(userPlant);
                }}
              >
                <Ionicons name="ellipsis-vertical" size={24} color={colorScheme === "dark" ? Colors.dark.text : Colors.light.text} />
              </TouchableOpacity>
              {/* Opciones del menú */}
              {modalVisible && selectedPlant?.id === userPlant.id && (
                <View style={[styles.optionsMenu, { backgroundColor }]}>
                  <Pressable style={{ marginBottom: 12 }} onPress={() => {
                    // Acción de ajustes
                    closeModal();
                    router.push({ pathname: "/plant-settings", params: { plant: JSON.stringify(userPlant) } });
                  }}>
                    <ThemedText type="defaultSemiBold">Ajustes de la planta</ThemedText>
                  </Pressable>
                  <Pressable onPress={() => {
                    setConfirmVisible(true);
                  }}>
                    <ThemedText type="defaultSemiBold" style={{ fontSize: 16, color: "red" }}>Eliminar</ThemedText>
                  </Pressable>
                </View>
              )}
            </ThemedView>
          </TouchableOpacity>
        ))}
        <Button text="Añadir planta" onPress={handleAdd} />
        <View style={{ marginBottom: 24 }} />
      </ScrollView>
      {/* Modal de opciones */}
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
    </>
  );
};

const styles = StyleSheet.create({
  optionsMenu: {
    position: 'absolute',
    right: 0,
    top: 40, // ajusta según tu diseño
    borderRadius: 12,
    shadowColor: "#fff",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 10,
    zIndex: 100,
    padding: 16
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
    zIndex: 1,
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
    marginTop: 32, // Espaciado superior
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
  }
});
