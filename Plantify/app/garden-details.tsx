import { Garden } from '@/models/Plant';
import GardensService from '@/services/gardensService';
import { useFocusEffect, useLocalSearchParams, useNavigation, router } from 'expo-router';
import React, { useEffect, useLayoutEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Colors';
import { useColorScheme, StyleSheet, View, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import Plants from '@/components/Plants';

interface GardenDetailsProps {
    id: string;
}

export default function GardenDetails() {
    const params = useLocalSearchParams();
    const { id } = params;
    const [garden, setGarden] = React.useState<Garden | null>(null);
    const colorScheme = useColorScheme();
    const navigation = useNavigation();
    const backgroundColor = colorScheme === 'dark' ? Colors.dark.background : Colors.light.background;

    const fetchGarden = async () => {
        const data = await GardensService.getGardenById(Number(id));
        setGarden(data);
    }

    useFocusEffect(
        React.useCallback(() => {
            fetchGarden();
        }, [])
    );

    /*
    useLayoutEffect(() => {
        navigation.setOptions({
            title: garden?.name
        });
    }, [navigation, garden]);
    */


    return (
        <LinearGradient
            colors={['rgba(213, 240, 219, 0.19)', backgroundColor]}
            style={[styles.container]}
        >
            <View style={styles.titleContainer}>
                <ThemedText type="title">{garden?.name}</ThemedText>
                <TouchableOpacity onPress={() => {
                            router.push({
                              pathname: `/garden-settings`,
                              params: { gardenString: JSON.stringify(garden) }
                            })
                          }}>
                    <Ionicons name="settings" size={24} color={Colors.light.tint} />
                </TouchableOpacity>
            </View>
            {garden && <Plants gardenId={garden.id} />}
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    tab: {
        backgroundColor: Colors.light.tint,
        borderRadius: 8,
        marginBottom: 16,
        marginHorizontal: 16,
    },
    titleContainer: {
        gap: 8,
        paddingVertical: 16,
        paddingHorizontal: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignContent: 'center',
        alignItems: 'center',
    },
    stepContainer: {
        gap: 8,
        marginBottom: 8,
    },
    reactLogo: {
        height: 178,
        width: 290,
        bottom: 0,
        left: 0,
        position: 'absolute',
    },
    title: {
        fontSize: 18,
        fontWeight: "bold",
    },
    text: {
        fontSize: 14,
        marginTop: 4,
        paddingHorizontal: 16,
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
    fab: {
        position: 'absolute',
        bottom: 16,
        right: 16,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: Colors.light.tint,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '80%',
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    input: {
        width: '100%',
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 8,
        marginBottom: 16,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    menuOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.01)',
        alignItems: 'flex-end',
        position: 'absolute',
        right: 0,
    },
    menuContent: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 16,
        margin: 16,
        minWidth: 160,
        elevation: 6,
    },
    menuButton: {
        paddingVertical: 12,
    },
    menuText: {
        fontSize: 16,
    },
});