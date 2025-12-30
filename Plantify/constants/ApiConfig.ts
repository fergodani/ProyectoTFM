import { API_BASE_URL } from '@env';

// Obtener la URL base de la API desde las variables de entorno
// Fallback a la IP actual si no está definida
const BASE_URL = API_BASE_URL || 'http://192.168.1.53:8000';

export const API_CONFIG = {
  BASE_URL: BASE_URL,
  ENDPOINTS: {
    GARDENS: `${BASE_URL}/api/gardens/`,
    PLANTS: `${BASE_URL}/api/plants/`,
    POSTS: `${BASE_URL}/api/posts/`,
    AUTH: {
      LOGIN: `${BASE_URL}/api/login/`,
      REGISTER: `${BASE_URL}/api/register/`
    },
    WEATHER: `${BASE_URL}/api/weather/`,
    RECOMMENDATIONS: `${BASE_URL}/api/recommendations/`
  }
};
