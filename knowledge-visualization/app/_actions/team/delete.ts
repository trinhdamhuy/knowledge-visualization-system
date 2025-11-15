"use server";

import { prisma } from "@/lib/prisma";
import { getTeamRole } from "./permission";
import { Permission } from "@prisma/client";

/**
 * Delete a team
 * Only OWNER has permission to delete a team
 * @param teamId - Team ID to delete
 * @returns true if successful, false otherwise
 */
async function deleteTeam(teamId: string): Promise<boolean> {
  // Only OWNER has permission to delete a team
  const role = await getTeamRole(teamId);
  if (role !== Permission.OWNER) {
    return false;
  }

  try {
    // Check if team exists
    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (!team) {
      return false;
    }

    await prisma.team.delete({ where: { id: teamId } });
    return true;
  } catch (error) {
    console.error("Failed to delete team:", error);
    return false;
  }
}

export { deleteTeam };
