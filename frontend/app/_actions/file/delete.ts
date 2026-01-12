"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "../user";
import { canEditDiagram } from "../diagram/permission";
import { deleteDiagramStore } from "../chat/delete-store";
import { deleteFileFromS3 } from "@/lib/file-upload-handler";

/**
 * Delete a file by URL (used when deleting from S3)
 * @param fileUrl - File URL
 * @returns true if successful, false otherwise
 */
async function deleteFileByUrl(fileUrl: string): Promise<boolean> {
  const user = await getCurrentUser();

  if (!user || !user.id) {
    return false;
  }

  try {
    // Get file with diagram
    const file = await prisma.file.findFirst({
      where: { fileUrl },
      include: { diagram: true },
    });

    if (!file || !file.diagram) {
      return false;
    }

    // Check edit permission
    const hasPermission = await canEditDiagram(file.diagram.id);
    if (!hasPermission) {
      return false;
    }

    const diagramId = file.diagram.id;

    // Delete from S3 first (best-effort, don't fail if already deleted)
    // This prevents trying to delete after DB record is gone
    try {
      await deleteFileFromS3(file.fileUrl);
    } catch (error) {
      // Log but continue - S3 deletion is best-effort
      console.warn(
        "Failed to delete from S3 (continuing with DB deletion):",
        error
      );
    }

    // Delete file from database
    await prisma.file.delete({
      where: { id: file.id },
    });

    // Clear chatbot vector store for this diagram to avoid stale context
    try {
      await deleteDiagramStore(diagramId);
    } catch (error) {
      // Log but continue - store deletion is best-effort
      console.warn("Failed to delete diagram store:", error);
    }

    return true;
  } catch (error) {
    console.error("Failed to delete file by URL:", error);
    return false;
  }
}

export { deleteFileByUrl };
