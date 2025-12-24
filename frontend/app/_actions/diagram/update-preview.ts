"use server";

import { prisma } from "@/lib/prisma";
import { canEditDiagram } from "./permission";
import { Prisma } from "@/generated/prisma/client";

export type PreviewNode = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  shape: "rectangle" | "square" | "circle" | "diamond";
};

export type PreviewEdge = {
  id: string;
  source: string;
  target: string;
};

export type DiagramPreview = {
  nodes: PreviewNode[];
  edges: PreviewEdge[];
};

/**
 * Update diagram preview snapshot
 * @param diagramId - Diagram ID to update
 * @param preview - Preview data (nodes and edges)
 * @returns true if successful, false otherwise
 */
async function updateDiagramPreview(
  diagramId: string,
  preview: DiagramPreview
): Promise<boolean> {
  // Check edit permission
  const hasPermission = await canEditDiagram(diagramId);
  if (!hasPermission) {
    return false;
  }

  try {
    // Update diagram preview
    // Note: After running `npx prisma generate`, the type error will be resolved
    await prisma.diagram.update({
      where: { id: diagramId },
      data: {
        preview: preview as unknown as Prisma.InputJsonValue,
        previewUpdatedAt: new Date(),
      } as Prisma.DiagramUpdateInput,
    });

    return true;
  } catch (error) {
    console.error("Failed to update diagram preview:", error);
    return false;
  }
}

export { updateDiagramPreview };
