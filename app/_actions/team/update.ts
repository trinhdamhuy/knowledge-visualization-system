"use server";

import { prisma } from "@/lib/prisma";
import { canEditTeam } from "./permission";
import { Team } from "@/generated/prisma/client";

/**
 * Update a team
 * Only OWNER and EDITOR have permission to update a team
 * @param teamId - Team ID to update
 * @param data - Update data (name, imageUrl)
 * @returns true if successful, false otherwise
 */
async function updateTeam(
  teamId: string,
  data: Partial<Pick<Team, "name" | "imageUrl">>
): Promise<boolean> {
  // Check edit permission
  const hasPermission = await canEditTeam(teamId);
  if (!hasPermission) {
    return false;
  }

  try {
    // Check if team exists
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          select: {
            userId: true,
          },
        },
      },
    });
    if (!team) {
      return false;
    }

    // Check for duplicate team name if name is being updated
    if (data.name !== undefined && data.name !== team.name) {
      // Get all user IDs that are members of this team
      const memberUserIds = team.members.map((m) => m.userId);

      // Check if any member already has a team with this name
      const existingTeam = await prisma.team.findFirst({
        where: {
          name: data.name,
          members: {
            some: {
              userId: { in: memberUserIds },
            },
          },
          id: { not: teamId }, // Exclude current team
        },
      });

      if (existingTeam) {
        throw new Error("A team member already has a team with this name");
      }
    }

    await prisma.team.update({ where: { id: teamId }, data: data });
    return true;
  } catch (error) {
    console.error("Failed to update team:", error);
    return false;
  }
}

export { updateTeam };
