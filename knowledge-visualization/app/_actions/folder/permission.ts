"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "../user";
import { Permission } from "@prisma/client";

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
 * Get the role (permission) of the current user for a folder
 * User can have permissions from multiple sources:
 * 1. Is the owner of the folder → OWNER
 * 2. Has been shared with a specific permission
 * 3. Is a member of the team (if folder belongs to a team) with a specific permission
 *
 * The function returns the highest permission from the above sources
 * @param folderId - Folder ID
 * @returns Permission (OWNER, EDITOR, VIEWER) or null if no permission
 */
async function getFolderRole(folderId: string): Promise<Permission | null> {
  const user = await getCurrentUser();

  if (!user || !user.id) {
    return null;
  }

  try {
    // Get folder with necessary information
    const folder = await prisma.folder.findUnique({
      where: { id: folderId },
      select: {
        ownerId: true,
        teamId: true,
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

    if (!folder) {
      return null;
    }

    let userRole: Permission | null = null;

    // 1. Check if user is the owner → OWNER
    if (folder.ownerId === user.id) {
      userRole = Permission.OWNER;
    }

    // 2. Check if user has been shared
    const sharePermission = folder.shares[0]?.permission;
    if (sharePermission) {
      userRole = getHighestPermission(userRole, sharePermission);
    }

    // 3. Check if folder belongs to a team and user is a member
    if (folder.teamId) {
      const teamMember = await prisma.teamMember.findUnique({
        where: {
          teamId_userId: {
            teamId: folder.teamId,
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

    return userRole;
  } catch (error) {
    console.error("Failed to get folder role:", error);
    return null;
  }
}

/**
 * Check if the user has permission to edit the folder (OWNER or EDITOR)
 * @param folderId - Folder ID
 * @returns true if user has edit permission, false otherwise
 */
async function canEditFolder(folderId: string): Promise<boolean> {
  const role = await getFolderRole(folderId);
  return role === Permission.OWNER || role === Permission.EDITOR;
}

/**
 * Check if the user has permission to view the folder (any role)
 * @param folderId - Folder ID
 * @returns true if user has view permission, false otherwise
 */
async function canViewFolder(folderId: string): Promise<boolean> {
  const role = await getFolderRole(folderId);
  return role !== null;
}

export { getFolderRole, canEditFolder, canViewFolder };
