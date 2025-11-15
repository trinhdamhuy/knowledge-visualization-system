"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "../user";

/**
 * Star a diagram
 * @param diagramId - Diagram ID to star
 * @returns Created starred record or null
 */
async function starDiagram(diagramId: string) {
  const user = await getCurrentUser();

  if (!user || !user.id) {
    throw new Error("Unauthorized");
  }

  try {
    // Check if diagram exists
    const diagram = await prisma.diagram.findUnique({
      where: { id: diagramId },
    });

    if (!diagram) {
      throw new Error("Diagram not found");
    }

    // Check if already starred
    const existing = await prisma.starred.findUnique({
      where: {
        userId_diagramId: {
          userId: user.id,
          diagramId: diagramId,
        },
      },
    });

    if (existing) {
      return existing; // Already starred
    }

    // Create starred record
    const starred = await prisma.starred.create({
      data: {
        userId: user.id,
        diagramId: diagramId,
      },
    });

    return starred;
  } catch (error) {
    console.error("Failed to star diagram:", error);
    throw error;
  }
}

export { starDiagram };
