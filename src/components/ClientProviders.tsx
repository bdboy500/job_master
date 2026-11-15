"use client";

import React, { useEffect } from "react";
import { AuthProvider } from "../context/AuthContext";

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
    }
  }, []);

  return <AuthProvider>{children}</AuthProvider>;
}
