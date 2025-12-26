"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "../user";
import { deleteFileFromS3, deleteFilesFromS3 } from "@/lib/file-upload-handler";
import { deleteChatHistory } from "../chat/delete-history";
import { deleteDiagramStore } from "../chat/delete-store";
import { getLiveblocks } from "@/lib/liveblocks";

/**
 * Delete a room from Liveblocks
 * @param roomId - Room ID to delete
 * @returns true if successful, false otherwise
 */
async function deleteLiveblocksRoom(roomId: string): Promise<boolean> {
  try {
    const liveblocks = getLiveblocks();
    await liveblocks.deleteRoom(roomId);
    return true;
  } catch (error) {
    // Room might not exist, which is okay.
    // The Liveblocks SDK throws for 404, so we swallow errors here.
    console.error("Error deleting Liveblocks room:", error);
    return false;
  }
}

async function deleteDiagramResources(diagramId: string) {
  // Get all files associated with the diagram
  const files = await prisma.file.findMany({
    where: { diagramId },
    select: { fileUrl: true },
  });

  // Delete files from S3
  const fileUrls = files.map((f) => f.fileUrl);
  if (fileUrls.length > 0) {
    try {
      const success = await deleteFilesFromS3(fileUrls);
      if (!success) {
        // Fallback to per-file deletion attempts (best-effort)
        for (const url of fileUrls) {
          try {
            await deleteFileFromS3(url);
          } catch (error) {
            console.error(`Failed to delete file from S3: ${url}`, error);
          }
        }
      }
    } catch (error) {
      // Best-effort cleanup; proceed with permanent deletion even if S3 fails
      console.error(
        `Failed to delete files from S3 for diagram ${diagramId}`,
        error
      );
    }
  }

  // Delete the Liveblocks room (room ID is the diagram ID)
  await deleteLiveblocksRoom(diagramId);

  // Delete chat history and store for this diagram (best-effort)
  try {
    await deleteChatHistory(diagramId);
  } catch (error) {
    console.error(
      `Failed to delete chat history for diagram ${diagramId}:`,
      error
    );
  }

  try {
    await deleteDiagramStore(diagramId);
  } catch (error) {
    console.error(
      `Failed to delete diagram store for diagram ${diagramId}:`,
      error
    );
  }
}

/**
 * Permanently delete diagrams.
 *
 * Authorization rules:
 * - If the diagram is in trash: only the user who moved it to trash can permanently delete it.
 * - If the diagram is NOT in trash (e.g. undo paste): only the owner can permanently delete it.
 *
 * @param diagramIds - Diagram IDs to permanently delete
 * @returns Number of successfully deleted diagrams
 */
async function permanentDeleteDiagrams(diagramIds: string[]): Promise<number> {
  const user = await getCurrentUser();

  if (!user || !user.id) {
    return 0;
  }

  let successCount = 0;

  try {
    for (const diagramId of diagramIds) {
      try {
        const [diagram, trash] = await Promise.all([
          prisma.diagram.findUnique({
            where: { id: diagramId },
            select: { id: true, ownerId: true },
          }),
          prisma.trash.findUnique({
            where: { diagramId },
            select: { deletedById: true },
          }),
        ]);

        if (!diagram) {
          continue;
        }

        const allowed =
          (trash && trash.deletedById === user.id) ||
          (!trash && diagram.ownerId === user.id);

        if (!allowed) {
          continue;
        }

        await deleteDiagramResources(diagramId);

        // Delete the diagram (cascade will delete trash record and files from DB)
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
  } catch (error) {
    console.error("Failed to permanently delete diagrams:", error);
    return successCount;
  }
}

/**
 * Permanently delete folders from trash.
 * Only the user who moved the folder to trash can permanently delete it.
 *
 * @param folderIds - Folder IDs to permanently delete
 * @returns Number of successfully deleted folders
 */
async function permanentDeleteFolders(folderIds: string[]): Promise<number> {
  const user = await getCurrentUser();

  if (!user || !user.id) {
    return 0;
  }

  let successCount = 0;

  try {
    for (const folderId of folderIds) {
      try {
        // Check if trash record exists and belongs to current user
        const trash = await prisma.trash.findUnique({
          where: { folderId },
          select: { deletedById: true },
        });

        if (!trash || trash.deletedById !== user.id) {
          continue;
        }

        // Get all diagrams in this folder
        const diagrams = await prisma.diagram.findMany({
          where: { folderId },
          select: { id: true },
        });

        // For each diagram, delete its external resources (best-effort)
        for (const diagram of diagrams) {
          try {
            await deleteDiagramResources(diagram.id);
          } catch (error) {
            console.error(
              `Failed to delete resources for diagram ${diagram.id}:`,
              error
            );
          }
        }

        // Delete the folder (cascade will delete trash record, children, and diagrams)
        await prisma.folder.delete({
          where: { id: folderId },
        });

        successCount++;
      } catch (error) {
        console.error(
          `Failed to permanently delete folder ${folderId}:`,
          error
        );
      }
    }

    return successCount;
  } catch (error) {
    console.error("Failed to permanently delete folders:", error);
    return successCount;
  }
}

async function permanentDeleteDiagram(diagramId: string): Promise<boolean> {
  const deleted = await permanentDeleteDiagrams([diagramId]);
  return deleted === 1;
}

async function permanentDeleteFolder(folderId: string): Promise<boolean> {
  const deleted = await permanentDeleteFolders([folderId]);
  return deleted === 1;
}

export {
  permanentDeleteDiagram,
  permanentDeleteDiagrams,
  permanentDeleteFolder,
  permanentDeleteFolders,
};
