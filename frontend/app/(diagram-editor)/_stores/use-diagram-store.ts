import { create } from "zustand";
import { DiagramMode } from "@/enums/modes";
import type { Node, Edge } from "@xyflow/react";

type DiagramState = {
  activeMode: DiagramMode;
  // Clipboard
  clipboard: { nodes: Node[]; edges: Edge[] } | null;
};

type DiagramActions = {
  setActiveMode: (mode: DiagramMode) => void;
  // Clipboard actions
  copyToClipboard: (nodes: Node[], edges: Edge[]) => void;
  getClipboard: () => { nodes: Node[]; edges: Edge[] } | null;
  clearClipboard: () => void;
};

export const useDiagramStore = create<DiagramState & DiagramActions>(
  (set, get) => ({
    activeMode: DiagramMode.Select,
    // Clipboard
    clipboard: null,

    setActiveMode: (mode: DiagramMode) => set({ activeMode: mode }),

    copyToClipboard: (nodes: Node[], edges: Edge[]) =>
      set({
        clipboard: {
          nodes: JSON.parse(JSON.stringify(nodes)),
          edges: JSON.parse(JSON.stringify(edges)),
        },
      }),

    getClipboard: () => get().clipboard,

    clearClipboard: () => set({ clipboard: null }),
  })
);
