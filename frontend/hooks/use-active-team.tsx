"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTeamStore } from "@/stores/team-store";
import { teamKeys, useTeam } from "@/hooks/use-team";
import type { Team } from "@/generated/prisma/client";

export function useActiveTeam() {
  const { currentTeam, setCurrentTeam, setActiveTeam } = useTeamStore();
  const queryClient = useQueryClient();

  // Get teams query - this will handle loading state
  const { isLoading } = useTeam();

  // Subscribe to teams query and use select to compute activeTeam
  // This will reactively update when teams or currentTeam changes
  const { data: activeTeam } = useQuery({
    queryKey: [...teamKeys.lists(), "active", currentTeam],
    queryFn: async () => {
      // Get teams from cache (from useTeam hook)
      const teams = queryClient.getQueryData<Team[]>(teamKeys.lists()) ?? [];
      if (!currentTeam || !teams.length) return null;
      return teams.find((team) => team.id === currentTeam) ?? null;
    },
    enabled: !!queryClient.getQueryData(teamKeys.lists()),
    select: (data) => data, // Return computed value from queryFn
  });

  // Query to watch teams and auto-set first team when available
  // This query runs when teams are loaded and no team is selected
  useQuery({
    queryKey: [...teamKeys.lists(), "auto-set"],
    queryFn: async () => {
      const teams = queryClient.getQueryData<Team[]>(teamKeys.lists()) ?? [];
      // Auto-set first team if no team is selected
      if (!currentTeam && teams.length > 0) {
        setCurrentTeam(teams[0].id);
      }
      return teams;
    },
    enabled: !!queryClient.getQueryData(teamKeys.lists()) && !currentTeam,
    select: (teams) => teams, // Just return teams, side effect is in queryFn
  });

  return {
    activeTeam: activeTeam ?? null,
    setActiveTeam,
    isLoading,
  };
}
