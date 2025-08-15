import { PlantInfo } from "./PlantInfo";

export interface Garden {
    id: number;
    name: string;
    location?: string;
    created_at?: string;
    humidity?: string;
    sunlight_exposure?: string;
    owner?: number;
    air?: boolean;
    user_plants?: UserPlant[];
}

export interface UserPlant {
    id: number;
    plant_id: number;
    user_id: number;
    plant: PlantInfo;
    planting_date?: string;
    last_watered_date?: string;
    garden?: Garden | number;
    garden_name?: string;
    custom_name?: string;
    height?: number;
    age?: string;
    pruning_time?: number;
    pruning_time_unit?: string;
    sprayed_time?: number;
    sprayed_unit?: string;
    rotation_time?: number;
    rotation_unit?: string;
    pot_type?: string;
    pot_size?: number;
    drainage?: string;
}
