export interface PestTextItem {
	subtitle: string;
	description: string;
}

export interface PestImage {
	license: number;
	license_name: string;
	license_url: string;
	original_url: string;
	regular_url: string;
	medium_url: string;
	small_url: string;
	thumbnail: string;
}

export interface Pest {
	id: number;
	common_name: string;
	scientific_name: string;
	other_name: string | null;
	family: string | null;
	description: PestTextItem[];
	solution: PestTextItem[];
	host: string[];
	images: PestImage[];
}

export interface PestParsed {
	id: number;
	href: string;
	image: string;
	name: string;
	solutions_count: number;
}

export interface SectionParsed {
	title: string;
	subtitle?: string;
	paragraphs: string[];
	bullets: string[];
}

export interface PestDetailParsed {
	name: string;
	scientific_name: string;
	image: string;
	sections: SectionParsed[];
}