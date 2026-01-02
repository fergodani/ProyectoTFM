import { Post } from "./Post";

type Season = "spring" | "summer" | "fall" | "winter";
export interface WateringPeriod {
    value: string;
    unit: string;
}
/*
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
*/
interface Dimension {
    type: string;
    min_value: number;
    max_value: number;
    unit: string;
}

interface Hardiness {
    min: string;
    max: string;
}

interface HardinessLocation {
    full_url: string;
    full_iframe: string;
}

interface WateringGeneralBenchmark {
    value: string;
    unit: string;
}

interface PlantAnatomy {
    part: string;
    color: string[];
}

interface PruningCount {
    amount: number;
    interval: string;
}

interface DefaultImage {
    license: number;
    license_name: string;
    license_url: string;
    original_url: string;
    regular_url: string;
    medium_url: string;
    small_url: string;
    thumbnail: string;
}

interface CareGuideSection {
    id: number;
    type: string;
    description: string;
}

interface CareGuideData {
    id: number;
    species_id: number;
    common_name: string;
    scientific_name: string[];
    section: CareGuideSection[];
}

interface CareGuides {
    data: CareGuideData[];
    to: number;
    per_page: number;
    current_page: number;
    from: number;
    last_page: number;
    total: number;
}

export interface PlantInfo {
    id: number;
    common_name: string;
    scientific_name: string[];
    other_name: string[];
    family: string | null;
    hybrid: string | null;
    authority: string | null;
    subspecies: string | null;
    cultivar: string | null;
    variety: string | null;
    species_epithet: string | null;
    genus: string;
    origin: string[];
    type: string;
    dimensions: Dimension[];
    cycle: string;
    attracts: string[];
    propagation: string[];
    hardiness: Hardiness;
    hardiness_location: HardinessLocation;
    watering: string;
    watering_general_benchmark: WateringPeriod;
    plant_anatomy: PlantAnatomy[];
    sunlight: string[];
    pruning_month: string[];
    pruning_count: PruningCount;
    seeds: boolean;
    maintenance: string | null;
    care_guides: CareGuides;
    soil: string[];
    growth_rate: string;
    drought_tolerant: boolean;
    salt_tolerant: boolean;
    thorny: boolean;
    invasive: boolean;
    tropical: boolean;
    indoor: boolean;
    care_level: string;
    pest_susceptibility: string[];
    flowers: boolean;
    flowering_season: string | null;
    cones: boolean;
    fruits: boolean;
    edible_fruit: boolean;
    harvest_season: string | null;
    leaf: boolean;
    edible_leaf: boolean;
    cuisine: boolean;
    medicinal: boolean;
    poisonous_to_humans: boolean;
    poisonous_to_pets: boolean;
    description: string;
    default_image: DefaultImage;
    other_images: string;
    xWateringQuality: string;
    xWateringPeriod: string;
    xWateringAvgVolumeRequirement: string;
    xWateringDepthRequirement: string;
    xWateringBasedTemperature: string;
    xWateringPhLevel: string;
    xSunlightDuration: string;
    xTemperatureTolence: string;
    xPlantSpacingRequirement: string;
    pruning: string;
    sunlight_long: string;
    watering_long: string;
    posts?: Post[];
}

export interface Prediction {
    plant_id: number;
    class: string;
    probabilities: number[];
}