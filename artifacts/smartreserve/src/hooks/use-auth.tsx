import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { setAuthTokenGetter } from "@workspace/api-client-react";

interface AuthContextType {
  token: string | null;
  setToken: (token: string | null) => void;
  isAuthenticated: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => {
    return localStorage.getItem("smartreserve_token");
  });

  const setToken = (newToken: string | null) => {
    if (newToken) {
      localStorage.setItem("smartreserve_token", newToken);
    } else {
      localStorage.removeItem("smartreserve_token");
    }
    setTokenState(newToken);
  };

  const logout = () => {
    setToken(null);
  };

  useEffect(() => {
    // Configure the API client to use this token
    setAuthTokenGetter(() => localStorage.getItem("smartreserve_token"));
  }, []);

  return (
    <AuthContext.Provider value={{ token, setToken, isAuthenticated: !!token, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
