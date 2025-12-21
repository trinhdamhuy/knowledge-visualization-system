"use client";

import * as React from "react";
import {
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
} from "@/components/ui/context-menu";
import { Copy, Pencil, Trash2 } from "lucide-react";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { useCanEditDiagram } from "@/hooks/use-diagram-permission";
import { toast } from "sonner";
import type { Item } from "@/types";
import { useDiagramClipboardStore } from "@/stores/diagram-clipboard-store";

interface DiagramContextMenuProps {
  item: Item;
  onRename?: (item: Item) => void;
  onDelete?: (item: Item) => void;
}

export function DiagramContextMenu({
  item,
  onRename,
  onDelete,
}: DiagramContextMenuProps) {
  const { data: canEdit, isLoading: isLoadingPermission } = useCanEditDiagram(
    item.id
  );
  const { copyDiagrams } = useDiagramClipboardStore();

  // Only show context menu for diagrams (not folders)
  if (item.type !== "diagram") {
    return null;
  }

  const handleCopy = () => {
    copyDiagrams([item.id]);
    toast.success("Diagram copied to clipboard");
  };

  const handleRename = () => {
    onRename?.(item);
  };

  const handleDelete = () => {
    onDelete?.(item);
  };

  // Show loading state while checking permission
  if (isLoadingPermission) {
    return (
      <>
        <ContextMenuItem disabled>
          <Copy />
          Copy
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
        <ContextMenuItem onSelect={handleDelete} variant="destructive">
          <Trash2 />
          Delete
          <ContextMenuShortcut>
            <Kbd>Del</Kbd>
          </ContextMenuShortcut>
        </ContextMenuItem>
      )}

      {/* Separator if there are edit options */}
      {canEdit && <ContextMenuSeparator />}

      {/* Copy - available for all users */}
      <ContextMenuItem onSelect={handleCopy}>
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
