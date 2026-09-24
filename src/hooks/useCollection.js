import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "animal-hunt:collection";

// localStorage-backed collection state, kept behind a hook so a backend
// (Supabase, etc.) can replace the persistence layer later without any
// caller needing to change.
export function useCollection() {
  const [found, setFound] = useState(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...found]));
    } catch {
      // Ignore write failures (private browsing, quota, etc.) — collection
      // state simply won't persist across reloads.
    }
  }, [found]);

  const markFound = useCallback((id) => {
    setFound((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  return { found, markFound };
}
