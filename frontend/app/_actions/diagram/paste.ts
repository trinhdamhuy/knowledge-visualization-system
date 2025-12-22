"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "../user";
import { Diagram } from "@/generated/prisma/client";
import { canViewDiagram } from "./permission";

/**
 * Paste diagrams (create copies from clipboard)
 * User must have view permission to copy each diagram
 * @param diagramIds - Array of diagram IDs to paste
 * @returns Array of newly created diagrams
 */
async function pasteDiagrams(diagramIds: string[]): Promise<Diagram[]> {
  const user = await getCurrentUser();

  if (!user || !user.id) {
    return [];
  }

  const newDiagrams: Diagram[] = [];

  for (const diagramId of diagramIds) {
    // Check if user has permission to view the diagram
    const canView = await canViewDiagram(diagramId);
    if (!canView) {
      continue;
    }

    try {
      // Get the original diagram
      const originalDiagram = await prisma.diagram.findUnique({
        where: { id: diagramId },
        select: {
          name: true,
          imageUrl: true,
          folderId: true,
          teamId: true,
        },
      });

      if (!originalDiagram) {
        continue;
      }

      // Don't copy if diagram is in trash
      const trashCheck = await prisma.trash.findUnique({
        where: { diagramId },
      });

      if (trashCheck) {
        continue;
      }

      // Create copy name
      const copyName = `Copy of ${originalDiagram.name}`;

      // Create new diagram (owned by current user)
      const newDiagram = await prisma.diagram.create({
        data: {
          name: copyName,
          ownerId: user.id,
          folderId: originalDiagram.folderId || null,
          teamId: originalDiagram.teamId || null,
          imageUrl: originalDiagram.imageUrl || null,
        },
      });

      newDiagrams.push(newDiagram);
    } catch (error) {
      console.error(`Failed to paste diagram ${diagramId}:`, error);
      // Continue with other diagrams
    }
  }

  return newDiagrams;
}

export { pasteDiagrams };
