import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { PlantTrefle } from "@/models/PlanTrefle";
import { PlantService } from "@/services/plantsService";
import React, { useEffect, useState } from "react";
import { ScrollView, Text, View, StyleSheet, Image, TouchableOpacity, FlatList, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { PlantInfo } from "@/models/PlantInfo";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";
import { Garden, PerenualPlant } from "@/models/Plant";
import { useAuth } from "@/hooks/useAuthContext";
import GardensService from "@/services/gardensService";

export const options = {
    headerShown: false,
};

export default function PlantList() {
    const params = useLocalSearchParams();
    const isInfiniteScroll = params.isInfiniteScroll === "true";
    const [plants, setPlants] = useState<PlantInfo[]>(params.plants ? JSON.parse(params.plants as string) : []);
    const filter = params.filter ? params.filter as string : "";
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(0);
    const [isFilterChosen, setIsFilterChosen] = useState(false);
    const [plantType, setPlantType] = useState("")
    const { getUserId, accessToken, isAuthenticated } = useAuth();
    const [gardens, setGardens] = useState<Garden[]>([]);

    const loadPlants = async (nextPage: number, filter: string, type: string) => {
        if (loading || !hasMore) return;
        setLoading(true);
        try {
            const newPlants = await PlantService.getPlantInfoList(nextPage, filter, type);
            if (newPlants.length === 0) {
                setHasMore(false);
            } else {
                setPlants(prev => {
                    const prevIds = new Set(prev.map(p => p.id));
                    const filtered = newPlants.filter(p => !prevIds.has(p.id));
                    return [...prev, ...filtered]
                });
                setPage(nextPage);
            }
        } catch (error) {
            console.error("Error loading plants:", error);
        }
        setLoading(false);
    };

    function setFilter(type: string) {
        setIsFilterChosen(true);
        setPlantType(type);
        loadPlants(page + 1, filter, type)
    }

    useEffect(() => {
        const fetchGardens = async () => {
            try {
                const response = await GardensService.getGardensName(accessToken!);
                setGardens(response);
            } catch (error) {
                console.error("Error fetching gardens:", error);
            }
        };
        if (isAuthenticated) {
            fetchGardens();
        }
    }, []);

    const handleAdd = (plant: PlantInfo) => {
        if (gardens.length === 0) {
            handleSkip(plant);
            return;
        }
        router.push({
            pathname: "/garden-select",
            params: {
                id: plant.id,
            }
        })
    };

    const handleSkip = async (plant: PlantInfo) => {
        try {
            const userPlant = {
                plant_id: plant.id,
                owner: getUserId()!
            }
            setLoading(true);
            console.log("Adding plant:", userPlant);
            await PlantService.createPlant(userPlant, accessToken!);
            setLoading(false);
            router.replace("/(tabs)/profile");
        } catch (error) {
            //console.error("Error adding plant:", error);
            alert("Error al agregar la planta.");
            setLoading(false);
            router.replace("/(tabs)/profile");
        }
    };

    return (
        <View style={{ flex: 1 }}>
            <FlatList
                data={plants}
                keyExtractor={item => item.id.toString()}
                renderItem={({ item: plant }) => (
                    <TouchableOpacity
                        key={plant.id}
                        onPress={() => router.push({
                            pathname: "/plant-info-details",
                            params: { id: plant.id }
                        })}
                    >
                        <ThemedView style={styles.card}>
                            {plant.default_image && (
                                <Image
                                    source={{ uri: plant.default_image.original_url }}
                                    style={{ width: 100, height: 100, borderRadius: 8 }}
                                />
                            )}
                            <View style={{ flex: 1, flexShrink: 1 }}>
                                <ThemedText type='title2'>{plant.common_name}</ThemedText>
                                <ThemedText type='subtitle'>{plant.scientific_name[0]}</ThemedText>
                            </View>
                            {isAuthenticated && (
                                <TouchableOpacity style={styles.button} onPress={() => {
                                    handleAdd(plant);
                                }}>
                                    <ThemedText type='default'>
                                        <Ionicons name="add-circle" size={24} color="#333" />
                                    </ThemedText>
                                </TouchableOpacity>
                            )}
                        </ThemedView>
                    </TouchableOpacity>
                )}
                contentContainerStyle={styles.container}
                onEndReached={() => { loadPlants(page + 1, filter, plantType); }}
                onEndReachedThreshold={0.5}
                ListFooterComponent={loading ? <ActivityIndicator size="large" style={{ marginVertical: 16 }} /> : null}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        paddingBottom: 100,
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
        backgroundColor: Colors.light.tint,
        borderRadius: 25,
        paddingVertical: 8,
        paddingHorizontal: 16,
        elevation: 5,
    },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: Colors.light.tint,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    image: {
        width: 100,
        height: 100,
        borderRadius: 50
    },
    filters: {
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 20,
        gap: 15,
        alignItems: 'center',
        justifyContent: 'center'
    },
    filter: {
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        alignItems: 'center',
        alignSelf: 'flex-start',
    }
});
