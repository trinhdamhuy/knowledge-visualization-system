import { create } from "zustand";

type ActionType = "paste" | "delete" | "restore";

interface HistoryAction {
  id: string;
  type: ActionType;
  timestamp: number;
  // For paste: created diagram IDs
  // For delete: deleted diagram IDs
  // For restore: restored item IDs
  itemIds: string[];
  // Metadata for undo/redo
  metadata?: Record<string, unknown>;
  // Inverse action type for undo
  inverseType?: ActionType;
}

interface ActionHistoryState {
  history: HistoryAction[];
  currentIndex: number; // -1 means at the end (no undo available)
}

interface ActionHistoryActions {
  pushAction: (action: Omit<HistoryAction, "id" | "timestamp">) => void;
  undo: () => HistoryAction | null;
  redo: () => HistoryAction | null;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clear: () => void;
}

export const useActionHistoryStore = create<
  ActionHistoryState & ActionHistoryActions
>((set, get) => ({
  history: [],
  currentIndex: -1,

  pushAction: (action) => {
    const newAction: HistoryAction = {
      ...action,
      id: `${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
    };

    set((state) => {
      // Remove any actions after currentIndex (when we're not at the end)
      const newHistory =
        state.currentIndex === -1
          ? [...state.history, newAction]
          : [...state.history.slice(0, state.currentIndex + 1), newAction];

      // Limit history to last 50 actions
      const limitedHistory =
        newHistory.length > 50
          ? newHistory.slice(newHistory.length - 50)
          : newHistory;

      return {
        history: limitedHistory,
        currentIndex: limitedHistory.length - 1,
      };
    });
  },

  undo: () => {
    const state = get();
    if (state.currentIndex < 0) {
      return null;
    }

    const action = state.history[state.currentIndex];
    set((prev) => ({
      currentIndex: prev.currentIndex - 1,
    }));
    return action;
  },

  redo: () => {
    const state = get();
    if (state.currentIndex >= state.history.length - 1) {
      return null;
    }

    const action = state.history[state.currentIndex + 1];
    set((prev) => ({
      currentIndex: prev.currentIndex + 1,
    }));
    return action;
  },

  canUndo: () => {
    return get().currentIndex >= 0;
  },

  canRedo: () => {
    const state = get();
    return state.currentIndex < state.history.length - 1;
  },

  clear: () => {
    set({ history: [], currentIndex: -1 });
  },
}));
