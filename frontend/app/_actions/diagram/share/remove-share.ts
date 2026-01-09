"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "../../user";

/**
 * Remove a user's share/permission from a diagram
 * @param diagramId - Diagram ID
 * @param userId - User ID to remove
 * @returns Success or error object
 */
export async function removeShare(
  diagramId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();

  if (!user || !user.id) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // Get diagram to check ownership
    const diagram = await prisma.diagram.findUnique({
      where: { id: diagramId },
      select: {
        id: true,
        ownerId: true,
      },
    });

    if (!diagram) {
      return { success: false, error: "Diagram not found" };
    }

    // Check if user is the owner
    if (diagram.ownerId !== user.id) {
      return {
        success: false,
        error: "You don't have permission to remove shares from this diagram",
      };
    }

    // Delete share
    await prisma.share.deleteMany({
      where: {
        diagramId,
        userId,
      },
    });

    // Update diagram to trigger Liveblocks refresh
    await prisma.diagram.update({
      where: { id: diagramId },
      data: {
        updatedAt: new Date(),
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to remove share:", error);
    return { success: false, error: "Failed to remove share" };
  }
}
