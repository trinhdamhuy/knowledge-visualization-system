"use server";

import { getCurrentUser } from "../user";
import type { BaseResponse, ChatRequest } from "@/types/chat";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

/**
 * Stream chat response (sends broadcast events to Liveblocks)
 * @param request - Chat request parameters
 * @returns Base response or null if failed
 */
async function streamChat(request: ChatRequest): Promise<BaseResponse | null> {
  const user = await getCurrentUser();

  if (!user || !user.id) {
    return null;
  }

  try {
    const response = await fetch(`${BACKEND_URL}/api/stream-chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      console.error(`Failed to stream chat: ${response.statusText}`);
      return null;
    }

    const data: BaseResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to stream chat:", error);
    return null;
  }
}

export { streamChat };
