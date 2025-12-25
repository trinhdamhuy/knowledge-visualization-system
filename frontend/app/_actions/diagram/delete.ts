"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "../user";
import { getDiagramRole } from "./permission";
import { Permission } from "@/generated/prisma/client";
import { deleteFileFromS3 } from "@/lib/file-upload-handler";
import { deleteChatHistory } from "../chat/delete-history";
import { deleteDiagramStore } from "../chat/delete-store";

/**
 * Delete a Liveblocks room
 * @param roomId - Room ID to delete
 * @returns true if successful, false otherwise
 */
async function deleteLiveblocksRoom(roomId: string): Promise<boolean> {
  const liveblocksSecretKey = process.env.LIVEBLOCKS_SECRET_KEY!;
  if (!liveblocksSecretKey) {
    console.error("Missing Liveblocks Secret Key");
    return false;
  }
  try {
    const response = await fetch(
      `https://api.liveblocks.io/v2/rooms/${roomId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${liveblocksSecretKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.ok || response.status === 404) {
      return true;
    }

    console.error(
      `Failed to delete Liveblocks room: ${response.status} ${response.statusText}`
    );
    return false;
  } catch (error) {
    console.error("Error deleting Liveblocks room:", error);
    return false;
  }
}

/**
 * Delete diagrams (move to trash)
 * Only OWNER or EDITOR has permission to delete each diagram
 * @param diagramIds - Array of diagram IDs to delete (can be single item)
 * @returns Number of successfully deleted diagrams
 */
async function deleteDiagrams(diagramIds: string[]): Promise<number> {
  const user = await getCurrentUser();
  if (!user || !user.id) {
    return 0;
  }

  let successCount = 0;

  for (const diagramId of diagramIds) {
    try {
      // Only OWNER or EDITOR has permission to delete
      const role = await getDiagramRole(diagramId);
      if (role !== Permission.OWNER && role !== Permission.EDITOR) {
        continue;
      }

      // Check if diagram exists
      const diagram = await prisma.diagram.findUnique({
        where: { id: diagramId },
        select: { id: true, trash: true },
      });

      if (!diagram) {
        continue;
      }

      // If already in trash, skip
      if (diagram.trash) {
        successCount++;
        continue;
      }

      await prisma.trash.create({
        data: {
          diagramId: diagramId,
          deletedById: user.id,
        },
      });

      successCount++;
    } catch (error) {
      console.error(`Failed to delete diagram ${diagramId}:`, error);
      // Continue with other diagrams
    }
  }

  return successCount;
}

/**
 * Permanently delete diagrams (for undoing paste)
 * Only diagrams owned by current user can be permanently deleted
 * @param diagramIds - Array of diagram IDs to permanently delete
 * @returns Number of successfully deleted diagrams
 */
async function deleteDiagramsPermanently(
  diagramIds: string[]
): Promise<number> {
  const user = await getCurrentUser();
  if (!user || !user.id) {
    return 0;
  }

  let successCount = 0;

  for (const diagramId of diagramIds) {
    try {
      // Check if diagram exists and is owned by current user
      const diagram = await prisma.diagram.findUnique({
        where: { id: diagramId },
        select: { id: true, ownerId: true },
      });

      if (!diagram || diagram.ownerId !== user.id) {
        continue;
      }

      // Get all files associated with the diagram
      const files = await prisma.file.findMany({
        where: { diagramId: diagramId },
        select: { fileUrl: true },
      });

      // Delete files from S3
      for (const file of files) {
        try {
          await deleteFileFromS3(file.fileUrl);
        } catch (error) {
          console.error(
            `Failed to delete file from S3: ${file.fileUrl}`,
            error
          );
        }
      }

      // Delete the Liveblocks room
      await deleteLiveblocksRoom(diagramId);

      // Delete chat history and store
      try {
        await deleteChatHistory(diagramId);
      } catch (error) {
        console.error("Failed to delete chat history:", error);
      }

      try {
        await deleteDiagramStore(diagramId);
      } catch (error) {
        console.error("Failed to delete diagram store:", error);
      }

      // Delete the diagram
      await prisma.diagram.delete({
        where: { id: diagramId },
      });

      successCount++;
    } catch (error) {
      console.error(
        `Failed to permanently delete diagram ${diagramId}:`,
        error
      );
    }
  }

  return successCount;
}

export { deleteDiagrams, deleteDiagramsPermanently };
