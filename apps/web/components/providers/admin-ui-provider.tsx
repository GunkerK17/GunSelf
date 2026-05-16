"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { PropsWithChildren } from "react";

type DepthMode = "normal" | "pro";

type AdminUiContextValue = {
  enable3d: boolean;
  enableAnimations: boolean;
  depthMode: DepthMode;
  setEnable3d: (value: boolean) => void;
  setEnableAnimations: (value: boolean) => void;
  setDepthMode: (value: DepthMode) => void;
};

const STORAGE_KEY = "gunself.admin.ui";

const AdminUiContext = createContext<AdminUiContextValue | null>(null);

export function AdminUiProvider({ children }: PropsWithChildren) {
  const [enable3d, setEnable3d] = useState(true);
  const [enableAnimations, setEnableAnimations] = useState(true);
  const [depthMode, setDepthMode] = useState<DepthMode>("pro");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as {
        enable3d?: boolean;
        enableAnimations?: boolean;
        depthMode?: DepthMode;
      };

      if (typeof parsed.enable3d === "boolean") {
        setEnable3d(parsed.enable3d);
      }
      if (typeof parsed.enableAnimations === "boolean") {
        setEnableAnimations(parsed.enableAnimations);
      }
      if (parsed.depthMode === "normal" || parsed.depthMode === "pro") {
        setDepthMode(parsed.depthMode);
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        enable3d,
        enableAnimations,
        depthMode
      })
    );
  }, [depthMode, enable3d, enableAnimations]);

  const value = useMemo<AdminUiContextValue>(
    () => ({
      enable3d,
      enableAnimations,
      depthMode,
      setEnable3d,
      setEnableAnimations,
      setDepthMode
    }),
    [depthMode, enable3d, enableAnimations]
  );

  return <AdminUiContext.Provider value={value}>{children}</AdminUiContext.Provider>;
}

export function useAdminUi() {
  const context = useContext(AdminUiContext);

  if (!context) {
    throw new Error("useAdminUi must be used within AdminUiProvider.");
  }

  return context;
}
