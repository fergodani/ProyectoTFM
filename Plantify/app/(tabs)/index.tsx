import { View, Image, StyleSheet, Platform, Pressable, Text, Touchable, TouchableOpacity } from 'react-native';

import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { globalStyles } from '@/styles/global-styles';
import { useAuth } from "@/hooks/useAuthContext";
import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Button from '@/components/Button';
import { Collapsible } from '@/components/Collapsible';

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const { isAuthenticated, login, logout, accessToken } = useAuth();
  const backgroundColor = colorScheme === 'dark' ? Colors.dark.background : Colors.light.background;

  return (
    <LinearGradient
      colors={['rgba(213, 240, 219, 0.19)', backgroundColor]} // Cambia estos colores a los que quieras
      style={[globalStyles.body, { padding: 16 }]}
    >
      <View style={globalStyles.titleContainer}>
        <ThemedText type="title">Recordatorios</ThemedText>
      </View>
      <ThemedText type='default'>Cuida cada una de tus plantas</ThemedText>
      <ThemedView style={[styles.card, {padding: 16}]}>
        <ThemedText type='default'>Parece que todavía no tienes ningún recordatorio</ThemedText>
        <Button text="Añadir Recordatorio" onPress={() => console.log("Add Reminder")} />
      </ThemedView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
    padding: 16,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
  iconContainer: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: Colors.light.tint,
  },
  card: {
    padding: 16,
    marginVertical: 8,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});
