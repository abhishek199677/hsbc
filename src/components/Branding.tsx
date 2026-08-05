"use client";

import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function Branding() {
  const { organization } = useAuth();

  useEffect(() => {
    const root = document.documentElement;
    if (organization?.primaryColor) {
      root.style.setProperty("--primary", organization.primaryColor);
    }
    if (organization?.accentColor) {
      root.style.setProperty("--primary-dark", organization.accentColor);
    }
    if (organization?.name) {
      document.title = `${organization.name} | AI-Powered Talent Screening`;
    }
  }, [organization]);

  return null;
}
