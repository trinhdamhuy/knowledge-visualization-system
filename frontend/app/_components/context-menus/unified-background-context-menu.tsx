"use client";

import * as React from "react";
import {
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
} from "@/components/ui/context-menu";
import { Copy, Trash2, ClipboardPaste, RotateCcw, Plus } from "lucide-react";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { useDiagramClipboardStore } from "@/stores/diagram-clipboard-store";
import { useActionHistoryStore } from "@/stores/action-history-store";
import { useDiagram } from "@/hooks/use-diagram";
import { deleteDiagrams } from "@/app/_actions/diagram";
import { useRestoreTrash, usePermanentDeleteTrash } from "@/hooks/use-trash";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { itemsKeys } from "@/hooks/use-items";
import { diagramKeys } from "@/hooks/use-diagram";
import { trashKeys } from "@/hooks/use-trash";
import type { TrashItem } from "@/types/trash";

interface UnifiedBackgroundContextMenuProps {
  // Normal mode props
  selectedDiagramIds?: string[];
  // Trash mode props
  selectedTrashItems?: TrashItem[];
  isTrashMode?: boolean;
  showCreate?: boolean; // Show Create option (only for home/my-diagrams)
  onCreate?: () => void; // Callback when Create is clicked
  onCopy?: () => void;
  onDelete?: () => void;
  onRestore?: () => void;
}

export function UnifiedBackgroundContextMenu({
  selectedDiagramIds = [],
  selectedTrashItems = [],
  isTrashMode = false,
  showCreate = false,
  onCreate,
  onCopy,
  onDelete,
  onRestore,
}: UnifiedBackgroundContextMenuProps) {
  const { copyDiagrams, getClipboard, hasClipboard } =
    useDiagramClipboardStore();
  const { pasteDiagrams: pasteDiagramsFn, isPastingDiagrams } = useDiagram();
  const { restore, isRestoring } = useRestoreTrash();
  const { permanentDelete } = usePermanentDeleteTrash();
  const queryClient = useQueryClient();
  const { pushAction } = useActionHistoryStore();
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isDeletingForever, setIsDeletingForever] = React.useState(false);

  // Normal mode state
  const hasSelection = selectedDiagramIds.length > 0;
  const clipboard = getClipboard();
  const canPaste = hasClipboard() && clipboard.length > 0;

  // Trash mode state
  const hasTrashSelection = selectedTrashItems.length > 0;

  // Normal mode handlers
  const handleCopy = async () => {
    if (hasSelection) {
      copyDiagrams(selectedDiagramIds);
      toast.success(`Copied ${selectedDiagramIds.length} diagram(s)`);
      onCopy?.();
    }
  };

  const handlePaste = async () => {
    if (!canPaste) return;

    try {
      const diagramIds = clipboard;
      const newDiagrams = await pasteDiagramsFn(diagramIds);

      if (newDiagrams.length > 0) {
        // Push to history for undo
        pushAction({
          type: "paste",
          itemIds: newDiagrams.map((d) => d.id),
          inverseType: "delete",
          metadata: {
            originalDiagramIds: diagramIds, // Store original IDs for redo
          },
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
  };

  const handleDelete = async () => {
    if (!hasSelection) return;

    try {
      setIsDeleting(true);
      const successCount = await deleteDiagrams(selectedDiagramIds);

      if (successCount > 0) {
        // Push to history for undo
        pushAction({
          type: "delete",
          itemIds: selectedDiagramIds,
          inverseType: "restore",
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
    } finally {
      setIsDeleting(false);
    }
  };

  // Trash mode handlers
  const handleRestore = async () => {
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
          inverseType: "delete",
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
  };

  const handleDeleteForever = async () => {
    if (!hasTrashSelection) return;

    try {
      setIsDeletingForever(true);
      let successCount = 0;
      for (const item of selectedTrashItems) {
        const success = await permanentDelete({ item });
        if (success) {
          successCount++;
        }
      }

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
    } finally {
      setIsDeletingForever(false);
    }
  };

  // Trash mode UI
  if (isTrashMode) {
    if (!hasTrashSelection) {
      return null;
    }

    return (
      <>
        <ContextMenuItem
          onSelect={handleRestore}
          disabled={isRestoring || isDeletingForever}
        >
          <RotateCcw />
          Restore {selectedTrashItems.length} item(s)
          <ContextMenuShortcut>
            <KbdGroup>
              <Kbd>Ctrl</Kbd>
              <Kbd>R</Kbd>
            </KbdGroup>
          </ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          onSelect={handleDeleteForever}
          variant="destructive"
          disabled={isRestoring || isDeletingForever}
        >
          <Trash2 />
          Delete item(s) forever {selectedTrashItems.length}
          <ContextMenuShortcut>
            <Kbd>Del</Kbd>
          </ContextMenuShortcut>
        </ContextMenuItem>
      </>
    );
  }

  // Normal mode UI
  return (
    <>
      {/* Create - only if showCreate is true */}
      {showCreate && (
        <>
          <ContextMenuItem onSelect={() => onCreate?.()}>
            <Plus />
            Create Diagram
          </ContextMenuItem>
          <ContextMenuSeparator />
        </>
      )}

      {/* Copy - always shown but disabled when no selection */}
      <ContextMenuItem onSelect={handleCopy} disabled={!hasSelection}>
        <Copy />
        Copy {hasSelection ? `${selectedDiagramIds.length} diagram(s)` : ""}
        <ContextMenuShortcut>
          <KbdGroup>
            <Kbd>Ctrl</Kbd>
            <Kbd>C</Kbd>
          </KbdGroup>
        </ContextMenuShortcut>
      </ContextMenuItem>

      {/* Paste - always shown but disabled when no clipboard */}
      <ContextMenuItem
        onSelect={handlePaste}
        disabled={!canPaste || isPastingDiagrams}
      >
        <ClipboardPaste />
        Paste {canPaste ? `${clipboard.length} diagram(s)` : ""}
        <ContextMenuShortcut>
          <KbdGroup>
            <Kbd>Ctrl</Kbd>
            <Kbd>V</Kbd>
          </KbdGroup>
        </ContextMenuShortcut>
      </ContextMenuItem>

      {/* Delete - only if there are selected diagrams */}
      {hasSelection && (
        <>
          <ContextMenuSeparator />
          <ContextMenuItem
            onSelect={handleDelete}
            variant="destructive"
            disabled={isDeleting}
          >
            <Trash2 />
            Delete {selectedDiagramIds.length} diagram(s)
            <ContextMenuShortcut>
              <Kbd>Del</Kbd>
            </ContextMenuShortcut>
          </ContextMenuItem>
        </>
      )}
    </>
  );
}
