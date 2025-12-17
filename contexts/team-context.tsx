"use client";

import { getStrictContext } from "@/lib/get-strict-context";
import { useTeamStore } from "@/stores/team-store";
import { useTeam } from "@/hooks/use-team";
import { Team } from "@/generated/prisma/client";
import { useCallback, useEffect, useMemo } from "react";

interface TeamContextValue {
  activeTeam: Team | null;
  setActiveTeam: (team: Team | null) => void;
  isLoading: boolean;
}

const [TeamContextProvider, useTeamContext] =
  getStrictContext<TeamContextValue>("TeamProvider");

function TeamProvider({ children }: { children: React.ReactNode }) {
  const { teams, isLoadingTeams } = useTeam();
  const { currentTeam, setCurrentTeam } = useTeamStore();

  // Find team object from teamId in store
  const activeTeam = useMemo(() => {
    if (!currentTeam || !teams.length) return null;
    return teams.find((team) => team.id === currentTeam) ?? null;
  }, [currentTeam, teams]);

  // Automatically set first team if no team is selected
  useEffect(() => {
    if (!currentTeam && teams.length > 0 && !isLoadingTeams) {
      setCurrentTeam(teams[0].id);
    }
  }, [currentTeam, teams, isLoadingTeams, setCurrentTeam]);

  const setActiveTeam = useCallback(
    (team: Team | null) => {
      if (team) {
        setCurrentTeam(team.id);
      } else {
        setCurrentTeam("");
      }
    },
    [setCurrentTeam]
  );

  const value: TeamContextValue = {
    activeTeam,
    setActiveTeam,
    isLoading: isLoadingTeams,
  };

  return <TeamContextProvider value={value}>{children}</TeamContextProvider>;
}

export { TeamProvider, useTeamContext };
