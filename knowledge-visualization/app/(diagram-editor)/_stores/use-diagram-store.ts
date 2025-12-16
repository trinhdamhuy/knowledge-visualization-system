import { create } from "zustand";
import { DiagramMode } from "@/enums/modes";

type DiagramState = {
  activeMode: DiagramMode;
  selectedNodeIds: string[];
};

type DiagramActions = {
  setActiveMode: (mode: DiagramMode) => void;
  setSelectedNodeIds: (nodeIds: string[]) => void;
};

export const useDiagramStore = create<DiagramState & DiagramActions>((set) => ({
  activeMode: DiagramMode.Select,
  selectedNodeIds: [],
  setActiveMode: (mode: DiagramMode) => set({ activeMode: mode }),
  setSelectedNodeIds: (nodeIds: string[]) => set({ selectedNodeIds: nodeIds }),
}));
