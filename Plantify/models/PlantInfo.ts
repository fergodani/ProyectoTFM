import { Post } from "./Post";

type Season = "spring" | "summer" | "fall" | "winter";
export interface WateringPeriod {
    value: string;
    unit: string;
    season: Season;
}

export interface PlantInfo {
    id: number;
    posts?: Post[];
    care_level: string | null;
    cones: string | null;
    cuisine: string | null;
    cycle: string | null;
    drought_tolerant: string | null;
    edible_fruit: string | null;
    edible_leaf: string | null;
    flowering_season: string | null;
    flowers: string | null;
    fruiting_season: string | null;
    fruits: string | null;
    growth_rate: string | null;
    harvest_method: string | null;
    harvest_season: string | null;
    indoor: string | null;
    invasive: string | null;
    leaf: string | null;
    maintenance: string | null;
    medicinal: string | null;
    pest_susceptibility: string | null;
    poisonous_to_humans: string | null;
    poisonous_to_pets: string | null;
    pruning_month: string | null;
    rare: string | null;
    salt_tolerant: string | null;
    soil: string | null;
    sunlight: string | null;
    thorny: string | null;
    tropical: string | null;
    watering: string | null;
    sun: string | null;
    edible: string | null;
    hardiness: string | null;
    image: string | null;
    common_name: string | null;
    scientific_name: string | null;
    watering_long: string | null;
    pruning: string | null;
    watering_period: WateringPeriod[];
    type: string;
}

export interface Prediction {
    plant_id: number;
    class: string;
    probabilities: number[];
}