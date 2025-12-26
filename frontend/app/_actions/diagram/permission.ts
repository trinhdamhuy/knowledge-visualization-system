"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "../user";
import { Permission } from "@/generated/prisma/client";
import { getLiveblocks } from "@/lib/liveblocks";

/**
 * Helper function to compare permissions and return the highest one
 * OWNER > EDITOR > VIEWER
 */
function getHighestPermission(
  perm1: Permission | null,
  perm2: Permission | null
): Permission | null {
  if (!perm1) return perm2;
  if (!perm2) return perm1;

  const priority = {
    [Permission.OWNER]: 3,
    [Permission.EDITOR]: 2,
    [Permission.VIEWER]: 1,
  };

  return priority[perm1] >= priority[perm2] ? perm1 : perm2;
}

/**
 * Get the role (permission) of the current user for a diagram
 * User can have permissions from multiple sources:
 * 1. Is the owner of the diagram → OWNER
 * 2. Has been shared with a specific permission
 * 3. Is a member of the team (if diagram belongs to a team) with a specific permission
 * 4. Has permission from the folder containing the diagram
 *
 * The function returns the highest permission from the above sources
 * @param diagramId - Diagram ID
 * @returns Permission (OWNER, EDITOR, VIEWER) or null if no permission
 */
async function getDiagramRole(diagramId: string): Promise<Permission | null> {
  const user = await getCurrentUser();

  if (!user || !user.id) {
    return null;
  }

  try {
    // Get diagram with necessary information
    const diagram = await prisma.diagram.findUnique({
      where: { id: diagramId },
      select: {
        ownerId: true,
        teamId: true,
        folderId: true,
        shares: {
          where: {
            userId: user.id,
          },
          select: {
            permission: true,
          },
        },
      },
    });

    if (!diagram) {
      return null;
    }

    let userRole: Permission | null = null;

    // 1. Check if user is the owner → OWNER
    if (diagram.ownerId === user.id) {
      userRole = Permission.OWNER;
    }

    // 2. Check if user has been shared
    const sharePermission = diagram.shares[0]?.permission;
    if (sharePermission) {
      userRole = getHighestPermission(userRole, sharePermission);
    }

    // 3. Check if diagram belongs to a team and user is a member
    if (diagram.teamId) {
      const teamMember = await prisma.teamMember.findUnique({
        where: {
          teamId_userId: {
            teamId: diagram.teamId,
            userId: user.id,
          },
        },
        select: {
          permission: true,
        },
      });

      if (teamMember) {
        userRole = getHighestPermission(userRole, teamMember.permission);
      }
    }

    // 4. Check if diagram belongs to a folder and user has permission from the folder
    if (diagram.folderId) {
      const { getFolderRole } = await import("../folder/permission");
      const folderRole = await getFolderRole(diagram.folderId);
      if (folderRole) {
        userRole = getHighestPermission(userRole, folderRole);
      }
    }

    return userRole;
  } catch (error) {
    console.error("Failed to get diagram role:", error);
    return null;
  }
}

/**
 * Check Liveblocks room access for anonymous users
 * @param diagramId - Diagram ID
 * @returns Object with view and edit permissions, or null if no access
 */
async function checkLiveblocksRoomAccess(diagramId: string): Promise<{
  canView: boolean;
  canEdit: boolean;
} | null> {
  try {
    const liveblocks = getLiveblocks();
    const roomInfo = await liveblocks.getRoom(diagramId);

    // Check if room has defaultAccesses (public access)
    if (!roomInfo?.defaultAccesses || roomInfo.defaultAccesses.length === 0) {
      return null;
    }

    const defaultAccesses = Array.isArray(roomInfo.defaultAccesses)
      ? roomInfo.defaultAccesses
      : [];

    const hasRead = defaultAccesses.some(
      (perm: string) => perm === "room:read" || perm === "room:presence:write"
    );
    const hasWrite = defaultAccesses.some(
      (perm: string) => perm === "room:write"
    );

    if (!hasRead && !hasWrite) {
      return null;
    }

    return {
      canView: hasRead || hasWrite,
      canEdit: hasWrite,
    };
  } catch (error) {
    console.error("Failed to check Liveblocks room access:", error);
    return null;
  }
}

/**
 * Check if the user has permission to edit the diagram (OWNER or EDITOR)
 * For anonymous users, checks Liveblocks room defaultAccesses with write permission
 * @param diagramId - Diagram ID
 * @returns true if user has edit permission, false otherwise
 */
async function canEditDiagram(diagramId: string): Promise<boolean> {
  const user = await getCurrentUser();

  // If user is authenticated, check database permissions
  if (user && user.id) {
    const role = await getDiagramRole(diagramId);
    return role === Permission.OWNER || role === Permission.EDITOR;
  }

  // If user is not authenticated, check Liveblocks room defaultAccesses
  const roomAccess = await checkLiveblocksRoomAccess(diagramId);
  return roomAccess?.canEdit ?? false;
}

/**
 * Check if the user has permission to view the diagram (any role)
 * For anonymous users, checks Liveblocks room defaultAccesses with read/write permission
 * @param diagramId - Diagram ID
 * @returns true if user has view permission, false otherwise
 */
async function canViewDiagram(diagramId: string): Promise<boolean> {
  const user = await getCurrentUser();

  // If user is authenticated, check database permissions
  if (user && user.id) {
    const role = await getDiagramRole(diagramId);
    return role !== null;
  }

  // If user is not authenticated, check Liveblocks room defaultAccesses
  const roomAccess = await checkLiveblocksRoomAccess(diagramId);
  return roomAccess?.canView ?? false;
}

export { getDiagramRole, canEditDiagram, canViewDiagram };
