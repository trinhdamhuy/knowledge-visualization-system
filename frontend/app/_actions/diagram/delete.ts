"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "../user";
import { getDiagramRole } from "./permission";
import { Permission } from "@/generated/prisma/client";

/**
 * Delete diagrams (move to trash)
 * Only OWNER or EDITOR has permission to delete each diagram
 * @param diagramIds - Array of diagram IDs to delete (can be single item)
 * @returns Number of successfully deleted diagrams
 */
async function deleteDiagrams(diagramIds: string[]): Promise<number> {
  const user = await getCurrentUser();
  if (!user || !user.id) {
    return 0;
  }

  let successCount = 0;

  for (const diagramId of diagramIds) {
    try {
      // Only OWNER or EDITOR has permission to delete
      const role = await getDiagramRole(diagramId);
      if (role !== Permission.OWNER && role !== Permission.EDITOR) {
        continue;
      }

      // Check if diagram exists
      const diagram = await prisma.diagram.findUnique({
        where: { id: diagramId },
        select: { id: true, trash: true },
      });

      if (!diagram) {
        continue;
      }

      // If already in trash, skip
      if (diagram.trash) {
        successCount++;
        continue;
      }

      await prisma.trash.create({
        data: {
          diagramId: diagramId,
          deletedById: user.id,
        },
      });

      successCount++;
    } catch (error) {
      console.error(`Failed to delete diagram ${diagramId}:`, error);
      // Continue with other diagrams
    }
  }

  return successCount;
}

export { deleteDiagrams };
