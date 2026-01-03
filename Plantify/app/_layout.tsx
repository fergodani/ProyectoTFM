import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { router, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { StrictMode, useEffect } from 'react';
import 'react-native-reanimated';
import { AuthProvider, useAuth } from "@/hooks/useAuthContext";

import { useColorScheme } from '@/hooks/useColorScheme';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  
  const [loaded] = useFonts({
    LexendDeca: require('../assets/fonts/LexendDeca.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <StrictMode>
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="plant-list" options={{ title: "Listado de plantas", headerShown: true }} />
          <Stack.Screen name="plant-details" options={{ title: "", headerShown: true }} />
          <Stack.Screen name="plant-settings" options={{ title: "Ajustes de planta", headerShown: true }} />
          <Stack.Screen name="plant-search" options={{ title: "", headerShown: false }} />
          <Stack.Screen name="garden-form" options={{ title: "", headerShown: false }} />
          <Stack.Screen name="garden-select" options={{ title: "Selecciona un lugar", headerShown: true }} />
          <Stack.Screen name="garden-details" options={{ title: "", headerShown: true }} />
          <Stack.Screen name="garden-settings" options={{ title: "Ajustes del sitio", headerShown: true }} />
          <Stack.Screen name="login" options={{ title: "", headerShown: true }} />
          <Stack.Screen name="signup" options={{ title: "", headerShown: true }} />
          <Stack.Screen name="camera-screen" options={{ title: "", headerShown: true }} />
          <Stack.Screen name="post-details" options={{ title: "", headerShown: true }} />
          <Stack.Screen name="post-form" options={{ title: "", headerShown: true }} />
          <Stack.Screen name="comment-form" options={{ title: "Añadir comentario", headerShown: true }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </AuthProvider>
    </StrictMode>
  );
}
