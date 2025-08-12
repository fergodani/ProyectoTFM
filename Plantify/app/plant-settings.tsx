import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { View, Image, StyleSheet, ScrollView, ActivityIndicator, useColorScheme } from "react-native";


export default function PlantSettings() {

    return(
        <ThemedView style={styles.card}>
            <ThemedText type="title">Configuración de la Planta</ThemedText>
        </ThemedView>
    );

}

const styles = StyleSheet.create({
  container: {
    padding: 4,
    alignItems: "center",
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 16,
    marginBottom: 16,
  },
  card: {
    padding: 16,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});