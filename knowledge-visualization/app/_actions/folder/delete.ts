"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "../user";
import { getFolderRole } from "./permission";
import { Permission } from "@prisma/client";

/**
 * Delete a folder (move to trash)
 * Only OWNER has permission to delete a folder
 * @param folderId - Folder ID to delete
 * @returns true if successful, false otherwise
 */
async function deleteFolder(folderId: string): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user || !user.id) {
    return false;
  }

  // Only OWNER has permission to delete
  const role = await getFolderRole(folderId);
  if (role !== Permission.OWNER) {
    return false;
  }

  try {
    // Check if folder exists
    const folder = await prisma.folder.findUnique({
      where: { id: folderId },
      select: { id: true, trash: true },
    });

    if (!folder) {
      return false;
    }

    // If already in trash, do nothing
    if (folder.trash) {
      return true;
    }

    // Create record in Trash (autoDeleteAt will be set by database default)
    await prisma.trash.create({
      data: {
        folderId: folderId,
        deletedById: user.id,
      },
    });

    return true;
  } catch (error) {
    console.error("Failed to delete folder:", error);
    return false;
  }
}

export { deleteFolder };
