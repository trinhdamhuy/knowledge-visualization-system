import { create } from "zustand";
import type { MindmapData } from "@/types/chat";

export interface ChatUIState {
  isOpen: boolean;
  currentStatus: string | null;
  importDialogOpen: boolean;
  pendingMindmapData: MindmapData | null;
  setIsOpen: (isOpen: boolean) => void;
  setCurrentStatus: (status: string | null) => void;
  setImportDialogOpen: (open: boolean) => void;
  setPendingMindmapData: (data: MindmapData | null) => void;
  reset: () => void;
}

const defaultState = {
  isOpen: false,
  currentStatus: null,
  importDialogOpen: false,
  pendingMindmapData: null,
};

export const useChatUIStore = create<ChatUIState>((set) => ({
  ...defaultState,
  setIsOpen: (isOpen) => set({ isOpen }),
  setCurrentStatus: (status) => set({ currentStatus: status }),
  setImportDialogOpen: (open) => set({ importDialogOpen: open }),
  setPendingMindmapData: (data) => set({ pendingMindmapData: data }),
  reset: () => set(defaultState),
}));
