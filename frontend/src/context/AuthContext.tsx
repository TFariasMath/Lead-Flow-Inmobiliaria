/**
 * Lead Flow - Auth Context
 * ========================
 * Maneja autenticación JWT, almacenamiento en localStorage,
 * y provee el token a toda la aplicación vía React Context.
 */

"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { login as apiLogin, refreshToken as apiRefresh, type TokenResponse } from "@/lib/api";

interface AuthUser {
  username: string;
  isStaff: boolean;
  groups: string[];
  permissions: string[];
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  login: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Decodificar JWT para extraer info del usuario
  const decodeToken = useCallback((accessToken: string): AuthUser | null => {
    try {
      const payload = JSON.parse(atob(accessToken.split(".")[1]));
      return {
        username: payload.username || payload.user_id?.toString() || "user",
        isStaff: payload.is_staff || false,
        groups: payload.groups || [],
        permissions: payload.permissions || [],
      };
    } catch {
      return null;
    }
  }, []);

  // Cargar sesión desde localStorage al montar
  useEffect(() => {
    const stored = localStorage.getItem("leadflow_auth");
    if (stored) {
      try {
        const { access, refresh } = JSON.parse(stored);
        // Intentar refrescar el token
        apiRefresh(refresh)
          .then(({ access: newAccess }) => {
            setToken(newAccess);
            setUser(decodeToken(newAccess));
            localStorage.setItem(
              "leadflow_auth",
              JSON.stringify({ access: newAccess, refresh })
            );
          })
          .catch(() => {
            localStorage.removeItem("leadflow_auth");
          })
          .finally(() => setIsLoading(false));
      } catch {
        localStorage.removeItem("leadflow_auth");
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, [decodeToken]);

  const login = async (username: string, password: string) => {
    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();
    const data: TokenResponse = await apiLogin(trimmedUsername, trimmedPassword);
    setToken(data.access);
    setUser(decodeToken(data.access));
    localStorage.setItem("leadflow_auth", JSON.stringify(data));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("leadflow_auth");
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
