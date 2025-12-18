import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ChatSettingsState {
  mode: "chat" | "generate";
  needInitializeData: boolean;
  setMode: (mode: "chat" | "generate") => void;
  setNeedInitializeData: (value: boolean) => void;
  reset: () => void;
}

const defaultState = {
  mode: "chat" as const,
  needInitializeData: false,
};

export const useChatSettingsStore = create<ChatSettingsState>()(
  persist(
    (set) => ({
      ...defaultState,
      setMode: (mode) => set({ mode }),
      setNeedInitializeData: (value) => set({ needInitializeData: value }),
      reset: () => set(defaultState),
    }),
    {
      name: "chat-settings",
      partialize: (state) => ({
        mode: state.mode,
        needInitializeData: state.needInitializeData,
      }),
    }
  )
);
