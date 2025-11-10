"use client";

import * as React from "react";
import { getStrictContext } from "@/lib/get-strict-context";
import { useTeamStore } from "@/stores/team-store";
import { useTeam } from "@/hooks/use-team";
import { Team } from "@prisma/client";

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

  // Tìm team object từ teamId trong store
  const activeTeam = React.useMemo(() => {
    if (!currentTeam || !teams.length) return null;
    return teams.find((team) => team.id === currentTeam) ?? null;
  }, [currentTeam, teams]);

  // Tự động set team đầu tiên nếu chưa có team nào được chọn
  React.useEffect(() => {
    if (!currentTeam && teams.length > 0 && !isLoadingTeams) {
      setCurrentTeam(teams[0].id);
    }
  }, [currentTeam, teams, isLoadingTeams, setCurrentTeam]);

  const setActiveTeam = React.useCallback(
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
