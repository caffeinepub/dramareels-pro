import { type ReactNode, createContext, useContext } from "react";
import type { backendInterface } from "../backend";
import { useBackend } from "../hooks/useBackend";

interface ActorContextValue {
  actor: backendInterface | null;
  isFetching: boolean;
}

const ActorContext = createContext<ActorContextValue>({
  actor: null,
  isFetching: true,
});

export function ActorProvider({ children }: { children: ReactNode }) {
  const value = useBackend();
  return (
    <ActorContext.Provider value={value}>{children}</ActorContext.Provider>
  );
}

export function useActor2(): backendInterface | null {
  return useContext(ActorContext).actor;
}

export function useActorReady(): boolean {
  const { actor, isFetching } = useContext(ActorContext);
  return !!actor && !isFetching;
}
