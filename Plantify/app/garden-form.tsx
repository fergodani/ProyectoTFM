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
import { Garden } from "@/models/Plant";
import { LinearGradient } from 'expo-linear-gradient';
// removed native-only TurboModuleRegistry import (not used on web)

const GardenForm = () => {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const { getUserId, accessToken, refreshToken, setTokens } = useAuth();
  const [gardenTemplates, setGardenTemplates] = useState<Garden[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    humidity: "",
    sunlight_exposure: "",
    owner: "",
  });
  const backgroundColor = colorScheme === 'dark' ? Colors.dark.background : Colors.light.background;
  const [isTemplate, setIsTemplate] = useState(false);

  // Helpers to render icons for the selected options
  const getLocationImage = (loc: string) => {
    if (loc === 'outdoor') return require('../assets/images/outdoor.png');
    return require('../assets/images/indoor.png');
  };
  const getSunlightImage = (sun: string) => {
    switch (sun) {
      case 'full_sun':
        return require('../assets/images/full-sun.png');
      case 'partial_sun':
        return require('../assets/images/partial-sun.png');
      case 'full_shade':
        return require('../assets/images/total-shadow.png');
      default:
        return require('../assets/images/indirect-light.png');
    }
  };
  const getHumidityImage = (hum: string) => {
    switch (hum) {
      case 'high':
        return require('../assets/images/high-humidity.png');
      case 'normal':
        return require('../assets/images/normal-humidity.png');
      default:
        return require('../assets/images/low-humidity.png');
    }
  };

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
    fetchGardenTemplates();
    setFormData({ ...formData, ['owner']: userId! + '' });
  }, []);

  const fetchGardenTemplates = async () => {
    try {
      const data = await GardensService.getGardenTemplates(accessToken!);
      setGardenTemplates(data);
      console.log("Garden templates fetched:", data);
    } catch (error) {
      console.error("Error fetching garden templates:", error);
    }
  };

  const handleNext = () => {
    setStep(step + 1);
  };
  const handleBack = () => {
    if (isTemplate) 
      setStep(1);
    else
      setStep(step - 1);
    setIsTemplate(false);
  };

  const handleChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
    if (name !== 'name') handleNext();
    if (name === 'humidity') handleNext();
  };

  const handleUseTemplate = (template: Garden) => {
    setFormData({
      ...formData,
      ['name']: template.name!,
      ['location']: template.location!,
      ['humidity']: template.humidity!,
      ['sunlight_exposure']: template.sunlight_exposure!,
    });
    setStep(6); // Go to confirmation step
    setIsTemplate(true);
  }

  const handleCustom = () => {
    setFormData({
      ...formData,
      ['name']: "",
      ['location']: "",
      ['humidity']: "",
      ['sunlight_exposure']: "",
    });
    handleNext();
  }

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
    <LinearGradient
      colors={['rgba(213, 240, 219, 0.19)', backgroundColor]} // Cambia estos colores a los que quieras
      style={[styles.container]}
    >
      {step === 1 && (
        <View style={{ alignItems: 'center' }}>
          <ThemedText type='title' style={styles.text}>Elije un lugar</ThemedText>
          <View style={styles.roundedCardsContainer}>
            {gardenTemplates.map((template) => (
              <TouchableOpacity
                style={styles.roundedCard}
                key={template.id}
                onPress={() => {
                  handleUseTemplate(template);
                }}
              >
                <Image
                  source={{ uri: template.custom_image || require('../assets/images/plant-placeholder.png') }}
                  style={{ width: 90, height: 90, borderRadius: 50 }}
                />
                <ThemedText type="subtitle" style={{ textAlign: 'center' }}>{template.name}</ThemedText>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={styles.roundedCard}
            key={'custom'}
            onPress={() => {
              handleCustom();
            }}
          >
            <Image
              source={require('../assets/images/location.png')}
              style={{ width: 90, height: 90, borderRadius: 50, backgroundColor: '#d3d3d3' }}
            />
            <ThemedText type="subtitle" style={{ textAlign: 'center' }}>Personalizado</ThemedText>
          </TouchableOpacity>
        </View>
      )}
      {step === 2 && (
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

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 16 }}>

            <View style={{ flex: 1, marginRight: 8 }}>
              <Button
                text="Siguiente"
                onPress={handleNext}
                disabled={formData.name.trim() === ""}
              />
              <Button text="Atrás" onPress={handleBack} />
            </View>
          </View>
        </View>
      )}
      {step === 3 && (
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
      {step == 4 && (
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
      {step == 5 && (
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
      {step === 6 && (
        <View style={{ backgroundColor: Colors[colorScheme!].cardBackground, padding: 16, borderRadius: 12, elevation: 3 }}>
          <ThemedText type='title' style={styles.text}>Confirma tu lugar</ThemedText>

          {/* Preview avatar + name */}
          <View style={styles.summaryHeader}>
            { isTemplate && (<Image
              source={{ uri: gardenTemplates.find(g => g.name === formData.name)?.custom_image || '' }}
              style={{ width: 96, height: 96, borderRadius: 48 }}
            />)}
            
            <ThemedText type='title' style={{ marginTop: 8 }}>{formData.name || 'Sin nombre'}</ThemedText>
          </View>

          {/* Chips with selected options */}
          <View style={styles.chipRow}>
            <ThemedView style={styles.chip}>
              <Image source={getLocationImage(formData.location || 'indoor')} style={styles.chipIcon} />
              <View style={{ flex: 1 }}>
                <ThemedText type='subtitle'>Ubicación</ThemedText>
                <ThemedText style={{color: "#333"}}>{locations[formData.location]?.label || 'Interior'}</ThemedText>
              </View>
            </ThemedView>

            <ThemedView style={styles.chip}>
              <Image source={getSunlightImage(formData.sunlight_exposure || 'indirect_sun')} style={styles.chipIcon} />
              <View style={{ flex: 1 }}>
                <ThemedText type='subtitle'>Tipo de luz</ThemedText>
                <ThemedText style={{color: "#333"}}>{sunlightExposures[formData.sunlight_exposure]?.label || 'Luz solar indirecta'}</ThemedText>
              </View>
            </ThemedView>

            <ThemedView style={styles.chip}>
              <Image source={getHumidityImage(formData.humidity || 'normal')} style={styles.chipIcon} />
              <View style={{ flex: 1 }}>
                <ThemedText type='subtitle'>Humedad</ThemedText>
                <ThemedText style={{color: "#333"}}>{humidities[formData.humidity]?.label || 'Normal'}</ThemedText>
              </View>
            </ThemedView>
          </View>

          {/* Actions */}
          <View style={{ marginTop: 16 }}>
            <Button text="Crear" onPress={handleSubmit} />
            <Button text="Atrás" onPress={handleBack} />
          </View>
        </View>
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    height: '100%',
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
  roundedCardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    flexWrap: 'wrap',
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
  roundedCard: {
    width: 100,
    height: 100,
    marginVertical: 8,
    borderRadius: 50,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryHeader: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    elevation: 2,
    backgroundColor: '#fff',
    flex: 1,
    minWidth: '48%',
  },
  chipIcon: {
    width: 55,
    height: 55,
    borderRadius: 8,
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