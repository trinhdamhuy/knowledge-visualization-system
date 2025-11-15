"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "../user";

/**
 * Unstar a diagram
 * @param diagramId - Diagram ID to unstar
 * @returns Deleted starred record or null
 */
async function unstarDiagram(diagramId: string) {
  const user = await getCurrentUser();

  if (!user || !user.id) {
    throw new Error("Unauthorized");
  }

  try {
    // Delete starred record
    const starred = await prisma.starred.deleteMany({
      where: {
        userId: user.id,
        diagramId: diagramId,
      },
    });

    return starred.count > 0;
  } catch (error) {
    console.error("Failed to unstar diagram:", error);
    throw error;
  }
}

export { unstarDiagram };
