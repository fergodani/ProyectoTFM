import { useAuth } from "@/hooks/useAuthContext";
import { Tasks, UserPlant } from "@/models/Plant";
import { PlantInfo, Prediction } from "@/models/PlantInfo";
import { PlantDetailTrefle, PlantTrefle } from "@/models/PlanTrefle";
import { Post } from "@/models/Post";

const url = "http://192.168.1.53:8000/api";

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
};