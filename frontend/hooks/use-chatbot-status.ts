"use client";

import { useStorage, useMutation } from "@liveblocks/react";
import { useMemo } from "react";

/**
 * Hook to manage chatbot status in Liveblocks storage
 */
export function useChatbotStatus() {
  const chatbotStatus = useStorage((root) => root.chatbotStatus);

  const isBusy = useMemo(() => {
    if (!chatbotStatus) {
      return false;
    }
    // useStorage automatically unwraps LiveObject to plain object
    return chatbotStatus.isBusy ?? false;
  }, [chatbotStatus]);

  const setChatbotBusy = useMutation(({ storage }) => {
    const status = storage.get("chatbotStatus");
    if (status) {
      status.set("isBusy", true);
    }
  }, []);

  const setChatbotIdle = useMutation(({ storage }) => {
    const status = storage.get("chatbotStatus");
    if (status) {
      status.set("isBusy", false);
    }
  }, []);

  return {
    isBusy,
    setChatbotBusy,
    setChatbotIdle,
  };
}
