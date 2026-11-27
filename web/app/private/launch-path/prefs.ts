"use client";

// Per-browser view preferences (language, visual style) kept in localStorage.
// Each store remembers the last choice made in this tab too, so switching still
// works when storage is blocked (private windows, strict settings).

import { useSyncExternalStore } from "react";

export function makePref<T extends string>(key: string, values: readonly T[], fallback: T) {
  const listeners = new Set<() => void>();
  let picked: T | null = null;
  const read = (): T => {
    try {
      const v = window.localStorage.getItem(key);
      if (v && (values as readonly string[]).includes(v)) return v as T;
    } catch {
      // Storage blocked: fall through to this tab's choice.
    }
    return picked ?? fallback;
  };
  const subscribe = (cb: () => void) => {
    listeners.add(cb);
    window.addEventListener("storage", cb);
    return () => {
      listeners.delete(cb);
      window.removeEventListener("storage", cb);
    };
  };
  return {
    use: () => useSyncExternalStore(subscribe, read, () => fallback),
    set: (v: T) => {
      try {
        window.localStorage.setItem(key, v);
      } catch {
        // Storage blocked: the choice lasts until the page reloads.
      }
      picked = v;
      listeners.forEach((cb) => cb());
    },
  };
}

export const SKINS = ["classic", "pixel", "bubbly", "poster"] as const;
export type Skin = (typeof SKINS)[number];
export const skinPref = makePref<Skin>("lp-skin", SKINS, "pixel");
