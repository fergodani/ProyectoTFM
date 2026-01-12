import { useAuth } from "@/hooks/useAuthContext";
import { Platform } from "react-native";
import { PerenualPlant, Tasks, UserPlant } from "@/models/Plant";
import { PlantInfo, Prediction } from "@/models/PlantInfo";
import { PlantDetailTrefle, PlantTrefle } from "@/models/PlanTrefle";
const url = process.env.EXPO_PUBLIC_API_BASE_URL;

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
      console.log(response.status);
      if (response.status === 401) {
        throw new Error("Unauthorized");
      }
      if (response.status === 400) {
        throw new Error("Error creating plant: Bad Requestr");
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
      // Do not send `custom_image` field as JSON (it may be a local URI)
      const payload: any = { ...userPlant } as any;
      if (payload.custom_image) {
        delete payload.custom_image;
      }
      if (payload.image) {
        delete payload.image;
      }

      const response = await fetch(`${url}/api/userplant/${userPlant.id}/`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
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

  uploadPlantImage: async (plantId: number, photoUri: string, accessToken: string): Promise<UserPlant | null> => {
    const formData = new FormData();
    if (Platform.OS === 'web') {
      try {
        const res = await fetch(photoUri);
        const blob = await res.blob();
        formData.append('custom_image', blob, 'photo.jpg');
      } catch (e) {
        console.error('Failed to prepare image blob for web:', e);
        throw e;
      }
    } else {
      formData.append('custom_image', {
        uri: photoUri,
        type: 'image/jpeg',
        name: 'photo.jpg',
      } as any);
    }

    try {
      const response = await fetch(`${url}/api/userplant/${plantId}/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        body: formData,
      });

      if (response.status === 401) {
        throw new Error('Unauthorized');
      }
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Error uploading image: ${response.status} ${text}`);
      }
      const json = await response.json();
      return json || null;
    } catch (error) {
      throw error;
    }
  },

  /*
  getPlantInfoList: async (page: number = 1, filter: string, type: string): Promise<PlantInfo[]> => {
    try {
      let response;
      if (filter) {
        response = await fetch(`${url}/api/plantinfo?format=json&page=${page}&name=${encodeURIComponent(filter)}`);
      } else if (type) {
        response = await fetch(`${url}/api/plantinfo?format=json&page=${page}&type=${encodeURIComponent(type)}`);
      }else {
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
  */
  getPlantInfoList: async (page: number = 1, filter: string, type: string): Promise<PlantInfo[]> => {
    try {
      let response;
      if (filter) {
        response = await fetch(`${url}/api/perenual/plants?format=json&page=${page}&q=${encodeURIComponent(filter)}`);
      } else if (type) {
        response = await fetch(`${url}/api/perenual/plants?format=json&page=${page}&type=${encodeURIComponent(type)}`);
      } else {
        response = await fetch(`${url}/api/perenual/plants?format=json&page=${page}`);
      }

      if (!response.ok) {
        throw new Error("Error fetching plants");
      }

      const json = await response.json();
      return json.data || [];
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

  /*
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
  */
  getPlantInfoById: async (id: number): Promise<PlantInfo> => {
    try {
      const response = await fetch(`${url}/api/perenual/plants/${id}?format=json`);
      if (!response.ok) {
        throw new Error("Error fetching plant by ID");
      }
      const json = await response.json();
      return json || {};
    } catch (error) {
      throw error;
    }
  },

  getTasks: async (accessToken: string): Promise<Tasks> => {
    try {
      const response = await fetch(`${url}/api/user-tasks/`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        }
      });
      if (response.status === 401) {
        throw new Error("Unauthorized");
      }
      if (!response.ok) {
        throw new Error("Error fetching tasks");
      }
      const json = await response.json();
      return json || [];
    } catch (error) {
      throw error;
    }
  },

  sendPhoto: async (photoUri: string, isPest: boolean = false): Promise<Prediction> => {
    const formData = new FormData();

    // En web, FormData necesita un Blob/File real. En móvil, RN usa el objeto con uri.
    if (Platform.OS === 'web') {
      try {
        let blob: Blob;
        if (photoUri.startsWith('data:')) {
          // Convertir data URL a Blob
          const [header, base64] = photoUri.split(',');
          const mimeMatch = header.match(/data:(.*);base64/);
          const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
          const binary = atob(base64);
          const array = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) {
            array[i] = binary.charCodeAt(i);
          }
          blob = new Blob([array], { type: mime });
        } else {
          // blob: or http(s)://
          const res = await fetch(photoUri);
          blob = await res.blob();
        }
        formData.append('image', blob, 'photo.jpg');
      } catch (e) {
        console.error('Failed to prepare image blob for web:', e);
        return {} as Prediction;
      }
    } else {
      formData.append('image', {
        uri: photoUri,
        type: 'image/jpeg',
        name: 'photo.jpg',
      } as any);
    }
    try {
      let response;
      if (isPest) {
        response = await fetch(`${url}/api/predict/pest/`, {
          method: 'POST',
          body: formData,
        });
      } else {
        response = await fetch(`${url}/api/predict/`, {
          method: 'POST',
          body: formData,
        });
      }

      const data = await response.json();
      console.log('Prediction result:', data);
      return data || {};
      // Handle the prediction result as needed
    } catch (error) {
      console.error('Error sending photo:', error);
      return {} as Prediction;
    }
  }
}