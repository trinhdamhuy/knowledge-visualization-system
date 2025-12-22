"use client";

import { create } from "zustand";

interface FileCardStore {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export const useFileCardStore = create<FileCardStore>((set) => ({
  isOpen: false,
  setIsOpen: (isOpen) => set({ isOpen }),
}));
