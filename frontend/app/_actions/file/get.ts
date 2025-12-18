"use server";

import { prisma } from "@/lib/prisma";
import { canViewDiagram } from "../diagram/permission";
import { File } from "@/generated/prisma/client";

/**
 * Get all files for a diagram
 * @param diagramId - Diagram ID
 * @returns Array of files or null if failed
 */
async function getFilesByDiagramId(diagramId: string): Promise<File[] | null> {
  // Check view permission
  const canView = await canViewDiagram(diagramId);
  if (!canView) {
    return null;
  }

  try {
    const files = await prisma.file.findMany({
      where: { diagramId },
      orderBy: { createdAt: "desc" },
    });

    return files;
  } catch (error) {
    console.error("Failed to get files:", error);
    return null;
  }
}

export { getFilesByDiagramId };
