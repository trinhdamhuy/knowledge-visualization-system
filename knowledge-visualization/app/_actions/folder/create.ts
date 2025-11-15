"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "../user";
import { Folder } from "@prisma/client";

/**
 * Create a new folder
 * @param name - Folder name
 * @param parentId - Parent folder ID (optional)
 * @param teamId - Team ID (optional)
 * @returns Newly created folder or null if failed
 */
async function createFolder(
  name: string,
  parentId?: string | null,
  teamId?: string | null
): Promise<Folder | null> {
  const user = await getCurrentUser();

  if (!user || !user.id) {
    return null;
  }

  try {
    // Validate: if parentId exists, check if parent exists
    if (parentId) {
      const parent = await prisma.folder.findUnique({
        where: { id: parentId },
      });
      if (!parent) {
        throw new Error("Parent folder not found");
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

    // Check for duplicate folder name in the same location (parent + team)
    // Exclude trashed folders
    const existingFolder = await prisma.folder.findFirst({
      where: {
        name: name,
        parentId: parentId || null,
        teamId: teamId || null,
        trash: null, // Exclude trashed folders
      },
    });

    if (existingFolder) {
      throw new Error(
        "A folder with this name already exists in this location"
      );
    }

    // Create folder
    const folder = await prisma.folder.create({
      data: {
        name: name,
        ownerId: user.id,
        parentId: parentId || null,
        teamId: teamId || null,
      },
    });

    return folder;
  } catch (error) {
    console.error("Failed to create folder:", error);
    return null;
  }
}

export { createFolder };
