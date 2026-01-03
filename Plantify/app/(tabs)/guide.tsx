import React, { useState } from 'react';
import {
    View,
    Text,
    Image,
    StyleSheet,
    TouchableOpacity,
    LayoutAnimation,
    FlatList,
    SafeAreaView,
    Platform,
    UIManager,
    ListRenderItem,
    useColorScheme
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Importa tu JSON. TypeScript lo reconocerá gracias a "resolveJsonModule"
import guiasData from '../../assets/data/guia_cuidados.json';
import { globalStyles } from '@/styles/global-styles';
import { Colors } from '@/constants/Colors';
import { ThemedText } from '@/components/ThemedText';

// --- 1. Definición de Tipos (Interfaces) ---
interface Consejo {
    tema: string;
    contenido: string;
    titulo?: string;
    imagen?: string; // soporta la clave 'imagen' en el JSON
    image?: string;  // soporta la clave 'image' en el JSON
    url?: string;    // soporta la clave 'url' en el JSON
}

interface GuiaData {
    id: string;
    titulo: string;
    icono: string;
    colorFondo: string;
    colorTexto: string;
    consejos: Consejo[];
}

// Habilitar animaciones en Android
if (
    Platform.OS === 'android' &&
    UIManager.setLayoutAnimationEnabledExperimental
) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

// --- 2. Componente de Tarjeta Individual ---

interface GuideCardProps {
    item: GuiaData;
}

const GuideCard: React.FC<GuideCardProps> = ({ item }) => {
    const [expanded, setExpanded] = useState<boolean>(false);

    const toggleExpand = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpanded(!expanded);
    };

    return (
        <View style={[styles.cardContainer, { backgroundColor: item.colorFondo }]}>
            {/* Cabecera */}
            <TouchableOpacity
                style={styles.cardHeader}
                onPress={toggleExpand}
                activeOpacity={0.7}
            >
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.icon}>{item.icono}</Text>
                    <Text style={[styles.title, { color: item.colorTexto }]}>
                        {item.titulo}
                    </Text>
                </View>

                <Text style={[styles.chevron, { color: item.colorTexto }]}>
                    {expanded ? '▲' : '▼'}
                </Text>
            </TouchableOpacity>

            {/* Contenido Expandible */}
            {expanded && (
                <View style={styles.cardBody}>
                    {item.consejos.map((consejo, index) => (
                        consejo.titulo === "true" ? (
                            <Text key={index} style={styles.title}>{consejo.tema}</Text>
                        ) : (
                            <View key={index} style={styles.tipContainer}>
                                <Text style={[styles.tipTitle, { color: item.colorTexto }]}>• {consejo.tema}</Text>
                                <Text style={styles.tipContent}>{consejo.contenido}</Text>
                                {/* Posible URL de imagen en varias claves del JSON */}
                                {(() => {
                                    const img = consejo.imagen || consejo.image || consejo.url;
                                    if (!img) return null;
                                    return (
                                        <Image
                                            source={{ uri: img }}
                                            style={styles.tipImage}
                                            resizeMode="cover"
                                        />
                                    );
                                })()}
                            </View>
                        )
                        
                    ))}
                </View>
            )}
        </View>
    );
};

// --- 3. Pantalla Principal ---

const GuiaScreen: React.FC = () => {
    const colorScheme = useColorScheme();
    const backgroundColor = colorScheme === 'dark' ? Colors.dark.background : Colors.light.background;
    // Tipamos el renderItem para mayor seguridad
    const renderItem: ListRenderItem<GuiaData> = ({ item }) => (
        <GuideCard item={item} />
    );

    return (
        <LinearGradient
            colors={['rgba(213, 240, 219, 0.19)', backgroundColor]} // Cambia estos colores a los que quieras
            style={globalStyles.body}
        >
            <View style={styles.titleContainer}>
                <ThemedText type="title">Guía de cuidados</ThemedText>

                <FlatList
                    data={guiasData as GuiaData[]} // Casting simple para asegurar el tipo
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            </View>
        </LinearGradient>
    );
};

// --- 4. Estilos (Sin cambios vs JS) ---
const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    titleContainer: {
        marginTop: 64,
        gap: 8,
        paddingHorizontal: 16,
    },
    screenTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        padding: 15,
        color: '#333',
    },
    listContent: {
        paddingHorizontal: 5,
        paddingBottom: 40,
    },
    cardContainer: {
        borderRadius: 16,
        marginBottom: 16,
        overflow: 'hidden',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
    },
    headerTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    icon: {
        fontSize: 24,
        marginRight: 12,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    chevron: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    cardBody: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    tipContainer: {
        marginBottom: 15,
    },
    tipTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    tipContent: {
        fontSize: 14,
        color: '#444',
        lineHeight: 20,
    },
    tipImage: {
        width: '100%',
        height: 180,
        borderRadius: 12,
        marginTop: 10,
        backgroundColor: '#eee',
    },
});

export default GuiaScreen;