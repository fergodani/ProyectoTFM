export interface Pest {
	id: number;
	href: string;
	image: string;
	local_image?: string;
	name: string;
	solutions_count: number;
}

export interface Sections {
	title: string;
	subtitle?: string;
	paragraphs: string[];
	bullets: string[];
}

export interface PestDetail {
	name: string;
	scientific_name: string;
	image: string;
	sections: Sections[];
}