import { ThemedText } from "@/components/ThemedText";
import { useAuth } from "@/hooks/useAuthContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Post, CommentVoteResponse } from "@/models/Post";
import { PostService } from "@/services/postService";
import { router, useLocalSearchParams, useFocusEffect, useNavigation } from "expo-router";
import { useEffect, useState, useCallback, useLayoutEffect } from "react";
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, TextInput, Image, Alert } from "react-native";
import { Colors } from "@/constants/Colors";
import { LinearGradient } from 'expo-linear-gradient';

export default function PostDetails() {
    // Recibe los parámetros por router
    const params = useLocalSearchParams();
    const { id } = params;
    const [post, setPost] = useState<Post | null>(null);
    const [loading, setLoading] = useState(true);
    const colorScheme = useColorScheme() ?? "light";
    const { getUserId, accessToken, refreshToken, setTokens } = useAuth();
    const cardBackground = colorScheme === "dark" ? "#222" : "#fff";
    const buttonBackground = colorScheme === "dark" ? "#fff" : "#444";
    const [commentText, setCommentText] = useState("");
    const [commentVotes, setCommentVotes] = useState<{ [key: number]: string | null }>({});
    const [votingComments, setVotingComments] = useState<Set<number>>(new Set());
    const [postVote, setPostVote] = useState<string | null>(null);
    const [votingPost, setVotingPost] = useState(false);
    const backgroundColor = colorScheme === 'dark' ? Colors.dark.background : Colors.light.background;

    // Función para mostrar feedback del voto
    const showVoteFeedback = (action: string, voteType: string | null) => {
        let message = '';
        switch (action) {
            case 'created':
                message = `You ${voteType}d this post!`;
                break;
            case 'updated':
                message = `Your vote has been changed to ${voteType}!`;
                break;
            case 'removed':
                message = 'Your vote has been removed.';
                break;
        }
        // console.log(message); // Puedes cambiar esto por una notificación toast si quieres
    };

    const handleLikePost = async () => {
        if (votingPost) return;

        setVotingPost(true);

        try {
            const response = await PostService.giveLikePost(Number(id), accessToken!);
            if (response) {
                // Actualiza el estado del post con los nuevos conteos de votos
                setPost(prevPost => prevPost ? {
                    ...prevPost,
                    vote_score: response.vote_score,
                    likes_count: response.likes_count,
                    dislikes_count: response.dislikes_count
                } : prevPost);

                // Actualiza el estado del voto del usuario para el post
                setPostVote(response.vote_type);

                // Mostrar feedback
                showVoteFeedback(response.action, response.vote_type);
            }
        } finally {
            setVotingPost(false);
        }
    };

    const handleDislikePost = async () => {
        if (votingPost) return;

        setVotingPost(true);

        try {
            const response = await PostService.giveDislikePost(Number(id), accessToken!);
            if (response) {
                // Actualiza el estado del post con los nuevos conteos de votos
                setPost(prevPost => prevPost ? {
                    ...prevPost,
                    vote_score: response.vote_score,
                    likes_count: response.likes_count,
                    dislikes_count: response.dislikes_count
                } : prevPost);

                // Actualiza el estado del voto del usuario para el post
                setPostVote(response.vote_type);

                // Mostrar feedback
                showVoteFeedback(response.action, response.vote_type);
            }
        } finally {
            setVotingPost(false);
        }
    };

    const handleLikeComment = async (commentId: number) => {
        // Evitar múltiples clics simultáneos
        if (votingComments.has(commentId)) return;

        setVotingComments(prev => new Set([...prev, commentId]));

        try {
            const response = await PostService.giveLikeComment(commentId, accessToken!);
            if (response) {
                // Actualiza el estado del comentario específico con los nuevos conteos de votos
                setPost(prevPost => prevPost ? {
                    ...prevPost,
                    comments: prevPost.comments?.map(comment =>
                        comment.id === commentId
                            ? {
                                ...comment,
                                vote_score: response.vote_score,
                                likes_count: response.likes_count,
                                dislikes_count: response.dislikes_count
                            }
                            : comment
                    )
                } : prevPost);

                // Actualiza el estado local del voto del usuario para este comentario
                setCommentVotes(prev => ({
                    ...prev,
                    [commentId]: response.user_vote
                }));
            }
        } finally {
            setVotingComments(prev => {
                const newSet = new Set(prev);
                newSet.delete(commentId);
                return newSet;
            });
        }
    };

    const handleDislikeComment = async (commentId: number) => {
        // Evitar múltiples clics simultáneos
        if (votingComments.has(commentId)) return;

        setVotingComments(prev => new Set([...prev, commentId]));

        try {
            const response = await PostService.giveDislikeComment(commentId, accessToken!);
            if (response) {
                // Actualiza el estado del comentario específico con los nuevos conteos de votos
                setPost(prevPost => prevPost ? {
                    ...prevPost,
                    comments: prevPost.comments?.map(comment =>
                        comment.id === commentId
                            ? {
                                ...comment,
                                vote_score: response.vote_score,
                                likes_count: response.likes_count,
                                dislikes_count: response.dislikes_count
                            }
                            : comment
                    )
                } : prevPost);

                // Actualiza el estado local del voto del usuario para este comentario
                setCommentVotes(prev => ({
                    ...prev,
                    [commentId]: response.user_vote
                }));
            }
        } finally {
            setVotingComments(prev => {
                const newSet = new Set(prev);
                newSet.delete(commentId);
                return newSet;
            });
        }
    };

    const handleSendComment = () => {
        router.push({
            pathname: "/comment-form",
            params: { postId: id }
        });
    };

    const confirmDeleteComment = (commentId?: number) => {
        if (!commentId) return;
        Alert.alert(
            'Confirmar eliminación',
            '¿Estás seguro de que quieres eliminar este comentario? Se ocultará su contenido.',
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Eliminar', style: 'destructive', onPress: () => handleDeleteComment(commentId) }
            ]
        );
    };

    const handleDeleteComment = async (commentId?: number) => {
        if (!commentId) return;
        try {
            const ok = await PostService.deleteComment(commentId, accessToken!);
            if (ok) {
                setPost(prevPost => prevPost ? {
                    ...prevPost,
                    comments: prevPost.comments?.map(c => c.id === commentId ? { ...c, content: '', is_deleted: true } : c)
                } : prevPost);
            } else {
                Alert.alert('Error', 'No se pudo eliminar el comentario. Revisa la conexión o reintenta.');
            }
        } catch (e) {
            console.error('Failed to delete comment', e);
            Alert.alert('Error', 'Ocurrió un error al eliminar el comentario. Comprueba la consola.');
        }
    };

    // Efecto para limpiar estados cuando cambia el ID del post
    useEffect(() => {
        // Resetear estados cuando cambia el post
        setPostVote(null);
        setCommentVotes({});
        setVotingPost(false);
        setVotingComments(new Set());
    }, [id]);

    const navigation = useNavigation();

    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => {
                if (!post) return null;
                // Mostrar el icono solo si el post pertenece al usuario actual
                try {
                    const currentId = Number(getUserId && getUserId());
                    if (post.author_id && Number(post.author_id) === currentId) {
                        return (
                            <TouchableOpacity
                                onPress={() => router.push({ pathname: '/post-form', params: { id: String(post.id), edit: 'true' } })}
                                style={{ marginRight: 12 }}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="pencil" size={22} color={buttonBackground} />
                            </TouchableOpacity>
                        );
                    }
                } catch (e) {
                    // ignore
                }
                return null;
            }
        });
    }, [navigation, post, getUserId, buttonBackground]);

    const fetchPost = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        try {
            const data = await PostService.getPostById(Number(id), accessToken!);
            setPost(data);

            // Inicializar el voto del post (siempre, incluso si es null)
            setPostVote(data?.user_vote || null);

            if (data?.comments) {
                const initialVotes: {[key: number]: string | null} = {};
                data.comments.forEach(comment => {
                    if (comment.id) {
                        initialVotes[comment.id] = comment.user_vote || null;
                    }
                });
                setCommentVotes(initialVotes);
            }
        } catch (error) {
            console.error("Error fetching post details:", error);
        } finally {
            setLoading(false);
        }
    }, [id, accessToken]);

    useEffect(() => {
        fetchPost();
    }, [fetchPost]);

    useFocusEffect(
        useCallback(() => {
            // Refresh when screen gains focus (e.g., after creating a comment)
            fetchPost();
        }, [fetchPost])
    );

    return (
        <LinearGradient
            colors={['rgba(213, 240, 219, 0.19)', backgroundColor]}
            style={[styles.container]}
        >
            {loading ? (
                <ActivityIndicator size="large" />
            ) : post ? (
                <>
                    <ScrollView style={styles.container}>
                        <View style={[styles.card, { backgroundColor: cardBackground, marginBottom: 16 }]}>
                            <ThemedText type="subtitle">{post.author} · {new Date(post.created_at!).toLocaleDateString()}</ThemedText>
                            <ThemedText type="title">{post.title}</ThemedText>
                            {post.image ? (
                                <Image source={{ uri: post.image }} style={styles.image} />
                            ) : null}
                            <ThemedText type="default">{post.content}</ThemedText>
                            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 12, paddingVertical: 8 }}>
                                <TouchableOpacity
                                    onPress={handleLikePost}
                                    style={{
                                        flexDirection: "row",
                                        alignItems: "center",
                                        marginRight: 8,
                                        opacity: votingPost ? 0.6 : 1,
                                        padding: 4,
                                        borderRadius: 16,
                                        backgroundColor: postVote === 'like' ? '#E8F5E8' : 'transparent'
                                    }}
                                    disabled={votingPost}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons
                                        name="arrow-up-circle"
                                        size={26}
                                        color={postVote === 'like' ? '#4CAF50' : buttonBackground}
                                    />
                                </TouchableOpacity>
                                <ThemedText style={{ marginLeft: 4, fontSize: 18, fontWeight: 'bold', minWidth: 30, textAlign: 'center' }}>
                                    {post.vote_score || 0}
                                </ThemedText>
                                <TouchableOpacity
                                    onPress={handleDislikePost}
                                    style={{
                                        flexDirection: "row",
                                        alignItems: "center",
                                        marginLeft: 8,
                                        opacity: votingPost ? 0.6 : 1,
                                        padding: 4,
                                        borderRadius: 16,
                                        backgroundColor: postVote === 'dislike' ? '#FFEBEE' : 'transparent'
                                    }}
                                    disabled={votingPost}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons
                                        name="arrow-down-circle"
                                        size={26}
                                        color={postVote === 'dislike' ? '#f44336' : buttonBackground}
                                    />
                                </TouchableOpacity>
                                {votingPost && (
                                    <ActivityIndicator size="small" color={buttonBackground} style={{ marginLeft: 12 }} />
                                )}
                            </View>
                        </View>
                        <View style={styles.comments}>
                        {post.comments?.map(comment => (
                            <View key={comment.id} style={[styles.card, { backgroundColor: cardBackground, marginBottom: 12 }]}>
                                <ThemedText type="subtitle">{comment.author} · {new Date(comment.created_at!).toLocaleDateString()}</ThemedText>
                                <ThemedText type="default">{comment.is_deleted ? 'Comentario eliminado' : (comment.content ?? '')}</ThemedText>
                                { !comment.is_deleted && (
                                <>
                                    <View style={{ position: 'absolute', right: 12, top: 12, flexDirection: 'row', alignItems: 'center' }}>
                                        {comment.author_id && Number(getUserId && getUserId()) === Number(comment.author_id) && (
                                            <>
                                                <TouchableOpacity onPress={() => router.push({ pathname: '/comment-form', params: { commentId: String(comment.id), postId: String(post.id), edit: 'true' } })} style={[styles.button, { marginRight: 6 }]} activeOpacity={0.7}>
                                                    <Ionicons name="pencil" size={24} color={buttonBackground} />
                                                </TouchableOpacity>
                                                <TouchableOpacity onPress={() => confirmDeleteComment(comment.id)} style={styles.button} activeOpacity={0.7}>
                                                    <Ionicons name="trash" size={24} color={buttonBackground} />
                                                </TouchableOpacity>
                                            </>
                                        )}
                                    </View>
                                    <View style={{ flexDirection: "row", alignItems: "center", marginTop: 12, paddingVertical: 4 }}>
                                        <View style={{ flexDirection: "row", alignItems: "center", marginLeft: "auto" }}>
                                            <TouchableOpacity
                                                onPress={() => handleLikeComment(comment.id!)}
                                                style={{
                                                    flexDirection: "row",
                                                    alignItems: "center",
                                                    marginRight: 6,
                                                    opacity: (votingComments.has(comment.id!) || comment.is_deleted) ? 0.6 : 1,
                                                    padding: 3,
                                                    borderRadius: 12,
                                                    backgroundColor: commentVotes[comment.id!] === 'like' ? '#E8F5E8' : 'transparent'
                                                }}
                                                disabled={votingComments.has(comment.id!) || comment.is_deleted}
                                                activeOpacity={0.7}
                                            >
                                                <Ionicons
                                                    name="arrow-up-circle"
                                                    size={22}
                                                    color={commentVotes[comment.id!] === 'like' ? '#4CAF50' : buttonBackground}
                                                />
                                            </TouchableOpacity>
                                            <ThemedText style={{ marginLeft: 4, fontSize: 14, fontWeight: '600', minWidth: 24, textAlign: 'center' }}>
                                                {comment.vote_score || 0}
                                            </ThemedText>
                                            <TouchableOpacity
                                                onPress={() => handleDislikeComment(comment.id!)}
                                                style={{
                                                    flexDirection: "row",
                                                    alignItems: "center",
                                                    marginLeft: 6,
                                                    opacity: (votingComments.has(comment.id!) || comment.is_deleted) ? 0.6 : 1,
                                                    padding: 3,
                                                    borderRadius: 12,
                                                    backgroundColor: commentVotes[comment.id!] === 'dislike' ? '#FFEBEE' : 'transparent'
                                                }}
                                                disabled={votingComments.has(comment.id!) || comment.is_deleted}
                                                activeOpacity={0.7}
                                            >
                                                <Ionicons
                                                    name="arrow-down-circle"
                                                    size={22}
                                                    color={commentVotes[comment.id!] === 'dislike' ? '#f44336' : buttonBackground}
                                                />
                                            </TouchableOpacity>
                                            {votingComments.has(comment.id!) && (
                                                <ActivityIndicator size="small" color={buttonBackground} style={{ marginLeft: 8 }} />
                                            )}
                                        </View>
                                    </View>
                                </>
                                )}
                            </View>
                        ))}
                        </View>
                    </ScrollView>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === "ios" ? "padding" : "height"}
                        keyboardVerticalOffset={80}
                        style={{ position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: cardBackground, padding: 8, flexDirection: "row", alignItems: "center", borderTopWidth: 1, borderColor: "#eee" }}
                    >
                        <TouchableOpacity
                            style={{ flex: 1, borderRadius: 5, paddingHorizontal: 16, paddingVertical: 8, marginRight: 8, backgroundColor: "#fff" }}
                            onPress={handleSendComment}
                            activeOpacity={1}
                        >
                            <ThemedText type="default" style={{ color: "#aaa" }}>Escribe un comentario...</ThemedText>
                        </TouchableOpacity>
                        <Ionicons name="send" size={25} color="#f3f3f3" />
                    </KeyboardAvoidingView>
                </>
            ) : (
                <ThemedText type="title">No post found.</ThemedText>
            )}
        </LinearGradient>
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
    comments: {
        flex: 1,
        paddingHorizontal: 8,
    },
    card: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    button: {
        padding: 4,
        marginLeft: 8,
    }
});