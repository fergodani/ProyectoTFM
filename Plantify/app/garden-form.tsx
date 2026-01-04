import Button from "@/components/Button";
import React, { useEffect, useState } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Image, ScrollView } from "react-native";
import { globalStyles } from '@/styles/global-styles';
import { ThemedText } from "@/components/ThemedText";
import { useRouter } from "expo-router";
import { ThemedView } from "@/components/ThemedView";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme.web";
import GardensService from "@/services/gardensService";
import { useAuth } from "@/hooks/useAuthContext";
import { UserService } from "@/services/userService";
// removed native-only TurboModuleRegistry import (not used on web)

const GardenForm = () => {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const { getUserId, accessToken, refreshToken, setTokens } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    humidity: "",
    sunlight_exposure: "",
    owner: "",
  });


  const locations: any = {
    indoor: { value: "indoor", label: "Interior" },
    outdoor: { value: "outdoor", label: "Exterior" },
  };
  const sunlightExposures: any = {
    indirect_sun: { value: "indirect_sun", label: "Luz solar indirecta" },
    full_shade: { value: "full_shade", label: "Sombra total" },
    partial_sun: { value: "partial_sun", label: "Sol parcial" },
    full_sun: { value: "full_sun", label: "A pleno sol" },
  };
  const humidities: any = {
    low: { value: "low", label: "Baja" },
    normal: { value: "normal", label: "Normal" },
    high: { value: "high", label: "Alta" },
  };

  useEffect(() => {
    const userId = getUserId();
    setFormData({ ...formData, ['owner']: userId! + '' });
  }, []);

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  const handleChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
    if (name !== 'name') handleNext();
    if (name === 'humidity') handleNext();
  };

  const handleSubmit = async () => {
    try {
      
      const data = await GardensService.createGarden(formData, accessToken!);
    } catch (error: any) {
      if (error.message === 'Unauthorized') {
        // Handle token refresh logic here
        try {
          const newTokens = await UserService.refreshToken(refreshToken!);
          setTokens(newTokens.access, newTokens.refresh);
          // Retry fetching plants with new access token
          await GardensService.createGarden(formData, newTokens.access);
        } catch (refreshError) {
          console.error("Error refreshing tokens:", refreshError);
        }
      }
    }
    router.back();
  };

  const goBack = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      {step === 1 && (
        <View>
          <ThemedText type='title' style={styles.text}>Nombre del lugar</ThemedText>
          <ThemedText type="subtitle" style={styles.text}>Introduce el nombre del lugar donde se encuentra el jardín.</ThemedText>
          <View style={styles.searchContainer}>
            <TextInput
              value={formData.name}
              onChangeText={value => handleChange("name", value)}
              placeholder="Nombre del jardín"
            />
          </View>
          <Button
            text="Siguiente"
            onPress={handleNext}
            disabled={formData.name.trim() === ""}
          />
        </View>
      )}
      {step === 2 && (
        <View>
          <ScrollView>
            <ThemedText type='title' style={styles.text}>Selecciona el tipo de luz que recibe tu jardín.</ThemedText>
            <TouchableOpacity
              onPress={() => { handleChange("sunlight_exposure", "indirect_sun") }}
            >
              <ThemedView style={styles.card}>
                <Image
                  source={require('../assets/images/indirect-light.png')}
                  style={{ width: 100, height: 100, borderRadius: 8 }}
                />
                <View style={{ flex: 1, flexShrink: 1 }}>
                  <ThemedText type='title2'>Luz solar indirecta</ThemedText>
                  <ThemedText type='subtitle'>Luminoso, pero sin luz solar directa</ThemedText>
                </View>
              </ThemedView>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => { handleChange("sunlight_exposure", "full_shade") }}
            >
              <ThemedView style={styles.card}>
                <Image
                  source={require('../assets/images/total-shadow.png')}
                  style={{ width: 100, height: 100, borderRadius: 8 }}
                />
                <View style={{ flex: 1, flexShrink: 1 }}>
                  <ThemedText type='title2'>Sombra total</ThemedText>
                  <ThemedText type='subtitle'>Luminoso, pero con poca luz</ThemedText>
                </View>
              </ThemedView>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => { handleChange("sunlight_exposure", "partial_sun") }}
            >
              <ThemedView style={styles.card}>
                <Image
                  source={require('../assets/images/partial-sun.png')}
                  style={{ width: 100, height: 100, borderRadius: 8 }}
                />
                <View style={{ flex: 1, flexShrink: 1 }}>
                  <ThemedText type='title2'>Sol parcial</ThemedText>
                  <ThemedText type='subtitle'>Unas 3-6 horas de luz solar</ThemedText>
                </View>
              </ThemedView>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { handleChange("sunlight_exposure", "full_sun") }}
            >
              <ThemedView style={styles.card}>
                <Image
                  source={require('../assets/images/full-sun.png')}
                  style={{ width: 100, height: 100, borderRadius: 8 }}
                />
                <View style={{ flex: 1, flexShrink: 1 }}>
                  <ThemedText type='title2'>A pleno sol</ThemedText>
                  <ThemedText type='subtitle'>Al menos 6 horas de luz solar</ThemedText>
                </View>
              </ThemedView>
            </TouchableOpacity>
          </ScrollView>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 16 }}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Button text="Atrás" onPress={handleBack} />
            </View>
          </View>
        </View>
      )}
      {step == 3 && (
        <View>
          <ScrollView>
            <ThemedText type='title' style={styles.text}>Selecciona cuánta humedad hay en el ambiente.</ThemedText>
            <TouchableOpacity
              onPress={() => { handleChange("humidity", "low") }}
            >
              <ThemedView style={styles.card}>
                <Image
                  source={require('../assets/images/low-humidity.png')}
                  style={{ width: 100, height: 100, borderRadius: 8 }}
                />
                <View style={{ flex: 1, flexShrink: 1 }}>
                  <ThemedText type='title2'>Poca humedad</ThemedText>
                  <ThemedText type='subtitle'>Ambiente muy seco</ThemedText>
                </View>
              </ThemedView>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { handleChange("humidity", "normal") }}
            >
              <ThemedView style={styles.card}>
                <Image
                  source={require('../assets/images/normal-humidity.png')}
                  style={{ width: 100, height: 100, borderRadius: 8 }}
                />
                <View style={{ flex: 1, flexShrink: 1 }}>
                  <ThemedText type='title2'>Normal</ThemedText>
                  <ThemedText type='subtitle'>Ambiente con humedad adecuada</ThemedText>
                </View>
              </ThemedView>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { handleChange("humidity", "high") }}
            >
              <ThemedView style={styles.card}>
                <Image
                  source={require('../assets/images/high-humidity.png')}
                  style={{ width: 100, height: 100, borderRadius: 8 }}
                />
                <View style={{ flex: 1, flexShrink: 1 }}>
                  <ThemedText type='title2'>Mucha humedad</ThemedText>
                  <ThemedText type='subtitle'>Ambiente muy húmedo</ThemedText>
                </View>
              </ThemedView>
            </TouchableOpacity>
          </ScrollView>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 16 }}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Button text="Atrás" onPress={handleBack} />
            </View>
          </View>
        </View>
      )}
      {step == 4 && (
        <View>
          <ScrollView>
            <ThemedText type='title' style={styles.text}>¿Dónde se ubica el lugar?</ThemedText>
            <TouchableOpacity
              onPress={() => { handleChange("location", "outdoor") }}
            >
              <ThemedView style={styles.card}>
                <Image
                  source={require('../assets/images/outdoor.png')}
                  style={{ width: 100, height: 100, borderRadius: 8 }}
                />
                <View style={{ flex: 1, flexShrink: 1 }}>
                  <ThemedText type='title2'>Exterior</ThemedText>
                  <ThemedText type='subtitle'>Al aire libre</ThemedText>
                </View>
              </ThemedView>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { handleChange("location", "indoor") }}
            >
              <ThemedView style={styles.card}>
                <Image
                  source={require('../assets/images/indoor.png')}
                  style={{ width: 100, height: 100, borderRadius: 8 }}
                />
                <View style={{ flex: 1, flexShrink: 1 }}>
                  <ThemedText type='title2'>Interior</ThemedText>
                  <ThemedText type='subtitle'>Lugar techado</ThemedText>
                </View>
              </ThemedView>
            </TouchableOpacity>
          </ScrollView>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 16 }}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Button text="Atrás" onPress={handleBack} />
            </View>
          </View>
        </View>
      )}
      {step === 5 && (
        <View style={{ backgroundColor: Colors[colorScheme!].cardBackground, padding: 16, borderRadius: 8, elevation: 3 }}>
          <ThemedText type='title' style={styles.text}>Confirmar datos</ThemedText>
          <ThemedText style={styles.text}>Jardín: {formData.name}</ThemedText>
          <ThemedText style={styles.text}>Ubicación: {locations[formData.location]?.label}</ThemedText>
          <ThemedText style={styles.text}>Tipo de luz: {sunlightExposures[formData.sunlight_exposure]?.label}</ThemedText>
          <ThemedText style={styles.text}>Humedad: {humidities[formData.humidity]?.label}</ThemedText>
          <Button text="Crear" onPress={handleSubmit} />
          <Button text="Atrás" onPress={handleBack} />

        </View>
      )}
      <View style={{ marginTop: 16, display: 'flex', flexDirection: 'column', width: '100%', alignItems: 'center' }}>
        <TouchableOpacity onPress={goBack}>
          <ThemedText type="default">Cancelar</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    marginTop: 64,
  },
  text: {
    textAlign: 'center',
  },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 12 },
  input: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    width: '80%',
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
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  searchContainer: {
    flexDirection: 'column',
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginTop: 16,
  },
});

export default GardenForm;