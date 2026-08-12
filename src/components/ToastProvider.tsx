"use client";

import { Toaster } from "react-hot-toast";

export default function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      duration={4000}
      toastOptions={{
        style: {
          background: "#312e81",
          color: "#fff",
          borderRadius: "0.5rem",
        },
        success: {
          style: {
            background: "#4f46e5",
          },
        },
        error: {
          style: {
            background: "#7c3aed",
          },
        },
      }}
    />
  );
}
