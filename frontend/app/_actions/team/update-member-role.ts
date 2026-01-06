"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "../user";
import { canEditTeam } from "./permission";
import { Permission } from "@/generated/prisma/client";

/**
 * Update a member's role/permission in a team
 * Only OWNER and EDITOR have permission to update member roles
 * Cannot change the last OWNER's role
 * @param teamId - Team ID
 * @param userId - User ID to update
 * @param permission - New permission level
 * @returns true if successful, false otherwise
 */
async function updateMemberRole(
  teamId: string,
  userId: string,
  permission: Permission
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();

  if (!user || !user.id) {
    return { success: false, error: "Unauthorized" };
  }

  // Check edit permission
  const hasPermission = await canEditTeam(teamId);
  if (!hasPermission) {
    return {
      success: false,
      error: "You don't have permission to update member roles",
    };
  }

  try {
    // Get current member
    const member = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: teamId,
          userId: userId,
        },
      },
    });

    if (!member) {
      return { success: false, error: "Member not found" };
    }

    // If changing from OWNER to something else, check if it's the last OWNER
    if (
      member.permission === Permission.OWNER &&
      permission !== Permission.OWNER
    ) {
      const ownerCount = await prisma.teamMember.count({
        where: {
          teamId: teamId,
          permission: Permission.OWNER,
        },
      });

      if (ownerCount <= 1) {
        return {
          success: false,
          error: "Cannot change the last owner's role",
        };
      }
    }

    // Update member permission
    await prisma.teamMember.update({
      where: {
        teamId_userId: {
          teamId: teamId,
          userId: userId,
        },
      },
      data: {
        permission: permission,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to update member role:", error);
    return { success: false, error: "Failed to update member role" };
  }
}

export { updateMemberRole };
