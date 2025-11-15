"use client";

import { useQuery } from "@tanstack/react-query";
import { canEditDiagram } from "@/app/_actions/diagram";

/**
 * Hook to check if current user can edit a diagram
 */
export const useCanEditDiagram = (diagramId: string | undefined) => {
  return useQuery({
    queryKey: ["diagram-permission", diagramId, "can-edit"],
    queryFn: async () => {
      if (!diagramId) return false;
      return await canEditDiagram(diagramId);
    },
    enabled: !!diagramId,
  });
};
