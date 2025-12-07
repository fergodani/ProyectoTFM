import { View, Image, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, FlatList, ScrollView, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // Asegúrate de instalar @expo/vector-icons si no lo tienes

import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

import * as Haptics from 'expo-haptics';
import { Link, useLocalSearchParams } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { PlantService } from '@/services/plantsService';
import { PlantTrefle } from '@/models/PlanTrefle';
import { PlantInfo } from '@/models/PlantInfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Button from '@/components/Button';
import { LinearGradient } from 'expo-linear-gradient';
import { globalStyles } from '@/styles/global-styles';
import { goBack } from 'expo-router/build/global-state/routing';
import { useAuth } from '@/hooks/useAuthContext';
import { UserPlant } from '@/models/Plant';

export default function PlantSearch() {
    const params = useLocalSearchParams();
    const { isCreating, gardenId } = params;
    const router = useRouter();
    const { getUserId, accessToken } = useAuth();
    const [searchText, setSearchText] = useState('');
    const [results, setResults] = useState<PlantInfo[]>([]);
    const [loading, setLoading] = useState(false);
    const colorScheme = useColorScheme();
    const backgroundColor = colorScheme === 'dark' ? Colors.dark.background : Colors.light.background;

    useEffect(() => {
        const fetchResults = async () => {
            if (!searchText.trim()) {
                setResults([]);
                return;
            }
            setLoading(true);
            try {
                // Llama a tu servicio de búsqueda aquí
                const plants = await PlantService.getPlantInfoList(1, searchText.trim());
                setResults(plants);

            } catch (error) {
                setResults([]);
            }
            setLoading(false);
        };

        // Pequeño debounce para evitar demasiadas llamadas
        const timeout = setTimeout(fetchResults, 400);
        return () => clearTimeout(timeout);
    }, [searchText]);

    const handleCreate = async (plantId: number) => {
        try {
            const userPlant = {
                id: plantId,
                garden: Number(gardenId),
                owner: getUserId()!
            }
            await PlantService.createPlant(userPlant, accessToken!);
            router.back();
        } catch (error) {
            console.error("Error adding plant:", error);
        }
    }

    const goBack = () => {
        router.back();
    };

    return (
        <LinearGradient
            colors={['rgba(213, 240, 219, 0.19)', backgroundColor]} // Cambia estos colores a los que quieras
            style={[globalStyles.body, { padding: 16 }]}
        >
            <View style={styles.titleContainer}>
                <View style={styles.searchContainer}>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Buscar plantas..."
                        placeholderTextColor="#aaa"
                        onChangeText={setSearchText}
                        value={searchText}
                    />
                    {searchText.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchText('')}>
                            <Ionicons name="close-circle" size={22} color="#aaa" />
                        </TouchableOpacity>
                    )}
                </View>
                <TouchableOpacity onPress={goBack}>
                    <ThemedText type="default">Cancelar</ThemedText>
                </TouchableOpacity>
            </View>
            {results.length == 0 &&
                <Text style={styles.searchPlaceholder}>Busca por el nombre común o el científico</Text>
            }
            {loading && (
                <ActivityIndicator size="large" color={Colors.light.tint} style={{ marginVertical: 16 }} />
            )}

            <ScrollView contentContainerStyle={styles.container}>
                {results.map(plant => (

                    <TouchableOpacity
                        key={plant.id}
                        onPress={() => {
                            if (isCreating && gardenId) {
                                handleCreate(plant.id);
                            } else if (isCreating) {
                                router.push({
                                    pathname: "/garden-select",
                                    params: { id: plant.id }
                                })
                            } else {
                                router.push({
                                    pathname: "/plant-info-details",
                                    params: { id: plant.id }
                                })
                            }
                        }}
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
                                <ThemedText type='subtitle'>{plant.scientific_name}</ThemedText>
                            </View>
                            <TouchableOpacity style={styles.button} onPress={() => {
                                router.push({
                                    pathname: "/garden-select",
                                    params: { id: plant.id }
                                })
                            }}>
                                <Ionicons name="add-circle" size={24} color="#333" />
                            </TouchableOpacity>
                        </ThemedView>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    body: {
        flex: 1,
    },
    container: {
        paddingHorizontal: 16,
        marginTop: 16,
    },
    searchPlaceholder: {
        fontSize: 14,
        color: '#aaa',
        marginTop: 16,
        textAlign: 'center',
    },
    titleContainer: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 64
    },
    buttonContainer: {
        flex: 1,
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    reactLogo: {
        height: 178,
        width: 290,
        bottom: 0,
        left: 0,
        position: 'absolute',
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
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 25,
        paddingHorizontal: 16,
        paddingVertical: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
        width: '80%',
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: '#333',
    },
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: 30,
        backgroundColor: Colors.light.tint,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    cameraButton: {
        marginTop: 32, // Espaciado superior
        width: 200,
        height: 200,
        borderRadius: 200,
        backgroundColor: Colors.light.tint,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    button: {
        backgroundColor: Colors.light.tint,
        borderRadius: 25,
        paddingVertical: 8,
        paddingHorizontal: 16,
        elevation: 5,
        display: 'flex',
        alignItems: 'center',
        alignContent: 'center',
        justifyContent: 'center',
    }
});
