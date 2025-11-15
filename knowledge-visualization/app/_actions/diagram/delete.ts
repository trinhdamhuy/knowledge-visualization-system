"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "../user";
import { getDiagramRole } from "./permission";
import { Permission } from "@prisma/client";

/**
 * Delete a diagram (move to trash)
 * Only OWNER has permission to delete a diagram
 * @param diagramId - Diagram ID to delete
 * @returns true if successful, false otherwise
 */
async function deleteDiagram(diagramId: string): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user || !user.id) {
    return false;
  }

  // Only OWNER has permission to delete
  const role = await getDiagramRole(diagramId);
  if (role !== Permission.OWNER) {
    return false;
  }

  try {
    // Check if diagram exists
    const diagram = await prisma.diagram.findUnique({
      where: { id: diagramId },
      select: { id: true, trash: true },
    });

    if (!diagram) {
      return false;
    }

    // If already in trash, do nothing
    if (diagram.trash) {
      return true;
    }

    await prisma.trash.create({
      data: {
        diagramId: diagramId,
        deletedById: user.id,
      },
    });

    return true;
  } catch (error) {
    console.error("Failed to delete diagram:", error);
    return false;
  }
}

export { deleteDiagram };
