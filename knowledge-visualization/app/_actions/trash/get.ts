"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "../user";
import type {
  GetTrashItemsParams,
  GetTrashItemsResult,
  TrashItem,
} from "@/types/trash";
import { Prisma } from "@prisma/client";

/**
 * Get trash items (folders and diagrams) with pagination
 * Only shows items deleted by the current user
 * @param params - Query parameters
 * @returns Paginated trash items result
 */
async function getTrashItems(
  params: GetTrashItemsParams = {}
): Promise<GetTrashItemsResult | null> {
  const user = await getCurrentUser();

  if (!user || !user.id) {
    return null;
  }

  try {
    const {
      page = 1,
      limit = 20,
      sortBy = "deletedAt",
      sortDirection = "desc",
    } = params;
    const skip = (page - 1) * limit;

    // Map sortBy to Prisma orderBy field
    // For deletedAt, we can sort directly on trash table
    // For other fields, we need to sort on the related diagram/folder
    let orderByField: Prisma.TrashOrderByWithRelationInput;
    if (sortBy === "deletedAt") {
      orderByField = { deletedAt: sortDirection };
    } else if (sortBy === "title") {
      // Sort by diagram title or folder name
      // We'll sort by deletedAt first, then sort in application layer
      orderByField = { deletedAt: sortDirection };
    } else if (sortBy === "createdAt") {
      // Sort by diagram or folder createdAt
      orderByField = { deletedAt: sortDirection };
    } else if (sortBy === "updatedAt") {
      // Sort by diagram or folder updatedAt
      orderByField = { deletedAt: sortDirection };
    } else {
      orderByField = { deletedAt: sortDirection };
    }

    const userSelect: Prisma.UserSelect = {
      id: true,
      name: true,
      email: true,
      image: true,
    };

    // Get trash records for current user
    const trashRecords = await prisma.trash.findMany({
      where: {
        deletedById: user.id,
      },
      include: {
        diagram: {
          include: {
            team: true,
            owner: {
              select: userSelect,
            },
            shares: {
              include: {
                user: {
                  select: userSelect,
                },
              },
            },
            starreds: {
              select: {
                userId: true,
              },
            },
          },
        },
        folder: {
          include: {
            team: true,
            owner: {
              select: userSelect,
            },
            shares: {
              include: {
                user: {
                  select: userSelect,
                },
              },
            },
          },
        },
        deletedBy: {
          select: userSelect,
        },
      },
      orderBy: orderByField,
      skip,
      take: limit,
    });

    // Get total count
    const total = await prisma.trash.count({
      where: {
        deletedById: user.id,
      },
    });

    // Transform to TrashItem format
    let items: TrashItem[] = trashRecords
      .map((trash): TrashItem | null => {
        if (trash.diagram) {
          return {
            type: "diagram" as const,
            ...trash.diagram,
            trash: {
              id: trash.id,
              deletedAt: trash.deletedAt,
              autoDeleteAt: trash.autoDeleteAt,
            },
          };
        } else if (trash.folder) {
          return {
            type: "folder" as const,
            ...trash.folder,
            trash: {
              id: trash.id,
              deletedAt: trash.deletedAt,
              autoDeleteAt: trash.autoDeleteAt,
            },
          };
        }
        return null;
      })
      .filter((item): item is TrashItem => item !== null);

    // Sort in application layer for fields that require sorting by diagram/folder properties
    if (sortBy !== "deletedAt") {
      items = items.sort((a, b) => {
        let aValue: string | Date;
        let bValue: string | Date;

        if (sortBy === "title") {
          aValue = a.type === "diagram" ? a.name : a.name;
          bValue = b.type === "diagram" ? b.name : b.name;
        } else if (sortBy === "createdAt") {
          aValue = a.createdAt;
          bValue = b.createdAt;
        } else if (sortBy === "updatedAt") {
          aValue = a.updatedAt;
          bValue = b.updatedAt;
        } else {
          return 0;
        }

        // Compare values
        if (aValue < bValue) {
          return sortDirection === "asc" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortDirection === "asc" ? 1 : -1;
        }
        return 0;
      });
    }

    return {
      items,
      hasMore: skip + items.length < total,
      total,
    };
  } catch (error) {
    console.error("Failed to get trash items:", error);
    return null;
  }
}

export { getTrashItems };
