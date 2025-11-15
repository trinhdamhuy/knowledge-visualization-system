"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "../user";
import { Prisma } from "@prisma/client";
import type { GetFoldersParams, GetFoldersResult } from "@/types/folder";

/**
 * Get folders with pagination
 * @param params - Query parameters
 * @returns Paginated folders result
 */
async function getFolders(
  params: GetFoldersParams = {}
): Promise<GetFoldersResult | null> {
  const user = await getCurrentUser();

  if (!user || !user.id) {
    return null;
  }

  try {
    const {
      parentId = null,
      ownerId = null,
      page = 1,
      limit = 20,
      sortBy = "updatedAt",
      sortDirection = "desc",
    } = params;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.FolderWhereInput = {
      trash: null, // Exclude trashed folders
      parentId: parentId ?? null,
    };

    // If ownerId is provided, filter by owner (for my-diagrams)
    if (ownerId === "current") {
      where.ownerId = user.id;
    } else if (ownerId) {
      where.ownerId = ownerId;
    } else {
      // For home page: show all folders that user has permission to view
      // User can see folders if:
      // 1. User is the owner
      // 2. Folder is shared with user
      // 3. Folder belongs to a team where user is a member
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
    const total = await prisma.folder.count({ where });

    // Build orderBy clause
    const orderBy: Prisma.FolderOrderByWithRelationInput = {};
    if (sortBy === "name") {
      orderBy.name = sortDirection;
    } else if (sortBy === "createdAt") {
      orderBy.createdAt = sortDirection;
    } else {
      orderBy.updatedAt = sortDirection;
    }

    // Get folders with relations
    const folders = await prisma.folder.findMany({
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
      },
    });

    return {
      folders,
      hasMore: skip + folders.length < total,
      total,
    };
  } catch (error) {
    console.error("Failed to get folders:", error);
    return null;
  }
}

export { getFolders };
