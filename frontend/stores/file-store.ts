import { create } from "zustand";

interface FileState {
  fileName: string | null;
  fileUrl: string | null;
  setFile: (fileName: string, fileUrl: string) => void;
  clearFile: () => void;
}

export const useFileStore = create<FileState>((set) => ({
  fileName: null,
  fileUrl: null,
  setFile: (fileName, fileUrl) => set({ fileName, fileUrl }),
  clearFile: () => set({ fileName: null, fileUrl: null }),
}));
