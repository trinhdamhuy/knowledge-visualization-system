"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createCookieStorage } from "@/lib/cookie-storage";

export type ChatDisplayMode = "docked" | "sidebar";

interface ChatPanelStore {
  isOpen: boolean;
  displayMode: ChatDisplayMode;
  setIsOpen: (isOpen: boolean) => void;
  setDisplayMode: (mode: ChatDisplayMode) => void;
}

const chatPanelStorage = createCookieStorage<{
  displayMode: ChatDisplayMode;
}>();

export const useChatPanelStore = create<ChatPanelStore>()(
  persist(
    (set) => ({
      isOpen: false,
      displayMode: "sidebar",
      setIsOpen: (isOpen) => set({ isOpen }),
      setDisplayMode: (mode) => set({ displayMode: mode }),
    }),
    {
      name: "chat-panel-settings",
      partialize: (state) => ({
        displayMode: state.displayMode,
      }),
      storage: chatPanelStorage,
    }
  )
);
