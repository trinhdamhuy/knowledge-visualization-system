"use server";

import { canViewDiagram } from "../diagram/permission";
import type { HistoryResponse } from "@/types/chat";
import { getEnv } from "@/lib/get-env";

/**
 * Get chat history for a diagram with pagination
 * Checks view permission for both authenticated and anonymous users
 * @param diagramId - Diagram ID
 * @param userId - User ID (required for user-specific chat history)
 * @param limit - Number of messages to fetch (default: 10)
 * @param offset - Offset for pagination (default: 0)
 * @returns Chat history response or null if failed
 */
async function getChatHistory(
  diagramId: string,
  userId: string | null,
  limit: number = 10,
  offset: number = 0
): Promise<HistoryResponse | null> {
  // Check view permission (works for both authenticated and anonymous users)
  const canView = await canViewDiagram(diagramId);
  if (!canView) {
    return null;
  }

  // If user is not logged in, don't fetch history
  if (!userId) {
    return null;
  }

  const { backendUrl: BACKEND_URL } = getEnv();

  try {
    const response = await fetch(
      `${BACKEND_URL}/api/chat-history?diagram_id=${diagramId}&user_id=${userId}&limit=${limit}&offset=${offset}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      console.error(`Failed to get chat history: ${response.statusText}`);
      return null;
    }

    const data: HistoryResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to get chat history:", error);
    return null;
  }
}

export { getChatHistory };
