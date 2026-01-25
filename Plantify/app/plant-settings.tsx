import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Text, View, Image, StyleSheet, ScrollView, ActivityIndicator, useColorScheme, TouchableOpacity, Alert, Pressable, SafeAreaView, TouchableWithoutFeedback, Modal, TextInput, KeyboardAvoidingView, Platform } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Garden, UserPlant } from "@/models/Plant";
import Ionicons from "@expo/vector-icons/build/Ionicons";
import { useEffect } from "react";
import * as ImagePicker from 'expo-image-picker';
import DashedLine from "@/components/DashedLine";
import { Switch } from "react-native";
import { useState } from "react";
import { Colors } from "@/constants/Colors";
import Button from "@/components/Button";
import { SafeAreaProvider } from "react-native-safe-area-context";
import WheelPicker from '@quidone/react-native-wheel-picker';
import { useAuth } from "@/hooks/useAuthContext";
import GardensService from "@/services/gardensService";
import { PlantService } from "@/services/plantsService";
import { UserService } from "@/services/userService";
import { LinearGradient } from 'expo-linear-gradient';

const data = [...Array(100).keys()].map((index) => ({
    value: index,
    label: index.toString(),
}))

const ageOptions = [
    { value: 'less_1_year', label: 'Menos de 1 año' },
    { value: '2_3_years', label: '2-3 años' },
    { value: 'more_3_years', label: 'Más de 3 años' }
];

const ageLabels = {
    "less_1_year": "Menos de 1 año",
    "2_3_years": "2-3 años",
    "more_3_years": "Más de 3 años"
}

const timeUnitOptions = [
    { value: 'day', label: 'Día' },
    { value: 'week', label: 'Semana' },
    { value: 'month', label: 'Mes' }
];

const timeUnitLabelsPerenual = {
    "days": "día",
    "weekw": "semana",
    "months": "mes"
};

const timeUnitLabelsLower = {
    "day": "día",
    "week": "semana",
    "month": "mes"
};
const potTypeOptions = [
    { value: 'clay', label: 'Arcilla' },
    { value: 'plastic', label: 'Plástico' },
    { value: 'glazed_ceramic', label: 'Cerámica/porcelana esmaltada' },
    { value: 'cement', label: 'Cemento' },
    { value: 'peat', label: 'Turba' },
    { value: 'stone', label: 'Piedra' },
    { value: 'wood', label: 'Madera' },
    { value: 'fabric', label: 'Tela' }
];

const potTypeLabels = {
    "clay": "Arcilla",
    "plastic": "Plástico",
    "glazed_ceramic": "Cerámica/porcelana esmaltada",
    "cement": "Cemento",
    "peat": "Turba",
    "stone": "Piedra",
    "wood": "Madera",
    "fabric": "Tela"
};

const drainageOptions = [
    { value: 'with_holes', label: 'Con agujeros' },
    { value: 'without_holes', label: 'Sin agujeros' }
];

const drainageLabels = {
    "with_holes": "Con agujeros",
    "without_holes": "Sin agujeros"
};

const wateringTypeLabels = [
    { value: 'recommended', label: 'Recomendado' },
    { value: 'manual', label: 'Manual' }
];




export default function PlantSettings() {
    const params = useLocalSearchParams();
    const { plant } = params;
    const [userPlant, setUserPlant] = useState<UserPlant>(JSON.parse(plant as string));
    const [userPlantTemp, setUserPlantTemp] = useState<UserPlant>(JSON.parse(plant as string));
    const [isWateringEnabled, setIsWateringEnabled] = useState(false);
    const [isFertilityEnabled, setIsFertilityEnabled] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    type ModalType = "watering_manual" | "watering_type" | "custom_name" | "height" | "age" | "pruning" | "spraying" | "rotation" | "site" | "pot_type" | "pot_size" | "pot_drainage" | "fertilizing" | null;
    const [modalType, setModalType] = useState<ModalType>(null);
    const [confirmVisible, setConfirmVisible] = useState(false);
    const [gardens, setGardens] = useState<Garden[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { getUserId, accessToken, refreshToken, setTokens } = useAuth();
    const [isUploading, setIsUploading] = useState(false);
    const [image, setImage] = useState<string | null>(null);
    const colorScheme = useColorScheme();
    const backgroundColor = colorScheme === 'dark' ? Colors.dark.background : Colors.light.background;

    const pickImage = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permissionResult.granted) {
            Alert.alert('Permission required', 'Permission to access the media library is required.');
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            // mediaTypes compatibility: prefer MediaType if available
            mediaTypes: (ImagePicker as any).MediaType?.Images ?? (ImagePicker as any).MediaTypeOptions?.Images ?? ['images'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        const canceled = (result as any).canceled ?? (result as any).cancelled ?? false;
        let selectedUri: string | undefined;
        if ((result as any).assets && (result as any).assets.length > 0) {
            selectedUri = (result as any).assets[0].uri;
        } else if ((result as any).uri) {
            selectedUri = (result as any).uri;
        }

        if (!canceled && selectedUri) {
            setImage(selectedUri);
            // upload immediately
            setIsUploading(true);
            try {
                const updated = await PlantService.uploadPlantImage(userPlant.id as number, selectedUri, accessToken!);
                if (updated) {
                    setUserPlant(updated);
                    setUserPlantTemp(updated);
                }
            } catch (e: any) {
                console.error('Error uploading image:', e);
                if (e.message === 'Unauthorized') {
                    try {
                        const newTokens = await UserService.refreshToken(refreshToken!);
                        setTokens(newTokens.access, newTokens.refresh);
                        const updated = await PlantService.uploadPlantImage(userPlant.id as number, selectedUri, newTokens.access);
                        if (updated) {
                            setUserPlant(updated);
                            setUserPlantTemp(updated);
                        }
                    } catch (re) {
                        console.error('Refresh failed:', re);
                        Alert.alert('Error', 'No autorizado');
                    }
                } else {
                    Alert.alert('Error', 'No se pudo subir la imagen');
                }
            } finally {
                setIsUploading(false);
            }
        }
    };

    const openModal = (type: ModalType | ((prevState: ModalType) => ModalType) | null) => {
        // Sincronizar userPlantTemp con userPlant cada vez que se abre el modal
        // crear copia base
        const base = { ...userPlant } as UserPlant;

        // Rellenar valores por defecto según el tipo de modal para que
        // el valor mostrado por el WheelPicker esté reflejado en userPlantTemp
        // incluso si el usuario no mueve la rueda.
        switch (type) {
            case 'height':
                base.height = (base.height ?? 0) as any;
                break;
            case 'age':
                base.age = base.age ?? ageOptions[0].value;
                break;
            case 'watering_type':
                base.watering_type = base.watering_type ?? 'recommended';
                break;
            case 'fertilizing':
                base.fertilizing_time = base.fertilizing_time ?? 0;
                base.fertilizing_time_unit = base.fertilizing_time_unit ?? 'day';
                break;
            case 'watering_manual':
                base.watering_time = base.watering_time ?? 0;
                base.watering_unit = base.watering_unit ?? 'day';
                break;
            case 'pruning':
                base.pruning_time = base.pruning_time ?? 0;
                base.pruning_time_unit = base.pruning_time_unit ?? 'day';
                break;
            case 'spraying':
                base.sprayed_time = base.sprayed_time ?? 0;
                base.sprayed_unit = base.sprayed_unit ?? 'day';
                break;
            case 'rotation':
                base.rotation_time = base.rotation_time ?? 0;
                base.rotation_unit = base.rotation_unit ?? 'day';
                break;
            case 'site':
                base.garden = base.garden ?? (gardens && gardens.length > 0 ? gardens[0].id : 0);
                break;
            case 'pot_type':
                base.pot_type = base.pot_type ?? potTypeOptions[0].value;
                break;
            case 'pot_size':
                base.pot_size = base.pot_size ?? 0;
                break;
            case 'pot_drainage':
                base.drainage = base.drainage ?? drainageOptions[0].value;
                break;
            case 'custom_name':
            default:
                break;
        }

        setUserPlantTemp(base);
        setModalType(type);
        setIsModalVisible(true);
    };

    useEffect(() => {
        const fetchGardens = async () => {
            try {
                const response = await GardensService.getGardensName(accessToken!);
                setGardens(response);
            } catch (error) {
                console.error("Error fetching gardens:", error);
            }
        };

        fetchGardens();
    }, []);

    const handlePut = async () => {
        setIsLoading(true);
        try {
            // Crear una copia del objeto sin mutar el estado
            const plantToUpdate = {
                ...userPlantTemp,
                plant_id: userPlantTemp.perenual_details!.id
            };
            const plant = await PlantService.putPlant(plantToUpdate, accessToken!);
            if (plant) {
                setUserPlant(plant);
            }
            setIsModalVisible(false);
        } catch (error: any) {
            console.error("Error in handlePut:", error);
            if (error.message === 'Unauthorized') {
                // Handle token refresh logic here
                try {
                    const newTokens = await UserService.refreshToken(refreshToken!);
                    setTokens(newTokens.access, newTokens.refresh);

                    const plantToUpdate = {
                        ...userPlantTemp,
                        plant_id: userPlantTemp.perenual_details!.id
                    };
                    const plant = await PlantService.putPlant(plantToUpdate, newTokens.access);
                    if (plant) {
                        setUserPlant(plant);
                    }
                    setIsModalVisible(false);
                } catch (refreshError) {
                    console.error("Error refreshing tokens:", refreshError);
                }
            } else {
                // Log other errors
                console.error("Non-auth error:", error);
            }
        } finally {
            setIsLoading(false);
        }
    }

    const closeConfirm = () => {
        setConfirmVisible(false);
    };

    const handleDelete = async () => {
        try {
            const response = await PlantService.deletePlant(userPlant.id, accessToken!);
            if (response) {
                router.back();
            }
        } catch (error) {
            console.error("Error deleting plant:", error);
        }
    };


    return (
        <>
            <LinearGradient
                colors={['rgba(213, 240, 219, 0.19)', backgroundColor]} // Cambia estos colores a los que quieras
                style={[styles.container]}
            >
                <ScrollView>
                    <View style={styles.body}>
                        <ThemedView style={styles.card}>
                            <View style={styles.subcard}>
                                <View style={{ width: 100, height: 100, borderRadius: 8, overflow: 'hidden', position: 'relative' }}>
                                    {userPlant.custom_image ? (
                                        <Image source={{ uri: userPlant.custom_image }} style={{ width: '100%', height: '100%' }} />
                                    ) : (
                                        <Image source={{ uri: userPlant.image }} style={{ width: '100%', height: '100%' }} />
                                    )}

                                    {/* Small edit icon */}
                                    <View style={{ position: 'absolute', right: 6, bottom: 6 }}>
                                        <View style={{ backgroundColor: '#fff', borderRadius: 16, width: 28, height: 28, justifyContent: 'center', alignItems: 'center', elevation: 2 }}>
                                            <Ionicons name="camera" size={16} color={Colors.light.tint} />
                                        </View>
                                    </View>

                                    <TouchableOpacity
                                        style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}
                                        onPress={pickImage}
                                    >
                                        {isUploading ? <ActivityIndicator /> : null}
                                    </TouchableOpacity>
                                </View>
                                <View style={{}}>
                                    <View>
                                        <ThemedText type='title2'>{userPlant.custom_name || userPlant.common_name}</ThemedText>
                                        <ThemedText type='italic'>{userPlant.perenual_details!.scientific_name[0]}</ThemedText>
                                    </View>
                                </View>
                                <TouchableOpacity
                                    style={{ position: 'absolute', top: 0, right: 0 }}
                                    testID="custom_name"
                                    onPress={() => {
                                        openModal('custom_name')
                                    }}
                                >
                                    <Ionicons name="create" size={20} color={"#bfd8c5ff"} />
                                </TouchableOpacity>
                            </View>
                            <DashedLine />
                            <TouchableOpacity
                                style={styles.subcardTouchable}
                                onPress={() => {
                                    openModal('height')
                                }}
                            >
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                    <Ionicons name="stats-chart" size={24} color={"#bfd8c5ff"} />
                                    <ThemedText type='default'>Altura de la planta</ThemedText>
                                </View>
                                <View style={{ display: 'flex', alignItems: "center", flexDirection: "row", gap: 2, alignContent: 'center' }}>
                                    {userPlant.height ? (<ThemedText type='default'>{userPlant.height} cm</ThemedText>) : (
                                        <ThemedText type='italic'>Seleccionar</ThemedText>
                                    )}
                                    <Ionicons name="chevron-forward" size={16} color={"#bfd8c5ff"}></Ionicons>
                                </View>

                            </TouchableOpacity>
                            <View
                                style={{
                                    borderBottomWidth: 1,
                                    borderStyle: "dashed",
                                    borderColor: "#ccc",
                                    marginVertical: 16,
                                    width: "100%",
                                }}
                            />
                            <TouchableOpacity
                                style={styles.subcardTouchable}
                                onPress={() => { openModal('age'); }}
                            >
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                    <Ionicons name="time" size={24} color={"#bfd8c5ff"} />
                                    <ThemedText type='default'>Tiempo de plantación</ThemedText>
                                </View>
                                <View style={{ display: 'flex', alignItems: "center", flexDirection: "row", gap: 2, alignContent: 'center' }}>
                                    {userPlant.age ? (<ThemedText type='default'>{ageLabels[userPlant.age as keyof typeof ageLabels]}</ThemedText>) : (
                                        <ThemedText type='italic'>Seleccionar</ThemedText>
                                    )}
                                    <Ionicons name="chevron-forward" size={16} color={"#bfd8c5ff"}></Ionicons>
                                </View>
                            </TouchableOpacity>
                        </ThemedView>
                        <ThemedView style={styles.card}>
                            <ThemedText type="title2" style={{ fontWeight: "bold" }}>Horario de cuidado de plantas</ThemedText>
                            {/* Frecuencia de riego */}
                            <View style={styles.subcardTouchable}>
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                    <Ionicons name="color-fill" size={24} color={"#bfd8c5ff"} />
                                    <ThemedText type="default">Riego</ThemedText>
                                </View>
                                <View>
                                    <Switch
                                        value={userPlant.isWateringReminder}
                                        onValueChange={
                                            (value) => {
                                                userPlantTemp.isWateringReminder = value;
                                                handlePut();
                                            }
                                        }
                                        trackColor={{ false: "#ccc", true: Colors.light.tint }}
                                        thumbColor={isWateringEnabled ? Colors.light.tint : "#f4f3f4"}
                                    />
                                </View>
                            </View>
                            <TouchableOpacity
                                style={styles.innerCard}
                                onPress={() => { openModal('watering_type') }}
                            >
                                <ThemedText type="default" style={{ color: '#333' }}>Tipo</ThemedText>
                                <View style={{ display: 'flex', alignItems: "center", flexDirection: "row", gap: 2, alignContent: 'center' }}>
                                    <ThemedText type='italic' style={{ color: '#333' }}>{userPlant.watering_type === "recommended" ? "Recomendado" : "Manual"}</ThemedText>

                                    <Ionicons name="chevron-forward" size={16} color={"#333"}></Ionicons>
                                </View>

                            </TouchableOpacity>
                            <View style={styles.innerCard}>
                                <ThemedText type="default" style={{ color: '#333' }}>Frecuencia</ThemedText>
                                {userPlant.isWateringReminder && userPlant.watering_type === "recommended" && (
                                    <ThemedText type="default" style={{ color: '#333' }}>
                                        Cada {userPlant.watering_period.value.includes('-')
                                            ? Math.round((parseInt(userPlant.watering_period.value.split('-')[0]) + parseInt(userPlant.watering_period.value.split('-')[1])) / 2)
                                            : userPlant.watering_period.value} {timeUnitLabelsPerenual[userPlant.watering_period.unit as keyof typeof timeUnitLabelsPerenual]}{(userPlant.watering_period.value.includes('-') || Number(userPlant.watering_period.value) > 1) && userPlant.watering_period.unit === "month" ? "es" : ""}{(userPlant.watering_period.value.includes('-') || Number(userPlant.watering_period.value) > 1) && userPlant.watering_period.unit != "month" ? "s" : ""}
                                    </ThemedText>
                                )}
                                {userPlant.isWateringReminder && userPlant.watering_type === "manual" && (
                                    <TouchableOpacity
                                        onPress={() => { openModal('watering_manual') }}
                                    >
                                        <View style={{ display: 'flex', alignItems: "center", flexDirection: "row", gap: 2, alignContent: 'center' }}>
                                            {userPlant.watering_time ?
                                                (<ThemedText type='default' style={{ color: '#333' }}>Cada {userPlant.watering_time == 1 ? "" : userPlant.watering_time} {timeUnitLabelsLower[userPlant.watering_unit as keyof typeof timeUnitLabelsLower]}{userPlant.watering_time > 1 && userPlant.watering_unit === "month" ? "es" : ""}{userPlant.watering_time > 1 && userPlant.watering_unit != "month" ? "s" : ""}</ThemedText>)
                                                : (
                                                    <ThemedText type='italic' style={{ color: '#333' }}>Seleccionar</ThemedText>
                                                )}
                                            <Ionicons name="chevron-forward" size={16} color={"#333"}></Ionicons>
                                        </View>

                                    </TouchableOpacity>
                                )}
                                {!userPlant.isWateringReminder && (
                                    <ThemedText type="default" style={{ color: '#333' }}>
                                        Pausado
                                    </ThemedText>
                                )}
                            </View>
                            <DashedLine />
                            <View style={{ flex: 1, gap: 8 }}>
                                {/* Frecuencia de fertilización */}
                                <TouchableOpacity
                                    style={styles.subcardTouchable}
                                    onPress={() => { openModal('fertilizing') }}
                                >
                                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                        <Ionicons name="archive" size={24} color={"#bfd8c5ff"} />
                                        <ThemedText type="default">Fertilización</ThemedText>
                                    </View>
                                    <View style={{ display: 'flex', alignItems: "center", flexDirection: "row", gap: 2, alignContent: 'center' }}>
                                        {userPlant.fertilizing_time ? (<ThemedText type='default'>Cada {userPlant.fertilizing_time == 1 ? "" : userPlant.fertilizing_time} {timeUnitLabelsLower[userPlant.fertilizing_time_unit as keyof typeof timeUnitLabelsLower]}{userPlant.fertilizing_time > 1 && userPlant.fertilizing_time_unit === "month" ? "es" : ""}{userPlant.fertilizing_time > 1 && userPlant.fertilizing_time_unit != "month" ? "s" : ""}</ThemedText>) : (
                                            <ThemedText type='italic'>Seleccionar</ThemedText>
                                        )}
                                        <Ionicons name="chevron-forward" size={16} color={"#bfd8c5ff"}></Ionicons>
                                    </View>
                                </TouchableOpacity>

                                {/* Datos de poda */}
                                <TouchableOpacity
                                    style={styles.subcardTouchable}
                                    onPress={() => { openModal('pruning') }}
                                >
                                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                        <Ionicons name="cut" size={24} color={"#bfd8c5ff"} />
                                        <ThemedText type='default'>Poda</ThemedText>
                                    </View>
                                    <View style={{ display: 'flex', alignItems: "center", flexDirection: "row", gap: 2, alignContent: 'center' }}>
                                        {userPlant.pruning_time ? (<ThemedText type='default'>Cada {userPlant.pruning_time == 1 ? "" : userPlant.pruning_time} {timeUnitLabelsLower[userPlant.pruning_time_unit as keyof typeof timeUnitLabelsLower]}{userPlant.pruning_time > 1 && userPlant.pruning_time_unit === "month" ? "es" : ""}{userPlant.pruning_time > 1 && userPlant.pruning_time_unit != "month" ? "s" : ""}</ThemedText>) : (
                                            <ThemedText type='italic'>Seleccionar</ThemedText>
                                        )}
                                        <Ionicons name="chevron-forward" size={16} color={"#bfd8c5ff"}></Ionicons>
                                    </View>

                                </TouchableOpacity>

                                {/* Datos de rociado */}
                                <TouchableOpacity
                                    style={styles.subcardTouchable}
                                    onPress={() => { openModal('spraying') }}
                                >
                                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                        <Ionicons name="water" size={24} color={"#bfd8c5ff"} />
                                        <ThemedText type='default'>Rociado</ThemedText>
                                    </View>
                                    <View style={{ display: 'flex', alignItems: "center", flexDirection: "row", gap: 2, alignContent: 'center' }}>
                                        {userPlant.sprayed_time ? (<ThemedText type='default'>Cada {userPlant.sprayed_time == 1 ? "" : userPlant.sprayed_time} {timeUnitLabelsLower[userPlant.sprayed_unit as keyof typeof timeUnitLabelsLower]}{userPlant.sprayed_time > 1 && userPlant.sprayed_unit === "month" ? "es" : ""}{userPlant.sprayed_time > 1 && userPlant.sprayed_unit != "month" ? "s" : ""}</ThemedText>) : (
                                            <ThemedText type='italic'>Seleccionar</ThemedText>
                                        )}
                                        <Ionicons name="chevron-forward" size={16} color={"#bfd8c5ff"}></Ionicons>
                                    </View>

                                </TouchableOpacity>

                                {/* Datos de rotacion */}
                                <TouchableOpacity
                                    style={styles.subcardTouchable}
                                    onPress={() => { openModal('rotation') }}
                                >
                                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                        <Ionicons name="sync" size={24} color={"#bfd8c5ff"} />
                                        <ThemedText type='default'>Rotación</ThemedText>
                                    </View>
                                    <View style={{ display: 'flex', alignItems: "center", flexDirection: "row", gap: 2, alignContent: 'center' }}>
                                        {userPlant.rotation_time ? (<ThemedText type='default'>Cada {userPlant.rotation_time == 1 ? "" : userPlant.rotation_time} {timeUnitLabelsLower[userPlant.rotation_unit as keyof typeof timeUnitLabelsLower]}{userPlant.rotation_time > 1 && userPlant.rotation_unit === "month" ? "es" : ""}{userPlant.rotation_time > 1 && userPlant.rotation_unit != "month" ? "s" : ""}</ThemedText>) : (
                                            <ThemedText type='italic'>Seleccionar</ThemedText>
                                        )}
                                        <Ionicons name="chevron-forward" size={16} color={"#bfd8c5ff"}></Ionicons>
                                    </View>

                                </TouchableOpacity>
                            </View>
                        </ThemedView>
                        {/* Datos del sitio */}
                        <ThemedView style={[styles.card, { gap: 16 }]}>
                            <ThemedText type="title2" style={{ fontWeight: "bold" }}>Establecer sitio</ThemedText>
                            <TouchableOpacity
                                style={styles.subcardTouchable}
                                onPress={() => { openModal('site') }}
                                disabled={gardens.length === 0}
                            >
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                    <Ionicons name="location" size={24} color={"#bfd8c5ff"} />
                                    <ThemedText type='default'>Lugar</ThemedText>
                                </View>
                                <View style={{ display: 'flex', alignItems: "center", flexDirection: "row", gap: 2, alignContent: 'center' }}>
                                    {userPlant.garden_name ? (<ThemedText type='default'>{userPlant.garden_name}</ThemedText>) : (
                                        <ThemedText type='italic'>{gardens.length == 0 ? "No hay lugares" : "Seleccionar"}</ThemedText>
                                    )}
                                    {gardens.length !== 0 &&
                                        <Ionicons name="chevron-forward" size={16} color={"#bfd8c5ff"}></Ionicons>
                                    }
                                </View>

                            </TouchableOpacity>
                        </ThemedView>

                        {/* Datos de la maceta */}
                        <ThemedView style={[styles.card, { gap: 16 }]}>
                            <ThemedText type="title2" style={{ fontWeight: "bold" }}>Maceta</ThemedText>
                            {/* Tipo de la maceta */}
                            <TouchableOpacity
                                style={styles.subcardTouchable}
                                onPress={() => {
                                    openModal('pot_type')
                                }}
                            >
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                    <Ionicons name="grid" size={24} color={"#bfd8c5ff"} />
                                    <ThemedText type='default'>Tipo</ThemedText>
                                </View>
                                <View style={{ display: 'flex', alignItems: "center", flexDirection: "row", gap: 2, alignContent: 'center' }}>
                                    {userPlant.pot_type ? (<ThemedText type='default'>{potTypeLabels[userPlant.pot_type as keyof typeof potTypeLabels]}</ThemedText>) : (
                                        <ThemedText type='italic'>Seleccionar</ThemedText>
                                    )}
                                    <Ionicons name="chevron-forward" size={16} color={"#bfd8c5ff"}></Ionicons>
                                </View>
                            </TouchableOpacity>

                            {/* Tamaño de la maceta */}
                            <TouchableOpacity
                                style={styles.subcardTouchable}
                                onPress={() => {
                                    openModal('pot_size')
                                }}
                            >
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                    <Ionicons name="stats-chart" size={24} color={"#bfd8c5ff"} />
                                    <ThemedText type='default'>Tamaño</ThemedText>
                                </View>
                                <View style={{ display: 'flex', alignItems: "center", flexDirection: "row", gap: 2, alignContent: 'center' }}>
                                    {userPlant.pot_size ? (<ThemedText type='default'>{userPlant.pot_size} cm</ThemedText>) : (
                                        <ThemedText type='italic'>Seleccionar</ThemedText>
                                    )}
                                    <Ionicons name="chevron-forward" size={16} color={"#bfd8c5ff"}></Ionicons>
                                </View>
                            </TouchableOpacity>

                            {/* Drenaje de la maceta */}
                            <TouchableOpacity
                                style={styles.subcardTouchable}
                                onPress={() => {
                                    openModal('pot_drainage')
                                }}
                            >
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                    <Ionicons name="water" size={24} color={"#bfd8c5ff"} />
                                    <ThemedText type='default'>Drenaje</ThemedText>
                                </View>
                                <View style={{ display: 'flex', alignItems: "center", flexDirection: "row", gap: 2, alignContent: 'center' }}>
                                    {userPlant.drainage ? (<ThemedText type='default'>{drainageLabels[userPlant.drainage as keyof typeof drainageLabels]}</ThemedText>) : (
                                        <ThemedText type='italic'>Seleccionar</ThemedText>
                                    )}
                                    <Ionicons name="chevron-forward" size={16} color={"#bfd8c5ff"}></Ionicons>
                                </View>
                            </TouchableOpacity>
                        </ThemedView>
                        <Button text="Eliminar esta planta" onPress={() => { setConfirmVisible(true); }} />
                    </View>

                </ScrollView>
            </LinearGradient>
            <Modal
                visible={isModalVisible}
                transparent={true}
                animationType="slide">
                <KeyboardAvoidingView
                    style={styles.centeredView}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <View style={styles.centeredView}>
                    <View style={styles.modalView}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 20 }}>
                            <TouchableOpacity
                                onPress={() => {
                                    setIsModalVisible(false);
                                }}
                                style={{ padding: 10, minWidth: 60, alignItems: 'center' }}
                                disabled={isLoading}
                            >
                                <ThemedText type="default" style={{ color: isLoading ? "#999" : "#000" }}>Cerrar</ThemedText>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => {
                                    handlePut();
                                }}
                                style={{ padding: 10, minWidth: 60, alignItems: 'center', backgroundColor: isLoading ? '#ccc' : '#4CAF50', borderRadius: 5, flexDirection: 'row', gap: 8 }}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <ActivityIndicator size="small" color="#fff" />
                                        <ThemedText type="default" style={{ color: "#fff", fontWeight: 'bold' }}>Guardando...</ThemedText>
                                    </>
                                ) : (
                                    <ThemedText type="default" style={{ color: "#fff", fontWeight: 'bold' }}>Aceptar</ThemedText>
                                )}
                            </TouchableOpacity>
                        </View>
                        {modalType === 'custom_name' && (
                            <View style={styles.searchContainer}>
                                <TextInput
                                    placeholder="Nombre de la planta"
                                    placeholderTextColor={colorScheme === 'dark' ? Colors.dark.placeholder : Colors.light.placeholder}
                                    autoCapitalize="none"
                                    style={styles.searchInput}
                                    value={userPlantTemp.custom_name || ''}
                                    onChangeText={(text) => setUserPlantTemp({ ...userPlantTemp, custom_name: text })}
                                />
                            </View>
                        )}
                        {modalType === 'height' && (
                            <WheelPicker
                                data={data}
                                width={100}
                                value={userPlantTemp.height || 0}
                                onValueChanged={({ item: { value } }) => setUserPlantTemp({ ...userPlantTemp, height: value })}
                                enableScrollByTapOnItem={true}
                            />
                        )}
                        {modalType === 'age' && (
                            <WheelPicker
                                data={ageOptions}
                                width={200}
                                value={userPlantTemp.age || ""}
                                onValueChanged={({ item: { value } }) => setUserPlantTemp({ ...userPlantTemp, age: value })}
                                enableScrollByTapOnItem={true}
                            />
                        )}
                        {modalType === 'watering_type' && (
                            <WheelPicker
                                data={wateringTypeLabels}
                                width={200}
                                value={userPlantTemp.watering_type || ""}
                                onValueChanged={({ item: { value } }) => setUserPlantTemp({ ...userPlantTemp, watering_type: value })}
                                enableScrollByTapOnItem={true}
                            />
                        )}
                        {modalType === 'fertilizing' && (
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 100 }}>
                                <WheelPicker
                                    data={data}
                                    width={100}
                                    value={userPlantTemp.fertilizing_time || 0}
                                    onValueChanged={({ item: { value } }) => setUserPlantTemp({ ...userPlantTemp, fertilizing_time: value })}
                                    enableScrollByTapOnItem={true}
                                />
                                <WheelPicker
                                    data={timeUnitOptions}
                                    width={100}
                                    value={userPlantTemp.fertilizing_time_unit || "day"}
                                    onValueChanged={({ item: { value } }) => setUserPlantTemp({ ...userPlantTemp, fertilizing_time_unit: value })}
                                    enableScrollByTapOnItem={true}
                                />
                            </View>
                        )}
                        {modalType === 'watering_manual' && (
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 100 }}>
                                <WheelPicker
                                    data={data}
                                    width={100}
                                    value={userPlantTemp.watering_time || 0}
                                    onValueChanged={({ item: { value } }) => setUserPlantTemp({
                                        ...userPlantTemp,
                                        watering_time: value,
                                        watering_unit: userPlantTemp.watering_unit || "day"
                                    })}
                                    enableScrollByTapOnItem={true}
                                />
                                <WheelPicker
                                    data={timeUnitOptions}
                                    width={100}
                                    value={userPlantTemp.watering_unit || "day"}
                                    onValueChanged={({ item: { value } }) => setUserPlantTemp({ ...userPlantTemp, watering_unit: value })}
                                    enableScrollByTapOnItem={true}
                                />
                            </View>
                        )}
                        {modalType === 'pruning' && (
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 100 }}>
                                <WheelPicker
                                    data={data}
                                    width={100}
                                    value={userPlantTemp.pruning_time || 0}
                                    onValueChanged={({ item: { value } }) => setUserPlantTemp({
                                        ...userPlantTemp,
                                        pruning_time: value,
                                        pruning_time_unit: userPlantTemp.pruning_time_unit || "day"
                                    })}
                                    enableScrollByTapOnItem={true}
                                />
                                <WheelPicker
                                    data={timeUnitOptions}
                                    width={100}
                                    value={userPlantTemp.pruning_time_unit || "day"}
                                    onValueChanged={({ item: { value } }) => setUserPlantTemp({ ...userPlantTemp, pruning_time_unit: value })}
                                    enableScrollByTapOnItem={true}
                                />
                            </View>
                        )}
                        {modalType === 'spraying' && (
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 100 }}>
                                <WheelPicker
                                    data={data}
                                    width={100}
                                    value={userPlantTemp.sprayed_time || 0}
                                    onValueChanged={({ item: { value } }) => setUserPlantTemp({ ...userPlantTemp, sprayed_time: value })}
                                    enableScrollByTapOnItem={true}
                                />
                                <WheelPicker
                                    data={timeUnitOptions}
                                    width={100}
                                    value={userPlantTemp.sprayed_unit || "day"}
                                    onValueChanged={({ item: { value } }) => setUserPlantTemp({ ...userPlantTemp, sprayed_unit: value })}
                                    enableScrollByTapOnItem={true}
                                />
                            </View>
                        )}
                        {modalType === 'rotation' && (
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 100 }}>
                                <WheelPicker
                                    data={data}
                                    width={100}
                                    value={userPlantTemp.rotation_time || 0}
                                    onValueChanged={({ item: { value } }) => setUserPlantTemp({ ...userPlantTemp, rotation_time: value })}
                                    enableScrollByTapOnItem={true}
                                />
                                <WheelPicker
                                    data={timeUnitOptions}
                                    width={100}
                                    value={userPlantTemp.rotation_unit || "day"}
                                    onValueChanged={({ item: { value } }) => setUserPlantTemp({ ...userPlantTemp, rotation_unit: value })}
                                    enableScrollByTapOnItem={true}
                                />
                            </View>
                        )}
                        {modalType === 'site' && (
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 100 }}>
                                <WheelPicker
                                    data={gardens.map(garden => ({ value: garden.id, label: garden.name }))}
                                    width={200}
                                    value={Number(userPlantTemp.garden) || 0}
                                    onValueChanged={({ item: { value } }) => setUserPlantTemp({ ...userPlantTemp, garden: value })}
                                    enableScrollByTapOnItem={true}
                                />
                            </View>
                        )}
                        {modalType === 'pot_type' && (
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 100 }}>
                                <WheelPicker
                                    data={potTypeOptions}
                                    value={userPlantTemp.pot_type || ""}
                                    width={200}
                                    onValueChanged={({ item: { value } }) => setUserPlantTemp({ ...userPlantTemp, pot_type: value })}
                                    enableScrollByTapOnItem={true}
                                />
                            </View>
                        )}
                        {modalType === 'pot_size' && (
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 100 }}>
                                <WheelPicker
                                    data={data}
                                    value={userPlantTemp.pot_size || 0}
                                    width={100}
                                    onValueChanged={({ item: { value } }) => setUserPlantTemp({ ...userPlantTemp, pot_size: value })}
                                    enableScrollByTapOnItem={true}
                                />
                            </View>
                        )}
                        {modalType === 'pot_drainage' && (
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 100 }}>
                                <WheelPicker
                                    data={drainageOptions}
                                    value={userPlantTemp.drainage || ""}
                                    width={200}
                                    onValueChanged={({ item: { value } }) => setUserPlantTemp({ ...userPlantTemp, drainage: value })}
                                    enableScrollByTapOnItem={true}
                                />
                            </View>
                        )}
                    </View>
                </View>
                </KeyboardAvoidingView>
            </Modal >
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
                        <ThemedText type="title2">¿Seguro que quieres eliminar esta planta?</ThemedText>
                        <ThemedText type="default">Al eliminar la planta todos los datos se eliminarán. Esta acción no podrá deshacerse.</ThemedText>
                        <View style={{ display: 'flex', flexDirection: 'row', gap: 12, justifyContent: 'flex-end', width: '100%' }}>
                            <Pressable style={{ marginBottom: 12 }} onPress={() => {
                                closeConfirm();
                            }}>
                                <ThemedText type="defaultSemiBold">Cancelar</ThemedText>
                            </Pressable>
                            <Pressable onPress={() => {
                                handleDelete();
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
    body: {
        padding: 16,
        flex: 1,
        gap: 16,
    },
    container: {
        flex: 1,
    },
    image: {
        width: 200,
        height: 200,
        borderRadius: 16,
        marginBottom: 16,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 25,
        paddingHorizontal: 16,
        paddingVertical: 16,
        marginTop: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
        backgroundColor: Colors.light.tint,
        width: '100%',
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: '#333',
    },
    card: {
        padding: 16,
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
        borderBottomLeftRadius: 8,
        borderBottomRightRadius: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        display: "flex",
        flexDirection: "column",
    },
    subcard: {
        display: "flex",
        flexDirection: "row",
        gap: 12,
        alignItems: "center",
        marginBottom: 16,
    },
    subcardTouchable: {
        display: 'flex',
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        justifyContent: "space-between",
        marginBottom: 16,
    },
    innerCard: {
        padding: 12,
        borderRadius: 8,
        backgroundColor: "#b1b1b1ff",
        marginTop: 8,
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between"
    },
    modalOverlay: {
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        height: '100%',
        backgroundColor: 'rgba(0,0,0,0.3)'
    },
    centeredView: {
        flex: 1,
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    modalView: {
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        padding: 35,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        width: '100%',
    },
    button: {
        borderRadius: 20,
        padding: 10,
        elevation: 2,
    },
    buttonOpen: {
        backgroundColor: '#F194FF',
    },
    buttonClose: {
        backgroundColor: '#2196F3',
    },
    textStyle: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
    },
    modalText: {
        marginBottom: 15,
        textAlign: 'center',
    },
    input: {
        height: 40,
        borderColor: 'gray',
        borderWidth: 1,
        paddingHorizontal: 8,
        borderRadius: 4,
    },
});