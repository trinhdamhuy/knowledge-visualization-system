"use client";

import * as React from "react";
import {
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
} from "@/components/ui/context-menu";
import {
  Copy,
  Trash2,
  ClipboardPaste,
  RotateCcw,
  Plus,
  Pencil,
  Share2,
  Link,
} from "lucide-react";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { Skeleton } from "@/components/ui/skeleton";
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
import type { Item } from "@/types";
import { useCanEditDiagram } from "@/hooks/use-diagram-permission";

interface UnifiedContextMenuProps {
  // Normal mode props
  selectedDiagramIds?: string[];
  selectedItems?: Item[]; // Array of selected items (for single item menu)
  // Trash mode props
  selectedTrashItems?: TrashItem[];
  isTrashMode?: boolean;
  showCreate?: boolean; // Show Create option (only for home/my-diagrams)
  onCreate?: () => void; // Callback when Create is clicked
  onCopy?: () => void;
  onDelete?: () => void;
  onRestore?: () => void;
  // Single item menu props
  onRename?: (item: Item) => void; // Callback when Rename is clicked
  onDeleteItem?: (item: Item) => void; // Callback when Delete single item is clicked
  onShare?: (item: Item) => void; // Callback when Share is clicked
}

export function UnifiedContextMenu({
  selectedDiagramIds = [],
  selectedItems = [],
  selectedTrashItems = [],
  isTrashMode = false,
  showCreate = false,
  onCreate,
  onCopy,
  onDelete,
  onRestore,
  onRename,
  onDeleteItem,
  onShare,
}: UnifiedContextMenuProps) {
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

  // Single item selection state
  const isSingleSelection = selectedDiagramIds.length === 1 && !isTrashMode;
  const selectedItem = isSingleSelection
    ? selectedItems?.find(
        (item) => item.id === selectedDiagramIds[0] && item.type === "diagram"
      )
    : null;

  // Permission check for single item (only when needed)
  const { data: canEdit, isLoading: isLoadingPermission } = useCanEditDiagram(
    isSingleSelection && selectedItem ? selectedItem.id : ""
  );

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

  // Single item handlers
  const handleRename = () => {
    if (selectedItem) {
      onRename?.(selectedItem);
    }
  };

  const handleSingleItemDelete = () => {
    if (selectedItem) {
      // Use onDeleteItem if provided, otherwise use onDelete
      if (onDeleteItem) {
        onDeleteItem(selectedItem);
      } else {
        // Fallback to regular delete handler
        handleDelete();
      }
    }
  };

  const handleSingleItemCopy = () => {
    if (selectedItem && selectedItem.type === "diagram") {
      copyDiagrams([selectedItem.id]);
      toast.success("Diagram copied to clipboard");
      onCopy?.();
    }
  };

  const handleShare = () => {
    if (selectedItem) {
      onShare?.(selectedItem);
    }
  };

  const handleCopyLink = () => {
    if (selectedItem && selectedItem.type === "diagram") {
      const link = `${window.location.origin}/diagrams/${selectedItem.id}`;
      navigator.clipboard.writeText(link);
      toast.success("Link copied to clipboard");
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

  // Single item menu UI (when only 1 diagram is selected)
  if (isSingleSelection && selectedItem && selectedItem.type === "diagram") {
    // Show loading state while checking permission
    if (isLoadingPermission) {
      return (
        <>
          {/* Rename skeleton */}
          <ContextMenuItem disabled className="pointer-events-none">
            <Skeleton className="h-4 w-4 shrink-0" />
            <Skeleton className="h-4 w-16" />
          </ContextMenuItem>
          {/* Delete skeleton */}
          <ContextMenuItem disabled className="pointer-events-none">
            <Skeleton className="h-4 w-4 shrink-0" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-12 ml-auto" />
          </ContextMenuItem>
          <ContextMenuSeparator />
          {/* Copy skeleton */}
          <ContextMenuItem disabled className="pointer-events-none">
            <Skeleton className="h-4 w-4 shrink-0" />
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-20 ml-auto" />
          </ContextMenuItem>
        </>
      );
    }

    return (
      <>
        {/* Rename - only for users with edit/owner permission */}
        {canEdit && (
          <ContextMenuItem onSelect={handleRename}>
            <Pencil />
            Rename
          </ContextMenuItem>
        )}

        {/* Delete - only for users with edit/owner permission */}
        {canEdit && (
          <ContextMenuItem
            onSelect={handleSingleItemDelete}
            variant="destructive"
            disabled={isDeleting}
          >
            <Trash2 />
            Delete
            <ContextMenuShortcut>
              <Kbd>Del</Kbd>
            </ContextMenuShortcut>
          </ContextMenuItem>
        )}

        {/* Separator if there are edit options */}
        {canEdit && <ContextMenuSeparator />}

        {/* Share submenu */}
        <ContextMenuSub>
          <ContextMenuSubTrigger className="gap-2">
            <Share2 />
            Share
          </ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuItem onSelect={handleShare}>
              <Share2 />
              Share
            </ContextMenuItem>
            <ContextMenuItem onSelect={handleCopyLink}>
              <Link />
              Copy Link
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>

        {/* Separator */}
        <ContextMenuSeparator />

        {/* Copy - available for all users */}
        <ContextMenuItem onSelect={handleSingleItemCopy}>
          <Copy />
          Copy
          <ContextMenuShortcut>
            <KbdGroup>
              <Kbd>Ctrl</Kbd>
              <Kbd>C</Kbd>
            </KbdGroup>
          </ContextMenuShortcut>
        </ContextMenuItem>
      </>
    );
  }

  // Multi-item or background menu UI
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
