import { Task } from "@/models/Plant";
import { ThemedView } from "./ThemedView";
import { ThemedText } from "./ThemedText";
import { Colors } from "@/constants/Colors";
import { ScrollView, Text, View, StyleSheet, TouchableOpacity, Image, useColorScheme, Pressable, Modal, RefreshControl } from "react-native";
import { useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import Button from "./Button";
import { PlantService } from "@/services/plantsService";
import { useAuth } from "@/hooks/useAuthContext";
import { UserService } from "@/services/userService";
import React from "react";

export default function TaskList({ tasks, isToday, isNext, onRefresh }: Readonly<{
    tasks: Task[] | undefined, isToday?: boolean, isNext?: boolean, onRefresh: () => void
}>) {
    const plantTaskMap: { [plantId: number]: { user_plant: Task['user_plant'], tasks: Task[] } } = {};
    const { getUserId, accessToken, setTokens, refreshToken } = useAuth();
    const [refreshing, setRefreshing] = React.useState(false);

    tasks?.forEach(task => {
        const plantId = task.user_plant.id;
        if (!plantTaskMap[plantId]) {
            plantTaskMap[plantId] = { user_plant: task.user_plant, tasks: [] };
        }
        plantTaskMap[plantId].tasks.push(task);
    });

    const plantTasksList = Object.values(plantTaskMap);

    const colorScheme = useColorScheme();

    const completeTask = async (task: Task) => {
        console.log("Completing task:", task);
        switch (task.type) {
            case 'watering':
                task.user_plant.last_watered_date = new Date().toISOString().slice(0, 10);
                break;
            case 'pruning':
                task.user_plant.last_pruning_date = new Date().toISOString().slice(0, 10);
                break;
            case 'spraying':
                task.user_plant.last_spraying_date = new Date().toISOString().slice(0, 10);
                break;
            case 'rotating':
                task.user_plant.last_rotating_date = new Date().toISOString().slice(0, 10);
                break;
            case 'fertilizing':
                task.user_plant.last_fertilized_date = new Date().toISOString().slice(0, 10);
                break;
        }
        try {
            const plant = await PlantService.putPlant(task.user_plant, accessToken!);
            if (plant) {
                const updatedTasks = tasks?.filter(t => t.user_plant.id !== task.user_plant.id);
                tasks = updatedTasks;
                onRefresh();
            }
        } catch (error: any) {
            if (error.message === 'Unauthorized') {
                // Handle token refresh logic here
                try {
                    const newTokens = await UserService.refreshToken(refreshToken!);
                    setTokens(newTokens.access, newTokens.refresh);

                    const plant = await PlantService.putPlant(task.user_plant, newTokens.access);
                    if (plant) {
                        const updatedTasks = tasks?.filter(t => t.user_plant.id !== task.user_plant.id);
                        tasks = updatedTasks;
                        onRefresh();
                    }
                } catch (refreshError) {
                    console.error("Error refreshing tokens:", refreshError);
                }
            }
        }
    };

    const taskTypeColors: Record<string, string> = {
        watering: "#A3D9A5",
        pruning: "#F7C873",
        spraying: "#A3C4F7",
        rotating: "#F7A3A3",
        fertilizing: "#B6A3F7"
    };

    const taskTypeIcons: Record<Task['type'], keyof typeof Ionicons.glyphMap> = {
        watering: "color-fill",
        pruning: "cut",
        spraying: "water",
        rotating: "sync",
        fertilizing: "archive"
    };

    return (
        <ScrollView
        style={styles.container}
        refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }>
            {tasks?.length === 0 ? (
                <>
                    {isToday && (
                        <ThemedView style={styles.card}>
                            <View style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <ThemedText type='title2'>Tareas de hoy</ThemedText>
                                <View style={{ display: 'flex', flexDirection: 'row', gap: 16, alignContent: 'center', alignItems: 'center' }}>
                                    <Ionicons name="checkmark-circle" size={42} color={colorScheme === "dark" ? Colors.dark.text : Colors.light.text} />
                                    <View>
                                        <ThemedText type='default'>Todo completado</ThemedText>
                                        <ThemedText type='subtitle'>Las tareas nuevas se muestran aquí</ThemedText>
                                    </View>

                                </View>
                            </View>
                        </ThemedView>
                    )}
                    {!isToday && isNext && (
                        <ThemedView style={styles.card}>
                            <View style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <ThemedText type='title2'>Tareas próximas</ThemedText>
                                <View style={{ display: 'flex', flexDirection: 'row', gap: 16, alignContent: 'center', alignItems: 'center' }}>
                                    <Ionicons name="checkmark-circle" size={42} color={colorScheme === "dark" ? Colors.dark.text : Colors.light.text} />
                                    <View>
                                        <ThemedText type='default'>Todo completado</ThemedText>
                                        <ThemedText type='subtitle'>Las próximas tareas se muestran aquí</ThemedText>
                                    </View>
                                </View>
                            </View>
                        </ThemedView>
                    )}
                    {!isToday && !isNext && (
                        <ThemedView style={styles.card}>
                            <View style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <ThemedText type='title2'>Tareas pasadas</ThemedText>
                                <View style={{ display: 'flex', flexDirection: 'row', gap: 16, alignContent: 'center', alignItems: 'center' }}>
                                    <Ionicons name="checkmark-circle" size={42} color={colorScheme === "dark" ? Colors.dark.text : Colors.light.text} />
                                    <View>
                                        <ThemedText type='default'>Todo completado</ThemedText>
                                        <ThemedText type='subtitle'>Las tareas pasadas se muestran aquí</ThemedText>
                                    </View>
                                </View>
                            </View>
                        </ThemedView>
                    )}
                </>
            ) : (
                plantTasksList.map(({ user_plant, tasks }) => (
                    <ThemedView key={user_plant.id} style={styles.card}>
                        <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 16, justifyContent: 'space-between' }}>
                            {user_plant.custom_image ? (
                                    <Image source={{ uri: user_plant.custom_image }} style={{ width: 50, height: 50 }} />
                                ) : (
                                    <Image source={{ uri: user_plant.image }} style={{ width: 50, height: 50 }} />
                                )}
                            {user_plant.custom_name ? (
                                <ThemedText type="title2">{user_plant.custom_name.charAt(0).toUpperCase() + user_plant.custom_name.slice(1)}</ThemedText>
                            ) : (
                                <ThemedText type="title2">{user_plant.common_name
                                ? user_plant.common_name.charAt(0).toUpperCase() + user_plant.common_name.slice(1)
                                : ""}</ThemedText>
                            )}
                            
                            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' }}>
                                <View style={styles.taskCount}>
                                    <ThemedText type="subtitle" style={{ color: Colors.light.text }}>
                                        {tasks.length == 1 ? "1 tarea" : `${tasks.length} tareas`}
                                    </ThemedText>
                                </View>
                            </View>
                        </View>

                        <View style={{ flex: 1, flexShrink: 1, gap: 16, display: 'flex', flexDirection: 'column' }}>

                            {/* Puedes mostrar más datos de user_plant aquí */}
                            {tasks.map(task => (
                                <View key={task.type} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
                                    <View
                                        style={{
                                            backgroundColor: taskTypeColors[task.type] || "#eee",
                                            borderRadius: 8,
                                            paddingHorizontal: 8,
                                            paddingVertical: 4,
                                            marginRight: 8,
                                            minWidth: 80,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexDirection: 'row',
                                            gap: 2,
                                        }}
                                    >
                                        <Ionicons name={taskTypeIcons[task.type]} size={16} color={"#333"} />
                                        <ThemedText style={{ color: "#222", fontWeight: "bold" }}>{task.type.charAt(0).toUpperCase() + task.type.slice(1)}</ThemedText>
                                    </View>
                                    <View style={{ justifyContent: 'center', alignSelf: "center" }}>
                                        <ThemedText>{(() => {
                                            const today = new Date();
                                            const taskDate = new Date(task.next_date!);
                                            const diff = Math.ceil((taskDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                                            if (diff === 0) return "";
                                            if (diff > 0) return `En ${diff} día${diff > 1 ? 's' : ''}`;
                                            return `Hace ${Math.abs(diff)} día${Math.abs(diff) > 1 ? 's' : ''}`;
                                        })()}</ThemedText>
                                    </View>
                                    {!isNext && (
                                        <TouchableOpacity style={[styles.button, { justifyContent: 'flex-end' }]} onPress={() => completeTask(task)}>
                                            <Ionicons name="checkmark-circle" size={24} color="#333" />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            ))}
                        </View>
                    </ThemedView>
                ))
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 4
    },
    optionsMenu: {
        position: 'absolute',
        right: 0,
        top: 40, // ajusta según tu diseño
        borderRadius: 12,
        shadowColor: "#fff",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 10,
        zIndex: 100,
        padding: 16
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
        justifyContent: 'space-between',
        flexDirection: 'column',
        alignItems: 'stretch',
        gap: 16,
        zIndex: 1,
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
    button: {
        backgroundColor: Colors.light.tint,
        borderRadius: 25,
        paddingVertical: 4,
        paddingHorizontal: 16,
        elevation: 5,
        display: 'flex',
        alignItems: 'center',
        alignContent: 'center',
        justifyContent: 'center',
    },
    buttonMenu: {
        position: 'absolute',
        right: 6,
        top: 12,
    },
    taskCount: {
        backgroundColor: Colors.light.tint,
        borderRadius: 12,
        padding: 8,
        justifyContent: 'center',
        alignItems: 'center',
    }
});

