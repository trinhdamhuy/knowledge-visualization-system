import { create } from "zustand";
import { DiagramMode } from "@/enums/modes";

type DiagramState = {
  activeMode: DiagramMode;
  selectedNodeId: string | null;
};

type DiagramActions = {
  setActiveMode: (mode: DiagramMode) => void;
  setSelectedNodeId: (nodeId: string | null) => void;
};

export const useDiagramStore = create<DiagramState & DiagramActions>((set) => ({
  activeMode: DiagramMode.Select,
  selectedNodeId: null,
  setActiveMode: (mode: DiagramMode) => set({ activeMode: mode }),
  setSelectedNodeId: (nodeId: string | null) => set({ selectedNodeId: nodeId }),
}));
