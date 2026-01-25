import { useAuth } from "@/hooks/useAuthContext";
import { Post, Comment } from "@/models/Post";
import { PostService } from "@/services/postService";
import { useEffect, useState } from "react";
import { Text, View, Image, StyleSheet, ScrollView, ActivityIndicator, useColorScheme, TouchableOpacity, RefreshControl, Modal, Pressable } from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from "@/constants/Colors";
import { ThemedText } from "@/components/ThemedText";
import Ionicons from "@expo/vector-icons/build/Ionicons";
import { router } from "expo-router";

export default function CommentsList() {
    const { getUserId, accessToken, refreshToken, setTokens } = useAuth();
    const [comments, setComments] = useState<Comment[]>([]);
    const colorScheme = useColorScheme();
    const backgroundColor = colorScheme === 'dark' ? Colors.dark.background : Colors.light.background;
    const cardBackground = colorScheme === "dark" ? "#222" : "#fff";
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [confirmVisible, setConfirmVisible] = useState(false);
    const [selectedComment, setSelectedComment] = useState<Comment | null>(null);
    const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });

    const fetchComments = async () => {
        try {
            const data = await PostService.getUserComments(accessToken!);
            setComments(data || []);
        } catch (error) {
            console.error("Error fetching comments:", error);
        }
    }

    useEffect(() => {
        fetchComments();
    }, []);

    const goToPostDetails = (postId: number) => {
        router.push({
            pathname: "/post-details",
            params: { id: postId }
        });
    }

    const openModal = (comment: Comment, event: any) => {
        if (modalVisible && selectedComment?.id === comment.id) {
            closeModal();
            return;
        }

        // Medir la posición del botón
        event.target.measure((x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
            setMenuPosition({
                top: pageY + height - 35,
                right: 16
            });
            setSelectedComment(comment);
            setModalVisible(true);
        });
    };

    const closeModal = () => {
        setModalVisible(false);
        setSelectedComment(null);
    };

    const closeConfirm = () => {
        setConfirmVisible(false);
        setSelectedComment(null);
    };

    const handleDelete = async () => {
        if (!selectedComment) return;
        try {
            const response = await PostService.deleteComment(selectedComment.id!, accessToken!);
            if (response) {
                setComments((prev) => prev.filter((p) => p.id !== selectedComment.id));
            }
        } catch (error) {
            console.error("Error deleting post:", error);
        }
    };

    return (
        <>
            <LinearGradient
                colors={['rgba(213, 240, 219, 0.19)', backgroundColor]} // Cambia estos colores a los que quieras
                style={[styles.container]}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollViewContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={fetchComments} />
                    }
                >
                    {comments.length === 0 ? (
                        <Text style={{ color: colorScheme === 'dark' ? '#FFFFFF' : '#000000' }}>No hay comentarios disponibles.</Text>
                    ) : (
                        comments.map((comment) => (
                            <TouchableOpacity
                                onPress={(event) => {
                                    goToPostDetails(comment.post!.id!);
                                }}
                                key={comment.id} style={[styles.card, { backgroundColor: cardBackground }]}>

                                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <ThemedText type="title2">{comment.post!.title}</ThemedText>
                                    <TouchableOpacity
                                        style={styles.buttonMenu}
                                        onPress={(event) => {
                                            openModal(comment, event);
                                        }}
                                    >
                                        <Ionicons name="ellipsis-vertical" size={20} color={colorScheme === "dark" ? Colors.dark.text : Colors.light.text} />
                                    </TouchableOpacity>
                                </View>
                                <View style={{ flexDirection: 'row', justifyContent: 'flex-start', gap: 12 }}>
                                    <ThemedText type="subtitle">{comment.post!.plant_common_name}</ThemedText>
                                    <ThemedText type="subtitle">{comment.created_since}</ThemedText>
                                </View>
                                <ThemedText type="default" numberOfLines={3} ellipsizeMode="tail">{comment.content}</ThemedText>
                            </TouchableOpacity>
                        ))
                    )}
                </ScrollView>
            </LinearGradient>
            {/* Modal de opciones del menú */}
            <Modal
                visible={modalVisible}
                transparent
                animationType="fade"
                onRequestClose={closeModal}>
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={closeModal}>
                    <View style={[styles.optionsMenu, {
                        backgroundColor,
                        position: 'absolute',
                        top: menuPosition.top,
                        right: menuPosition.right
                    }]}>
                        <Pressable onPress={() => {
                            setConfirmVisible(true);
                        }}>
                            <ThemedText type="defaultSemiBold" style={{ fontSize: 16, color: "red" }}>Eliminar</ThemedText>
                        </Pressable>
                    </View>
                </TouchableOpacity>
            </Modal>
            {/* Modal de confirmación de eliminación */}
            <Modal
                visible={confirmVisible}
                transparent
                animationType="fade"
                onRequestClose={closeConfirm}>
                <View style={{
                    flex: 1,
                    backgroundColor: "rgba(0,0,0,0.3)",
                    justifyContent: "center",
                    alignItems: "center",

                }}>
                    <View style={{
                        backgroundColor: backgroundColor,
                        borderRadius: 12,
                        padding: 24,
                        minWidth: 220,
                        alignItems: "center",
                        margin: 36
                    }}>
                        <ThemedText type="title2">¿Seguro que quieres eliminar este comentario?</ThemedText>
                        <ThemedText type="default">Se ocultará su contenido y no podrá recuperarse.</ThemedText>
                        <View style={{ display: 'flex', flexDirection: 'row', gap: 12, justifyContent: 'flex-end', width: '100%' }}>
                            <Pressable style={{ marginBottom: 12 }} onPress={() => {
                                closeModal();
                                closeConfirm();
                            }}>
                                <ThemedText type="defaultSemiBold">Cancelar</ThemedText>
                            </Pressable>
                            <Pressable onPress={() => {
                                handleDelete();
                                closeModal();
                                closeConfirm();
                            }}>
                                <ThemedText type="defaultSemiBold" style={{ color: "red" }}>Eliminar</ThemedText>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    body: {
        padding: 16,
        flex: 1,
        gap: 16,
    },
    container: {
        flex: 1,
    },
    scrollViewContent: {
        padding: 16,
    },
    card: {
        padding: 16,
        borderRadius: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        marginBottom: 16,
    },
    buttonMenu: {
        padding: 2,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
    },
    optionsMenu: {
        borderRadius: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 10,
        padding: 16,
        minWidth: 200,
    },
});