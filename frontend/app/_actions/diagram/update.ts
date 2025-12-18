"use server";

import { prisma } from "@/lib/prisma";
import { canEditDiagram } from "./permission";
import { Diagram } from "@/generated/prisma/client";

/**
 * Update a diagram
 * @param diagramId - Diagram ID to update
 * @param data - Update data (name, imageUrl, folderId)
 * @returns true if successful, false otherwise
 */
async function updateDiagram(
  diagramId: string,
  data: Partial<Pick<Diagram, "name" | "imageUrl" | "folderId">>
): Promise<boolean> {
  // Check edit permission
  const hasPermission = await canEditDiagram(diagramId);
  if (!hasPermission) {
    return false;
  }

  try {
    // Validate: if folderId exists, check if folder exists
    if (data.folderId !== undefined) {
      if (data.folderId) {
        const folder = await prisma.folder.findUnique({
          where: { id: data.folderId },
        });
        if (!folder) {
          throw new Error("Folder not found");
        }
      }
    }

    // Update diagram
    await prisma.diagram.update({
      where: { id: diagramId },
      data: {
        ...data,
      },
    });

    return true;
  } catch (error) {
    console.error("Failed to update diagram:", error);
    return false;
  }
}

export { updateDiagram };
