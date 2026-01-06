"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createTeam,
  getTeams,
  updateTeam,
  deleteTeam,
  inviteMember,
  removeMember,
  updateMemberRole,
} from "@/app/_actions/team";
import type { Team } from "@/generated/prisma/client";
import { Permission } from "@/generated/prisma/enums";

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

interface InviteMemberParams {
  teamId: string;
  email: string;
  permission?: Permission;
}

interface RemoveMemberParams {
  teamId: string;
  userId: string;
}

interface UpdateMemberRoleParams {
  teamId: string;
  userId: string;
  permission: Permission;
}

export const useTeam = () => {
  const queryClient = useQueryClient();

  // Query: Get teams
  const {
    data: teams,
    isLoading,
    error,
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
      return await deleteTeam(params.teamId);
    },
    onSuccess: (data) => {
      if (data) {
        // Invalidate and refetch teams list
        queryClient.invalidateQueries({ queryKey: teamKeys.lists() });
      }
    },
  });

  // Mutation: Invite member
  const inviteMemberMutation = useMutation({
    mutationFn: async (params: InviteMemberParams) => {
      return await inviteMember(params.teamId, params.email, params.permission);
    },
    onSuccess: (data) => {
      if (data.success) {
        // Invalidate team details and lists
        queryClient.invalidateQueries({ queryKey: teamKeys.details() });
        queryClient.invalidateQueries({ queryKey: teamKeys.lists() });
      }
    },
  });

  // Mutation: Remove member
  const removeMemberMutation = useMutation({
    mutationFn: async (params: RemoveMemberParams) => {
      return await removeMember(params.teamId, params.userId);
    },
    onSuccess: (data) => {
      if (data.success) {
        // Invalidate team details and lists
        queryClient.invalidateQueries({ queryKey: teamKeys.details() });
        queryClient.invalidateQueries({ queryKey: teamKeys.lists() });
      }
    },
  });

  // Mutation: Update member role
  const updateMemberRoleMutation = useMutation({
    mutationFn: async (params: UpdateMemberRoleParams) => {
      return await updateMemberRole(
        params.teamId,
        params.userId,
        params.permission
      );
    },
    onSuccess: (data) => {
      if (data.success) {
        // Invalidate team details and lists
        queryClient.invalidateQueries({ queryKey: teamKeys.details() });
        queryClient.invalidateQueries({ queryKey: teamKeys.lists() });
      }
    },
  });

  return {
    // Query data
    teams: teams ?? [],
    isLoading,
    error,
    refetchTeams,

    // Mutations
    createTeam: createTeamMutation.mutateAsync,
    updateTeam: updateTeamMutation.mutateAsync,
    deleteTeam: deleteTeamMutation.mutateAsync,
    inviteMember: inviteMemberMutation.mutateAsync,
    removeMember: removeMemberMutation.mutateAsync,
    updateMemberRole: updateMemberRoleMutation.mutateAsync,

    // Mutation states
    isCreatingTeam: createTeamMutation.isPending,
    isUpdatingTeam: updateTeamMutation.isPending,
    isDeletingTeam: deleteTeamMutation.isPending,
    isInvitingMember: inviteMemberMutation.isPending,
    isRemovingMember: removeMemberMutation.isPending,
    isUpdatingMemberRole: updateMemberRoleMutation.isPending,

    // Mutation results
    createTeamError: createTeamMutation.error,
    updateTeamError: updateTeamMutation.error,
    deleteTeamError: deleteTeamMutation.error,
    inviteMemberError: inviteMemberMutation.error,
    removeMemberError: removeMemberMutation.error,
    updateMemberRoleError: updateMemberRoleMutation.error,
  };
};
