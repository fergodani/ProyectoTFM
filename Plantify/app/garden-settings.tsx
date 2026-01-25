import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Text, View, Image, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, useColorScheme, TouchableOpacity, Alert, Pressable, SafeAreaView, TouchableWithoutFeedback, Modal, TextInput } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Garden, UserPlant } from "@/models/Plant";
import Ionicons from "@expo/vector-icons/build/Ionicons";
import { useEffect } from "react";
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

const data = [...Array(100).keys()].map((index) => ({
    value: index,
    label: index.toString(),
}))

const locationOptions = [
    { value: 'indoor', label: 'Interior' },
    { value: 'outdoor', label: 'Exterior' }
];

const locationLabels = {
    "indoor": "Interior",
    "outdoor": "Exterior"
}

const sunlightExposureOptions = [
    { value: 'full_sun', label: 'Sol directo' },
    { value: 'partial_sun', label: 'Sol parcial' },
    { value: 'indirect_sun', label: 'Luz indirecta' },
    { value: 'full_shade', label: 'Sombra total' }
];

const sunlightExposureLabels = {
    "full_sun": "Sol directo",
    "partial_sun": "Sol parcial",
    "indirect_sun": "Luz indirecta",
    "full_shade": "Sombra total"
};

const humidityOptions = [
    { value: 'low', label: 'Baja humedad' },
    { value: 'normal', label: 'Humedad normal' },
    { value: 'high', label: 'Alta humedad' }
];

const humidityLabels = {
    "low": "Baja humedad",
    "normal": "Humedad normal",
    "high": "Alta humedad"
};

export default function GardenSettings() {
    const params = useLocalSearchParams();
    const { gardenString } = params;
    const [garden, setGarden] = useState<Garden>(JSON.parse(gardenString as string));
    const [gardenTemp, setGardenTemp] = useState<Garden>(JSON.parse(gardenString as string));
    const [isModalVisible, setIsModalVisible] = useState(false);
    type ModalType = "name" | "location" | "sun" | "humidity" | "air" | null;
    const [modalType, setModalType] = useState<ModalType>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [name, setName] = useState(garden.name);
    const router = useRouter();
    const { getUserId, accessToken, refreshToken, setTokens } = useAuth();
    const [confirmVisible, setConfirmVisible] = useState(false);
    const colorScheme = useColorScheme();
    const backgroundColor = colorScheme === 'dark' ? Colors.dark.background : Colors.light.background;

    const openModal = (type: ModalType | ((prevState: ModalType) => ModalType) | null) => {
        setModalType(type);
        setIsModalVisible(true);
    };

    useEffect(() => {
    }, []);

    const handlePut = async () => {
        setIsLoading(true);
        try {
            gardenTemp.name = name;
            const garden = await GardensService.updateGarden(gardenTemp, accessToken!);
            if (garden)
                setGarden(garden);
            setIsModalVisible(false);
        } catch (error: any) {
            if (error.message === 'Unauthorized') {
                // Handle token refresh logic here
                try {
                    const newTokens = await UserService.refreshToken(refreshToken!);
                    setTokens(newTokens.access, newTokens.refresh);

                    const garden = await GardensService.updateGarden(gardenTemp, newTokens.access);
                    if (garden)
                        setGarden(garden);
                    setIsModalVisible(false);
                } catch (refreshError) {
                    console.error("Error refreshing tokens:", refreshError);
                }
            }
        } finally {
            setIsLoading(false);
        }
    }

    const handleDelete = async () => {
        try {
            const response = await GardensService.deleteGarden(garden.id, accessToken!);
            router.replace("/(tabs)/profile");
        } catch (error) {
            console.error("Error deleting garden:", error);
        }
    };

    const closeConfirm = () => {
        setConfirmVisible(false);
    };


    return (
        <>
            <ScrollView>
                <View style={styles.body}>
                    <ThemedText type='title'>{garden.name}</ThemedText>
                    <ThemedView style={styles.card}>
                        <ThemedText type='title2' style={{ marginBottom: 8 }}>General</ThemedText>
                        {/* Nombre */}
                        <TouchableOpacity
                            style={styles.subcardTouchable}
                            onPress={() => {
                                openModal('name')
                            }}
                        >
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                <Ionicons name="reader" size={24} color={"#bfd8c5ff"} />
                                <ThemedText type='default'>Nombre</ThemedText>
                            </View>
                            <View style={{ display: 'flex', alignItems: "center", flexDirection: "row", gap: 2, alignContent: 'center' }}>
                                {garden.name ? (<ThemedText type='default'>{garden.name}</ThemedText>) : (
                                    <ThemedText type='italic'>Seleccionar</ThemedText>
                                )}
                                <Ionicons name="chevron-forward" size={16} color={"#bfd8c5ff"}></Ionicons>
                            </View>
                        </TouchableOpacity>

                        <DashedLine />

                        {/* Ubicacion */}
                        <TouchableOpacity
                            style={styles.subcardTouchable}
                            onPress={() => { openModal('location'); }}
                        >
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                <Ionicons name="location" size={24} color={"#bfd8c5ff"} />
                                <ThemedText type='default'>Ubicacion</ThemedText>
                            </View>
                            <View style={{ display: 'flex', alignItems: "center", flexDirection: "row", gap: 2, alignContent: 'center' }}>
                                {garden.location ? (<ThemedText type='default'>{locationLabels[garden.location as keyof typeof locationLabels]}</ThemedText>) : (
                                    <ThemedText type='italic'>Seleccionar</ThemedText>
                                )}
                                <Ionicons name="chevron-forward" size={16} color={"#bfd8c5ff"}></Ionicons>
                            </View>
                        </TouchableOpacity>
                    </ThemedView>

                    <ThemedView style={styles.card}>
                        <ThemedText type="title2" style={{ marginBottom: 8 }}>Condiciones del lugar</ThemedText>
                        {/* Luz */}
                        <TouchableOpacity
                            style={styles.subcardTouchable}
                            onPress={() => { openModal('sun'); }}
                        >
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                <Ionicons name="sunny" size={24} color={"#bfd8c5ff"} />
                                <ThemedText type='default'>Luz</ThemedText>
                            </View>
                            <View style={{ display: 'flex', alignItems: "center", flexDirection: "row", gap: 2, alignContent: 'center' }}>
                                {garden.sunlight_exposure ? (<ThemedText type='default'>{sunlightExposureLabels[garden.sunlight_exposure as keyof typeof sunlightExposureLabels]}</ThemedText>) : (
                                    <ThemedText type='italic'>Seleccionar</ThemedText>
                                )}
                                <Ionicons name="chevron-forward" size={16} color={"#bfd8c5ff"}></Ionicons>
                            </View>
                        </TouchableOpacity>

                        <DashedLine />

                        {/* Humedad */}
                        <TouchableOpacity
                            style={styles.subcardTouchable}
                            onPress={() => { openModal('humidity'); }}
                        >
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                <Ionicons name="water" size={24} color={"#bfd8c5ff"} />
                                <ThemedText type='default'>Humedad</ThemedText>
                            </View>
                            <View style={{ display: 'flex', alignItems: "center", flexDirection: "row", gap: 2, alignContent: 'center' }}>
                                {garden.humidity ? (<ThemedText type='default'>{humidityLabels[garden.humidity as keyof typeof humidityLabels]}</ThemedText>) : (
                                    <ThemedText type='italic'>Seleccionar</ThemedText>
                                )}
                                <Ionicons name="chevron-forward" size={16} color={"#bfd8c5ff"}></Ionicons>
                            </View>
                        </TouchableOpacity>

                        <DashedLine />

                        {/* Aire */}
                        <TouchableOpacity
                            style={styles.subcardTouchable}
                            onPress={() => { openModal('air'); }}
                        >
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                <Ionicons name="repeat" size={24} color={"#bfd8c5ff"} />
                                <ThemedText type='default'>Aire</ThemedText>
                            </View>
                            <View style={{ display: 'flex', alignItems: "center", flexDirection: "row", gap: 2, alignContent: 'center' }}>
                                {garden.air != undefined ? (<ThemedText type='default'>{garden.air ? "Sí" : "No"}</ThemedText>) : (
                                    <ThemedText type='italic'>Seleccionar</ThemedText>
                                )}
                                <Ionicons name="chevron-forward" size={16} color={"#bfd8c5ff"}></Ionicons>
                            </View>
                        </TouchableOpacity>
                    </ThemedView>

                    <Button text="Eliminar este sitio" onPress={() => { setConfirmVisible(true); }} />
                </View>

            </ScrollView>
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
            <Modal
                visible={isModalVisible}
                transparent={true}
                animationType="slide">
                    <KeyboardAvoidingView
                            style={styles.centeredView}
                            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                    <View style={styles.modalView}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
                            <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                                <ThemedText type="default" style={{ color: "#000" }}>Cerrar</ThemedText>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => handlePut()}
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

                        {modalType === 'name' && (
                            <View style={styles.searchContainer}>
                                <TextInput
                                    placeholder="Nombre del sitio"
                                    autoCapitalize="none"
                                    style={styles.searchInput}
                                    value={name}
                                    onChangeText={(text) => { setName(text) }}
                                />
                            </View>
                        )}
                        {modalType === 'location' && (
                            <WheelPicker
                                data={locationOptions}
                                width={200}
                                value={gardenTemp.location || ""}
                                onValueChanged={({ item: { value } }) => setGardenTemp({ ...gardenTemp, location: value })}
                                enableScrollByTapOnItem={true}
                            />
                        )}
                        {modalType === 'sun' && (
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 100 }}>
                                <WheelPicker
                                    data={sunlightExposureOptions}
                                    width={200}
                                    value={gardenTemp.sunlight_exposure || ""}
                                    onValueChanged={({ item: { value } }) => setGardenTemp({ ...gardenTemp, sunlight_exposure: value })}
                                    enableScrollByTapOnItem={true}
                                />
                            </View>
                        )}
                        {modalType === 'humidity' && (
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 100 }}>
                                <WheelPicker
                                    data={humidityOptions}
                                    width={200}
                                    value={gardenTemp.humidity || ""}
                                    onValueChanged={({ item: { value } }) => setGardenTemp({ ...gardenTemp, humidity: value })}
                                    enableScrollByTapOnItem={true}
                                />
                            </View>
                        )}
                        {modalType === 'air' && (
                            <View style={{ display: "flex", alignItems: "center", flexDirection: 'column' }}>
                                <ThemedText type="default" style={{ color: "#000" }}>¿Suele haber corrientes de aire?</ThemedText>
                                <WheelPicker
                                    data={[
                                        { value: true, label: "Sí" },
                                        { value: false, label: "No" }
                                    ]}
                                    width={100}
                                    value={gardenTemp.air ?? false}
                                    onValueChanged={({ item: { value } }) => setGardenTemp({ ...gardenTemp, air: value })}
                                    enableScrollByTapOnItem={true}
                                />
                            </View>
                        )}
                    </View>
                </KeyboardAvoidingView>
            </Modal >
        </>
    );

}

const styles = StyleSheet.create({
    body: {
        padding: 16,
        flex: 1,
        gap: 16,
    },
    image: {
        width: 200,
        height: 200,
        borderRadius: 16,
        marginBottom: 16,
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
        gap: 8,
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
});