import { createCookieStorage } from "@/lib/cookie-storage";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Team } from "@/generated/prisma/client";

export interface TeamStoreState {
  currentTeam: string | null;
  setCurrentTeam: (id: string) => void;
  setActiveTeam: (team: Team | null) => void;
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
      setActiveTeam: (team) => {
        if (team) {
          set({ currentTeam: team.id });
        } else {
          set({ currentTeam: null });
        }
      },
      clearCurrentTeam: () => {
        set({ currentTeam: null });
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
