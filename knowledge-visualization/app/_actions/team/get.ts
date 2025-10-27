"use server";

import { prisma } from "@/lib/prisma";
import { Team } from "@prisma/client";
import { getCurrentUser } from "../user";

async function getTeams(): Promise<Team[] | null> {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  try {
    const teams = await prisma.team.findMany({
      where: {
        members: {
          some: {
            userId: user.id!,
          },
        },
      },
    });
    return teams;
  } catch (error) {
    console.error("Failed to get teams:", error);
    return null;
  }
}

export { getTeams };
