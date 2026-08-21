"use client";

import { useEffect, useState } from "react";

/** True once the client has mounted — use to avoid SSR/localStorage hydration mismatch. */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
