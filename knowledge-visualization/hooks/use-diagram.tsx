"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createDiagram,
  updateDiagram,
  getDiagramById,
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
  title: string;
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
        params.title,
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
        title?: string;
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
        // Invalidate starred list if title changed
        if (variables.data.title) {
          queryClient.invalidateQueries({ queryKey: starredKeys.all });
        }
      }
    },
  });

  return {
    // Mutations
    createDiagram: createDiagramMutation.mutateAsync,
    updateDiagram: updateDiagramMutation.mutateAsync,

    // Mutation states
    isCreatingDiagram: createDiagramMutation.isPending,
    isUpdatingDiagram: updateDiagramMutation.isPending,

    // Mutation results
    createDiagramError: createDiagramMutation.error,
    updateDiagramError: updateDiagramMutation.error,
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
