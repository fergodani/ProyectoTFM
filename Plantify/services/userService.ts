import { User } from "@/models/User";

const url = process.env.EXPO_PUBLIC_API_BASE_URL;

export const UserService = {

  login: async (email: string, password: string): Promise<any> => {
    try {
        const response = await fetch(`${url}/api/login/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: email, password }),
        });
        const data = await response.json();
        if (response.ok && data.access) {
            console.log("Login successful", data);
            return data; // Return the user data or token as needed
        } else {
            throw new Error('Usuario o contraseña incorrectos');
        }
    } catch (e) {
        throw new Error('Error al iniciar sesión: ' + e);
    }
  },

  refreshToken: async (refreshToken: string): Promise<any> => {
    try {
      const response = await fetch(`${url}/api/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refreshToken }),
      });
      const data = await response.json();
      if (response.ok && data.access) {
        console.log("Token refreshed successfully", data);
        return data;
      } else {
        throw new Error('Error refreshing tokens');
      }
    } catch (e) {
      throw new Error('Error refreshing tokens: ' + e);
    }
  },

  signup: async (username: string, email: string, password: string): Promise<any> => {
    try {
        console.log("Attempting signup for:", email);
        const response = await fetch(`${url}/api/register/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password }),
        });
        const data = await response.json();
        if (response.ok && data.access) {
            console.log("Signup successful", data);
            return data; // Return the user data or token as needed
        } else {
            console.error("Signup failed", data);
            throw new Error('Error en el registro');
        }
    } catch (e) {
        console.error('Error al registrarse:', e);
        throw new Error('Error al registrarse: ' + e);
    }
  },

  getCurrentUser: async (accessToken: string): Promise<User | null> => {
    try {
      const response = await fetch(`${url}/api/user/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      if (response.status === 401) {
        throw new Error('Unauthorized');
      }
      if (!response.ok) {
        throw new Error('Error fetching current user');
      }
      const data = await response.json();
      return data;
    } catch (e) {
      throw e;
    }
  },

  updateUser: async (userData: User, accessToken: string): Promise<User> => {
    try {
      const response = await fetch(`${url}/api/user/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(userData),
      });
      if (response.status === 401) {
        throw new Error('Unauthorized');
      }
      if (!response.ok) {
        throw new Error('Error updating user');
      }
      const data = await response.json();
      return data;
    } catch (e) {
      throw e;
    }
  },

  changePassword: async (currentPassword: string, newPassword: string, confirmPassword: string, accessToken: string): Promise<void> => {
    try {
      const response = await fetch(`${url}/api/user/password/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword, confirm_password: confirmPassword }),
      });
      if (response.status === 401) {
        throw new Error('Unauthorized');
      }
     
      const data = await response.json();
       console.log(data)
      return data.message;
    } catch (e) {
      throw e;
    }
  },
};
