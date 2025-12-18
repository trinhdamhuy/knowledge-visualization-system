"use server";

import { getCurrentUser } from "../user";
import type { ChatRequest } from "@/types/chat";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

/**
 * Send chat request to backend
 * @param request - Chat request parameters
 * @returns true if request was accepted, false otherwise
 */
async function sendChatRequest(request: ChatRequest): Promise<boolean> {
  const user = await getCurrentUser();

  if (!user || !user.id) {
    return false;
  }

  try {
    const response = await fetch(`${BACKEND_URL}/api/chat`, {
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

    return true;
  } catch (error) {
    console.error("Failed to send chat request:", error);
    return false;
  }
}

export { sendChatRequest };
