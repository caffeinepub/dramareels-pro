import type { backendInterface } from "../backend";
import { useActor } from "./useActor";

/**
 * Returns the actor (backend interface) directly.
 * The actor is always available (anonymous if not authenticated).
 * Use isFetching to know if actor is still initializing.
 */
export function useBackend(): {
  actor: backendInterface | null;
  isFetching: boolean;
} {
  const { actor, isFetching } = useActor();
  return { actor, isFetching };
}
