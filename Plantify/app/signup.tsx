import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { UserService } from '@/services/userService';
import * as React from 'react';
import { View, useWindowDimensions, Text, StatusBar, TextInput, TouchableOpacity, StyleSheet, useColorScheme, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TabView, SceneMap } from 'react-native-tab-view';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuthContext';
import Button from '@/components/Button';
import { LinearGradient } from 'expo-linear-gradient';

export default function SignupScreen() {
    const router = useRouter();
    const layout = useWindowDimensions();
    const [username, setUsername] = React.useState('');
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [confirmPassword, setConfirmPassword] = React.useState('');
    const [error, setError] = React.useState('');
    const [showPassword, setShowPassword] = React.useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(false);
    const { signup } = useAuth();
    const colorScheme = useColorScheme() ?? 'light';
    const backgroundColor = colorScheme === 'dark' ? Colors.dark.background : Colors.light.background;
    const handleSignup = async () => {

        setError('');
        if (!email || !password) {
            setError('Por favor, completa todos los campos.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden.');
            return;
        }
        
        setIsLoading(true);
        try {
            await signup(username, email, password);
            router.replace({
                pathname: "/profile",
                params: {}
            });
        } catch (e: any) {
            setError(e.message || 'Error al crear la cuenta.');
        } finally {
            setIsLoading(false);
        }
    };
    return (
        <LinearGradient
                      colors={['rgba(213, 240, 219, 0.19)', backgroundColor]} // Cambia estos colores a los que quieras
                      style={[styles.body, { padding: 16 }]}
                    >
            <ThemedText type="title">Crear una cuenta</ThemedText>
                <View>
                    <ThemedText type="subtitle">Nombre de usuario</ThemedText>
                    <View style={styles.searchContainer}>
                        <TextInput
                            placeholder="Introduce tu nombre de usuario"
                            placeholderTextColor={colorScheme === 'dark' ? Colors.dark.placeholder : Colors.light.placeholder}
                            autoCapitalize="none"
                            style={styles.searchInput}
                            value={username}
                            onChangeText={setUsername}
                        />
                    </View>
                </View>
                <View style={{ marginTop: 16 }}>
                    <ThemedText type="subtitle">Correo electrónico</ThemedText>
                    <View style={styles.searchContainer}>
                        <TextInput
                            placeholder="Introduce tu correo"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            style={styles.searchInput}
                            value={email}
                            onChangeText={setEmail}
                            placeholderTextColor={colorScheme === 'dark' ? Colors.dark.placeholder : Colors.light.placeholder}
                        />
                    </View>
                </View>
                <View style={{ marginTop: 16 }}>
                    <ThemedText type="subtitle">Contraseña</ThemedText>
                    <View style={styles.searchContainer}>
                        <TextInput
                            placeholder="Introduce tu contraseña"
                            accessibilityLabel="Introduce tu contraseña"
                            autoCapitalize="none"
                            secureTextEntry={!showPassword}
                            style={styles.searchInput}
                            value={password}
                            onChangeText={setPassword}
                            placeholderTextColor={colorScheme === 'dark' ? Colors.dark.placeholder : Colors.light.placeholder}
                        />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                            <Ionicons 
                                name={!showPassword ? 'eye-off-outline' : 'eye-outline'} 
                                size={24} 
                                color={Colors.light.icon} 
                            />
                        </TouchableOpacity>
                    </View>
                </View>
                <View style={{ marginTop: 16 }}>
                    <ThemedText type="subtitle">Confirmar contraseña</ThemedText>
                    <View style={styles.searchContainer}>
                        <TextInput
                            placeholder="Confirma tu contraseña"
                            accessibilityLabel="Confirma tu contraseña"
                            autoCapitalize="none"
                            secureTextEntry={!showConfirmPassword}
                            style={styles.searchInput}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            placeholderTextColor={colorScheme === 'dark' ? Colors.dark.placeholder : Colors.light.placeholder}
                        />
                        <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                            <Ionicons 
                                name={!showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} 
                                size={24} 
                                color={Colors.light.icon} 
                            />
                        </TouchableOpacity>
                    </View>
                </View>
                {error ? (
                    <Text style={{ color: 'red', marginTop: 16, textAlign: 'center' }}>
                        {error}
                    </Text>
                ) : null}
                {isLoading ? (
                    <View style={{ marginTop: 32, alignItems: 'center' }}>
                        <ActivityIndicator size="large" color={Colors.light.tint} />
                        <Text style={{ marginTop: 8, color: Colors.light.icon }}>Creando cuenta...</Text>
                    </View>
                ) : (
                    <Button text="Registrarse" onPress={handleSignup} />
                )}
        </LinearGradient>
    )
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
    card: {
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
        marginTop: 6,
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
