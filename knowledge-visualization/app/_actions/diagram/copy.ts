"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "../user";
import { Diagram } from "@/generated/prisma/client";
import { canViewDiagram } from "./permission";

/**
 * Copy a diagram (create a new diagram with "Copy of {name}")
 * User must have view permission to copy
 * @param diagramId - Diagram ID to copy
 * @returns Newly created diagram or null if failed
 */
async function copyDiagram(diagramId: string): Promise<Diagram | null> {
  const user = await getCurrentUser();

  if (!user || !user.id) {
    return null;
  }

  // Check if user has permission to view the diagram
  const canView = await canViewDiagram(diagramId);
  if (!canView) {
    return null;
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
      return null;
    }

    // Don't copy if diagram is in trash
    const trashCheck = await prisma.trash.findUnique({
      where: { diagramId },
    });

    if (trashCheck) {
      return null;
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

    return newDiagram;
  } catch (error) {
    console.error("Failed to copy diagram:", error);
    return null;
  }
}

export { copyDiagram };
