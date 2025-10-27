"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "../user";
import { Team } from "@prisma/client";

async function updateTeam(
  teamId: string,
  data: Partial<Team>
): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) {
    return false;
  }

  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) {
    return false;
  }

  if (team.ownerId !== user.id) {
    return false;
  }

  try {
    await prisma.team.update({ where: { id: teamId }, data: data });
    return true;
  } catch (error) {
    console.error("Failed to update team:", error);
    return false;
  }
}

export { updateTeam };
