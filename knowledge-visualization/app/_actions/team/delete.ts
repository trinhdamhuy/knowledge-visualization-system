"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "../user";

async function deleteTeam(teamId: string): Promise<boolean> {
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
    await prisma.team.delete({ where: { id: teamId } });
    return true;
  } catch (error) {
    console.error("Failed to delete team:", error);
    return false;
  }
}

export { deleteTeam };