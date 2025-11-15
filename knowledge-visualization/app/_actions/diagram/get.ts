"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "../user";
import { Prisma } from "@prisma/client";
import type {
  DiagramWithRelations,
  GetDiagramsParams,
  GetDiagramsResult,
} from "@/types/diagram";

/**
 * Get diagrams with pagination
 * @param params - Query parameters
 * @returns Paginated diagrams result
 */
async function getDiagrams(
  params: GetDiagramsParams = {}
): Promise<GetDiagramsResult | null> {
  const user = await getCurrentUser();

  if (!user || !user.id) {
    return null;
  }

  try {
    const {
      folderId = null,
      ownerId = null,
      page = 1,
      limit = 20,
      sortBy = "updatedAt",
      sortDirection = "desc",
    } = params;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.DiagramWhereInput = {
      trash: null, // Exclude trashed diagrams
      folderId: folderId ?? null,
    };

    // If ownerId is provided, filter by owner (for my-diagrams)
    if (ownerId === "current") {
      where.ownerId = user.id;
    } else if (ownerId) {
      where.ownerId = ownerId;
    } else {
      // For home page: show all diagrams that user has permission to view
      // User can see diagrams if:
      // 1. User is the owner
      // 2. Diagram is shared with user
      // 3. Diagram belongs to a team where user is a member
      where.OR = [
        { ownerId: user.id },
        { shares: { some: { userId: user.id } } },
        {
          teamId: { not: null },
          team: {
            members: {
              some: {
                userId: user.id,
              },
            },
          },
        },
      ];
    }

    // Get total count
    const total = await prisma.diagram.count({ where });

    // Build orderBy clause
    const orderBy: Prisma.DiagramOrderByWithRelationInput = {};
    if (sortBy === "title") {
      orderBy.title = sortDirection;
    } else if (sortBy === "createdAt") {
      orderBy.createdAt = sortDirection;
    } else {
      orderBy.updatedAt = sortDirection;
    }

    // Get diagrams with relations
    const diagrams = await prisma.diagram.findMany({
      where,
      skip,
      take: limit,
      orderBy,
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

    return {
      diagrams,
      hasMore: skip + diagrams.length < total,
      total,
    };
  } catch (error) {
    console.error("Failed to get diagrams:", error);
    return null;
  }
}

export { getDiagrams };
