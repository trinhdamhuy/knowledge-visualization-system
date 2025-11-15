"use server";

import { prisma } from "@/lib/prisma";
import { canEditFolder } from "./permission";
import { Folder } from "@prisma/client";

/**
 * Update a folder
 * @param folderId - Folder ID to update
 * @param data - Update data (name, parentId)
 * @returns true if successful, false otherwise
 */
async function updateFolder(
  folderId: string,
  data: Partial<Pick<Folder, "name" | "parentId">>
): Promise<boolean> {
  // Check edit permission
  const hasPermission = await canEditFolder(folderId);
  if (!hasPermission) {
    return false;
  }

  try {
    // Get current folder to check its current state
    const currentFolder = await prisma.folder.findUnique({
      where: { id: folderId },
      select: {
        name: true,
        parentId: true,
        teamId: true,
      },
    });

    if (!currentFolder) {
      return false;
    }

    // Determine the final values after update
    const finalName = data.name !== undefined ? data.name : currentFolder.name;
    const finalParentId =
      data.parentId !== undefined ? data.parentId : currentFolder.parentId;
    const finalTeamId = currentFolder.teamId; // teamId cannot be changed via update

    // Validate: if parentId exists, check if parent exists and prevent circular reference
    if (data.parentId !== undefined) {
      if (data.parentId) {
        const parent = await prisma.folder.findUnique({
          where: { id: data.parentId },
        });
        if (!parent) {
          throw new Error("Parent folder not found");
        }

        // Check that parent cannot be set to itself or its children
        if (data.parentId === folderId) {
          throw new Error("Cannot set folder as its own parent");
        }

        // Check for circular reference (parent cannot be a child of the current folder)
        const checkCircular = async (
          currentId: string,
          targetId: string
        ): Promise<boolean> => {
          const current = await prisma.folder.findUnique({
            where: { id: currentId },
            select: { parentId: true },
          });
          if (!current || !current.parentId) return false;
          if (current.parentId === targetId) return true;
          return checkCircular(current.parentId, targetId);
        };

        if (await checkCircular(data.parentId, folderId)) {
          throw new Error("Cannot create circular reference");
        }
      }
    }

    // Check for duplicate folder name in the same location (parent + team)
    // Only check if name or parentId is being changed
    if (data.name !== undefined || data.parentId !== undefined) {
      const existingFolder = await prisma.folder.findFirst({
        where: {
          name: finalName,
          parentId: finalParentId || null,
          teamId: finalTeamId || null,
          id: { not: folderId }, // Exclude current folder
          trash: null, // Exclude trashed folders
        },
      });

      if (existingFolder) {
        throw new Error(
          "A folder with this name already exists in this location"
        );
      }
    }

    await prisma.folder.update({
      where: { id: folderId },
      data: data,
    });

    return true;
  } catch (error) {
    console.error("Failed to update folder:", error);
    return false;
  }
}

export { updateFolder };
