"use client";

import { createContext, useContext, useSyncExternalStore, ReactNode } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  email: string;
  name: string | null;
  phone?: string | null;
  role?: string;
  organizationId?: string;
  emailVerified?: boolean;
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

function subscribeToStorage(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

function subscribeNever() {
  return () => {};
}

const cache = new Map<string, { raw: string | null; value: unknown }>();

function readStored<T>(key: string, parse: (raw: string) => T): T | null {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(key);
  } catch {
    return null;
  }
  const cached = cache.get(key);
  if (cached && cached.raw === raw) return cached.value as T | null;
  let value: T | null = null;
  if (raw !== null) {
    try {
      value = parse(raw);
    } catch {
      value = null;
    }
  }
  cache.set(key, { raw, value });
  return value;
}

function useStoredState<T>(key: string, parse: (raw: string) => T): T | null {
  return useSyncExternalStore(
    subscribeToStorage,
    () => readStored<T>(key, parse),
    () => null
  );
}

function useHydrated() {
  return useSyncExternalStore(subscribeNever, () => true, () => false);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const user = useStoredState<User>("user", (raw) => JSON.parse(raw));
  const token = useStoredState<string>("token", (raw) => raw);
  const organization = useStoredState<Organization>("organization", (raw) => JSON.parse(raw));
  const isLoading = !useHydrated();

  const login = (_newToken: string, newUser: User, newOrganization: Organization) => {
    // The real session is held in an HttpOnly cookie and is not available to JavaScript.
    localStorage.setItem("token", "cookie-session");
    localStorage.setItem("user", JSON.stringify(newUser));
    localStorage.setItem("organization", JSON.stringify(newOrganization));
  };

  const logout = () => {
    void fetch("/api/auth/logout", { method: "POST" });
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("organization");
    if ("caches" in window) void caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key))));
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
