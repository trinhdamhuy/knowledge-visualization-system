import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ChatSettingsState {
  needInitializeData: boolean;
  setNeedInitializeData: (value: boolean) => void;
  reset: () => void;
}

const defaultState = {
  needInitializeData: false,
};

export const useChatSettingsStore = create<ChatSettingsState>()(
  persist(
    (set) => ({
      ...defaultState,
      setNeedInitializeData: (value) => set({ needInitializeData: value }),
      reset: () => set(defaultState),
    }),
    {
      name: "chat-settings",
      partialize: (state) => ({
        needInitializeData: state.needInitializeData,
      }),
    }
  )
);
