import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Text, View, Image, StyleSheet, ScrollView, ActivityIndicator, useColorScheme, TouchableOpacity, Alert, Pressable, SafeAreaView, TouchableWithoutFeedback, Modal, TextInput, KeyboardAvoidingView, Platform } from "react-native";
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
import { useNavigation, useRouter } from 'expo-router';
import { User } from "@/models/User";
import { StorageService } from "@/services/storageService";
import { NotificationService } from "@/services/notificationService";
import { KeyboardAwareScrollView, KeyboardToolbar } from 'react-native-keyboard-controller';

const data = [...Array(100).keys()].map((index) => ({
    value: index,
    label: index.toString(),
}))

const hourOptions = [
    { value: '0', label: '00:00' },
    { value: '1', label: '01:00' },
    { value: '2', label: '02:00' },
    { value: '3', label: '03:00' },
    { value: '4', label: '04:00' },
    { value: '5', label: '05:00' },
    { value: '6', label: '06:00' },
    { value: '7', label: '07:00' },
    { value: '8', label: '08:00' },
    { value: '9', label: '09:00' },
    { value: '10', label: '10:00' },
    { value: '11', label: '11:00' },
    { value: '12', label: '12:00' },
    { value: '13', label: '13:00' },
    { value: '14', label: '14:00' },
    { value: '15', label: '15:00' },
    { value: '16', label: '16:00' },
    { value: '17', label: '17:00' },
    { value: '18', label: '18:00' },
    { value: '19', label: '19:00' },
    { value: '20', label: '20:00' },
    { value: '21', label: '21:00' },
    { value: '22', label: '22:00' },
    { value: '23', label: '23:00' }
];

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
    const router = useRouter();
    const params = useLocalSearchParams();
    const [isModalVisible, setIsModalVisible] = useState(false);
    type ModalType = "username" | "email" | "password" | "hour" | "sun" | "humidity" | "air" | null;
    const [modalType, setModalType] = useState<ModalType>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isNotifications, setIsNotifications] = useState(false);
    const { getUserId, accessToken, refreshToken, logout, setTokens } = useAuth();
    const [user, setUser] = useState<User>({} as User);
    const [userTemp, setUserTemp] = useState<User>({} as User);
    const [actualPassword, setActualPassword] = useState<string>('');
    const [newPassword, setNewPassword] = useState<string>('');
    const [confirmNewPassword, setConfirmNewPassword] = useState<string>('');
    const [selectedHour, setSelectedHour] = useState<number>(9);
    const [selectedHourTemp, setSelectedHourTemp] = useState<number>(9);
    const colorScheme = useColorScheme() ?? 'light';

    const openModal = (type: ModalType | ((prevState: ModalType) => ModalType) | null) => {
        setModalType(type);
        setIsModalVisible(true);
    };

    useEffect(() => {
        const fetchUser = async () => {
            if (!accessToken) return;
            try {
                const data = await UserService.getCurrentUser(accessToken);
                if (data) {
                    setUser(data);
                    setUserTemp(data);
                }
            } catch (error: any) {
                if (error?.message === 'Unauthorized' && refreshToken) {
                    try {
                        const newTokens = await UserService.refreshToken(refreshToken);
                        setTokens(newTokens.access, newTokens.refresh);
                        const data = await UserService.getCurrentUser(newTokens.access);
                        if (data) {
                            setUser(data);
                            setUserTemp(data);
                        }
                    } catch (refreshError) {
                        console.error('Error refreshing tokens:', refreshError);
                    }
                } else {
                    console.error('Error fetching user:', error);
                }
            }
        };
        const loadNotificationTime = async () => {
            const hour = await StorageService.getNotificationTime();
            setSelectedHour(hour);
            setSelectedHourTemp(hour);
        }
        const loadIsNotificationsEnabled = async () => {
            const enabled = await StorageService.getIsNotificationsEnabled();
            setIsNotifications(enabled);
        }
        loadNotificationTime();
        loadIsNotificationsEnabled();
        fetchUser();
    }, [accessToken, refreshToken]);

    const handlePut = async () => {
        if (selectedHour !== selectedHourTemp) {
            handleTimeChange(selectedHourTemp);
            return;
        }
        if (actualPassword || newPassword || confirmNewPassword) {
            handleChangePassword();
            return;
        }
        setIsLoading(true);
        try {
            const userToUpdate = {
                ...userTemp
            }
            const updatedUser = await UserService.updateUser(userToUpdate, accessToken!);
            if (updatedUser) {
                setUser(updatedUser);
            }
            setIsModalVisible(false);
        } catch (error: any) {
            if (error.message === 'Unauthorized') {
                // Handle token refresh logic here
                try {
                    const newTokens = await UserService.refreshToken(refreshToken!);
                    setTokens(newTokens.access, newTokens.refresh);

                    const userToUpdate = {
                        ...userTemp
                    }
                    const updatedUser = await UserService.updateUser(userToUpdate, accessToken!);
                    if (updatedUser) {
                        setUser(updatedUser);
                    }

                    setIsModalVisible(false);
                } catch (refreshError) {
                    console.error("Error refreshing tokens:", refreshError);
                }
            }
        } finally {
            setIsLoading(false);
        }
    }

    const handleTimeChange = async (selectedHour?: number) => {
        // Actualizamos estado visual
        setSelectedHour(selectedHour!);
        setSelectedHourTemp(selectedHour!);

        // 2. GUARDADO: Persistir la preferencia en el teléfono
        await StorageService.saveNotificationTime(selectedHour!);

        // 3. AGENDADO: Reprogramar la notificación real
        const hasPermission = await NotificationService.requestPermissions();
        if (hasPermission) {
            await NotificationService.scheduleDailyReminder(selectedHour!);
        }
        setIsModalVisible(false);
    };

    const handleChangePassword = async () => {
        setIsLoading(true);
        try {
            const message = await UserService.changePassword(actualPassword, newPassword, confirmNewPassword, accessToken!);
            alert(message);
            setIsModalVisible(false);
        } catch (error: any) {
            if (error.message === 'Unauthorized') {
                // Handle token refresh logic here
                try {
                    const newTokens = await UserService.refreshToken(refreshToken!);
                    setTokens(newTokens.access, newTokens.refresh);

                    const message = await UserService.changePassword(actualPassword, newPassword, confirmNewPassword, accessToken!);
                    alert(message);

                    setIsModalVisible(false);
                } catch (refreshError) {
                    console.error("Error refreshing tokens:", refreshError);
                }
            }
        } finally {
            setIsLoading(false);
        }
    }

    const handleIsNotificationsChange = async (value: boolean) => {
        setIsNotifications(value);
        await StorageService.saveIsNotificationsEnabled(value);
        if (value) {
            const hasPermission = await NotificationService.requestPermissions();
            if (hasPermission) {
                await NotificationService.scheduleDailyReminder(selectedHour);
            }
        } else {
            await NotificationService.disableNotifications();
        }
    }

    const handleLogout = () => {
        logout();
        router.back();
    };

    const handleClose = async () => {
        setIsModalVisible(false);
        setActualPassword('');
        setConfirmNewPassword('');
        setNewPassword('');
        const hour = await StorageService.getNotificationTime();
        setSelectedHour(hour);
        setSelectedHourTemp(hour);
    }


    return (
        <>
            <ScrollView>
                <View style={styles.body}>
                    <ThemedView style={styles.card}>
                        <ThemedText type='title2' style={{ marginBottom: 8 }}>Cuenta</ThemedText>
                        {/* Nombre */}
                        <TouchableOpacity
                            style={styles.subcardTouchable}
                            onPress={() => {
                                openModal('username')
                            }}
                        >
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                <Ionicons name="create" size={24} color={"#bfd8c5ff"} />
                                <ThemedText type='default'>Usuario</ThemedText>
                            </View>
                            <View style={{ display: 'flex', alignItems: "center", flexDirection: "row", gap: 6, alignContent: 'center' }}>
                                <ThemedText type='italic'>{user.username || '—'}</ThemedText>
                                <Ionicons name="chevron-forward" size={16} color={"#bfd8c5ff"}></Ionicons>
                            </View>
                        </TouchableOpacity>
                        <DashedLine />
                        {/* Email */}
                        <TouchableOpacity
                            style={styles.subcardTouchable}
                            onPress={() => {
                                openModal('email')
                            }}
                        >
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                <Ionicons name="mail" size={24} color={"#bfd8c5ff"} />
                                <ThemedText type='default'>Email</ThemedText>
                            </View>
                            <View style={{ display: 'flex', alignItems: "center", flexDirection: "row", gap: 6, alignContent: 'center' }}>
                                <ThemedText type='italic'>{user.email || '—'}</ThemedText>
                                <Ionicons name="chevron-forward" size={16} color={"#bfd8c5ff"}></Ionicons>
                            </View>
                        </TouchableOpacity>
                        <DashedLine />
                        {/* Contraseña */}
                        <TouchableOpacity
                            style={styles.subcardTouchable}
                            onPress={() => {
                                openModal('password')
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
                        <ThemedText type="title2" style={{ marginBottom: 8 }}>Publicaciones</ThemedText>
                        {/* Posts */}
                        <TouchableOpacity
                            style={styles.subcardTouchable}
                            onPress={() => { router.push('/posts-list'); }}
                        >
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                <Ionicons name="document" size={24} color={"#bfd8c5ff"} />
                                <ThemedText type='default'>Publicaciones</ThemedText>
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
                            onPress={() => { router.push('/comments-list'); }}
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
                        <ThemedText type="title2" style={{ marginBottom: 8 }}>Notificaciones</ThemedText>
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
                                            handleIsNotificationsChange(value);
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
                            onPress={() => { openModal('hour'); }}
                        >
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                <Ionicons name="alarm" size={24} color={"#bfd8c5ff"} />
                                <ThemedText type='default'>Hora</ThemedText>
                            </View>
                            <View style={{ display: 'flex', alignItems: "center", flexDirection: "row", gap: 2, alignContent: 'center' }}>
                                <ThemedText type='italic'>{selectedHourTemp}:00</ThemedText>
                                <Ionicons name="chevron-forward" size={16} color={"#bfd8c5ff"}></Ionicons>
                            </View>
                        </TouchableOpacity>
                    </ThemedView>

                    <Button text="Cerrar sesión" onPress={() => { handleLogout(); }} />
                </View>
            </ScrollView>


            <Modal
                visible={isModalVisible}
                transparent={true}
                animationType="slide">
                <KeyboardAvoidingView
                            style={styles.centeredView}
                            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                    <View style={styles.modalView}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
                            <TouchableOpacity onPress={() => handleClose()}>
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
                        
                            {modalType === 'username' && (
                                <View style={styles.searchContainer}>
                                    <TextInput
                                        placeholder="Nombre de usuario"
                                        placeholderTextColor={colorScheme === 'dark' ? Colors.dark.placeholder : Colors.light.placeholder}
                                        autoCapitalize="none"
                                        style={styles.searchInput}
                                        value={userTemp.username}
                                        onChangeText={(text) => { setUserTemp({ ...userTemp, username: text }); }}
                                    />
                                </View>
                            )}
                            {modalType === 'email' && (
                                <View style={styles.searchContainer}>
                                    <TextInput
                                        placeholder="Correo electrónico"
                                        placeholderTextColor={colorScheme === 'dark' ? Colors.dark.placeholder : Colors.light.placeholder}
                                        autoCapitalize="none"
                                        style={styles.searchInput}
                                        value={userTemp.email}
                                        onChangeText={(text) => { setUserTemp({ ...userTemp, email: text }); }}
                                    />
                                </View>
                            )}
                            {modalType === 'password' && (
                                <View style={styles.passwordContainer}>
                                    <TextInput
                                        placeholder="Contraseña actual"
                                        autoCapitalize="none"
                                        secureTextEntry
                                        style={styles.passwordInput}
                                        value={actualPassword}
                                        onChangeText={(text) => { setActualPassword(text); }}
                                    />
                                    <TextInput
                                        placeholder="Contraseña nueva"
                                        autoCapitalize="none"
                                        secureTextEntry
                                        style={styles.passwordInput}
                                        value={newPassword}
                                        onChangeText={(text) => { setNewPassword(text); }}
                                    />
                                    <TextInput
                                        placeholder="Contraseña nueva (confirmación)"
                                        autoCapitalize="none"
                                        secureTextEntry
                                        style={styles.passwordInput}
                                        value={confirmNewPassword}
                                        onChangeText={(text) => { setConfirmNewPassword(text); }}
                                    />
                                </View>
                            )}
                            {modalType === 'hour' && (
                                <WheelPicker
                                    data={hourOptions}
                                    width={200}
                                    value={selectedHourTemp.toString()}
                                    onValueChanged={({ item: { value } }) => { setSelectedHourTemp(Number(value)); }}
                                    enableScrollByTapOnItem={true}
                                />
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
        marginBottom: 30
    },
    container: {
        gap: 16,
        padding: 16,
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
    passwordContainer: {
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        gap: 10,
        marginTop: 16,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: '#333',

    },
    passwordInput: {
        flex: 1,
        fontSize: 14,
        color: '#333',
        backgroundColor: Colors.light.tint,
        borderRadius: 25,
        paddingHorizontal: 16,
        paddingVertical: 16,
        width: '100%',
    }
});