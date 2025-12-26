"use client";

import { create } from "zustand";

interface FileCardStore {
  isOpen: boolean;
  pdfPage: number | null;
  setIsOpen: (isOpen: boolean) => void;
  setPdfPage: (page: number | null) => void;
  openPdfPage: (page: number) => void;
}

export const useFileCardStore = create<FileCardStore>((set) => ({
  isOpen: false,
  pdfPage: null,
  setIsOpen: (isOpen) => set({ isOpen }),
  setPdfPage: (page) => set({ pdfPage: page }),
  openPdfPage: (page) =>
    set({
      isOpen: true,
      pdfPage: page > 0 ? page : null,
    }),
}));
