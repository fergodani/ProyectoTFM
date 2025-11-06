import { Garden, GardenBySuitability } from '@/models/Plant';

const API_URL = 'http://192.168.1.143:8000/api/gardens/'; // Cambia la URL según tu configuración

const mockGardens: Garden[] = [
  { id: 1, name: 'Backyard Garden', location: 'Madrid, España', created_at: '2023-01-01' },
  { id: 2, name: 'Frontyard Garden', location: 'Barcelona, España', created_at: '2023-02-15' },
  { id: 3, name: 'Park Garden', location: 'Valencia, España', created_at: '2023-03-10' },
  { id: 4, name: 'Botanical Garden', location: 'Sevilla, España', created_at: '2023-04-20' },
];

const GardensService = {
  getAllGardens: async (accessToken: string): Promise<Garden[]> => {
    try {
      const response = await fetch(`${API_URL}`, {
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

  getGardensName: async (accessToken: string): Promise<Garden[]> => {
    try {
      const response = await fetch(`${API_URL}simple/`, {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        }
      });
      if (response.status === 401) {
        throw new Error("Unauthorized");
      }
      if (!response.ok) {
        throw new Error("Error fetching gardens");
      }
      const json = await response.json();
      return json || [];
    } catch (error) {
      throw error;
    }
  },

  getGardensBySuitability: async (plantId: number, accessToken: string): Promise<GardenBySuitability[]> => {
    try {
      const response = await fetch(`${API_URL}suitability/?plant_id=${plantId}`, {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        }
      });
      if (response.status === 401) {
        throw new Error("Unauthorized");
      }
      if (!response.ok) {
        throw new Error("Error fetching gardens");
      }
      const json = await response.json();
      return json || [];
    } catch (error) {
      throw error;
    }
  },

  createGarden: async (garden: any, accessToken: string): Promise<Garden> => {
    try {
      const response = await fetch(`${API_URL}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`
        },
        body: JSON.stringify(garden)
      });
      if (response.status === 401) {
        throw new Error("Unauthorized");
      }
      if (!response.ok) {
        throw new Error("Error creating garden");
      }
      const json = await response.json();
      return json;
    } catch (error) {
      throw error;
    }
  },

  getGardenById: async (id: number): Promise<Garden> => {
    try {
      const response = await fetch(`${API_URL}${id}/`);
      if (!response.ok) {
        throw new Error("Error fetching garden by ID");
      }
      const json = await response.json();
      return json || {};
    } catch (error) {
      throw error;
    }
  },

  updateGarden: async (garden: Garden, accessToken: string): Promise<Garden> => {
    try {
      const response = await fetch(`${API_URL}${garden.id}/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`
        },
        body: JSON.stringify(garden)
      });
      if (response.status === 401) {
        throw new Error("Unauthorized");
      }
      if (!response.ok) {
        throw new Error("Error updating garden");
      }
      const json = await response.json();
      return json;
    } catch (error) {
      throw error;
    }
  },


  /*
// Obtener todos los jardines
getAllGardens: async (): Promise<Garden[]> => {
  const response = await axios.get(API_URL);
  return response.data;
},

// Obtener un jardín por su ID
getGardenById: async (id: number): Promise<Garden> => {
  const response = await axios.get(`${API_URL}${id}/`);
  return response.data;
},

// Crear un nuevo jardín
createGarden: async (garden: Omit<Garden, 'id' | 'created_at'>): Promise<Garden> => {
  const response = await axios.post(API_URL, garden);
  return response.data;
},

// Actualizar un jardín existente
updateGarden: async (id: number, garden: Partial<Omit<Garden, 'created_at'>>): Promise<Garden> => {
  const response = await axios.put(`${API_URL}${id}/`, garden);
  return response.data;
},

// Eliminar un jardín
deleteGarden: async (id: number): Promise<void> => {
  await axios.delete(`${API_URL}${id}/`);
},
*/

  getMockedGardens: (): Garden[] => {
    return mockGardens;
  },
};

export default GardensService;