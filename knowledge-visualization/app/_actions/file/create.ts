"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "../user";
import { canEditDiagram } from "../diagram/permission";
import { File } from "@/generated/prisma/client";

/**
 * Create a new file for a diagram
 * @param diagramId - Diagram ID
 * @param fileName - Original file name
 * @param fileUrl - File URL from S3
 * @param fileType - File type (pdf or txt)
 * @returns Newly created file or null if failed
 */
async function createFile(
  diagramId: string,
  fileName: string,
  fileUrl: string,
  fileType: string
): Promise<File | null> {
  const user = await getCurrentUser();

  if (!user || !user.id) {
    return null;
  }

  // Check edit permission
  const hasPermission = await canEditDiagram(diagramId);
  if (!hasPermission) {
    return null;
  }

  try {
    // Validate diagram exists
    const diagram = await prisma.diagram.findUnique({
      where: { id: diagramId },
    });

    if (!diagram) {
      return null;
    }

    // Create file
    const file = await prisma.file.create({
      data: {
        fileName,
        fileUrl,
        fileType,
        diagramId,
      },
    });

    return file;
  } catch (error) {
    console.error("Failed to create file:", error);
    return null;
  }
}

export { createFile };
