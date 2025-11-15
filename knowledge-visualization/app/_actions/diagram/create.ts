"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "../user";
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
 * Create a new diagram
 * @param title - Diagram title
 * @param folderId - Folder ID containing the diagram (optional)
 * @param teamId - Team ID (optional)
 * @param imageUrl - Preview image URL (optional)
 * @returns Newly created diagram or null if failed
 */
async function createDiagram(
  title: string,
  folderId?: string | null,
  teamId?: string | null,
  imageUrl?: string | null
): Promise<Diagram | null> {
  const user = await getCurrentUser();

  if (!user || !user.id) {
    return null;
  }

  try {
    // Validate: if folderId exists, check if folder exists
    if (folderId) {
      const folder = await prisma.folder.findUnique({
        where: { id: folderId },
      });
      if (!folder) {
        throw new Error("Folder not found");
      }
    }

    // Validate: if teamId exists, check if user is a member of the team
    if (teamId) {
      const teamMember = await prisma.teamMember.findUnique({
        where: {
          teamId_userId: {
            teamId: teamId,
            userId: user.id,
          },
        },
      });
      if (!teamMember) {
        throw new Error("User is not a member of this team");
      }
    }

    // Find unique title by appending number suffix if needed
    const uniqueTitle = await findUniqueDiagramTitle(title, folderId, teamId);

    // Create diagram
    const diagram = await prisma.diagram.create({
      data: {
        title: uniqueTitle,
        ownerId: user.id,
        folderId: folderId || null,
        teamId: teamId || null,
        imageUrl: imageUrl || null,
      },
    });

    return diagram;
  } catch (error) {
    console.error("Failed to create diagram:", error);
    return null;
  }
}

export { createDiagram };
