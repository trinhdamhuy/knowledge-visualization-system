"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "../user";
import { Team, Permission } from "@prisma/client";

async function createTeam(
  name: string,
  imageUrl: string
): Promise<Team | null> {
  const user = await getCurrentUser();

  if (!user || !user.id) {
    return null;
  }

  try {
    const team = await prisma.team.create({
      data: {
        name: name,
        imageUrl: imageUrl ? imageUrl : user.image || null,
        members: {
          create: {
            userId: user.id,
            permission: Permission.OWNER,
          },
        },  
      },
    });

    return team;
  } catch (error) {
    console.error("Failed to create team:", error);
    return null;
  }
}

/**
 * Create a default team for user if they don't have any team yet
 * @param userId - User ID
 * @param userName - User name (used as default team name)
 * @param userImage - User image (used as default team image)
 * @returns Team | null
 */
async function createDefaultTeam(
  userId: string,
  userName?: string | null,
  userImage?: string | null
): Promise<Team | null> {
  try {
    // Check if user already has any teams
    const existingTeams = await prisma.team.findMany({
      where: {
        members: {
          some: {
            userId: userId,
          },
        },
      },
    });

    // If user already has teams, don't create default team
    if (existingTeams.length > 0) {
      return null;
    }

    // Create default team
    const defaultTeamName = userName ? `${userName}'s Team` : "My Team";

    const team = await prisma.team.create({
      data: {
        name: defaultTeamName,
        imageUrl: userImage || null,
        members: {
          create: {
            userId: userId,
            permission: Permission.OWNER,
          },
        },
      },
    });

    return team;
  } catch (error) {
    console.error("Failed to create default team:", error);
    return null;
  }
}

export { createTeam, createDefaultTeam };
