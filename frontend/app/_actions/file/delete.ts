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

    // Delete file
    await prisma.file.delete({
      where: { id: file.id },
    });

    // Delete from S3
    const deleted = await deleteFileFromS3(fileUrl);
    if (!deleted) {
      return false;
    }

    // Clear chatbot vector store for this diagram to avoid stale context
    await deleteDiagramStore(file.diagram.id);

    return true;
  } catch (error) {
    console.error("Failed to delete file by URL:", error);
    return false;
  }
}

export { deleteFileByUrl };
