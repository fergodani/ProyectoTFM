import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Text, View, Image, StyleSheet, ScrollView, ActivityIndicator, useColorScheme, TouchableOpacity, Alert, Pressable, SafeAreaView, TouchableWithoutFeedback, Modal, TextInput } from "react-native";
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

export default function Settings() {
    const params = useLocalSearchParams();
    const [isModalVisible, setIsModalVisible] = useState(false);
    type ModalType = "name" | "location" | "sun" | "humidity" | "air" | null;
    const [modalType, setModalType] = useState<ModalType>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isNotifications, setIsNotifications] = useState(false);
    const { getUserId, accessToken, refreshToken, setTokens } = useAuth();

    const openModal = (type: ModalType | ((prevState: ModalType) => ModalType) | null) => {
        setModalType(type);
        setIsModalVisible(true);
    };

    useEffect(() => {
    }, []);

    const handlePut = async () => {
        setIsLoading(true);
        try {
          
            setIsModalVisible(false);
        } catch (error: any) {
            if (error.message === 'Unauthorized') {
                // Handle token refresh logic here
                try {
                    const newTokens = await UserService.refreshToken(refreshToken!);
                    setTokens(newTokens.access, newTokens.refresh);

                    setIsModalVisible(false);
                } catch (refreshError) {
                    console.error("Error refreshing tokens:", refreshError);
                }
            }
        } finally {
            setIsLoading(false);
        }
    }


    return (
        <>
            <ScrollView>
                <View style={styles.body}>
                    <ThemedView style={styles.card}>
                        <ThemedText type='title2' style={{marginBottom: 8}}>Cuenta</ThemedText>
                        {/* Nombre */}
                        <TouchableOpacity
                            style={styles.subcardTouchable}
                            onPress={() => {
                                openModal('name')
                            }}
                        >
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                <Ionicons name="create" size={24} color={"#bfd8c5ff"} />
                                <ThemedText type='default'>Nombre de usuario</ThemedText>
                            </View>
                            <View style={{ display: 'flex', alignItems: "center", flexDirection: "row", gap: 2, alignContent: 'center' }}>
                                    <ThemedText type='italic'>Cambiar</ThemedText>
                                <Ionicons name="chevron-forward" size={16} color={"#bfd8c5ff"}></Ionicons>
                            </View>
                        </TouchableOpacity>
                         <DashedLine />
                        {/* Email */}
                        <TouchableOpacity
                            style={styles.subcardTouchable}
                            onPress={() => {
                                openModal('name')
                            }}
                        >
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                <Ionicons name="mail" size={24} color={"#bfd8c5ff"} />
                                <ThemedText type='default'>Email</ThemedText>
                            </View>
                            <View style={{ display: 'flex', alignItems: "center", flexDirection: "row", gap: 2, alignContent: 'center' }}>
                                    <ThemedText type='italic'>Cambiar</ThemedText>
                                <Ionicons name="chevron-forward" size={16} color={"#bfd8c5ff"}></Ionicons>
                            </View>
                        </TouchableOpacity>
                         <DashedLine />
                        {/* Contraseña */}
                        <TouchableOpacity
                            style={styles.subcardTouchable}
                            onPress={() => {
                                openModal('name')
                            }}
                        >
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                <Ionicons name="lock-open" size={24} color={"#bfd8c5ff"} />
                                <ThemedText type='default'>Contraseña</ThemedText>
                            </View>
                            <View style={{ display: 'flex', alignItems: "center", flexDirection: "row", gap: 2, alignContent: 'center' }}>
                                    <ThemedText type='italic'>Cambiar</ThemedText>
                                <Ionicons name="chevron-forward" size={16} color={"#bfd8c5ff"}></Ionicons>
                            </View>
                        </TouchableOpacity>
                    </ThemedView>

                    <ThemedView style={styles.card}>
                        <ThemedText type="title2" style={{marginBottom: 8}}>Posts</ThemedText>
                        {/* Posts */}
                        <TouchableOpacity
                            style={styles.subcardTouchable}
                            onPress={() => { openModal('location'); }}
                        >
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                <Ionicons name="document" size={24} color={"#bfd8c5ff"} />
                                <ThemedText type='default'>Posts</ThemedText>
                            </View>
                            <View style={{ display: 'flex', alignItems: "center", flexDirection: "row", gap: 2, alignContent: 'center' }}>
                                    <ThemedText type='italic'>Ver todos</ThemedText>
                                <Ionicons name="chevron-forward" size={16} color={"#bfd8c5ff"}></Ionicons>
                            </View>
                        </TouchableOpacity>

                        <DashedLine />

                        {/* Comentarios */}
                        <TouchableOpacity
                            style={styles.subcardTouchable}
                            onPress={() => { openModal('location'); }}
                        >
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                <Ionicons name="bookmark" size={24} color={"#bfd8c5ff"} />
                                <ThemedText type='default'>Comentarios</ThemedText>
                            </View>
                            <View style={{ display: 'flex', alignItems: "center", flexDirection: "row", gap: 2, alignContent: 'center' }}>
                                    <ThemedText type='italic'>Ver todos</ThemedText>
                                <Ionicons name="chevron-forward" size={16} color={"#bfd8c5ff"}></Ionicons>
                            </View>
                        </TouchableOpacity>
                    </ThemedView>
                    <ThemedView style={styles.card}>
                        <ThemedText type="title2" style={{marginBottom: 8}}>Notificaciones</ThemedText>
                        {/* Notificaciones */}
                            <View style={styles.subcardTouchable}>
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                    <Ionicons name="notifications" size={24} color={"#bfd8c5ff"} />
                                    <ThemedText type="default">Notificaciones automáticas</ThemedText>
                                </View>
                                <View>
                                    <Switch
                                        value={isNotifications}
                                        onValueChange={
                                            (value) => {
                                                console.log(value)
                                                isNotifications ? setIsNotifications(false) : setIsNotifications(true)
                                            }
                                        }
                                        trackColor={{ false: "#ccc", true: Colors.light.tint }}
                                        thumbColor={isNotifications ? Colors.light.tint : "#f4f3f4"}
                                    />
                                </View>
                            </View>

                        <DashedLine />

                        {/* Horario notificaciones */}
                        <TouchableOpacity
                            style={styles.subcardTouchable}
                            onPress={() => { openModal('location'); }}
                        >
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                <Ionicons name="alarm" size={24} color={"#bfd8c5ff"} />
                                <ThemedText type='default'>Hora</ThemedText>
                            </View>
                            <View style={{ display: 'flex', alignItems: "center", flexDirection: "row", gap: 2, alignContent: 'center' }}>
                                    <ThemedText type='italic'>9:00</ThemedText>
                                <Ionicons name="chevron-forward" size={16} color={"#bfd8c5ff"}></Ionicons>
                            </View>
                        </TouchableOpacity>
                    </ThemedView>

                    <Button text="Cerrar sesión" onPress={() => { }} />
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
                                        value={""}
                                        onChangeText={(text) => {  }}
                                    />
                                </View>
                        )}
                        {modalType === 'location' && (
                            <WheelPicker
                                data={locationOptions}
                                width={200}
                                value={ ""}
                                onValueChanged={({ item: { value } }) => {}}
                                enableScrollByTapOnItem={true}
                            />
                        )}
                        {modalType === 'sun' && (
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 100 }}>
                                <WheelPicker
                                    data={sunlightExposureOptions}
                                    width={200}
                                    value={""}
                                    onValueChanged={({ item: { value } }) => {}}
                                    enableScrollByTapOnItem={true}
                                />
                            </View>
                        )}
                        {modalType === 'humidity' && (
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 100 }}>
                                <WheelPicker
                                    data={humidityOptions}
                                    width={200}
                                    value={""}
                                    onValueChanged={({ item: { value } }) => {}}
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
                                    value={false}
                                    onValueChanged={({ item: { value } }) => {}}
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