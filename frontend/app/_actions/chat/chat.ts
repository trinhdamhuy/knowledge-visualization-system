"use server";

import { canViewDiagram } from "../diagram/permission";
import type { ChatRequest } from "@/types/chat";
import { getEnv } from "@/lib/get-env";

/**
 * Send chat request to backend
 * Checks view permission for both authenticated and anonymous users
 * @param request - Chat request parameters (includes user_id from Liveblocks)
 * @returns true if request was accepted, false otherwise
 */
async function sendChatRequest(request: ChatRequest): Promise<boolean> {
  // Check view permission (works for both authenticated and anonymous users)
  const canView = await canViewDiagram(request.diagram_id);
  if (!canView) {
    return false;
  }

  // Validate that user_id is provided (from Liveblocks, can be anonymous ID)
  if (!request.user_id) {
    return false;
  }

  const { backendUrl: BACKEND_URL } = getEnv();

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

/**
 * Cancel an ongoing chat request
 * Checks view permission for both authenticated and anonymous users
 * @param diagramId - Diagram ID to cancel chat for
 * @returns true if cancellation was successful, false otherwise
 */
async function cancelChatRequest(diagramId: string): Promise<boolean> {
  // Check view permission (works for both authenticated and anonymous users)
  const canView = await canViewDiagram(diagramId);
  if (!canView) {
    return false;
  }

  const { backendUrl: BACKEND_URL } = getEnv();

  try {
    const response = await fetch(`${BACKEND_URL}/api/chat/cancel`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ diagram_id: diagramId }),
    });

    if (!response.ok) {
      console.error(`Failed to cancel chat: ${response.statusText}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Failed to cancel chat request:", error);
    return false;
  }
}

export { sendChatRequest, cancelChatRequest };
