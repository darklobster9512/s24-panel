// Browser-side Supabase client for the SPA.
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env
  .VITE_SUPABASE_PUBLISHABLE_KEY as string;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  console.error(
    "[Supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY.",
  );
}

const REMEMBER_KEY = "s24.remember-me";

export function getRememberMe(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(REMEMBER_KEY) !== "0";
  } catch {
    return true;
  }
}

export function setRememberMe(value: boolean) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(REMEMBER_KEY, value ? "1" : "0");
  } catch {
    /* ignore */
  }
}

/**
 * Storage adapter that routes the auth session to localStorage when
 * "Angemeldet bleiben" is active, otherwise to sessionStorage (session ends
 * when the browser is closed).
 */
const hybridStorage = {
  getItem: (key: string) => {
    try {
      return (
        window.localStorage.getItem(key) ?? window.sessionStorage.getItem(key)
      );
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string) => {
    try {
      if (getRememberMe()) {
        window.sessionStorage.removeItem(key);
        window.localStorage.setItem(key, value);
      } else {
        window.localStorage.removeItem(key);
        window.sessionStorage.setItem(key, value);
      }
    } catch {
      /* ignore */
    }
  },
  removeItem: (key: string) => {
    try {
      window.localStorage.removeItem(key);
      window.sessionStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  },
};

export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      storage: typeof window !== "undefined" ? hybridStorage : undefined,
      persistSession: true,
      autoRefreshToken: true,
    },
  },
);

