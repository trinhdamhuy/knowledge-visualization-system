"use client";

import { JsonObject, useEventListener } from "@liveblocks/react";
import { JsonArray } from "@liveblocks/client";

export interface BroadcastEventPayload {
  type: string;
  payload?: JsonObject | JsonArray;
}

/**
 * Hook to listen to broadcast events from Liveblocks
 * @param eventType - Type of event to listen for
 * @param callback - Callback function when event is received
 */
export function useBroadcastEventListener(
  eventType: string,
  callback: (payload: BroadcastEventPayload["payload"]) => void
) {
  useEventListener(({ event }) => {
    if (
      event &&
      typeof event === "object" &&
      "type" in event &&
      event.type === eventType
    ) {
      callback(event.payload as BroadcastEventPayload["payload"]);
    }
  });
}
