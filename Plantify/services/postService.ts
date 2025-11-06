import { useAuth } from "@/hooks/useAuthContext";
import { Tasks, UserPlant } from "@/models/Plant";
import { PlantInfo, Prediction } from "@/models/PlantInfo";
import { PlantDetailTrefle, PlantTrefle } from "@/models/PlanTrefle";
import { Post, Comment, PostVoteResponse, CommentVoteResponse, VoteRequest, VoteType } from "@/models/Post";

const url = "http://192.168.1.143:8000/api";

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

    createPost: async (post: Post, accessToken: string): Promise<Post | null> => {
        try {
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
};
