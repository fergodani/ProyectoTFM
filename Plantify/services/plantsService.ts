import { useAuth } from "@/hooks/useAuthContext";
import { UserPlant } from "@/models/Plant";
import { PlantInfo } from "@/models/PlantInfo";
import { PlantDetailTrefle, PlantTrefle } from "@/models/PlanTrefle";

const url = "http://192.168.1.48:8000"

export const PlantService = {
  getAllPlants: async (accessToken: string): Promise<UserPlant[]> => {
    try {
      const response = await fetch(`${url}/api/userplant`, {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        }
      });
      if (response.status === 401) {
        throw new Error("Unauthorized");
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

  getUserPlantById: async (id: number, accessToken: string): Promise<UserPlant | null> => {
    try {
      const response = await fetch(`${url}/api/userplant/${id}`, {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        }
      });
      if (response.status === 401) {
        throw new Error("Unauthorized");
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

  getPlantsByGarden: async (gardenId: number, accessToken: string): Promise<UserPlant[]> => {
    try {
      const response = await fetch(`${url}/api/userplant?gardenId=${gardenId}`, {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        }
      });
      if (response.status === 401) {
        throw new Error("Unauthorized");
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

  createPlant: async (newPlant: any, accessToken: string): Promise<UserPlant> => {
    try {
      const response = await fetch(`${url}/api/userplant/`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(newPlant)
      });
      if (response.status === 401) {
        throw new Error("Unauthorized");
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
  /*
    updatePlant: async (id: number, updatedData: Partial<UserPlant>): Promise<PlanUserPlantt> => {
      
    },
  */
  deletePlant: async (id: number, accessToken: string) => {
    try {
      const response = await fetch(`${url}/api/userplant/${id}/`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
        }
      });
      // Si el backend devuelve 204, no hay contenido
      if (response.status === 204 || response.status === 200) {
        return true;
      }
      if (response.status === 401) {
        throw new Error("Unauthorized");
      }
      if (!response.ok) {
        throw new Error("Error deleting plant");
      }
      console.log("plant deleted")
      return response.ok;
    } catch (error) {
      throw error;
    }
  },

  putPlant: async (userPlant: UserPlant, accessToken: string): Promise<UserPlant | null> => {
    try {
      const response = await fetch(`${url}/api/userplant/${userPlant.id}/`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(userPlant)
      });
      if (response.status === 401) {
        throw new Error("Unauthorized");
      }
      if (!response.ok) {
        throw new Error("Error updating plant");
      }
      const json = await response.json();
      return json || null;
    } catch (error) {
      throw error;
    }
  },

  getPlantInfoList: async (page: number = 1, filter: string): Promise<PlantInfo[]> => {
    try {
      let response;
      if (filter) {
        response = await fetch(`${url}/api/plantinfo?format=json&page=${page}&name=${encodeURIComponent(filter)}`);
      } else {
        response = await fetch(`${url}/api/plantinfo?format=json&page=${page}`);
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

  getTreflePlantById: async (id: number): Promise<PlantDetailTrefle> => {
    try {
      const response = await fetch(`${url}/api/trefle/plant?id=${id}`);
      if (!response.ok) {
        throw new Error("Error fetching plant by ID");
      }
      const json = await response.json();
      return json || {};
    } catch (error) {
      throw error;
    }
  },

  getPlantInfoById: async (id: number): Promise<PlantInfo> => {
    try {
      const response = await fetch(`${url}/api/plantinfo/${id}?format=json`);
      if (!response.ok) {
        throw new Error("Error fetching plant by ID");
      }
      const json = await response.json();
      return json || {};
    } catch (error) {
      throw error;
    }
  },
};
