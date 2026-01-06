"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "../user";
import { FullTeam } from "@/types/team";

/**
 * Get team with all members and their user information
 * @param teamId - Team ID
 * @returns FullTeam with members or null if not found or user doesn't have access
 */
async function getTeamMembers(teamId: string): Promise<FullTeam | null> {
  const user = await getCurrentUser();

  if (!user || !user.id) {
    return null;
  }

  try {
    // Check if user is a member of the team
    const teamMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: teamId,
          userId: user.id,
        },
      },
    });

    if (!teamMember) {
      return null;
    }

    // Fetch team with all members and their user information
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
                email: true,
              },
            },
          },
          orderBy: {
            joinedAt: "asc",
          },
        },
      },
    });

    if (!team) {
      return null;
    }

    return team as FullTeam;
  } catch (error) {
    console.error("Failed to get team members:", error);
    return null;
  }
}

export { getTeamMembers };
