import { create } from "zustand";

interface FileState {
  fileName: string | null;
  fileUrl: string | null;
  signedFileUrl: string | null;
  setFile: (fileName: string, fileUrl: string) => void;
  setSignedFileUrl: (signedUrl: string | null) => void;
  clearFile: () => void;
}

export const useFileStore = create<FileState>((set) => ({
  fileName: null,
  fileUrl: null,
  signedFileUrl: null,
  setFile: (fileName, fileUrl) => set({ fileName, fileUrl }),
  setSignedFileUrl: (signedUrl) => set({ signedFileUrl: signedUrl }),
  clearFile: () => set({ fileName: null, fileUrl: null, signedFileUrl: null }),
}));
