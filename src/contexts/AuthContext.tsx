"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  email: string;
  name: string | null;
  phone?: string | null;
  role?: string;
  organizationId?: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  primaryColor: string;
  accentColor: string;
  isGovernment: boolean;
  plan: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  organization: Organization | null;
  login: (token: string, user: User, organization: Organization) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check for stored auth data on mount
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    const storedOrg = localStorage.getItem("organization");

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    if (storedOrg) {
      try {
        setOrganization(JSON.parse(storedOrg));
      } catch {
        setOrganization(null);
      }
    }
    setIsLoading(false);
  }, []);

  const login = (newToken: string, newUser: User, newOrganization: Organization) => {
    setToken(newToken);
    setUser(newUser);
    setOrganization(newOrganization);
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(newUser));
    localStorage.setItem("organization", JSON.stringify(newOrganization));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setOrganization(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("organization");
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, token, organization, login, logout, isLoading }}>
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
