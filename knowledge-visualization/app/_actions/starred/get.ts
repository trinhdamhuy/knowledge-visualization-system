"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "../user";
import { Prisma } from "@prisma/client";
import type {
  GetStarredDiagramsParams,
  GetStarredDiagramsResult,
} from "@/types/starred";

/**
 * Get starred diagrams with pagination
 * @param params - Query parameters
 * @returns Paginated starred diagrams result
 */
async function getStarredDiagrams(
  params: GetStarredDiagramsParams = {}
): Promise<GetStarredDiagramsResult | null> {
  const user = await getCurrentUser();

  if (!user || !user.id) {
    return null;
  }

  try {
    const { page = 1, limit = 20 } = params;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.DiagramWhereInput = {
      trash: null, // Exclude trashed diagrams
      starreds: {
        some: {
          userId: user.id,
        },
      },
    };

    // Get total count
    const total = await prisma.diagram.count({ where });

    // Get starred records first to sort by starredAt
    const starredRecords = await prisma.starred.findMany({
      where: {
        userId: user.id,
        diagram: {
          trash: null,
        },
      },
      orderBy: {
        starredAt: "desc",
      },
      skip,
      take: limit,
      select: {
        diagramId: true,
      },
    });

    const diagramIds = starredRecords.map((s) => s.diagramId);

    // Get diagrams with relations
    const diagrams = await prisma.diagram.findMany({
      where: {
        id: { in: diagramIds },
        trash: null,
      },
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

    // Sort diagrams to match the order of starredRecords
    const sortedDiagrams = diagramIds
      .map((id) => diagrams.find((d) => d.id === id))
      .filter((d): d is (typeof diagrams)[0] => d !== undefined);

    return {
      diagrams: sortedDiagrams,
      hasMore: skip + sortedDiagrams.length < total,
      total,
    };
  } catch (error) {
    console.error("Failed to get starred diagrams:", error);
    return null;
  }
}

/**
 * Check if a diagram is starred by current user
 * @param diagramId - Diagram ID
 * @returns true if starred, false otherwise
 */
async function isDiagramStarred(diagramId: string): Promise<boolean> {
  const user = await getCurrentUser();

  if (!user || !user.id) {
    return false;
  }

  try {
    const starred = await prisma.starred.findUnique({
      where: {
        userId_diagramId: {
          userId: user.id,
          diagramId: diagramId,
        },
      },
    });

    return !!starred;
  } catch (error) {
    console.error("Failed to check if diagram is starred:", error);
    return false;
  }
}

export { getStarredDiagrams, isDiagramStarred };
