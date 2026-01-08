import { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, TouchableOpacity, View, useColorScheme } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { Pest, PestDetailParsed } from '@/models/Pest';
import { globalStyles } from '@/styles/global-styles';
import { PestsService } from '@/services/pestsService';
import ParallaxScrollView from '@/components/ParallaxScrollView';

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL;

export default function PestDetails() {
    const { id } = useLocalSearchParams<{ id?: string }>();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [pest, setPest] = useState<PestDetailParsed | null>(null);
    const colorScheme = useColorScheme();
    const navigation = useNavigation();
    const backgroundColor = colorScheme === 'dark' ? Colors.dark.background : Colors.light.background;

    useEffect(() => {
        const fetchDetails = async () => {
            if (!id) return;
            setLoading(true);
            setError(null);
            try {
                const json = await PestsService.getPestDetails(id);
                setPest(json);
            } catch (e: any) {
                setError(e?.message || 'Error cargando detalles');
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [id]);

    useLayoutEffect(() => {
        navigation.setOptions({
          title: pest?.name
            ? pest.name.charAt(0).toUpperCase() + pest.name.slice(1)
            : "Detalles de la plaga",
        });
      }, [navigation, pest]);

    return (
        <View style={{ flex: 1 }}
        >
            <ParallaxScrollView
                headerImage={
                    <Image
                        source={{ uri: pest?.image }}
                        style={{ width: '100%', height: 250 }}
                        resizeMode="cover"
                    />
                }
                headerBackgroundColor={{ light: '#4CAF50', dark: '#222' }}
            >

                {loading && (
                    <View style={{ marginTop: 48, alignItems: 'center' }}>
                        <ActivityIndicator size="large" color={Colors.light.tint} />
                    </View>
                )}

                {!loading && error && (
                    <ThemedText type='default' style={{ margin: 16, color: '#c00' }}>{error}</ThemedText>
                )}

                {!loading && pest && (
                    <View>
                        {/* Title and names */}
                        <View style={{ paddingHorizontal: 10, marginTop: 16 }}>
                            <ThemedText type='title2' style={{ marginBottom: 4 }}>{pest.name}</ThemedText>
                            <ThemedText type='subtitle'>{pest.scientific_name}</ThemedText>
                        </View>

                        {/* Sections */}
                        {pest.sections.map((section, idx) => {
                            const items = [
                                ...section.paragraphs.map((paragraph: string) => ({
                                    subtitle: '',
                                    description: paragraph,
                                })),
                                ...(section.bullets && section.bullets.length
                                    ? [{
                                        subtitle: '',
                                        description: section.bullets.map((b: string) => `• ${b}`).join('\n'),
                                    }]
                                    : [])
                            ];

                            return (
                                <Section
                                    key={`${section.title}-${idx}`}
                                    title={section.title}
                                    items={items}
                                />
                            );
                        })}
                    </View>
                )}
            </ParallaxScrollView>
        </View>
    );
}

function Section({ title, items }: { title: string; items: { subtitle: string; description: string }[] }) {
    return (
        <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
            <ThemedText type='subtitle' style={{ marginBottom: 8 }}>{title}</ThemedText>
            {items.map((it, idx) => (
                <ThemedView key={`${it.subtitle}-${idx}`} style={styles.card}>
                    {it.subtitle ? (
                        <ThemedText type='subtitle' style={{ marginBottom: 6 }}>{it.subtitle}</ThemedText>
                    ) : null}
                    {it.description ? (
                        <ThemedText type='default'>{it.description}</ThemedText>
                    ) : null}
                </ThemedView>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    headerBar: {
        paddingHorizontal: 8,
        paddingTop: 20,
        paddingBottom: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    iconBtn: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    hero: {
        width: '100%',
        height: 220,
        borderRadius: 12,
        backgroundColor: '#ddd',
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#DDF0D5',
    },
    chipText: {
        color: '#11181C',
    },
    hostPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f1f1f1',
    },
    hostText: {
        color: '#11181C',
    },
    card: {
        padding: 16,
        marginVertical: 8,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 2,
    },
    thumb: {
        width: 90,
        height: 90,
        borderRadius: 10,
        backgroundColor: '#eaeaea',
    },
});

