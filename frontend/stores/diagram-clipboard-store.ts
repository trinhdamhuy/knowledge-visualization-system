import { create } from "zustand";

type DiagramClipboardState = {
  diagramIds: string[];
};

type DiagramClipboardActions = {
  copyDiagrams: (diagramIds: string[]) => void;
  getClipboard: () => string[];
  clearClipboard: () => void;
  hasClipboard: () => boolean;
};

export const useDiagramClipboardStore = create<
  DiagramClipboardState & DiagramClipboardActions
>((set, get) => ({
  diagramIds: [],

  copyDiagrams: (diagramIds: string[]) => set({ diagramIds: [...diagramIds] }),

  getClipboard: () => get().diagramIds,

  clearClipboard: () => set({ diagramIds: [] }),

  hasClipboard: () => get().diagramIds.length > 0,
}));
