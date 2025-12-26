"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "../user";
import { deleteFileFromS3, deleteFilesFromS3 } from "@/lib/file-upload-handler";
import { deleteChatHistory } from "../chat/delete-history";
import { deleteDiagramStore } from "../chat/delete-store";

const LIVEBLOCKS_SECRET_KEY =
  "sk_prod_FnBVxnhHqxg4RSN1zvKMWpwL4OTTNBltGnhP_ltdeNZ657mx_vI7KjbvOsBcNgv4";

/**
 * Delete a room from Liveblocks
 * @param roomId - Room ID to delete
 * @returns true if successful, false otherwise
 */
async function deleteLiveblocksRoom(roomId: string): Promise<boolean> {
  try {
    // Delete room using Liveblocks REST API
    const response = await fetch(
      `https://api.liveblocks.io/v2/rooms/${roomId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${LIVEBLOCKS_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    // Room might not exist, which is okay (404 is acceptable)
    if (response.ok || response.status === 404) {
      return true;
    }

    console.error(
      `Failed to delete Liveblocks room: ${response.status} ${response.statusText}`
    );
    return false;
  } catch (error) {
    console.error("Error deleting Liveblocks room:", error);
    // Don't fail the entire operation if Liveblocks deletion fails
    return false;
  }
}

/**
 * Permanently delete a diagram from trash
 * @param diagramId - Diagram ID to permanently delete
 * @returns true if successful, false otherwise
 */
async function permanentDeleteDiagram(diagramId: string): Promise<boolean> {
  const user = await getCurrentUser();

  if (!user || !user.id) {
    return false;
  }

  try {
    // Check if trash record exists and belongs to current user
    const trash = await prisma.trash.findUnique({
      where: { diagramId: diagramId },
      select: { deletedById: true },
    });

    if (!trash || trash.deletedById !== user.id) {
      return false;
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
        console.error(`Failed to delete file from S3: ${file.fileUrl}`, error);
        // Continue with deletion even if S3 deletion fails
      }
    }

    // Delete the Liveblocks room (room ID is the diagram ID)
    await deleteLiveblocksRoom(diagramId);

    // Delete chat history and store for this diagram
    try {
      await deleteChatHistory(diagramId);
    } catch (error) {
      console.error("Failed to delete chat history:", error);
      // Continue even if chat history deletion fails
    }

    try {
      await deleteDiagramStore(diagramId);
    } catch (error) {
      console.error("Failed to delete diagram store:", error);
      // Continue even if store deletion fails
    }

    // Delete the diagram (cascade will delete trash record and files from DB)
    await prisma.diagram.delete({
      where: { id: diagramId },
    });

    return true;
  } catch (error) {
    console.error("Failed to permanently delete diagram:", error);
    return false;
  }
}

/**
 * Permanently delete a folder from trash
 * @param folderId - Folder ID to permanently delete
 * @returns true if successful, false otherwise
 */
async function permanentDeleteFolder(folderId: string): Promise<boolean> {
  const user = await getCurrentUser();

  if (!user || !user.id) {
    return false;
  }

  try {
    // Check if trash record exists and belongs to current user
    const trash = await prisma.trash.findUnique({
      where: { folderId: folderId },
      select: { deletedById: true },
    });

    if (!trash || trash.deletedById !== user.id) {
      return false;
    }

    // Get all diagrams in this folder
    const diagrams = await prisma.diagram.findMany({
      where: { folderId: folderId },
      select: { id: true },
    });

    // For each diagram, delete its files from S3 and Liveblocks room
    for (const diagram of diagrams) {
      try {
        // Get all files for this diagram
        const files = await prisma.file.findMany({
          where: { diagramId: diagram.id },
          select: { fileUrl: true },
        });

        // Delete files from S3
        const success = await deleteFilesFromS3(
          files.map((file) => file.fileUrl)
        );
        if (!success) {
          console.error(
            `Failed to delete files from S3: ${files
              .map((file) => file.fileUrl)
              .join(", ")}`
          );
          return false;
        }

        // Delete the Liveblocks room (room ID is the diagram ID)
        const liveblocksSuccess = await deleteLiveblocksRoom(diagram.id);
        if (!liveblocksSuccess) {
          console.error(`Failed to delete Liveblocks room: ${diagram.id}`);
          return false;
        }

        // Delete chat history and store for this diagram
        try {
          await deleteChatHistory(diagram.id);
        } catch (error) {
          console.error(
            `Failed to delete chat history for diagram ${diagram.id}:`,
            error
          );
          // Continue even if chat history deletion fails
        }

        try {
          await deleteDiagramStore(diagram.id);
        } catch (error) {
          console.error(
            `Failed to delete diagram store for diagram ${diagram.id}:`,
            error
          );
          // Continue even if store deletion fails
        }
      } catch (error) {
        console.error(
          `Failed to delete diagram ${diagram.id} resources:`,
          error
        );
        return false;
      }
    }

    // Delete the folder (cascade will delete trash record, children, and diagrams)
    await prisma.folder.delete({
      where: { id: folderId },
    });

    return true;
  } catch (error) {
    console.error("Failed to permanently delete folder:", error);
    return false;
  }
}

export { permanentDeleteDiagram, permanentDeleteFolder };
