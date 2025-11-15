"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "../user";

/**
 * Permanently delete a diagram from trash
 * @param diagramId - Diagram ID to permanently delete
 * @returns true if successful, false otherwise
 */
async function permanentDeleteDiagram(diagramId: string): Promise<boolean> {
  const user = await getCurrentUser();

  if (!user || !user.id) {
    return false;
  }

  try {
    // Check if trash record exists and belongs to current user
    const trash = await prisma.trash.findUnique({
      where: { diagramId: diagramId },
      select: { deletedById: true },
    });

    if (!trash || trash.deletedById !== user.id) {
      return false;
    }

    // Delete the diagram (cascade will delete trash record)
    await prisma.diagram.delete({
      where: { id: diagramId },
    });

    return true;
  } catch (error) {
    console.error("Failed to permanently delete diagram:", error);
    return false;
  }
}

/**
 * Permanently delete a folder from trash
 * @param folderId - Folder ID to permanently delete
 * @returns true if successful, false otherwise
 */
async function permanentDeleteFolder(folderId: string): Promise<boolean> {
  const user = await getCurrentUser();

  if (!user || !user.id) {
    return false;
  }

  try {
    // Check if trash record exists and belongs to current user
    const trash = await prisma.trash.findUnique({
      where: { folderId: folderId },
      select: { deletedById: true },
    });

    if (!trash || trash.deletedById !== user.id) {
      return false;
    }

    // Delete the folder (cascade will delete trash record and children)
    await prisma.folder.delete({
      where: { id: folderId },
    });

    return true;
  } catch (error) {
    console.error("Failed to permanently delete folder:", error);
    return false;
  }
}

export { permanentDeleteDiagram, permanentDeleteFolder };

