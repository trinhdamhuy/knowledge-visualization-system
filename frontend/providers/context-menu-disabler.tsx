"use client";

import { useEffect, ReactNode } from "react";

interface ContextMenuDisablerProps {
  children: ReactNode;
}

export function ContextMenuDisabler({ children }: ContextMenuDisablerProps) {
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // Prevent context menu on entire document except allowed elements
    document.addEventListener("contextmenu", handleContextMenu);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  }, []);

  return <>{children}</>;
}
