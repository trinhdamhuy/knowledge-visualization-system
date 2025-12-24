"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "../../user";
import { Prisma } from "@/generated/prisma/client";
import type {
  GetSharedDiagramsParams,
  GetSharedDiagramsResult,
} from "@/types/shared";

/**
 * Get shared diagrams with pagination
 * Returns diagrams that are shared with the current user but not owned by them
 * @param params - Query parameters
 * @returns Paginated shared diagrams result
 */
async function getSharedDiagrams(
  params: GetSharedDiagramsParams = {}
): Promise<GetSharedDiagramsResult | null> {
  const user = await getCurrentUser();

  if (!user || !user.id) {
    return null;
  }

  try {
    const {
      page = 1,
      limit = 20,
      sortBy = "updatedAt",
      sortDirection = "desc",
    } = params;

    const skip = (page - 1) * limit;

    // Build where clause - diagrams shared with user but NOT owned by user
    // Ensure owner exists to display owner avatar
    const where: Prisma.DiagramWhereInput = {
      trash: null, // Exclude trashed diagrams
      ownerId: { not: user.id }, // Exclude diagrams owned by user
      owner: { isNot: null }, // Ensure owner exists to display avatar
      OR: [
        // Direct share via Share table
        { shares: { some: { userId: user.id } } },
        // Team membership - diagram belongs to a team where user is a member
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
        // Folder share - diagram is in a folder that is shared with user
        {
          folderId: { not: null },
          folder: {
            shares: {
              some: {
                userId: user.id,
              },
            },
          },
        },
      ],
    };

    // Get total count
    const total = await prisma.diagram.count({ where });

    // Build orderBy clause
    const orderBy: Prisma.DiagramOrderByWithRelationInput = {};
    if (sortBy === "name") {
      orderBy.name = sortDirection;
    } else if (sortBy === "createdAt") {
      orderBy.createdAt = sortDirection;
    } else if (sortBy === "sharedAt") {
      // For sharedAt, we need to sort by the Share table's sharedAt
      // This is more complex, so we'll fetch shares first and sort manually
      // For now, fallback to updatedAt
      orderBy.updatedAt = sortDirection;
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

    // If sorting by sharedAt, sort by the most recent share date
    let sortedDiagrams = diagrams;
    if (sortBy === "sharedAt") {
      sortedDiagrams = [...diagrams].sort((a, b) => {
        // Get the most recent share date for each diagram
        const aShareDate = a.shares
          .filter((s) => s.userId === user.id)
          .map((s) => s.sharedAt)
          .sort((d1, d2) => d2.getTime() - d1.getTime())[0];

        const bShareDate = b.shares
          .filter((s) => s.userId === user.id)
          .map((s) => s.sharedAt)
          .sort((d1, d2) => d2.getTime() - d1.getTime())[0];

        // If no share date, use updatedAt as fallback
        const aDate = aShareDate || a.updatedAt;
        const bDate = bShareDate || b.updatedAt;

        if (sortDirection === "desc") {
          return bDate.getTime() - aDate.getTime();
        } else {
          return aDate.getTime() - bDate.getTime();
        }
      });
    }

    return {
      diagrams: sortedDiagrams,
      hasMore: skip + sortedDiagrams.length < total,
      total,
    };
  } catch (error) {
    console.error("Failed to get shared diagrams:", error);
    return null;
  }
}

export { getSharedDiagrams };
