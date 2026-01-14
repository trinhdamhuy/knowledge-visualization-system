"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "../../user";
import { getUserByEmail } from "../../user/get";
import { Permission } from "@/generated/prisma/client";
import { sendDiagramInvite } from "../../auth/send-invite";
import { getEnv } from "@/lib/get-env";

/**
 * Invite a user to a diagram by email
 * @param diagramId - Diagram ID
 * @param email - User email to invite
 * @param permission - Permission level (default: VIEWER)
 * @returns Success or error object
 */
export async function inviteUserToDiagram(
  diagramId: string,
  email: string,
  permission: Permission = Permission.VIEWER
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();

  if (!user || !user.id) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // Get diagram with name
    const diagram = await prisma.diagram.findUnique({
      where: { id: diagramId },
      select: {
        id: true,
        name: true,
        ownerId: true,
        owner: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!diagram) {
      return { success: false, error: "Diagram not found" };
    }

    // Check if user is the owner
    if (diagram.ownerId !== user.id) {
      return {
        success: false,
        error: "You don't have permission to invite users to this diagram",
      };
    }

    // Find user by email
    const invitedUser = await getUserByEmail(email);
    if (!invitedUser || !invitedUser.id) {
      return { success: false, error: "User not found" };
    }

    // Check if user is already shared
    const existingShare = await prisma.share.findFirst({
      where: {
        diagramId,
        userId: invitedUser.id,
      },
    });

    if (existingShare) {
      return {
        success: false,
        error: "User is already invited to this diagram",
      };
    }

    // Create share
    await prisma.share.create({
      data: {
        diagramId,
        userId: invitedUser.id,
        permission,
      },
    });

    // Send invitation email
    // Get base URL from environment or construct from request
    const baseUrl = getEnv("NEXT_PUBLIC_APP_URL") || "http://localhost:3000";
    const diagramUrl = `${baseUrl}/diagrams/${diagramId}`;
    const roleName =
      permission === Permission.OWNER
        ? "Owner"
        : permission === Permission.EDITOR
        ? "Editor"
        : "Viewer";
    const inviterName = user.name || "";

    await sendDiagramInvite(email, {
      username: inviterName,
      url: diagramUrl,
      role: roleName,
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to invite user to diagram:", error);
    return { success: false, error: "Failed to invite user" };
  }
}
