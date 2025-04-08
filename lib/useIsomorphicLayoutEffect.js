import { useLayoutEffect, useEffect } from "react";

/**
 * A hook that resolves to useLayoutEffect on the client and useEffect on the server.
 * This avoids the warning about useLayoutEffect during SSR.
 */
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export default useIsomorphicLayoutEffect;
