import React, { createContext, useContext, useEffect, useState } from "react";
import { UserService } from "@/services/userService";
import AsyncStorage from '@react-native-async-storage/async-storage';

type AuthContextType = {
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (username: string, email: string, password: string) => Promise<void>;
  getUserId: () => number | null;
  setTokens: (access: string, refresh: string) => void;
  accessToken: string | null;
  refreshToken: string | null;
};

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  login: async () => { },
  logout: async () => { },
  signup: async () => { },
  getUserId: () => null,
  setTokens: (access: string, refresh: string) => { },
  accessToken: null,
  refreshToken: null,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem("accessToken").then(token => {
      setAccessToken(token);
    });
    AsyncStorage.getItem("refreshToken").then(token => {
      setRefreshToken(token);
    });
  }, []);

  const login = async (email: string, password: string) => {
    const data = await UserService.login(email, password);
    await AsyncStorage.setItem('accessToken', data.access);
    await AsyncStorage.setItem('refreshToken', data.refresh);
    setAccessToken(data.access);
    setRefreshToken(data.refresh);
  };

  const setTokens = (access: string, refresh: string) => {
    AsyncStorage.setItem('accessToken', access);
    AsyncStorage.setItem('refreshToken', refresh);
    setAccessToken(access);
    setRefreshToken(refresh);
  };

  const signup = async (username: string, email: string, password: string) => {
    const data = await UserService.signup(username, email, password);
    await AsyncStorage.setItem('accessToken', data.access);
    await AsyncStorage.setItem('refreshToken', data.refresh);
    setAccessToken(data.access);
  };

  const logout = async () => {
    await AsyncStorage.removeItem("accessToken");
    setAccessToken(null);
  };

  const getUserId = () => {
    const token = accessToken;
    if (!token) return null;

    const payload = JSON.parse(atob(token.split('.')[1]));
    return typeof payload.user_id === "number" ? payload.user_id : Number(payload.user_id) || null;
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!accessToken,
        login,
        logout,
        signup,
        getUserId,
        setTokens,
        accessToken,
        refreshToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);