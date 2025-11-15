"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "../user";
import type { DiagramWithRelations } from "@/types/diagram";

/**
 * Get a diagram by ID with all relations
 * @param diagramId - Diagram ID
 * @returns Diagram with relations or null
 */
async function getDiagramById(
  diagramId: string
): Promise<DiagramWithRelations | null> {
  const user = await getCurrentUser();

  if (!user || !user.id) {
    return null;
  }

  try {
    const diagram = await prisma.diagram.findUnique({
      where: { id: diagramId },
      include: {
        team: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        shares: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
        starreds: {
          select: {
            userId: true,
          },
        },
      },
    });

    return diagram;
  } catch (error) {
    console.error("Failed to get diagram by ID:", error);
    return null;
  }
}

export { getDiagramById };
