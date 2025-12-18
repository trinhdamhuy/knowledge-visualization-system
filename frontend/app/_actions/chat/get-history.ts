"use server";

import { getCurrentUser } from "../user";
import type { HistoryResponse } from "@/types/chat";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

/**
 * Get chat history for a diagram
 * @param diagramId - Diagram ID
 * @returns Chat history response or null if failed
 */
async function getChatHistory(
  diagramId: string
): Promise<HistoryResponse | null> {
  const user = await getCurrentUser();

  if (!user || !user.id) {
    return null;
  }

  try {
    const response = await fetch(
      `${BACKEND_URL}/api/chat-history?diagram_id=${diagramId}`,
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
