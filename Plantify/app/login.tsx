import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { UserService } from '@/services/userService';
import * as React from 'react';
import { View, useWindowDimensions, Text, StatusBar, TextInput, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import { TabView, SceneMap } from 'react-native-tab-view';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuthContext';
import Button from '@/components/Button';
import { useLocalSearchParams } from "expo-router";
import { LinearGradient } from 'expo-linear-gradient';
import { useLayoutEffect } from 'react';

export default function LoginScreen() {
    const params = useLocalSearchParams();
    const {from} = params;
    const fromPath = Array.isArray(from) ? from[0] : from;
    const router = useRouter();
    const layout = useWindowDimensions();
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [error, setError] = React.useState('');
    const { login } = useAuth();
    const colorScheme = useColorScheme() ?? 'light';
    const navigation = useNavigation();
    const backgroundColor = colorScheme === 'dark' ? Colors.dark.background : Colors.light.background;

    useLayoutEffect(() => {
        navigation.setOptions({
          headerStyle: {
            backgroundColor: Colors[colorScheme].background,
          },
        });
      }, [navigation, colorScheme]);

    const handleLogin = async () => {
        setError('');
        if (!email || !password){
            setError('Por favor, completa todos los campos.');
            return;
        }
        try {
            await login(email, password);
        } catch (e) {
            setError('Error al iniciar sesión.');
            return;
        }
        router.replace(fromPath || '/');
    };
    return (
        <LinearGradient
              colors={['rgba(213, 240, 219, 0.19)', backgroundColor]} // Cambia estos colores a los que quieras
              style={[styles.body, { padding: 16 }]}
            >
            <ThemedText type="title">Iniciar sesión</ThemedText>
            <View style={{ display: 'flex', gap: 12 }}>
                <View>
                    <ThemedText type="subtitle">Nombre de usuario</ThemedText>
                    <View style={styles.searchContainer}>
                        <TextInput
                            placeholder="Introduce tu nombre de usuario"
                            placeholderTextColor={colorScheme === 'dark' ? Colors.dark.placeholder : Colors.light.placeholder}
                            autoCapitalize="none"
                            style={styles.searchInput}
                            value={email}
                            onChangeText={setEmail}
                        />
                    </View>
                </View>
                <View>
                    <ThemedText type="subtitle">Contraseña</ThemedText>
                    <View style={styles.searchContainer}>
                        <TextInput
                            placeholder="Introduce tu contraseña"
                            placeholderTextColor={colorScheme === 'dark' ? Colors.dark.placeholder : Colors.light.placeholder}
                            secureTextEntry
                            style={styles.searchInput}
                            value={password}
                            onChangeText={setPassword}
                        />
                    </View>
                </View>
                <ThemedText type="subtitle">¿No tienes cuenta?</ThemedText>
                <TouchableOpacity onPress={() => router.push('/signup')}>
                    <ThemedText type="link">Regístrate aquí</ThemedText>
                </TouchableOpacity>
                {error ? (
                    <Text style={{ color: 'red', marginTop: 16, textAlign: 'center' }}>
                        {error}
                    </Text>
                ) : null}
                <Button text="Entrar" onPress={handleLogin} />
            </View>
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
        marginTop: 16,
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
