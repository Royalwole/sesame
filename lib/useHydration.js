import { useState, useEffect } from "react";

/**
 * Custom hook to help with hydration issues
 * Returns true once the component has hydrated on the client-side
 */
export function useHydration() {
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  return hasHydrated;
}
