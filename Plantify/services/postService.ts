import { useAuth } from "@/hooks/useAuthContext";
import { Platform } from 'react-native';
import { Tasks, UserPlant } from "@/models/Plant";
import { PlantInfo, Prediction } from "@/models/PlantInfo";
import { PlantDetailTrefle, PlantTrefle } from "@/models/PlanTrefle";
import { Post, Comment, PostVoteResponse, CommentVoteResponse, VoteRequest, VoteType } from "@/models/Post";

const url = `${process.env.EXPO_PUBLIC_API_BASE_URL}/api`;

export const PostService = {
    getPostById: async (id: number, accessToken: string): Promise<Post | null> => {
        try {
            const response = await fetch(`${url}/posts/${id}`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            if (!response.ok) {
                throw new Error("Failed to fetch post");
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error("Error fetching post:", error);
            return null;
        }
    },

    createPost: async (post: Post, accessToken: string, imageUri?: string): Promise<Post | null> => {
        try {
            if (imageUri) {
                const formData = new FormData();
                formData.append('title', post.title as any);
                formData.append('content', post.content as any);
                formData.append('plant_id', String(post.plant_id) as any);

                if (Platform.OS === 'web') {
                    const res = await fetch(imageUri);
                    const blob = await res.blob();
                    formData.append('image', blob, 'photo.jpg');
                } else {
                    formData.append('image', {
                        uri: imageUri,
                        type: 'image/jpeg',
                        name: 'photo.jpg',
                    } as any);
                }

                const response = await fetch(`${url}/user-posts/`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                    body: formData,
                });

                if (!response.ok) {
                    throw new Error(`Failed to create post: ${response.status}`);
                }
                const data = await response.json();
                return data;
            } else {
                const response = await fetch(`${url}/user-posts/`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${accessToken}`,
                    },
                    body: JSON.stringify(post),
                });
                if (!response.ok) {
                    throw new Error("Failed to create post");
                }
                const data = await response.json();
                return data;
            }
        } catch (error) {
            console.error("Error creating post:", error);
            return null;
        }
    },

    createComment: async (comment: Comment, accessToken: string): Promise<Comment | null> => {
        try {
            const response = await fetch(`${url}/comments/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify(comment),
            });
            if (!response.ok) {
                throw new Error("Failed to create comment");
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error("Error creating comment:", error);
            return null;
        }
    },

    getCommentById: async (commentId: number, accessToken: string): Promise<Comment | null> => {
        try {
            const response = await fetch(`${url}/comments/${commentId}/`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                }
            });
            if (!response.ok) throw new Error('Failed to fetch comment');
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching comment:', error);
            return null;
        }
    },

    updateComment: async (commentId: number, comment: Partial<Comment>, accessToken: string): Promise<Comment | null> => {
        try {
            const response = await fetch(`${url}/comments/${commentId}/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify(comment),
            });
            if (!response.ok) {
                const text = await response.text().catch(() => '');
                throw new Error(`Failed to update comment: ${response.status} ${text}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error updating comment:', error);
            return null;
        }
    },

    // Función genérica para votar (like o dislike)
    votePost: async (postId: number, voteType: VoteType, accessToken: string): Promise<PostVoteResponse | null> => {
        try {
            const voteRequest: VoteRequest = { vote_type: voteType };
            
            const response = await fetch(`${url}/posts/${postId}/vote/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(voteRequest)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Vote failed: ${response.status} - ${errorData.error || 'Unknown error'}`);
            }

            const voteResponse: PostVoteResponse = await response.json();
            return voteResponse;
        } catch (error) {
            console.error('Error voting post:', error);
            return null;
        }
    },

    voteComment: async (commentId: number, voteType: VoteType, accessToken: string): Promise<CommentVoteResponse | null> => {
        try {
            const voteRequest: VoteRequest = { vote_type: voteType };

            const response = await fetch(`${url}/comments/${commentId}/vote/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(voteRequest)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Vote failed: ${response.status} - ${errorData.error || 'Unknown error'}`);
            }

            const voteResponse: CommentVoteResponse = await response.json();
            return voteResponse;
        } catch (error) {
            console.error('Error voting comment:', error);
            return null;
        }
    },

    // Función específica para dar like
    giveLikePost: async (postId: number, accessToken: string): Promise<PostVoteResponse | null> => {
        return PostService.votePost(postId, 'like', accessToken);
    },

    // Función específica para dar dislike
    giveDislikePost: async (postId: number, accessToken: string): Promise<PostVoteResponse | null> => {
        return PostService.votePost(postId, 'dislike', accessToken);
    },

    giveLikeComment: async (commentId: number, accessToken: string): Promise<CommentVoteResponse | null> => {
        return PostService.voteComment(commentId, 'like', accessToken);
    },

    // Función específica para dar dislike
    giveDislikeComment: async (commentId: number, accessToken: string): Promise<CommentVoteResponse | null> => {
        return PostService.voteComment(commentId, 'dislike', accessToken);
    },
    deleteComment: async (commentId: number, accessToken: string): Promise<boolean> => {
        try {
            const response = await fetch(`${url}/comments/${commentId}/`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                }
            });
            
            // Leer texto para evitar problemas con cuerpos vacíos en algunas plataformas
            let text = '';
            try {
                text = await response.text();
            } catch (e) {
                // ignore
            }

            const ok = response.status === 204 || response.status === 200 || response.ok;
            if (!ok) {
                console.error(`Delete comment failed: status=${response.status} text=${text}`);
            } else {
                console.log(`Delete comment success: status=${response.status} text=${text}`);
            }
            return ok;
        } catch (error) {
            console.error('Error deleting comment (network):', error);
            return false;
        }
    }
,
    updatePost: async (postId: number, post: Partial<Post>, accessToken: string, imageUri?: string): Promise<Post | null> => {
        try {
            if (imageUri) {
                const formData = new FormData();
                if (post.title !== undefined) formData.append('title', post.title as any);
                if (post.content !== undefined) formData.append('content', post.content as any);
                if (post.plant_id !== undefined) formData.append('plant_id', String(post.plant_id) as any);

                if (Platform.OS === 'web') {
                    const res = await fetch(imageUri);
                    const blob = await res.blob();
                    formData.append('image', blob, 'photo.jpg');
                } else {
                    formData.append('image', {
                        uri: imageUri,
                        type: 'image/jpeg',
                        name: 'photo.jpg',
                    } as any);
                }

                const response = await fetch(`${url}/posts/${postId}/`, {
                    method: 'PATCH',
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                    body: formData,
                });

                if (!response.ok) {
                    throw new Error(`Failed to update post: ${response.status}`);
                }
                const data = await response.json();
                return data;
            } else {
                const response = await fetch(`${url}/posts/${postId}/`, {
                    method: 'PATCH',
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${accessToken}`,
                    },
                    body: JSON.stringify(post),
                });
                if (!response.ok) {
                    throw new Error("Failed to update post");
                }
                const data = await response.json();
                return data;
            }
        } catch (error) {
            console.error("Error updating post:", error);
            return null;
        }
    }
};
