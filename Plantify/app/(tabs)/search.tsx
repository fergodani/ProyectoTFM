import { View, Image, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // Asegúrate de instalar @expo/vector-icons si no lo tienes

import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

import * as Haptics from 'expo-haptics';
import { Link } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { PlantService } from '@/services/plantsService';
import { PlantTrefle } from '@/models/PlanTrefle';
import { PlantInfo } from '@/models/PlantInfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Button from '@/components/Button';
import { LinearGradient } from 'expo-linear-gradient';
import { globalStyles } from '@/styles/global-styles';

export default function SearchScreen() {
    const router = useRouter();
    const [searchText, setSearchText] = useState('');
    const [results, setResults] = useState<PlantInfo[]>([]);
    const [loading, setLoading] = useState(false);
    const colorScheme = useColorScheme();
    const backgroundColor = colorScheme === 'dark' ? Colors.dark.background : Colors.light.background;

    const handleSearch = async () => {
        /*
        const value = searchText.trim();
        if (!value) return;
        setLoading(true);
        try {
            router.push({
                pathname: "/plant-list",
                params: { filter: value }
            });
        } catch (error) {
            console.error("Error searching plants:", error);
            setResults([]);
        }
        setLoading(false);
        */
       router.push({
                pathname: "/plant-search",
            });
    };

    const fetchPlants = async () => {
        const accessToken = await AsyncStorage.getItem('accessToken');
        console.log(accessToken);
        try {
            router.push({
                pathname: "/plant-list",
                params: { }
            });
        } catch (error) {
            console.error("ERROR FETCHING PLANTS:", error);
        }
        setLoading(false);
    };

    return (
        <LinearGradient
                        colors={['rgba(213, 240, 219, 0.19)', backgroundColor]} // Cambia estos colores a los que quieras
                        style={[globalStyles.body, {padding: 16}]}
                    >
            <View style={styles.titleContainer}>
                <ThemedText type="title">Encuentra plantas</ThemedText>
            </View>
            <ThemedText type='default'>Añade todas tus plantas para cuidarlas fácilmente</ThemedText>
            <TouchableOpacity style={styles.searchContainer} onPress={handleSearch} activeOpacity={1}>
                <View
                    style={styles.searchInput}
                >
                    <Text style={styles.searchPlaceholder}>Buscar plantas...</Text>
                </View>
                <View style={styles.iconContainer} >
                    <Ionicons name="search" size={35} color="#11181C" />
                </View>
            </TouchableOpacity>
            {loading && (
                <ActivityIndicator size="large" color={Colors.light.tint} style={{ marginVertical: 16 }} />
            )}
            <View style={styles.buttonContainer}>

                <TouchableOpacity style={styles.cameraButton} onPress={() => router.push('/camera-screen')}>
                    <Ionicons name="camera" size={120} color="#11181C" />
                </TouchableOpacity>
            </View>
            <Button text="Ver todas las plantas" onPress={fetchPlants} />
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    body: {
        flex: 1,
        padding: 16,
    },
    titleContainer: {
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
    searchPlaceholder: {
        fontSize: 14,
        color: '#aaa',
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
        marginTop: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
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
    }
});
