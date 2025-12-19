"use server";

import { getCurrentUser } from "../user";
import type { HistoryResponse } from "@/types/chat";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

/**
 * Get chat history for a diagram with pagination
 * @param diagramId - Diagram ID
 * @param limit - Number of messages to fetch (default: 10)
 * @param offset - Offset for pagination (default: 0)
 * @returns Chat history response or null if failed
 */
async function getChatHistory(
  diagramId: string,
  limit: number = 10,
  offset: number = 0
): Promise<HistoryResponse | null> {
  const user = await getCurrentUser();

  if (!user || !user.id) {
    return null;
  }

  try {
    const response = await fetch(
      `${BACKEND_URL}/api/chat-history?diagram_id=${diagramId}&limit=${limit}&offset=${offset}`,
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
