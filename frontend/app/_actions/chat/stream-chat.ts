"use server";

import { getCurrentUser } from "../user";
import type { ChatRequest } from "@/types/chat";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

/**
 * Stream chat response (sends broadcast events to Liveblocks)
 * @param request - Chat request parameters
 * @returns true if request was accepted and started streaming, false otherwise
 */
async function streamChat(request: ChatRequest): Promise<boolean> {
  const user = await getCurrentUser();

  if (!user || !user.id) {
    return false;
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
      return false;
    }

    // For streaming responses, we just check if the request was accepted
    // The actual streaming happens via broadcast events
    // We don't need to read the stream here, just confirm it started
    return true;
  } catch (error) {
    console.error("Failed to stream chat:", error);
    return false;
  }
}

export { streamChat };
