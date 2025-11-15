"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "../user";
import type {
  GetTrashItemsParams,
  GetTrashItemsResult,
  TrashItem,
} from "@/types/trash";

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
    const { page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

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
        },
        folder: {
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
        },
        deletedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: {
        deletedAt: "desc",
      },
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
    const items: TrashItem[] = trashRecords
      .map((trash) => {
        if (trash.diagram) {
          return {
            type: "diagram" as const,
            ...trash.diagram,
            trash: {
              id: trash.id,
              deletedAt: trash.deletedAt,
              autoDeleteAt: trash.autoDeleteAt,
              deletedBy: trash.deletedBy,
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
              deletedBy: trash.deletedBy,
            },
          };
        }
        return null;
      })
      .filter((item): item is TrashItem => item !== null);

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

