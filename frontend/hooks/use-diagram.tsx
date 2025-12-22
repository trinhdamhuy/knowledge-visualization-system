"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createDiagram,
  updateDiagram,
  getDiagramById,
  copyDiagram,
  pasteDiagrams,
} from "@/app/_actions/diagram";
import { itemsKeys } from "./use-items";
import { starredKeys } from "./use-starred";

// Query keys
export const diagramKeys = {
  all: ["diagrams"] as const,
  lists: () => [...diagramKeys.all, "list"] as const,
  list: (filters: string) => [...diagramKeys.lists(), { filters }] as const,
  details: () => [...diagramKeys.all, "detail"] as const,
  detail: (id: string) => [...diagramKeys.details(), id] as const,
};

interface CreateDiagramParams {
  name: string;
  folderId?: string | null;
  teamId?: string | null;
  imageUrl?: string | null;
}

export const useDiagram = () => {
  const queryClient = useQueryClient();

  // Mutation: Create diagram
  const createDiagramMutation = useMutation({
    mutationFn: async (params: CreateDiagramParams) => {
      return await createDiagram(
        params.name,
        params.folderId,
        params.teamId,
        params.imageUrl
      );
    },
    onSuccess: (data) => {
      if (data) {
        // Invalidate and refetch diagrams list
        queryClient.invalidateQueries({ queryKey: diagramKeys.lists() });
        // Invalidate items list (for home, my-diagrams pages)
        queryClient.invalidateQueries({ queryKey: itemsKeys.all });
      }
    },
  });

  // Mutation: Update diagram
  const updateDiagramMutation = useMutation({
    mutationFn: async ({
      diagramId,
      data,
    }: {
      diagramId: string;
      data: {
        name?: string;
        imageUrl?: string | null;
        folderId?: string | null;
      };
    }) => {
      return await updateDiagram(diagramId, data);
    },
    onSuccess: (success, variables) => {
      if (success) {
        // Invalidate diagram detail
        queryClient.invalidateQueries({
          queryKey: diagramKeys.detail(variables.diagramId),
        });
        // Invalidate diagrams list
        queryClient.invalidateQueries({ queryKey: diagramKeys.lists() });
        // Invalidate items list (for home, my-diagrams pages)
        queryClient.invalidateQueries({ queryKey: itemsKeys.all });
        // Invalidate permission check
        queryClient.invalidateQueries({
          queryKey: ["diagram-permission", variables.diagramId],
        });
        // Invalidate starred list if name changed
        if (variables.data.name) {
          queryClient.invalidateQueries({ queryKey: starredKeys.all });
        }
      }
    },
  });

  // Mutation: Copy diagram
  const copyDiagramMutation = useMutation({
    mutationFn: async (diagramId: string) => {
      return await copyDiagram(diagramId);
    },
    onSuccess: (data) => {
      if (data) {
        // Invalidate and refetch diagrams list
        queryClient.invalidateQueries({ queryKey: diagramKeys.lists() });
        // Invalidate items list (for home, my-diagrams pages)
        queryClient.invalidateQueries({ queryKey: itemsKeys.all });
      }
    },
  });

  // Mutation: Paste diagrams
  const pasteDiagramsMutation = useMutation({
    mutationFn: async (diagramIds: string[]) => {
      return await pasteDiagrams(diagramIds);
    },
    onSuccess: (data) => {
      if (data && data.length > 0) {
        // Invalidate and refetch diagrams list
        queryClient.invalidateQueries({ queryKey: diagramKeys.lists() });
        // Invalidate items list (for home, my-diagrams pages)
        queryClient.invalidateQueries({ queryKey: itemsKeys.all });
      }
    },
  });

  return {
    // Mutations
    createDiagram: createDiagramMutation.mutateAsync,
    updateDiagram: updateDiagramMutation.mutateAsync,
    copyDiagram: copyDiagramMutation.mutateAsync,
    pasteDiagrams: pasteDiagramsMutation.mutateAsync,

    // Mutation states
    isCreatingDiagram: createDiagramMutation.isPending,
    isUpdatingDiagram: updateDiagramMutation.isPending,
    isCopyingDiagram: copyDiagramMutation.isPending,
    isPastingDiagrams: pasteDiagramsMutation.isPending,

    // Mutation results
    createDiagramError: createDiagramMutation.error,
    updateDiagramError: updateDiagramMutation.error,
    copyDiagramError: copyDiagramMutation.error,
    pasteDiagramsError: pasteDiagramsMutation.error,
  };
};

/**
 * Hook to get a diagram by ID
 */
export const useDiagramById = (diagramId: string | undefined) => {
  return useQuery({
    queryKey: diagramKeys.detail(diagramId || ""),
    queryFn: async () => {
      if (!diagramId) return null;
      return await getDiagramById(diagramId);
    },
    enabled: !!diagramId,
  });
};
