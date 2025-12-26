import { useEffect, useCallback } from "react";
import { useDiagramClipboardStore } from "@/stores/diagram-clipboard-store";
import { useActionHistoryStore } from "@/stores/action-history-store";
import { useDiagram } from "@/hooks/use-diagram";
import { deleteDiagrams } from "@/app/_actions/diagram";
import {
  permanentDeleteDiagrams,
  permanentDeleteFolders,
} from "@/app/_actions/trash";
import { restoreDiagram, restoreFolder } from "@/app/_actions/trash/restore";
import { useRestoreTrash } from "@/hooks/use-trash";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { itemsKeys } from "@/hooks/use-items";
import { diagramKeys } from "@/hooks/use-diagram";
import { trashKeys } from "@/hooks/use-trash";
import type { TrashItem } from "@/types/trash";

interface UseUnifiedKeyboardShortcutsProps {
  // Normal mode props
  selectedDiagramIds?: string[];
  // Trash mode props
  selectedTrashItems?: TrashItem[];
  isTrashMode?: boolean;
  onCopy?: () => void;
  onDelete?: () => void;
  onRestore?: () => void;
  onRequestDeleteForever?: () => void;
  enabled?: boolean;
}

export function useUnifiedKeyboardShortcuts({
  selectedDiagramIds = [],
  selectedTrashItems = [],
  isTrashMode = false,
  onCopy,
  onDelete,
  onRestore,
  onRequestDeleteForever,
  enabled = true,
}: UseUnifiedKeyboardShortcutsProps) {
  const { copyDiagrams, getClipboard, hasClipboard } =
    useDiagramClipboardStore();
  const { pasteDiagrams } = useDiagram();
  const { restore } = useRestoreTrash();
  const queryClient = useQueryClient();
  const {
    pushAction,
    undo: undoAction,
    redo: redoAction,
    canUndo,
    canRedo,
  } = useActionHistoryStore();

  // Normal mode state
  const hasSelection = selectedDiagramIds.length > 0;
  const clipboard = getClipboard();
  const canPaste = hasClipboard() && clipboard.length > 0;

  // Trash mode state
  const hasTrashSelection = selectedTrashItems.length > 0;

  // Normal mode handlers
  const handleCopy = useCallback(() => {
    if (!hasSelection) return;
    copyDiagrams(selectedDiagramIds);
    toast.success(`Copied ${selectedDiagramIds.length} diagram(s)`);
    onCopy?.();
  }, [hasSelection, selectedDiagramIds, copyDiagrams, onCopy]);

  const handlePaste = useCallback(async () => {
    if (!canPaste) return;

    try {
      const diagramIds = clipboard;
      const newDiagrams = await pasteDiagrams(diagramIds);

      if (newDiagrams.length > 0) {
        // Push to history for undo
        pushAction({
          type: "paste",
          itemIds: newDiagrams.map((d) => d.id),
        });

        toast.success(`Pasted ${newDiagrams.length} diagram(s)`);
        queryClient.invalidateQueries({ queryKey: itemsKeys.all });
        queryClient.invalidateQueries({ queryKey: diagramKeys.lists() });
      } else {
        toast.error("Failed to paste diagrams");
      }
    } catch (error) {
      console.error("Error pasting diagrams:", error);
      toast.error("An error occurred while pasting diagrams");
    }
  }, [canPaste, clipboard, pasteDiagrams, queryClient, pushAction]);

  const handleDelete = useCallback(async () => {
    if (!hasSelection) return;

    try {
      const successCount = await deleteDiagrams(selectedDiagramIds);

      if (successCount > 0) {
        // Push to history for undo
        pushAction({
          type: "delete",
          itemIds: selectedDiagramIds,
          inverseType: "restore", // Inverse action is restore
        });

        toast.success(`Moved ${successCount} diagram(s) to trash`);
        queryClient.invalidateQueries({ queryKey: itemsKeys.all });
        queryClient.invalidateQueries({ queryKey: diagramKeys.lists() });
        onDelete?.();
      } else {
        toast.error("Failed to delete diagrams. You may not have permission.");
      }
    } catch (error) {
      console.error("Error deleting diagrams:", error);
      toast.error("An error occurred while deleting diagrams");
    }
  }, [hasSelection, selectedDiagramIds, queryClient, onDelete, pushAction]);

  // Trash mode handlers
  const handleRestore = useCallback(async () => {
    if (!hasTrashSelection) return;

    try {
      let successCount = 0;
      const restoredIds: string[] = [];
      for (const item of selectedTrashItems) {
        const success = await restore({ item });
        if (success) {
          successCount++;
          restoredIds.push(item.id);
        }
      }

      if (successCount > 0) {
        // Push to history for undo
        pushAction({
          type: "restore",
          itemIds: restoredIds,
          inverseType: "delete", // Inverse action is delete
        });

        toast.success(`Restored ${successCount} item(s)`);
        queryClient.invalidateQueries({ queryKey: trashKeys.list() });
        queryClient.invalidateQueries({ queryKey: itemsKeys.all });
        onRestore?.();
      } else {
        toast.error("Failed to restore items");
      }
    } catch (error) {
      console.error("Error restoring items:", error);
      toast.error("An error occurred while restoring items");
    }
  }, [
    hasTrashSelection,
    selectedTrashItems,
    restore,
    queryClient,
    onRestore,
    pushAction,
  ]);

  const handleDeleteForever = useCallback(async () => {
    if (!hasTrashSelection) return;

    try {
      const diagramIds = selectedTrashItems
        .filter((i) => i.type === "diagram")
        .map((i) => i.id);
      const folderIds = selectedTrashItems
        .filter((i) => i.type === "folder")
        .map((i) => i.id);

      const [deletedDiagrams, deletedFolders] = await Promise.all([
        diagramIds.length > 0
          ? permanentDeleteDiagrams(diagramIds)
          : Promise.resolve(0),
        folderIds.length > 0
          ? permanentDeleteFolders(folderIds)
          : Promise.resolve(0),
      ]);

      const successCount = deletedDiagrams + deletedFolders;

      if (successCount > 0) {
        toast.success(`Permanently deleted ${successCount} item(s)`);
        queryClient.invalidateQueries({ queryKey: trashKeys.list() });
        onDelete?.();
      } else {
        toast.error("Failed to delete items");
      }
    } catch (error) {
      console.error("Error deleting items:", error);
      toast.error("An error occurred while deleting items");
    }
  }, [hasTrashSelection, selectedTrashItems, queryClient, onDelete]);

  // Undo handler - executes inverse action
  const handleUndo = useCallback(async () => {
    const action = undoAction();
    if (!action) return;

    try {
      // Use inverseType if available, otherwise infer from type
      const actionType =
        action.inverseType ||
        (action.type === "paste"
          ? "delete"
          : action.type === "delete"
          ? "restore"
          : "delete");

      switch (actionType) {
        case "delete":
          // Undo paste or restore: delete (permanently for paste, move to trash for restore)
          if (action.type === "paste") {
            // Undo paste: delete permanently
            const deletedCount = await permanentDeleteDiagrams(action.itemIds);
            if (deletedCount > 0) {
              toast.success(`Undone: Deleted ${deletedCount} diagram(s)`);
              queryClient.invalidateQueries({ queryKey: itemsKeys.all });
              queryClient.invalidateQueries({ queryKey: diagramKeys.lists() });
            }
          } else {
            // Undo restore: move back to trash
            const deleteCount = await deleteDiagrams(action.itemIds);
            if (deleteCount > 0) {
              toast.success(`Undone: Moved ${deleteCount} diagram(s) to trash`);
              queryClient.invalidateQueries({ queryKey: itemsKeys.all });
              queryClient.invalidateQueries({ queryKey: diagramKeys.lists() });
              queryClient.invalidateQueries({ queryKey: trashKeys.list() });
            }
          }
          break;

        case "restore":
          // Undo delete: restore from trash
          let restoredCount = 0;
          for (const itemId of action.itemIds) {
            const diagramSuccess = await restoreDiagram(itemId);
            if (diagramSuccess) {
              restoredCount++;
            } else {
              const folderSuccess = await restoreFolder(itemId);
              if (folderSuccess) {
                restoredCount++;
              }
            }
          }
          if (restoredCount > 0) {
            toast.success(`Undone: Restored ${restoredCount} item(s)`);
            queryClient.invalidateQueries({ queryKey: itemsKeys.all });
            queryClient.invalidateQueries({ queryKey: diagramKeys.lists() });
            queryClient.invalidateQueries({ queryKey: trashKeys.list() });
          }
          break;
      }
    } catch (error) {
      console.error("Error undoing action:", error);
      toast.error("Failed to undo action");
    }
  }, [undoAction, queryClient]);

  // Redo handler - executes the action from history
  const handleRedo = useCallback(async () => {
    const action = redoAction();
    if (!action) return;

    try {
      switch (action.type) {
        case "paste":
          // Redo paste: paste again using original diagram IDs from metadata
          const originalIds = action.metadata?.originalDiagramIds as
            | string[]
            | undefined;
          if (originalIds && originalIds.length > 0) {
            const newDiagrams = await pasteDiagrams(originalIds);
            if (newDiagrams.length > 0) {
              // Push new action to history (after redo, we're at the end again)
              pushAction({
                type: "paste",
                itemIds: newDiagrams.map((d) => d.id),
                inverseType: "delete",
                metadata: {
                  originalDiagramIds: originalIds,
                },
              });
              toast.success(`Redone: Pasted ${newDiagrams.length} diagram(s)`);
              queryClient.invalidateQueries({ queryKey: itemsKeys.all });
              queryClient.invalidateQueries({ queryKey: diagramKeys.lists() });
            }
          } else {
            toast.info("Cannot redo paste: original diagram IDs not found");
          }
          break;

        case "delete":
          // Redo delete: delete again
          const redoDeleteCount = await deleteDiagrams(action.itemIds);
          if (redoDeleteCount > 0) {
            // Push new action to history
            pushAction({
              type: "delete",
              itemIds: action.itemIds,
              inverseType: "restore",
            });
            toast.success(
              `Redone: Moved ${redoDeleteCount} diagram(s) to trash`
            );
            queryClient.invalidateQueries({ queryKey: itemsKeys.all });
            queryClient.invalidateQueries({ queryKey: diagramKeys.lists() });
          }
          break;

        case "restore":
          // Redo restore: restore again
          let redoRestoredCount = 0;
          const redoRestoredIds: string[] = [];
          for (const itemId of action.itemIds) {
            const diagramSuccess = await restoreDiagram(itemId);
            if (diagramSuccess) {
              redoRestoredCount++;
              redoRestoredIds.push(itemId);
            } else {
              const folderSuccess = await restoreFolder(itemId);
              if (folderSuccess) {
                redoRestoredCount++;
                redoRestoredIds.push(itemId);
              }
            }
          }
          if (redoRestoredCount > 0) {
            // Push new action to history
            pushAction({
              type: "restore",
              itemIds: redoRestoredIds,
              inverseType: "delete",
            });
            toast.success(`Redone: Restored ${redoRestoredCount} item(s)`);
            queryClient.invalidateQueries({ queryKey: itemsKeys.all });
            queryClient.invalidateQueries({ queryKey: diagramKeys.lists() });
            queryClient.invalidateQueries({ queryKey: trashKeys.list() });
          }
          break;
      }
    } catch (error) {
      console.error("Error redoing action:", error);
      toast.error("Failed to redo action");
    }
  }, [redoAction, queryClient, pasteDiagrams, pushAction]);

  useEffect(() => {
    if (!enabled) return;

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
      if (ctrlOrCmd && e.key === "z" && !e.shiftKey && canUndo()) {
        e.preventDefault();
        handleUndo();
        return;
      }

      // Ctrl+Y / Cmd+Y or Ctrl+Shift+Z: Redo
      if (
        (ctrlOrCmd && e.key === "y") ||
        (ctrlOrCmd && e.key === "z" && e.shiftKey && canRedo())
      ) {
        e.preventDefault();
        handleRedo();
        return;
      }

      if (isTrashMode) {
        // Trash mode shortcuts
        // Ctrl+R / Cmd+R: Restore
        if (ctrlOrCmd && e.key === "r" && hasTrashSelection) {
          e.preventDefault();
          handleRestore();
          return;
        }

        // Delete or Backspace: Delete Forever
        if (
          (e.key === "Delete" || e.key === "Backspace") &&
          hasTrashSelection
        ) {
          e.preventDefault();
          if (onRequestDeleteForever) {
            onRequestDeleteForever();
          } else {
            // Fallback (if caller didn't provide a dialog)
            handleDeleteForever();
          }
          return;
        }
      } else {
        // Normal mode shortcuts
        // Ctrl+C / Cmd+C: Copy
        if (ctrlOrCmd && e.key === "c" && hasSelection) {
          e.preventDefault();
          handleCopy();
          return;
        }

        // Ctrl+V / Cmd+V: Paste
        if (ctrlOrCmd && e.key === "v" && canPaste) {
          e.preventDefault();
          handlePaste();
          return;
        }

        // Delete or Backspace: Delete selected diagrams
        if ((e.key === "Delete" || e.key === "Backspace") && hasSelection) {
          e.preventDefault();
          handleDelete();
          return;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    enabled,
    isTrashMode,
    hasSelection,
    hasTrashSelection,
    canPaste,
    canUndo,
    canRedo,
    handleCopy,
    handlePaste,
    handleDelete,
    handleRestore,
    handleDeleteForever,
    handleUndo,
    handleRedo,
    onRequestDeleteForever,
  ]);
}
