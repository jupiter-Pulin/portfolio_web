// One subscription to the reduced-motion query, shared by every animated client
// component. The server always renders the motion-on branch and corrects itself
// on hydration, which is what useSyncExternalStore's server snapshot is for.
import { useSyncExternalStore } from "react";

export const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

const subscribe = (onChange: () => void) => {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
const now = () => window.matchMedia(REDUCED_MOTION).matches;
const onServer = () => false;

export const useReducedMotion = (): boolean => useSyncExternalStore(subscribe, now, onServer);
