import { Colors } from "@/constants/Colors";
import { WateringPeriod } from "@/models/PlantInfo";
import React from "react";
import { View, Text, Dimensions, useColorScheme } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { ThemedText } from "./ThemedText";



interface Props {
    periods: WateringPeriod[];
}

const SEASON_LABELS = {
    spring: "Spring",
    summer: "Summer",
    fall: "Fall",
    winter: "Winter",
};

export default function PlantWateringChart({ periods }: Readonly<Props>) {
    const colorScheme = useColorScheme();
    // Convierte valores tipo "1-2" a un promedio numérico
    let data = periods.map((p) => {
        if (p.value.includes("-")) {
            const [min, max] = p.value.split("-").map(Number);
            return (min + max) / 2;
        }
        return Number(p.value);
    });

    // Toma la unidad de la primera estación (asume que todas son iguales)
    const unit = periods[0]?.unit || "";

    const labels = periods.map((p) => SEASON_LABELS[p.season] || p.season);
    return (
        <View style={{ padding: 8 }}>
            <ThemedText type='subtitle' style={{ fontWeight: "bold", marginBottom: 4 }}>
                Watering frequency ({unit})
            </ThemedText>
            <View style={{ alignItems: "center" }}>
                <LineChart
                    data={{
                        labels,
                        datasets: [{ data }]
                    }}
                    width={Math.min(Dimensions.get("window").width - 32, 400)} // Ajusta el ancho máximo
                    height={180}
                    chartConfig={{
                        backgroundGradientFrom: Colors[colorScheme!].cardBackground,
                        backgroundGradientTo: Colors[colorScheme!].cardBackground,
                        decimalPlaces: 1,
                        color: (opacity = 1) => `rgba(76, 142, 175, ${opacity})`,
                        labelColor: (opacity = 1) => Colors[colorScheme!].text,
                        propsForDots: {
                            r: "4",
                            strokeWidth: "4",
                            stroke: "#4bcab7ff",
                        },
                    }}
                    bezier
                    style={{
                        marginVertical: 8,
                        borderRadius: 12,
                    }}
                    fromZero
                />
            </View>
        </View>
    );
}