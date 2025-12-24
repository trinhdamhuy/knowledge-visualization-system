"use server";

import { getCurrentUser } from "../user";
import type { BaseResponse, DeleteRequest } from "@/types/chat";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

/**
 * Delete diagram store (vector store) for a diagram
 * @param diagramId - Diagram ID
 * @returns Base response or null if failed
 */
async function deleteDiagramStore(
  diagramId: string
): Promise<BaseResponse | null> {
  const user = await getCurrentUser();

  if (!user || !user.id) {
    return null;
  }

  try {
    const requestBody: DeleteRequest = {
      diagram_id: diagramId,
      user_id: user.id,
    };

    const response = await fetch(`${BACKEND_URL}/api/delete-diagram-store`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      console.error(`Failed to delete diagram store: ${response.statusText}`);
      return null;
    }

    const data: BaseResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to delete diagram store:", error);
    return null;
  }
}

export { deleteDiagramStore };
