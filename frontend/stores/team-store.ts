import { createCookieStorage } from "@/lib/cookie-storage";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface TeamStoreState {
  currentTeam: string | null;
  setCurrentTeam: (id: string) => void;
  clearCurrentTeam: () => void;
}

const teamStorage = createCookieStorage<{
  currentTeam: string | null;
}>();

export const useTeamStore = create<TeamStoreState>()(
  persist(
    (set) => ({
      currentTeam: null,
      setCurrentTeam: (id) => set({ currentTeam: id }),
      clearCurrentTeam: () => {
        teamStorage.removeItem("current_team");
      },
    }),
    {
      name: "current_team",
      partialize: (state) => ({
        currentTeam: state.currentTeam,
      }),
      storage: teamStorage,
    }
  )
);
