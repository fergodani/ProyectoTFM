import React, { useEffect, useRef, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ScrollView, TouchableOpacity, Image, Pressable, Modal, ActivityIndicator, RefreshControl, Animated } from 'react-native';
import gardensService from '@/services/gardensService';
import { Garden, GardenBySuitability } from '@/models/Plant';
import { ThemedText } from './ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme.web';
import { useThemeColor } from '@/hooks/useThemeColor';
import { ThemedView } from './ThemedView';
import { useAuth } from '@/hooks/useAuthContext';
import { useFocusEffect, useRouter } from 'expo-router';
import GardensService from '@/services/gardensService';
import { Ionicons } from '@expo/vector-icons';
import { UserService } from '@/services/userService';
import Button from './Button';
import { PlantService } from '@/services/plantsService';
import Swipeable from "react-native-gesture-handler/Swipeable";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function Gardens({ plantId }: Readonly<{ plantId: number | null }>) {
    const colorScheme = useColorScheme();
    const router = useRouter();
    const { getUserId, accessToken, refreshToken, setTokens } = useAuth();
    const [gardens, setGardens] = React.useState<Garden[]>([]);
    const [gardensBySuitability, setGardensBySuitability] = React.useState<GardenBySuitability[]>([]);
    const [selectedGarden, setSelectedGarden] = useState<Garden | null>(null);
    const [menuPosition, setMenuPosition] = useState<{ top: number; right: number }>({ top: 0, right: 0 });
    const [modalVisible, setModalVisible] = useState(false);
    const [confirmVisible, setConfirmVisible] = useState(false);
    const backgroundColor = colorScheme === 'dark' ? Colors.dark.background : Colors.light.background;
    const [isLoading, setIsLoading] = useState(false);
    const swipeableRefs = useRef<Map<number, Swipeable>>(new Map());

    const fetchGardens = async () => {
        if (!getUserId()) {
            console.error("User ID not found");
            return;
        }
        try {
            setIsLoading(true);
            if (plantId) {
                const suitableGardens = await GardensService.getGardensBySuitability(plantId!, accessToken!);
                setGardensBySuitability(suitableGardens);
                console.log(suitableGardens[0].garden.user_plants);
            } else {
                const data = await GardensService.getAllGardens(accessToken!);
                setGardens(data);
            }

        } catch (error: any) {
            if (error.message === 'Unauthorized') {
                // Handle token refresh logic here
                try {
                    const newTokens = await UserService.refreshToken(refreshToken!);
                    setTokens(newTokens.access, newTokens.refresh);
                    // Retry fetching gardens with new access token
                    const data = await GardensService.getAllGardens(newTokens.access);

                    setGardens(data);
                } catch (refreshError) {
                    console.error("Error refreshing tokens:", refreshError);
                }
            }
        } finally {
            setIsLoading(false);
        }
    };

    const openModal = (garden: Garden, event: any) => {
        if (modalVisible && selectedGarden?.id === garden.id) {
            closeModal();
            return;
        }

        // Medir la posición del botón
        event.target.measure((x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
            setMenuPosition({
                top: pageY + height - 35,
                right: 16
            });
            setSelectedGarden(garden);
            setModalVisible(true);
        });
    };

    const closeModal = () => {
        setModalVisible(false);
        setSelectedGarden(null);
    };

    const closeConfirm = () => {
        setConfirmVisible(false);
        setSelectedGarden(null);
    };


    const handleCreatePlantInGarden = async (gardenId: number) => {
        try {
            const userPlant = {
                plant_id: plantId,
                garden: Number(gardenId),
                owner: getUserId()!,
            }
            setIsLoading(true);
            await PlantService.createPlant(userPlant, accessToken!);
            router.replace("/(tabs)/profile");
        } catch (error) {
            alert("Error al agregar la planta.");
            router.replace("/(tabs)/profile");
        } finally {
            setIsLoading(false);
        }
    }

    const handleAdd = () => {
        router.push("/garden-form");
    };

    const handleDelete = async () => {
        if (!selectedGarden) return;
        try {
            const response = await GardensService.deleteGarden(selectedGarden.id, accessToken!);
            if (response) {
                setGardens((prev) => prev.filter((p) => p.id !== selectedGarden.id));
            }
        } catch (error) {
            console.error("Error deleting garden:", error);
        }
    };

    const handleSwipeDelete = async (plantId: number) => {
        const garden = gardens.find(p => p.id === plantId);
        if (!garden) return;

        setSelectedGarden(garden);
        setConfirmVisible(true);
    };

    const renderLeftActions = (plantId: number, progress: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>) => {
        const scale = dragX.interpolate({
            inputRange: [-100, 0],
            outputRange: [1, 0],
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


    const handleSettings = async (gardenId: number) => {
        try {
            setIsLoading(true);
            const gardenDetails = await GardensService.getGardenById(gardenId);
            closeModal();
            setIsLoading(false);
            console.log(gardenDetails);
            router.push({ pathname: "/garden-settings", params: { gardenString: JSON.stringify(gardenDetails) } });
        } catch (error) {
            console.error("Error fetching garden details:", error);
            setIsLoading(false);
        }
    }

    useFocusEffect(

        React.useCallback(() => {
            fetchGardens();
        }, [])
    );

    return (
        <>
            {!plantId && (
                <>
                    {gardens.length === 0 && (
                        <View style={{ paddingHorizontal: 16 }}>
                            <ThemedText type="default">No hay lugares aquí aún. ¡Añade un nuevo lugar y agrupa tus plantas!</ThemedText>
                            <ThemedText type="subtitle">Crea espacios personalizados para agrupar tus plantas y gestionar sus cuidados por zonas</ThemedText>
                        </View>
                    )}
                    <GestureHandlerRootView style={{ flex: 1 }}>
                        <ScrollView style={styles.container}
                            refreshControl={
                                <RefreshControl refreshing={isLoading} onRefresh={fetchGardens} />
                            }>
                            {isLoading && <ActivityIndicator size="large" style={{ marginTop: 32 }} />}
                            {gardens.map((garden: Garden) => {
                                // Suponiendo que garden.plants es un array de plantas con propiedad image
                                const plantImages = garden.user_plants?.slice(0, 3).map(p => p.custom_image ? p.custom_image : p.image) || [];
                                return (
                                    <Swipeable
                                        key={garden.id}
                                        ref={(ref) => {
                                            if (ref) {
                                                swipeableRefs.current.set(garden.id, ref);
                                            }
                                        }}
                                        renderRightActions={(progress, dragX) => renderLeftActions(garden.id, progress, dragX)}
                                        overshootLeft={false}
                                        overshootRight={false}
                                        friction={2}
                                        leftThreshold={2000}
                                        rightThreshold={1}
                                        activeOffsetX={[-5, 30]}
                                        failOffsetY={[-30, 30]}
                                    >
                                        <TouchableOpacity
                                            key={garden.id}
                                            onPress={() => {
                                                if (plantId) {
                                                    handleCreatePlantInGarden(garden.id);
                                                } else {
                                                    router.push({
                                                        pathname: "/garden-details",
                                                        params: { id: garden.id }
                                                    })
                                                }
                                            }}
                                        >
                                            <ThemedView key={garden.id} style={styles.gardenCard}>
                                                <View style={styles.mosaicContainer}>
                                                    {plantImages.length > 0 && plantImages[0] && (
                                                        <Image
                                                            source={{ uri: plantImages[0] }}
                                                            style={styles.mainImage}
                                                        />
                                                    )}
                                                    {!plantImages[0] && (
                                                        <Image
                                                            source={require('@/assets/images/plant-placeholder.png')}
                                                            style={styles.mainImage}
                                                        />
                                                    )}
                                                    <View style={styles.sideImagesContainer}>
                                                        {plantImages[1] && (
                                                            <Image
                                                                source={{ uri: plantImages[1] }}
                                                                style={styles.sideImage}
                                                            />
                                                        )}
                                                        {!plantImages[1] && (
                                                            <Image
                                                                source={require('@/assets/images/plant-placeholder.png')}
                                                                style={styles.sideImage}
                                                            />
                                                        )}
                                                        {plantImages[2] && (
                                                            <Image
                                                                source={{ uri: plantImages[2] }}
                                                                style={styles.sideImage}
                                                            />
                                                        )}
                                                        {!plantImages[2] && (
                                                            <Image
                                                                source={require('@/assets/images/plant-placeholder.png')}
                                                                style={styles.sideImage}
                                                            />
                                                        )}
                                                    </View>
                                                </View>
                                                <View style={styles.gardenInfoContainer}>
                                                    <ThemedText type='title2'>{garden.name}</ThemedText>
                                                    <ThemedText type='default'>{garden.location === 'indoor' ? 'Interior' : garden.location === 'outdoor' ? 'Exterior' : garden.location}</ThemedText>
                                                    <ThemedText type='default'>{garden.user_plants?.length} {garden.user_plants?.length == 1 ? 'planta' : 'plantas'}</ThemedText>
                                                </View>
                                                <TouchableOpacity
                                                    hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                                                    style={styles.buttonMenu} onPress={(event) => {
                                                        openModal(garden, event)
                                                    }}>
                                                    <Ionicons name="ellipsis-vertical" size={24} color={colorScheme === "dark" ? Colors.dark.text : Colors.light.text} />
                                                </TouchableOpacity>
                                            </ThemedView>
                                        </TouchableOpacity>
                                    </Swipeable>
                                );
                            })}
                            {!plantId && (
                                <Button text="Añadir lugar" onPress={handleAdd} />
                            )}
                            <View style={{ marginBottom: 24 }} />
                        </ScrollView>
                    </GestureHandlerRootView>
                </>
            )}

            {plantId && (
                <ScrollView style={styles.container}>
                    {isLoading && <ActivityIndicator size="large" style={{ marginTop: 32 }} />}
                    {gardensBySuitability.map((gardenBySuitability: GardenBySuitability) => {
                        // Suponiendo que garden.plants es un array de plantas con propiedad image
                        const plantImages = gardenBySuitability.garden.user_plants?.slice(0, 3).map(p => p.custom_image ? p.custom_image : p.image) || [];
                        return (
                            <TouchableOpacity
                                key={gardenBySuitability.garden.id}
                                onPress={() => {
                                    if (plantId) {
                                        handleCreatePlantInGarden(gardenBySuitability.garden.id);
                                    } else {
                                        router.push({
                                            pathname: "/garden-details",
                                            params: { id: gardenBySuitability.garden.id }
                                        })
                                    }
                                }}
                            >
                                <ThemedView key={gardenBySuitability.garden.id} style={styles.gardenCard}>
                                    <View style={styles.mosaicContainer}>
                                        {plantImages.length > 0 && plantImages[0] && (
                                            <Image
                                                source={{ uri: plantImages[0] }}
                                                style={styles.mainImage}
                                            />
                                        )}
                                        {!plantImages[0] && (
                                            <Image
                                                source={require('@/assets/images/plant-placeholder.png')}
                                                style={styles.mainImage}
                                            />
                                        )}
                                        <View style={styles.sideImagesContainer}>
                                            {plantImages[1] && (
                                                <Image
                                                    source={{ uri: plantImages[1] }}
                                                    style={styles.sideImage}
                                                />
                                            )}
                                            {!plantImages[1] && (
                                                <Image
                                                    source={require('@/assets/images/plant-placeholder.png')}
                                                    style={styles.sideImage}
                                                />
                                            )}
                                            {plantImages[2] && (
                                                <Image
                                                    source={{ uri: plantImages[2] }}
                                                    style={styles.sideImage}
                                                />
                                            )}
                                            {!plantImages[2] && (
                                                <Image
                                                    source={require('@/assets/images/plant-placeholder.png')}
                                                    style={styles.sideImage}
                                                />
                                            )}
                                        </View>
                                    </View>
                                    <View style={styles.gardenInfoContainer}>
                                        <ThemedText type='title2'>{gardenBySuitability.garden.name}</ThemedText>
                                        <ThemedText type='default'>{gardenBySuitability.garden.location === 'indoor' ? 'Interior' : gardenBySuitability.garden.location === 'outdoor' ? 'Exterior' : gardenBySuitability.garden.location}</ThemedText>
                                        <ThemedText type='default'>{gardenBySuitability.garden.user_plants?.length} {gardenBySuitability.garden.user_plants?.length == 1 ? 'planta' : 'plantas'}</ThemedText>
                                        <View>
                                            {gardenBySuitability.is_optimal ? (
                                                <ThemedText type='default' style={{ color: 'green', fontWeight: 'bold' }}>Óptimo</ThemedText>
                                            ) : (
                                                <ThemedText type='default' style={{ color: 'red', fontWeight: 'bold' }}>No óptimo</ThemedText>
                                            )}
                                            {gardenBySuitability.reasons.map((reason: string) => {
                                                return (
                                                    <ThemedText type='subtitle' style={{ color: 'gray' }}>{reason}</ThemedText>
                                                )
                                            })}

                                        </View>
                                    </View>
                                </ThemedView>

                            </TouchableOpacity>
                        );
                    })}
                    {!plantId && (
                        <Button text="Añadir lugar" onPress={handleAdd} />
                    )}
                    <View style={{ marginBottom: 24 }} />
                </ScrollView>)}

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
                            handleSettings(selectedGarden!.id);
                        }}>
                            <ThemedText type="defaultSemiBold">Ajustes del lugar</ThemedText>
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
                        <ThemedText type="title2">¿Seguro que quieres eliminar este lugar?</ThemedText>
                        <ThemedText type="default">Al eliminar el lugar todos los datos se eliminarán, pero no las plantas asociadas. Esta acción no podrá deshacerse.</ThemedText>
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
}

const styles = StyleSheet.create({
    mosaicContainer: {
        flexDirection: 'row',
        marginBottom: 12,
        height: 80,
    },
    mainImage: {
        width: 100,
        height: 100,
        borderRadius: 8,
        marginRight: 8,
    },
    sideImagesContainer: {
        flexDirection: 'column',
        justifyContent: 'space-between',
    },
    sideImage: {
        width: 48,
        height: 48,
        borderRadius: 8,
        marginBottom: 4,
    },
    gardenInfoContainer: {
        flex: 1,
        padding: 12,
    },
    container: {
        flex: 1,
        paddingHorizontal: 16
    },
    list: {
        paddingBottom: 16,
    },
    gardenCard: {
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
        alignContent: 'center',
        justifyContent: 'center',
    },
    gardenName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    gardenLocation: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    gardenDate: {
        fontSize: 12,
        color: '#999',
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
    },
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