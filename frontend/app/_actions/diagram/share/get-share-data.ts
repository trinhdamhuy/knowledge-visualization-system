"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "../../user";
import { Permission } from "@/generated/prisma/client";
import { liveblocks } from "@/lib/liveblocks";

export interface ShareData {
  diagramId: string;
  teamId: string | null;
  teamName: string | null;
  privacyType: "restricted" | "view" | "edit";
  teamPermission: Permission | null;
  shares: Array<{
    id: string;
    userId: string;
    userName: string | null;
    userEmail: string | null;
    userImage: string | null;
    permission: Permission;
  }>;
}

/**
 * Convert Liveblocks room permissions to application Permission
 * @param permissions - Liveblocks permissions array
 * @returns Permission (VIEWER, EDITOR) or null if no access
 */
function parseLiveblocksPermissions(
  permissions: readonly string[] | null
): Permission | null {
  if (!permissions || permissions.length === 0) {
    return null;
  }

  // If has room:write, it's WRITE (EDITOR)
  if (permissions.includes("room:write")) {
    return Permission.EDITOR;
  }

  // If has room:read (and possibly room:presence:write), it's VIEW (VIEWER)
  if (permissions.includes("room:read")) {
    return Permission.VIEWER;
  }

  return null;
}

/**
 * Get team permission from Liveblocks room
 * @param roomId - Room ID (diagram ID)
 * @param teamId - Team ID
 * @returns Permission or null if no access
 */
async function getTeamPermissionFromLiveblocks(
  roomId: string,
  teamId: string
): Promise<Permission | null> {
  try {
    // Get room info from Liveblocks
    const room = await liveblocks.getRoom(roomId);

    if (!room || !room.groupsAccesses) {
      return null;
    }

    // Get team's access permissions
    const teamAccess = room.groupsAccesses[teamId];

    if (!teamAccess) {
      return null;
    }

    // Convert Liveblocks permissions to application Permission
    return parseLiveblocksPermissions(teamAccess);
  } catch (error) {
    console.error("Failed to get team permission from Liveblocks:", error);
    return null;
  }
}

/**
 * Get share data for a diagram
 * @param diagramId - Diagram ID
 * @returns Share data or null if not found or no permission
 */
export async function getShareData(
  diagramId: string
): Promise<ShareData | null> {
  const user = await getCurrentUser();
  if (!user || !user.id) {
    return null;
  }

  try {
    const diagram = await prisma.diagram.findUnique({
      where: { id: diagramId },
      select: {
        id: true,
        ownerId: true,
        teamId: true,
        team: {
          select: {
            id: true,
            name: true,
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

    if (!diagram) {
      return null;
    }

    // Only owner can view share settings
    if (diagram.ownerId !== user.id) {
      return null;
    }

    // Get team permission from Liveblocks instead of TeamMember
    let teamPermission: Permission | null = null;
    if (diagram.teamId) {
      teamPermission = await getTeamPermissionFromLiveblocks(
        diagramId,
        diagram.teamId
      );
    }

    // Get privacy type from defaultAccesses
    let privacyType: "restricted" | "view" | "edit" = "restricted";
    try {
      const room = await liveblocks.getRoom(diagramId);
      if (
        room?.defaultAccesses &&
        Array.isArray(room.defaultAccesses) &&
        room.defaultAccesses.length > 0
      ) {
        // Check if defaultAccesses has room:write (edit) or room:read (view)
        if (
          room.defaultAccesses.some((perm: string) => perm === "room:write")
        ) {
          privacyType = "edit";
        } else {
          privacyType = "view";
        }
      } else {
        // No default access, it's restricted
        privacyType = "restricted";
      }
    } catch (error) {
      console.error("Failed to get privacy type from Liveblocks:", error);
      // Fallback: restricted
      privacyType = "restricted";
    }

    return {
      diagramId: diagram.id,
      teamId: diagram.teamId,
      teamName: diagram.team?.name ?? null,
      privacyType,
      teamPermission,
      shares: diagram.shares.map((share) => ({
        id: share.id,
        userId: share.userId ?? "",
        userName: share.user?.name ?? null,
        userEmail: share.user?.email ?? null,
        userImage: share.user?.image ?? null,
        permission: share.permission,
      })),
    };
  } catch (error) {
    console.error("Failed to get share data:", error);
    return null;
  }
}
