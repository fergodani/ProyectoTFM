import { ThemedText } from "@/components/ThemedText";
import { useAuth } from "@/hooks/useAuthContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Post } from "@/models/Post";
import { PostService } from "@/services/postService";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, TextInput } from "react-native";

export default function PostDetails() {
    // Recibe los parámetros por router
    const params = useLocalSearchParams();
    const { id } = params;
    const [post, setPost] = useState<Post | null>(null);
    const [loading, setLoading] = useState(true);
    const colorScheme = useColorScheme() ?? "light";
    const { getUserId, accessToken, refreshToken, setTokens } = useAuth();
    const cardBackground = colorScheme === "dark" ? "#222" : "#fff"; // O los colores que prefieras
    const [commentText, setCommentText] = useState("");
    const [likeCount, setLikeCount] = useState(post?.likes || 0);
    const [dislikeCount, setDislikeCount] = useState(post?.dislikes || 0);

    const handleLike = () => {
        // Aquí puedes llamar a tu servicio para registrar el voto positivo
        setLikeCount(likeCount + 1);
    };

    const handleDislike = () => {
        // Aquí puedes llamar a tu servicio para registrar el voto negativo
        setDislikeCount(dislikeCount + 1);
    };

    const handleSendComment = () => {
        // Aquí puedes llamar a tu servicio para enviar el comentario
        // y luego limpiar el input
        setCommentText("");
    };

    useEffect(() => {
        const fetchPost = async () => {
            try {
                const data = await PostService.getPostById(Number(id), accessToken!);
                setPost(data);
            } catch (error) {
                console.error("Error fetching post details:", error);
            }
            setLoading(false);
        };
        fetchPost();
    }, [id, accessToken]);

    return (
        <View style={{ flex: 1, }}>
            {loading ? (
                <ActivityIndicator size="large" />
            ) : post ? (
                <>
                    <ScrollView style={styles.container}>
                        <View style={[styles.card, { backgroundColor: cardBackground, marginBottom: 16 }]}>
                            <ThemedText type="subtitle">{post.author} · {new Date(post.created_at).toLocaleDateString()}</ThemedText>
                            <ThemedText type="title">{post.title}</ThemedText>
                            <ThemedText type="default">{post.content}</ThemedText>
                            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 12 }}>
                                <TouchableOpacity onPress={handleLike} style={{ flexDirection: "row", alignItems: "center", marginRight: 16 }}>
                                    <Ionicons name="thumbs-up-outline" size={24} color="#4CAF50" />
                                    <ThemedText style={{ marginLeft: 4 }}>{likeCount}</ThemedText>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={handleDislike} style={{ flexDirection: "row", alignItems: "center" }}>
                                    <Ionicons name="thumbs-down-outline" size={24} color="#F44336" />
                                    <ThemedText style={{ marginLeft: 4 }}>{dislikeCount}</ThemedText>
                                </TouchableOpacity>
                            </View>
                        </View>
                        {post.comments.map(comment => (
                            <View key={comment.id} style={[styles.card, { backgroundColor: cardBackground, marginBottom: 12 }]}>
                                <ThemedText type="subtitle">{comment.author} · {new Date(comment.created_at).toLocaleDateString()}</ThemedText>
                                <ThemedText type="default">{comment.content}</ThemedText>
                                <View style={{ flexDirection: "row", alignItems: "center", marginTop: 12 }}>
                                <View style={{ flexDirection: "row", alignItems: "center", marginLeft: "auto" }}>
                                    <TouchableOpacity onPress={handleLike} style={{ flexDirection: "row", alignItems: "center", marginRight: 16 }}>
                                        <Ionicons name="thumbs-up-outline" size={20} color="#4CAF50" />
                                        <ThemedText style={{ marginLeft: 4 }}>{likeCount}</ThemedText>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={handleDislike} style={{ flexDirection: "row", alignItems: "center" }}>
                                        <Ionicons name="thumbs-down-outline" size={20} color="#F44336" />
                                        <ThemedText style={{ marginLeft: 4 }}>{dislikeCount}</ThemedText>
                                    </TouchableOpacity>
                                </View>
                            </View>
                            </View>
                        ))}
                    </ScrollView>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === "ios" ? "padding" : "height"}
                        keyboardVerticalOffset={80}
                        style={{ position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: cardBackground, padding: 8, flexDirection: "row", alignItems: "center", borderTopWidth: 1, borderColor: "#eee" }}
                    >
                        <TextInput
                            style={{ flex: 1, borderRadius: 5, paddingHorizontal: 16, paddingVertical: 8, marginRight: 8, backgroundColor: "#fff" }}
                            placeholder="Escribe un comentario..."
                            value={commentText}
                            onChangeText={setCommentText}
                        />
                        <TouchableOpacity onPress={handleSendComment} style={{ padding: 8 }}>
                            <Ionicons name="send" size={25} color="#f3f3f3" />
                        </TouchableOpacity>
                    </KeyboardAvoidingView>
                </>
            ) : (
                <ThemedText type="title">No post found.</ThemedText>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        marginBottom: 60, // Espacio para el input de comentario
    },
    image: {
        width: 200,
        height: 200,
        borderRadius: 16,
        marginBottom: 16,
    },
    card: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        //borderRadius: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
});