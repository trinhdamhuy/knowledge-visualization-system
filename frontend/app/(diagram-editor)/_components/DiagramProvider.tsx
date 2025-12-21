"use client";

import { useEffect, useState, useCallback, ReactNode } from "react";
import { useDiagramStore } from "../_stores/use-diagram-store";
import { useDiagramSync } from "@/hooks/use-diagram-sync";
import {
  useUndo,
  useRedo,
  useCanRedo,
  useCanUndo,
} from "@liveblocks/react/suspense";
import { DiagramMode } from "@/enums/modes";
import { PasteErrorDialog } from "./PasteErrorDialog";
import { useUpdateMyPresence, useSelf } from "@liveblocks/react";

interface DiagramProviderProps {
  children: ReactNode;
}

/**
 * Provider component for diagram editor with keyboard shortcuts
 * Handles: Ctrl+Z (undo), Ctrl+Y (redo), Esc (select mode), Ctrl+A (select all), Ctrl+C (copy), Ctrl+V (paste)
 */
export function DiagramProvider({ children }: DiagramProviderProps) {
  const { setActiveMode } = useDiagramStore();
  const { copySelected, paste, nodes, edges, deleteNodesAndEdges } =
    useDiagramSync();
  const undo = useUndo();
  const redo = useRedo();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();
  const updateMyPresence = useUpdateMyPresence();
  const currentUser = useSelf();
  const [pasteError, setPasteError] = useState<string | null>(null);

  // Handle copy
  const handleCopy = useCallback(() => {
    const selection = currentUser?.presence?.selectedObjectIds ?? {
      nodeIds: [],
      edgeIds: [],
    };
    // Only copy nodes, not edges
    if (selection.nodeIds.length === 0) {
      return;
    }
    copySelected(selection.nodeIds, []); // Don't copy edges
  }, [currentUser, copySelected]);

  // Handle cut
  const handleCut = useCallback(() => {
    const selection = currentUser?.presence?.selectedObjectIds ?? {
      nodeIds: [],
      edgeIds: [],
    };
    // Only cut nodes, not edges
    if (selection.nodeIds.length === 0) {
      return;
    }

    // First, copy nodes to clipboard
    copySelected(selection.nodeIds, []); // Don't copy edges

    // Also delete edges connected to deleted nodes
    const connectedEdgeIds = edges
      .filter(
        (edge) =>
          selection.nodeIds.includes(edge.source) ||
          selection.nodeIds.includes(edge.target)
      )
      .map((edge) => edge.id);

    // Delete nodes and edges in a single operation (creates only one undo entry)
    if (selection.nodeIds.length > 0 || connectedEdgeIds.length > 0) {
      deleteNodesAndEdges({
        nodeIds: selection.nodeIds,
        edgeIds: connectedEdgeIds,
      });
    }

    // Clear selection
    updateMyPresence({
      selectedObjectIds: {
        nodeIds: [],
        edgeIds: [],
      },
    });
  }, [currentUser, copySelected, edges, deleteNodesAndEdges, updateMyPresence]);

  // Handle paste
  const handlePaste = useCallback(async () => {
    const result = await paste();
    if (!result.success) {
      setPasteError(result.error || "Failed to paste");
    } else if (result.success && "nodeIds" in result && "edgeIds" in result) {
      // Select newly pasted items
      updateMyPresence({
        selectedObjectIds: {
          nodeIds: result.nodeIds,
          edgeIds: result.edgeIds,
        },
      });
    }
  }, [paste, updateMyPresence]);

  // Handle select all
  const handleSelectAll = useCallback(() => {
    const allNodeIds = nodes.map((n) => n.id);
    const allEdgeIds = edges.map((e) => e.id);
    updateMyPresence({
      selectedObjectIds: {
        nodeIds: allNodeIds,
        edgeIds: allEdgeIds,
      },
    });
  }, [nodes, edges, updateMyPresence]);

  // Keyboard shortcuts handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields or textareas
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const ctrlOrCmd = isMac ? e.metaKey : e.ctrlKey;

      // Ctrl+Z / Cmd+Z: Undo
      if (ctrlOrCmd && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        if (canUndo) {
          undo();
        }
        return;
      }

      // Ctrl+Y / Cmd+Y or Ctrl+Shift+Z: Redo
      if (
        (ctrlOrCmd && e.key === "y") ||
        (ctrlOrCmd && e.key === "z" && e.shiftKey)
      ) {
        e.preventDefault();
        if (canRedo) {
          redo();
        }
        return;
      }

      // Esc: Set mode to Select
      if (e.key === "Escape") {
        e.preventDefault();
        setActiveMode(DiagramMode.Select);
        return;
      }

      // Ctrl+A / Cmd+A: Select all
      if (ctrlOrCmd && e.key === "a") {
        e.preventDefault();
        handleSelectAll();
        return;
      }

      // Ctrl+C / Cmd+C: Copy
      if (ctrlOrCmd && e.key === "c") {
        e.preventDefault();
        handleCopy();
        return;
      }

      // Ctrl+X / Cmd+X: Cut
      if (ctrlOrCmd && e.key === "x") {
        e.preventDefault();
        handleCut();
        return;
      }

      // Ctrl+V / Cmd+V: Paste
      if (ctrlOrCmd && e.key === "v") {
        e.preventDefault();
        handlePaste();
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    canUndo,
    canRedo,
    undo,
    redo,
    setActiveMode,
    handleSelectAll,
    handleCopy,
    handleCut,
    handlePaste,
  ]);

  return (
    <>
      {children}
      <PasteErrorDialog
        open={pasteError !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPasteError(null);
          }
        }}
        error={pasteError}
      />
    </>
  );
}
