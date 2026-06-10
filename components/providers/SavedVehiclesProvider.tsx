"use client";

import * as React from "react";
import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { useSession } from "@/hooks/useSession";

type SavedVehicleItem = { vehicleId: string };

export interface SavedVehiclesStore {
  savedIds: string[];
  ready: boolean;
  isSaved: (vehicleId: string) => boolean;
  save: (vehicleId: string) => Promise<void>;
  unsave: (vehicleId: string) => Promise<void>;
  toggle: (vehicleId: string) => Promise<boolean>;
}

const SavedVehiclesContext = React.createContext<SavedVehiclesStore | null>(null);

export function SavedVehiclesProvider({ children }: { children: React.ReactNode }) {
  const store = useSavedVehiclesStore();
  return (
    <SavedVehiclesContext.Provider value={store}>{children}</SavedVehiclesContext.Provider>
  );
}

export function useSavedVehiclesContext(): SavedVehiclesStore {
  const store = React.useContext(SavedVehiclesContext);
  if (!store) {
    throw new Error("useSavedVehicles must be used within SavedVehiclesProvider");
  }
  return store;
}

function useSavedVehiclesStore(): SavedVehiclesStore {
  const { session, ready: sessionReady } = useSession();
  const [savedIds, setSavedIds] = React.useState<string[]>([]);
  const [loaded, setLoaded] = React.useState(false);

  const refresh = React.useCallback(async () => {
    if (!session) {
      setSavedIds([]);
      setLoaded(true);
      return;
    }

    try {
      const res = await api.get<{ items: SavedVehicleItem[] }>(endpoints.accountSavedVehicles);
      setSavedIds(res.items.map((item) => item.vehicleId));
    } catch {
      setSavedIds([]);
    } finally {
      setLoaded(true);
    }
  }, [session]);

  React.useEffect(() => {
    if (!sessionReady) return;
    void refresh();
  }, [sessionReady, refresh]);

  const save = React.useCallback(async (vehicleId: string) => {
    await api.post(endpoints.accountSavedVehicleById(vehicleId));
    setSavedIds((current) => (current.includes(vehicleId) ? current : [vehicleId, ...current]));
  }, []);

  const unsave = React.useCallback(async (vehicleId: string) => {
    await api.delete(endpoints.accountSavedVehicleById(vehicleId));
    setSavedIds((current) => current.filter((id) => id !== vehicleId));
  }, []);

  const toggle = React.useCallback(
    async (vehicleId: string) => {
      if (savedIds.includes(vehicleId)) {
        await unsave(vehicleId);
        return false;
      }
      await save(vehicleId);
      return true;
    },
    [save, savedIds, unsave],
  );

  const isSaved = React.useCallback(
    (vehicleId: string) => savedIds.includes(vehicleId),
    [savedIds],
  );

  return {
    savedIds,
    ready: sessionReady && loaded,
    isSaved,
    save,
    unsave,
    toggle,
  };
}
