"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "../user";
import { Diagram } from "@/generated/prisma/client";

/**
 * Create a new diagram
 * @param name - Diagram name
 * @param folderId - Folder ID containing the diagram (optional)
 * @param teamId - Team ID (optional)
 * @param imageUrl - Preview image URL (optional)
 * @returns Newly created diagram or null if failed
 */
async function createDiagram(
  name: string,
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

    // Create diagram
    const diagram = await prisma.diagram.create({
      data: {
        name: name,
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
