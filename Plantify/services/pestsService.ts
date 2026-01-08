import { PestDetailParsed, PestParsed } from "@/models/Pest";

const url = process.env.EXPO_PUBLIC_API_BASE_URL;

export const PestsService = {
    getAllPests: async (page: number = 1, q: string): Promise<PestParsed[]> => {
        try {
            let response;
            if (q) {
                response = await fetch(`${url}/api/perenual/pests?format=json&page=${page}&q=${encodeURIComponent(q)}`);
            } else {
                response = await fetch(`${url}/api/perenual/pests?format=json&page=${page}`);
            }

            if (!response.ok) {
                throw new Error("Error fetching plants");
            }

            const json = await response.json();
            return json || [];
        } catch (error) {
            throw error;
        }
    },

    getPestDetails: async (pestId: string): Promise<PestDetailParsed> => {
        try {
            const response = await fetch(`${url}/api/perenual/pests/${pestId}/?format=json`);
            if (!response.ok) {
                throw new Error("Error fetching pest details");
            }
            const json = await response.json();
            return json || null;
        } catch (error) {
            throw error;
        }
    },
};