import { ThemedText } from "@/components/ThemedText";
import { useColorScheme, View, StyleSheet, Touchable, TouchableOpacity, Image } from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import Button from "@/components/Button";

export const options = {
    headerShown: false,
};

export default function HealthTab() {
    const colorScheme = useColorScheme();
    const backgroundColor = colorScheme === 'dark' ? Colors.dark.background : Colors.light.background;
    return (
        <LinearGradient
            colors={['rgba(213, 240, 219, 0.19)', backgroundColor]} // Cambia estos colores a los que quieras
            style={[styles.container, { padding: 16 }]}
        >
            <View style={styles.titleContainer}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignContent: 'center', gap: 8 }}>
                    <ThemedText type="title">Diagnóstico</ThemedText>
                </View>
            </View>
            <ThemedText type='default'>Ayuda a tus plantas a mantenerse saludables con un diagnóstico inteligente</ThemedText>
            <View style={{...styles.card, backgroundColor: colorScheme === 'dark' ? Colors.dark.background : Colors.light.background, alignItems: 'center', padding: 24, marginTop: 24, gap: 12 }}>
                <Image
                    source={require('../../assets/images/plant_scan.jpg')}
                    style={{ width: 100, height: 100, borderRadius: 8 }}
                />
                <ThemedText type='title2'>¿Problemas con tus plantas?</ThemedText>
                <ThemedText type='default'>Utiliza nuestra herramienta de autodiagnóstico para identificar plagas y enfermedades en tus plantas mediante imágenes.</ThemedText>
                <TouchableOpacity
                    onPress={() => {
                        router.push({
                            pathname: '/camera-screen',
                            params: { isPest: 'true' }
                        })
                    }}
                    style={styles.button}
                >
                    <Ionicons name="camera" size={18} color="#11181C" />
                    <ThemedText type='default' style={{ color: '#11181C' }}>Autodiagnóstico</ThemedText>

                </TouchableOpacity>
            </View>
            <View style={{ marginTop: 24, gap: 12 }}>

                <Button
                    text="Plagas y enfermedades"
                    onPress={() => router.push('/pests-search')}
                />
            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    titleContainer: {
        gap: 8,
        marginTop: 64,
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
    button: {
        marginTop: 32, // Espaciado superior
        width: '100%',
        height: 50,
        borderRadius: 25,
        backgroundColor: Colors.light.tint,
        flexDirection: 'row',
        gap: 8,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    }
});