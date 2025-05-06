import { useState } from "react";
import useIsomorphicLayoutEffect from "./useIsomorphicLayoutEffect";

/**
 * Custom hook to help with hydration issues
 * Returns true once the component has hydrated on the client-side
 */
export function useHydration() {
  const [hasHydrated, setHasHydrated] = useState(false);

  // Use isomorphic layout effect to run synchronously after all DOM mutations
  useIsomorphicLayoutEffect(() => {
    setHasHydrated(true);
  }, []);

  return hasHydrated;
}
