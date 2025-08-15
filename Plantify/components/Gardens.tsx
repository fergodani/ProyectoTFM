import React, { useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import gardensService from '@/services/gardensService';
import { Garden } from '@/models/Plant';
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

export default function Gardens({ plantId }: Readonly<{ plantId: number | null }>) {
    const colorScheme = useColorScheme();
    const router = useRouter();
    const { getUserId, accessToken, refreshToken, setTokens } = useAuth();
    const [gardens, setGardens] = React.useState<Garden[]>([]);

    const fetchGardens = async () => {
        if (!getUserId()) {
            console.error("User ID not found");
            return;
        }
        try {
            const data = await GardensService.getAllGardens(accessToken!);
            setGardens(data);
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
        }
    };

    const handleCreatePlantInGarden = async (gardenId: number) => {
        try {
            const userPlant = {
                plant_id: plantId,
                garden: Number(gardenId),
                owner: getUserId()!
            }
            console.log(userPlant)
            await PlantService.createPlant(userPlant, accessToken!);
            router.replace("/(tabs)/profile");
        } catch (error) {
            console.error("Error adding plant:", error);
        }
    }

    const handleAdd = () => {
        router.push("/garden-form");
    };

    useFocusEffect(
    
        React.useCallback(() => {
            fetchGardens();
        }, [])
    );

    return (
        <ScrollView style={styles.container}>
            {gardens.map((garden: Garden) => {
                // Suponiendo que garden.plants es un array de plantas con propiedad image
                const plantImages = garden.user_plants?.slice(0, 3).map(p => p.plant.image) || [];
                return (
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
                                <ThemedText type='default'>{garden.location}</ThemedText>
                                <ThemedText type='default'>{garden.user_plants?.length} {garden.user_plants?.length == 1 ? 'planta' : 'plantas'}</ThemedText>
                            </View>
                            <TouchableOpacity style={styles.buttonMenu} onPress={() => { }}>
                                <Ionicons name="ellipsis-vertical" size={24} color={colorScheme === "dark" ? Colors.dark.text : Colors.light.text} />
                            </TouchableOpacity>
                        </ThemedView>
                    </TouchableOpacity>
                );
            })}
            { !plantId && (
              <Button text="Añadir jardín" onPress={handleAdd} />
            )}
            <View style={{ marginBottom: 24 }} />
        </ScrollView>
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
    }
});