"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "../user";
import { getUserByEmail } from "../user/get";
import { canEditTeam } from "./permission";
import { Permission } from "@/generated/prisma/client";

/**
 * Invite a user to a team by email
 * Only OWNER and EDITOR have permission to invite members
 * @param teamId - Team ID
 * @param email - User email to invite
 * @param permission - Permission level (default: VIEWER)
 * @returns true if successful, false otherwise
 */
async function inviteMember(
  teamId: string,
  email: string,
  permission: Permission = Permission.VIEWER
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
      error: "You don't have permission to invite members",
    };
  }

  try {
    // Find user by email
    const invitedUser = await getUserByEmail(email);
    if (!invitedUser || !invitedUser.id) {
      return { success: false, error: "User not found" };
    }

    // Check if user is already a member
    const existingMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: teamId,
          userId: invitedUser.id,
        },
      },
    });

    if (existingMember) {
      return { success: false, error: "User is already a member of this team" };
    }

    // Check if team exists
    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      return { success: false, error: "Team not found" };
    }

    // Create team member
    await prisma.teamMember.create({
      data: {
        teamId: teamId,
        userId: invitedUser.id,
        permission: permission,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to invite member:", error);
    return { success: false, error: "Failed to invite member" };
  }
}

export { inviteMember };
