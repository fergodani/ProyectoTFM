import { PlantInfo } from "./PlantInfo";

export interface Garden {
    id: number;
    name: string;
    location?: string;
    created_at?: string;
    humidity?: string;
    sunlight_exposure?: string;
    owner?: number;
    user_plants?: UserPlant[];
}

export interface UserPlant {
    id: number;
    user_id: number;
    plant: PlantInfo;
    planting_date?: string;
    last_watered_date?: string;
    garden: Garden;
    garden_name?: string;
}