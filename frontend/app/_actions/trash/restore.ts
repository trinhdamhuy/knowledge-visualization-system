"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "../user";

/**
 * Restore a diagram from trash
 * @param diagramId - Diagram ID to restore
 * @returns true if successful, false otherwise
 */
async function restoreDiagram(diagramId: string): Promise<boolean> {
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

    // Delete trash record (restore the diagram)
    await prisma.trash.delete({
      where: { diagramId: diagramId },
    });

    return true;
  } catch (error) {
    console.error("Failed to restore diagram:", error);
    return false;
  }
}

/**
 * Restore a folder from trash
 * @param folderId - Folder ID to restore
 * @returns true if successful, false otherwise
 */
async function restoreFolder(folderId: string): Promise<boolean> {
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

    // Delete trash record (restore the folder)
    await prisma.trash.delete({
      where: { folderId: folderId },
    });

    return true;
  } catch (error) {
    console.error("Failed to restore folder:", error);
    return false;
  }
}

export { restoreDiagram, restoreFolder };

