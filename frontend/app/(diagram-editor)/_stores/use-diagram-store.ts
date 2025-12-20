import { create } from "zustand";
import { DiagramMode } from "@/enums/modes";

type SelectedObjectIds = {
  nodeIds: string[];
  edgeIds: string[];
};

type DiagramState = {
  activeMode: DiagramMode;
  selectedObjectIds: SelectedObjectIds;
};

type DiagramActions = {
  setActiveMode: (mode: DiagramMode) => void;
  setSelection: (nodeIds: string[], edgeIds: string[]) => void;
};

export const useDiagramStore = create<DiagramState & DiagramActions>((set) => ({
  activeMode: DiagramMode.Select,
  selectedObjectIds: {
    nodeIds: [],
    edgeIds: [],
  },
  setActiveMode: (mode: DiagramMode) => set({ activeMode: mode }),
  setSelection: (nodeIds: string[], edgeIds: string[]) => {
    set({
      selectedObjectIds: { nodeIds, edgeIds },
    });
  },
}));
