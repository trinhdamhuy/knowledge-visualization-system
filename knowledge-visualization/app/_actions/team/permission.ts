"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "../user";
import { Permission } from "@prisma/client";

/**
 * Get the role (permission) of the current user in a team
 * @param teamId - Team ID
 * @returns Permission (OWNER, EDITOR, VIEWER) or null if not a member
 */
async function getTeamRole(teamId: string): Promise<Permission | null> {
  const user = await getCurrentUser();

  if (!user || !user.id) {
    return null;
  }

  try {
    const teamMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: teamId,
          userId: user.id,
        },
      },
      select: {
        permission: true,
      },
    });

    return teamMember?.permission || null;
  } catch (error) {
    console.error("Failed to get team role:", error);
    return null;
  }
}

/**
 * Check if the user has permission to edit the team (OWNER or EDITOR)
 * @param teamId - Team ID
 * @returns true if user has edit permission, false otherwise
 */
async function canEditTeam(teamId: string): Promise<boolean> {
  const role = await getTeamRole(teamId);
  return role === Permission.OWNER || role === Permission.EDITOR;
}

export { getTeamRole, canEditTeam };
