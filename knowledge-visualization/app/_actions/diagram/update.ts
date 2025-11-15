"use server";

import { prisma } from "@/lib/prisma";
import { canEditDiagram } from "./permission";
import { Diagram } from "@prisma/client";

/**
 * Find a unique diagram title by appending a number suffix if needed
 * @param baseTitle - Base title to check
 * @param folderId - Folder ID (optional)
 * @param teamId - Team ID (optional)
 * @param excludeDiagramId - Diagram ID to exclude from check (optional)
 * @returns Unique title with number suffix if needed
 */
async function findUniqueDiagramTitle(
  baseTitle: string,
  folderId: string | null | undefined,
  teamId: string | null | undefined,
  excludeDiagramId?: string
): Promise<string> {
  // Check if base title is available
  const existingBase = await prisma.diagram.findFirst({
    where: {
      title: baseTitle,
      folderId: folderId || null,
      teamId: teamId || null,
      id: excludeDiagramId ? { not: excludeDiagramId } : undefined,
      trash: null,
    },
  });

  if (!existingBase) {
    return baseTitle;
  }

  // Find the next available number
  let counter = 1;
  let uniqueTitle = `${baseTitle} (${counter})`;

  while (true) {
    const existing = await prisma.diagram.findFirst({
      where: {
        title: uniqueTitle,
        folderId: folderId || null,
        teamId: teamId || null,
        id: excludeDiagramId ? { not: excludeDiagramId } : undefined,
        trash: null,
      },
    });

    if (!existing) {
      return uniqueTitle;
    }

    counter++;
    uniqueTitle = `${baseTitle} (${counter})`;
  }
}

/**
 * Update a diagram
 * @param diagramId - Diagram ID to update
 * @param data - Update data (title, imageUrl, folderId)
 * @returns true if successful, false otherwise
 */
async function updateDiagram(
  diagramId: string,
  data: Partial<Pick<Diagram, "title" | "imageUrl" | "folderId">>
): Promise<boolean> {
  // Check edit permission
  const hasPermission = await canEditDiagram(diagramId);
  if (!hasPermission) {
    return false;
  }

  try {
    // Get current diagram to check its current state
    const currentDiagram = await prisma.diagram.findUnique({
      where: { id: diagramId },
      select: {
        title: true,
        folderId: true,
        teamId: true,
      },
    });

    if (!currentDiagram) {
      return false;
    }

    // Determine the final values after update
    const baseTitle =
      data.title !== undefined ? data.title : currentDiagram.title;
    const finalFolderId =
      data.folderId !== undefined ? data.folderId : currentDiagram.folderId;
    const finalTeamId = currentDiagram.teamId; // teamId cannot be changed via update

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

    // Find unique title by appending number suffix if needed
    // Only check if title or folderId is being changed
    let finalTitle = baseTitle;
    if (data.title !== undefined || data.folderId !== undefined) {
      finalTitle = await findUniqueDiagramTitle(
        baseTitle,
        finalFolderId,
        finalTeamId,
        diagramId
      );
    }

    // Update with unique title
    await prisma.diagram.update({
      where: { id: diagramId },
      data: {
        ...data,
        title: data.title !== undefined ? finalTitle : undefined,
      },
    });

    return true;
  } catch (error) {
    console.error("Failed to update diagram:", error);
    return false;
  }
}

export { updateDiagram };
