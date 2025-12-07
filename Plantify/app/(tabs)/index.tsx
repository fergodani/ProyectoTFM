import { View, Image, StyleSheet, Platform, Pressable, Text, Touchable, TouchableOpacity, useWindowDimensions, ActivityIndicator } from 'react-native';

import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { globalStyles } from '@/styles/global-styles';
import { useAuth } from "@/hooks/useAuthContext";
import { useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Button from '@/components/Button';
import { Collapsible } from '@/components/Collapsible';
import * as Location from 'expo-location';
import { PlantService } from '@/services/plantsService';
import { UserService } from '@/services/userService';
import { usePathname } from "expo-router";
import { Tasks } from '@/models/Plant';
import { SceneMap, TabBar, TabView } from 'react-native-tab-view';
import React from 'react';
import TaskList from '@/components/TaskList';
import { RecommendationService } from '@/services/recommendationService';

const routes = [
  { key: 'previous', title: 'Previous' },
  { key: 'today', title: 'Today' },
  { key: 'next', title: 'Upcoming' },
];

export default function HomeScreen() {
  const router = useRouter();
  const pathname = usePathname();
  const colorScheme = useColorScheme();
  const { refreshToken, login, logout, accessToken, setTokens, isAuthenticated } = useAuth();
  const backgroundColor = colorScheme === 'dark' ? Colors.dark.background : Colors.light.background;
  const [weatherInfo, setWeatherInfo] = useState<any>(null);
  const [tasks, setTasks] = useState<Tasks>();
  const [index, setIndex] = React.useState(1);
  const layout = useWindowDimensions();
  const [showWarning, setShowWarning] = useState(true);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);

  const renderScene = SceneMap({
    previous: () => <TaskList tasks={tasks?.previous_tasks} isToday={false} isNext={false} onRefresh={loadTasksData} />,
    today: () => <TaskList tasks={tasks?.today_tasks} isToday={true} isNext={false} onRefresh={loadTasksData} />,
    next: () => <TaskList tasks={tasks?.next_tasks} isToday={false} isNext={true} onRefresh={loadTasksData} />,
  });


  // Función para obtener datos del tiempo (memoizada)
  const loadWeatherData = useCallback(async () => {
    setLoadingWeather(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Location permission not granted');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      const data = await RecommendationService.getWeather(latitude, longitude);
      setWeatherInfo(data);
    } catch (error) {
      console.error("Error fetching weather data:", error);
    } finally {
      setLoadingWeather(false);
    }
  }, []);

  // Función para obtener las tareas (memoizada)
  const loadTasksData = useCallback(async () => {
    if (!isAuthenticated) return;

    setLoadingTasks(true);
    try {
      const data = await fetchTasksPromise();
      setTasks(data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoadingTasks(false);
    }
  }, [isAuthenticated, accessToken, refreshToken]);

  useEffect(() => {
    // Ejecutar ambas funciones en paralelo al montar el componente
    Promise.all([
      loadWeatherData(),
      loadTasksData()
    ]);
  }, [loadWeatherData, loadTasksData]);

  // Efecto separado para cargar tareas cuando el usuario se autentica
  useEffect(() => {
    if (isAuthenticated && !tasks && !loadingTasks) {
      loadTasksData();
    }
  }, [isAuthenticated, loadTasksData, tasks]);


  // Función que devuelve una promesa sin efectos secundarios
  const fetchTasksPromise = async () => {
    try {
      const data = await PlantService.getTasks(accessToken!);
      console.log("Tasks data:", data);
      return data;
    } catch (error: any) {
      if (error.message === 'Unauthorized') {
        // Handle token refresh logic here
        try {
          const newTokens = await UserService.refreshToken(refreshToken!);
          setTokens(newTokens.access, newTokens.refresh);

          const data = await PlantService.getTasks(newTokens.access);
          console.log("Tasks data:", data);
          return data;
        } catch (refreshError) {
          throw refreshError;
        }
      }
      throw error;
    }
  };

  // Función wrapper para usar en otros lugares (mantiene la funcionalidad anterior)
  const fetchTasks = async () => {
    try {
      const data = await fetchTasksPromise();
      setTasks(data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  return (
    <LinearGradient
      colors={['rgba(213, 240, 219, 0.19)', backgroundColor]} // Cambia estos colores a los que quieras
      style={[globalStyles.body, { padding: 16 }]}
    >
      <View style={{ display: "flex", gap: 12, flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ flex: 1, flexDirection: 'column', gap: 8 }}>
          <View style={globalStyles.titleContainer}>
            <ThemedText type="title">Recordatorios</ThemedText>
          </View>
          <ThemedText type='default'>Cuida cada una de tus plantas</ThemedText>
        </View>
        {loadingWeather || weatherInfo === null ? (
          <View style={{ width: 75, height: 75, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={Colors.light.tint} />
          </View>
        ) : (
          <View style={{ flexDirection: 'column', gap: 2, justifyContent: 'flex-end', alignItems: 'center' }}>
            <Image
              source={{ uri: `https://openweathermap.org/img/wn/${weatherInfo.weather.weather[0].icon}@2x.png` }}
              style={{ width: 75, height: 75 }}
            />
            <View style={{ paddingHorizontal: 8 }}>
              <ThemedText type='default'>
                {Math.trunc(weatherInfo.weather.main.temp_min)}°C - {Math.trunc(weatherInfo.weather.main.temp_max)}°C
              </ThemedText>
              <ThemedText type='subtitle'>
                {weatherInfo.weather.name}
              </ThemedText>
            </View>
          </View>
        )}
      </View>
      {showWarning && weatherInfo && (
        <View style={[styles.warning]}>
          <Image
            source={{ uri: `https://openweathermap.org/img/wn/${weatherInfo.weather.weather[0].icon}@2x.png` }}
            style={{ width: 75, height: 75 }}
          />
          <ThemedText type="default" style={{ color: '#856404', flex: 1, flexWrap: 'wrap' }}>
            {weatherInfo.recommendation}
          </ThemedText>
          <TouchableOpacity
            onPress={() => setShowWarning(false)}
            style={styles.closeButton}
          >
            <Text style={{ fontSize: 16, color: '#856404' }}>✕</Text>
          </TouchableOpacity>
        </View>
      )}
      {!isAuthenticated ? (
        <ThemedView style={[styles.card, { padding: 16 }]}>
          <ThemedText type='default'>Inicia sesión para ver tus recordatorios</ThemedText>
        </ThemedView>
      ) : loadingTasks ? (
        <View style={{ marginTop: 16, padding: 32, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={Colors.light.tint} />
          <ThemedText type="default" style={{ marginTop: 8 }}>Cargando tareas...</ThemedText>
        </View>
      ) : (
        <TabView
          style={{ marginTop: 16 }}
          navigationState={{ index, routes }}
          renderScene={renderScene}
          onIndexChange={setIndex}
          initialLayout={{ width: layout.width }}
          renderTabBar={props => <TabBar
            {...props}
            style={styles.tab}
            activeColor={Colors.light.text}
            inactiveColor={Colors.light.text}
            indicatorStyle={{ backgroundColor: 'white', height: '100%', borderRadius: 8 }}
          />}
        />
      )}

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
  tab: {
    backgroundColor: Colors.light.tint,
    borderRadius: 8,
    marginBottom: 16,
    marginHorizontal: 16,
  },
  warning: {
    backgroundColor: '#fff3cdff',
    borderColor: '#ffd558ff',
    borderWidth: 4,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    position: 'relative',
    maxWidth: '100%',
    paddingRight: 32, // leave space for close button
  },
  closeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    padding: 4,
    zIndex: 1,
  },
});
