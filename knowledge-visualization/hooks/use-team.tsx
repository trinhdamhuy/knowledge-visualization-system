"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createTeam,
  getTeams,
  updateTeam,
  deleteTeam,
} from "@/app/_actions/team";
import { Team } from "@prisma/client";

// Query keys
export const teamKeys = {
  all: ["teams"] as const,
  lists: () => [...teamKeys.all, "list"] as const,
  list: (filters: string) => [...teamKeys.lists(), { filters }] as const,
  details: () => [...teamKeys.all, "detail"] as const,
  detail: (id: string) => [...teamKeys.details(), id] as const,
};

interface CreateTeamParams {
  name: string;
  imageUrl: string;
}

interface UpdateTeamParams {
  teamId: string;
  data: Partial<Team>;
}

interface DeleteTeamParams {
  teamId: string;
}

export const useTeam = () => {
  const queryClient = useQueryClient();

  // Query: Get teams
  const {
    data: teams,
    isLoading: isLoadingTeams,
    error: teamsError,
    refetch: refetchTeams,
  } = useQuery({
    queryKey: teamKeys.lists(),
    queryFn: async () => {
      const result = await getTeams();
      return result ?? [];
    },
  });

  // Mutation: Create team
  const createTeamMutation = useMutation({
    mutationFn: async (params: CreateTeamParams) => {
      return await createTeam(params.name, params.imageUrl);
    },
    onSuccess: (data) => {
      if (data) {
        // Invalidate and refetch teams list
        queryClient.invalidateQueries({ queryKey: teamKeys.lists() });
      }
    },
  });

  // Mutation: Update team
  const updateTeamMutation = useMutation({
    mutationFn: async (params: UpdateTeamParams) => {
      // TODO: Implement update team functionality
      return await updateTeam(params.teamId, params.data);
    },
    onSuccess: (data) => {
      if (data) {
        // Invalidate and refetch teams list
        queryClient.invalidateQueries({ queryKey: teamKeys.lists() });
      }
    },
  });

  // Mutation: Delete team
  const deleteTeamMutation = useMutation({
    mutationFn: async (params: DeleteTeamParams) => {
      // TODO: Implement delete team functionality
      return await deleteTeam(params.teamId);
    },
    onSuccess: (data) => {
      if (data) {
        // Invalidate and refetch teams list
        queryClient.invalidateQueries({ queryKey: teamKeys.lists() });
      }
    },
  });

  return {
    // Query data
    teams: teams ?? [],
    isLoadingTeams,
    teamsError,
    refetchTeams,

    // Mutations
    createTeam: createTeamMutation.mutateAsync,
    updateTeam: updateTeamMutation.mutateAsync,
    deleteTeam: deleteTeamMutation.mutateAsync,

    // Mutation states
    isCreatingTeam: createTeamMutation.isPending,
    isUpdatingTeam: updateTeamMutation.isPending,
    isDeletingTeam: deleteTeamMutation.isPending,

    // Mutation results
    createTeamError: createTeamMutation.error,
    updateTeamError: updateTeamMutation.error,
    deleteTeamError: deleteTeamMutation.error,
  };
};
