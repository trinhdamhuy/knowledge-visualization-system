"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "../../user";
import { Permission } from "@/generated/prisma/client";
import { liveblocks } from "@/lib/liveblocks";

export interface SaveShareSettingsParams {
  diagramId: string;
  privacyType: "restricted" | "view" | "edit";
  teamPermission: Permission | null; // null means restricted (no team access)
  userShares: Array<{
    userId: string;
    permission: Permission;
  }>;
}

/**
 * Convert application Permission to Liveblocks room permissions
 * @param permission - Application permission (VIEWER, EDITOR, or null)
 * @returns Liveblocks room permissions tuple or null
 */
function getLiveblocksPermissions(
  permission: Permission | null
): ["room:write"] | ["room:read", "room:presence:write"] | null {
  if (!permission) {
    return null; // No access
  }

  switch (permission) {
    case Permission.EDITOR:
      return ["room:write"];
    case Permission.VIEWER:
      return ["room:read", "room:presence:write"];
    default:
      return null;
  }
}

/**
 * Save share settings for a diagram
 * Updates team permission and user shares
 * Also updates Liveblocks room permissions
 * @param params - Share settings parameters
 * @returns true if successful, false otherwise
 */
export async function saveShareSettings(
  params: SaveShareSettingsParams
): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user || !user.id) {
    return false;
  }

  const { diagramId, privacyType, teamPermission, userShares } = params;

  try {
    // Check if user is the owner
    const diagram = await prisma.diagram.findUnique({
      where: { id: diagramId },
      select: {
        ownerId: true,
        teamId: true,
      },
    });

    if (!diagram || diagram.ownerId !== user.id) {
      return false;
    }

    // Determine defaultAccesses based on privacy type
    // Use tuple types to match Liveblocks RoomPermission type
    let defaultAccesses:
      | ["room:write"]
      | ["room:read", "room:presence:write"]
      | [] = [];
    if (privacyType === "view") {
      defaultAccesses = ["room:read", "room:presence:write"];
    } else if (privacyType === "edit") {
      defaultAccesses = ["room:write"];
    } else {
      // restricted: no default access
      defaultAccesses = [];
    }

    // Prepare room update data
    const roomUpdate: {
      defaultAccesses:
        | ["room:write"]
        | ["room:read", "room:presence:write"]
        | [];
      groupsAccesses?: Record<
        string,
        ["room:write"] | ["room:read", "room:presence:write"] | null
      >;
    } = {
      defaultAccesses,
    };

    // Update team permission on Liveblocks if diagram belongs to a team
    if (diagram.teamId) {
      const teamAccess = getLiveblocksPermissions(teamPermission);

      // Update Liveblocks room groupsAccesses for the team
      // This updates the team's access without touching TeamMember table
      roomUpdate.groupsAccesses = {
        [diagram.teamId]: teamAccess,
      };
    }

    // Update Liveblocks room with privacy and team settings
    await liveblocks.updateRoom(diagramId, roomUpdate);

    // Delete all existing shares for this diagram
    await prisma.share.deleteMany({
      where: { diagramId },
    });

    // Create new shares
    if (userShares.length > 0) {
      await prisma.share.createMany({
        data: userShares.map((share) => ({
          diagramId,
          userId: share.userId,
          permission: share.permission,
        })),
      });
    }

    // Update Liveblocks room permissions
    // This will be handled by the Liveblocks auth endpoint based on Share records
    // But we can trigger a refresh by updating the diagram
    await prisma.diagram.update({
      where: { id: diagramId },
      data: {
        updatedAt: new Date(),
      },
    });

    return true;
  } catch (error) {
    console.error("Failed to save share settings:", error);
    return false;
  }
}
