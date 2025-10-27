"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "../user";
import { Team } from "@prisma/client";

async function createTeam(
  name: string,
  imageUrl: string
): Promise<Team | null> {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  try {
    const team = await prisma.team.create({
      data: {
        name: name,
        imageUrl: imageUrl,
        ownerId: user.id!,
      },
    });
    return team;
  } catch (error) {
    console.error("Failed to create team:", error);
    return null;
  }
}

export { createTeam };
