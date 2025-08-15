import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Text, View, Image, StyleSheet, ScrollView, ActivityIndicator, useColorScheme, TouchableOpacity, Alert, Pressable, SafeAreaView, TouchableWithoutFeedback, Modal } from "react-native";
import { useLocalSearchParams } from "expo-router";
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

const timeUnitLabels = {
    "day": "Día",
    "week": "Semana",
    "month": "Mes"
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



export default function PlantSettings() {
    const params = useLocalSearchParams();
    const { plant } = params;
    const [userPlant, setUserPlant] = useState<UserPlant>(JSON.parse(plant as string));
    const [userPlantTemp, setUserPlantTemp] = useState<UserPlant>(JSON.parse(plant as string));
    const [isWateringEnabled, setIsWateringEnabled] = useState(false);
    const [isFertilityEnabled, setIsFertilityEnabled] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    type ModalType = "height" | "age" | "pruning" | "spraying" | "rotation" | "site" | "pot_type" | "pot_size" | "pot_drainage" | null;
    const [modalType, setModalType] = useState<ModalType>(null);
    const [value, setValue] = useState(0);
    const [stringValue, setStringValue] = useState("");
    const [gardens, setGardens] = useState<Garden[]>([]);
    const { getUserId, accessToken, refreshToken, setTokens } = useAuth();

    const openModal = (type: ModalType | ((prevState: ModalType) => ModalType) | null) => {
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
        try {
            userPlantTemp.plant_id = userPlantTemp.plant.id;
            console.log(userPlantTemp)
            const plant = await PlantService.putPlant(userPlantTemp, accessToken!);
            if (plant)
                setUserPlant(plant);
            setIsModalVisible(false);
        } catch (error: any) {
            if (error.message === 'Unauthorized') {
                // Handle token refresh logic here
                try {
                    const newTokens = await UserService.refreshToken(refreshToken!);
                    setTokens(newTokens.access, newTokens.refresh);

                    const plant = await PlantService.putPlant(userPlantTemp, newTokens.access);
                    if (plant)
                        setUserPlant(plant);
                    setIsModalVisible(false);
                } catch (refreshError) {
                    console.error("Error refreshing tokens:", refreshError);
                }
            }
        }
    }


    return (
        <>
            <ScrollView>
                <View style={styles.body}>
                    <ThemedView style={styles.card}>
                        <View style={styles.subcard}>
                            {userPlant.plant.image && (
                                <Image
                                    source={{ uri: userPlant.plant.image }}
                                    style={{ width: 100, height: 100, borderRadius: 8 }}
                                />
                            )}
                            <View style={{}}>
                                <View>
                                    <ThemedText type='title2'>{userPlant.plant.common_name}</ThemedText>
                                    <ThemedText type='italic'>{userPlant.plant.scientific_name}</ThemedText>
                                </View>
                            </View>
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
                                    value={isWateringEnabled}
                                    onValueChange={setIsWateringEnabled}
                                    trackColor={{ false: "#ccc", true: Colors.light.tint }}
                                    thumbColor={isWateringEnabled ? Colors.light.tint : "#f4f3f4"}
                                />
                            </View>
                        </View>
                        <View style={styles.innerCard}>
                            <ThemedText type="default" style={{ color: '#333' }}>Frecuencia</ThemedText>
                            <ThemedText type="default" style={{ color: '#333' }}>Cada 15 días</ThemedText>
                        </View>
                        <DashedLine />
                        {/* Frecuencia de fertilización */}
                        <View style={styles.subcardTouchable}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                <Ionicons name="archive" size={24} color={"#bfd8c5ff"} />
                                <ThemedText type="default">Fertilización</ThemedText>
                            </View>
                            <View>
                                <Switch
                                    value={isFertilityEnabled}
                                    onValueChange={setIsFertilityEnabled}
                                    trackColor={{ false: "#ccc", true: Colors.light.tint }}
                                    thumbColor={isFertilityEnabled ? Colors.light.tint : "#f4f3f4"}
                                />
                            </View>
                        </View>
                        <View style={styles.innerCard}>
                            <ThemedText type="default" style={{ color: '#333' }}>Frecuencia</ThemedText>
                            <ThemedText type="default" style={{ color: '#333' }}>Cada 15 días</ThemedText>
                        </View>
                        <DashedLine />
                        <View style={{ flex: 1, gap: 8 }}>
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
                                    {userPlant.pruning_time ? (<ThemedText type='default'>{userPlant.pruning_time} {timeUnitLabels[userPlant.pruning_time_unit as keyof typeof timeUnitLabels]}</ThemedText>) : (
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
                                    {userPlant.sprayed_time ? (<ThemedText type='default'>{userPlant.sprayed_time} {timeUnitLabels[userPlant.sprayed_unit as keyof typeof timeUnitLabels]}</ThemedText>) : (
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
                                    {userPlant.rotation_time ? (<ThemedText type='default'>{userPlant.rotation_time} {timeUnitLabels[userPlant.rotation_unit as keyof typeof timeUnitLabels]}</ThemedText>) : (
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
                        >
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                <Ionicons name="location" size={24} color={"#bfd8c5ff"} />
                                <ThemedText type='default'>Lugar</ThemedText>
                            </View>
                            <View style={{ display: 'flex', alignItems: "center", flexDirection: "row", gap: 2, alignContent: 'center' }}>
                                {userPlant.garden_name ? (<ThemedText type='default'>{userPlant.garden_name}</ThemedText>) : (
                                    <ThemedText type='italic'>Seleccionar</ThemedText>
                                )}
                                <Ionicons name="chevron-forward" size={16} color={"#bfd8c5ff"}></Ionicons>
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
                    <Button text="Eliminar esta planta" onPress={() => { }} />
                </View>

            </ScrollView>
            <Modal
                visible={isModalVisible}
                transparent={true}
                animationType="slide">
                <View style={styles.centeredView}>
                    <View style={styles.modalView}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
                            <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                                <ThemedText type="default" style={{ color: "#000" }}>Cerrar</ThemedText>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handlePut()}>
                                <ThemedText type="default" style={{ color: "#000" }}>Aceptar</ThemedText>
                            </TouchableOpacity>
                        </View>

                        {modalType === 'height' && (
                            <WheelPicker
                                data={data}
                                width={100}
                                value={userPlant.height}
                                onValueChanged={({ item: { value } }) => setUserPlantTemp({ ...userPlantTemp, height: value })}
                                enableScrollByTapOnItem={true}
                            />
                        )}
                        {modalType === 'age' && (
                            <WheelPicker
                                data={ageOptions}
                                width={200}
                                value={userPlant.age || ""}
                                onValueChanged={({ item: { value } }) => { userPlantTemp.age = value }}
                                enableScrollByTapOnItem={true}
                            />
                        )}
                        {modalType === 'pruning' && (
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 100 }}>
                                <WheelPicker
                                    data={data}
                                    width={100}
                                    value={userPlant.pruning_time || 0}
                                    onValueChanged={({ item: { value } }) => { 
                                        if (userPlantTemp.pruning_time_unit === undefined) {
                                            userPlantTemp.pruning_time_unit = "day";
                                        }
                                        userPlantTemp.pruning_time = value;
                                    }}
                                    enableScrollByTapOnItem={true}
                                />
                                <WheelPicker
                                    data={timeUnitOptions}
                                    width={100}
                                    value={userPlant.pruning_time_unit || "day"}
                                    onValueChanged={({ item: { value } }) => { userPlantTemp.pruning_time_unit = value }}
                                    enableScrollByTapOnItem={true}
                                />
                            </View>
                        )}
                        {modalType === 'spraying' && (
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 100 }}>
                                <WheelPicker
                                    data={data}
                                    width={100}
                                    value={userPlant.sprayed_time || 0}
                                    onValueChanged={({ item: { value } }) => { userPlantTemp.sprayed_time = value }}
                                    enableScrollByTapOnItem={true}
                                />
                                <WheelPicker
                                    data={timeUnitOptions}
                                    width={100}
                                    value={userPlant.sprayed_unit || "day"}
                                    onValueChanged={({ item: { value } }) => { userPlantTemp.sprayed_unit = value }}
                                    enableScrollByTapOnItem={true}
                                />
                            </View>
                        )}
                        {modalType === 'rotation' && (
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 100 }}>
                                <WheelPicker
                                    data={data}
                                    width={100}
                                    value={userPlant.rotation_time || 0}
                                    onValueChanged={({ item: { value } }) => { userPlantTemp.rotation_time = value }}
                                    enableScrollByTapOnItem={true}
                                />
                                <WheelPicker
                                    data={timeUnitOptions}
                                    width={100}
                                    value={userPlant.rotation_unit || "day"}
                                    onValueChanged={({ item: { value } }) => { userPlantTemp.rotation_unit = value }}
                                    enableScrollByTapOnItem={true}
                                />
                            </View>
                        )}
                        {modalType === 'site' && (
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 100 }}>
                                <WheelPicker
                                    data={gardens.map(garden => ({ value: garden.id, label: garden.name }))}
                                    width={200}
                                    value={Number(userPlant.garden) || 0}
                                    onValueChanged={({ item: { value } }) => userPlantTemp.garden = value}
                                    enableScrollByTapOnItem={true}
                                />
                            </View>
                        )}
                        {modalType === 'pot_type' && (
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 100 }}>
                                <WheelPicker
                                    data={potTypeOptions}
                                    value={userPlant.pot_type || ""}
                                    width={200}
                                    onValueChanged={({ item: { value } }) => { userPlantTemp.pot_type = value }}
                                    enableScrollByTapOnItem={true}
                                />
                            </View>
                        )}
                        {modalType === 'pot_size' && (
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 100 }}>
                                <WheelPicker
                                    data={data}
                                    value={userPlant.pot_size || 0}
                                    width={100}
                                    onValueChanged={({ item: { value } }) => { userPlantTemp.pot_size = value }}
                                    enableScrollByTapOnItem={true}
                                />
                            </View>
                        )}
                        {modalType === 'pot_drainage' && (
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 100 }}>
                                <WheelPicker
                                    data={drainageOptions}
                                    value={userPlant.drainage || ""}
                                    width={200}
                                    onValueChanged={({ item: { value } }) => { userPlantTemp.drainage = value }}
                                    enableScrollByTapOnItem={true}
                                />
                            </View>
                        )}
                    </View>
                </View>
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
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
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
});