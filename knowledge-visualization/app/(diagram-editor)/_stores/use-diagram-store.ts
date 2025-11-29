import { create } from "zustand";
import { DiagramMode } from "@/enums/modes";

type DiagramState = {
  activeMode: DiagramMode;
};

type DiagramActions = {
  setActiveMode: (mode: DiagramMode) => void;
};

export const useDiagramStore = create<DiagramState & DiagramActions>((set) => ({
  activeMode: DiagramMode.Select,
  setActiveMode: (mode: DiagramMode) => set({ activeMode: mode }),
}));
