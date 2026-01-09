import AsyncStorage from '@react-native-async-storage/async-storage';

const TIME_KEY = 'USER_NOTIFICATION_TIME';

export const StorageService = {
  /**
   * Guarda la hora seleccionada por el usuario
   */
  async saveNotificationTime(hour: number): Promise<void> {
    try {
      // Guardamos solo la fecha en formato ISO string
      await AsyncStorage.setItem(TIME_KEY, hour.toString());
      console.log('Hora guardada:', hour);
    } catch (e) {
      console.error('Error guardando la hora', e);
    }
  },

  /**
   * Recupera la hora guardada.
   * Si no existe (es la primera vez), devuelve una por defecto (ej: 9:00 AM).
   */
  async getNotificationTime(): Promise<number> {
    try {
      const storedHour = await AsyncStorage.getItem(TIME_KEY);
      
      if (storedHour) {
        return Number.parseInt(storedHour, 10);
      }
      
      // Valor por defecto: Hoy a las 9:00 AM
      const defaultTime = 9;
      return defaultTime;
      
    } catch (e) {
      console.error('Error leyendo la hora', e);
      return 9; // Fallback seguro
    }
  }
};