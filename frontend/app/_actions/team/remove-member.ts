"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "../user";
import { canEditTeam } from "./permission";
import { Permission } from "@/generated/prisma/client";

/**
 * Remove a member from a team
 * Only OWNER and EDITOR have permission to remove members
 * Cannot remove the last OWNER
 * Cannot remove yourself if you're the only OWNER
 * @param teamId - Team ID
 * @param userId - User ID to remove
 * @returns true if successful, false otherwise
 */
async function removeMember(
  teamId: string,
  userId: string
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
      error: "You don't have permission to remove members",
    };
  }

  try {
    // Get member to remove
    const memberToRemove = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: teamId,
          userId: userId,
        },
      },
    });

    if (!memberToRemove) {
      return { success: false, error: "Member not found" };
    }

    // If removing an OWNER, check if it's the last OWNER
    if (memberToRemove.permission === Permission.OWNER) {
      const ownerCount = await prisma.teamMember.count({
        where: {
          teamId: teamId,
          permission: Permission.OWNER,
        },
      });

      if (ownerCount <= 1) {
        return {
          success: false,
          error: "Cannot remove the last owner of the team",
        };
      }

      // If removing yourself and you're the only OWNER, prevent it
      if (userId === user.id && ownerCount === 1) {
        return {
          success: false,
          error: "Cannot remove yourself as the only owner",
        };
      }
    }

    // Remove the member
    await prisma.teamMember.delete({
      where: {
        teamId_userId: {
          teamId: teamId,
          userId: userId,
        },
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to remove member:", error);
    return { success: false, error: "Failed to remove member" };
  }
}

export { removeMember };
