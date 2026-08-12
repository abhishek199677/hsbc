"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    $crisp: unknown[];
    CRISP_WEBSITE_ID: string;
  }
}

export default function CrispChat() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;

    const websiteId = process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID;
    if (!websiteId) return;

    window.$crisp = [];
    window.CRISP_WEBSITE_ID = websiteId;

    const s = document.createElement("script");
    s.src = "https://client.crisp.chat/l.js";
    s.async = true;
    document.head.appendChild(s);

    const setupInterval = setInterval(() => {
      if (typeof window.$crisp === "object" && typeof window.$crisp.push === "function") {
        window.$crisp.push(["set", "session:locale", "en"]);
        window.$crisp.push(["set", "appearance:theme", "dark"]);
        window.$crisp.push(["set", "appearance:color", "#4f46e5"]);
        try {
          const stored = localStorage.getItem("user");
          if (stored) {
            const user = JSON.parse(stored);
            if (user?.email) {
              window.$crisp.push(["set", "user:email", user.email]);
              if (user?.id) window.$crisp.push(["set", "user:avatar", ""]);
            }
          }
        } catch { /* noop */ }
        clearInterval(setupInterval);
      }
    }, 200);

    return () => clearInterval(setupInterval);
  }, []);

  return null;
}
