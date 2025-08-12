export interface PlantTrefle {
  id: number;
  common_name: string | null;
  slug: string;
  scientific_name: string;
  year: number;
  bibliography: string;
  author: string;
  status: string;
  rank: string;
  family_common_name: string | null;
  genus_id: number;
  image_url: string | null;
  synonyms: string[];
  genus: string;
  family: string;
}

export interface PlantDetailTrefle {
  data: {
    id: number;
    common_name: string | null;
    slug: string;
    scientific_name: string;
    main_species_id: number;
    image_url: string | null;
    year: number;
    bibliography: string;
    author: string;
    family_common_name: string | null;
    genus_id: number;
    observations: string;
    vegetable: boolean;
    links: {
      self: string;
      species: string;
      genus: string;
    };
    genus: {
      id: number;
      name: string;
      slug: string;
      links: {
        self: string;
        plants: string;
        species: string;
        family: string;
      };
    };
    family: {
      id: number;
      name: string;
      common_name: string | null;
      slug: string;
      links: {
        self: string;
        division_order: string | null;
        genus: string;
      };
    };
    subspecies: any[];
    varieties: any[];
    hybrids: any[];
    forms: any[];
    subvarieties: any[];
  };
  meta: {
    last_modified: string;
  };
  sunlight_info: string;
  pruning_info: string;
  watering_info: string;
}