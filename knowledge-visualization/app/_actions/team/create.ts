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
        imageUrl: imageUrl ? imageUrl : user.image || null,
        ownerId: user.id!,
      },
    });
    return team;
  } catch (error) {
    console.error("Failed to create team:", error);
    return null;
  }
}

/**
 * Tạo team mặc định cho user nếu họ chưa có team nào
 * @param userId - ID của user
 * @param userName - Tên của user (dùng làm tên team mặc định)
 * @param userImage - Ảnh của user (dùng làm ảnh team mặc định)
 * @returns Team | null
 */
async function createDefaultTeam(
  userId: string,
  userName?: string | null,
  userImage?: string | null
): Promise<Team | null> {
  try {
    // Kiểm tra xem user đã có team nào chưa
    const existingTeams = await prisma.team.findMany({
      where: {
        members: {
          some: {
            userId: userId,
          },
        },
      },
    });

    // Nếu đã có team thì không tạo team mặc định
    if (existingTeams.length > 0) {
      return null;
    }

    // Tạo team mặc định
    const defaultTeamName = userName ? `${userName}'s Team` : "My Team";

    const team = await prisma.team.create({
      data: {
        name: defaultTeamName,
        imageUrl: userImage || null,
        ownerId: userId,
      },
    });

    // Thêm user vào team với quyền OWNER
    await prisma.teamMember.create({
      data: {
        teamId: team.id,
        userId: userId,
        permission: "OWNER",
      },
    });

    return team;
  } catch (error) {
    console.error("Failed to create default team:", error);
    return null;
  }
}

export { createTeam, createDefaultTeam };
