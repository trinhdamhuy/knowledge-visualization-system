"use client";

import * as React from "react";
import {
  ContextMenuItem,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
import { Copy, Pencil, Trash2 } from "lucide-react";
import { useCanEditDiagram } from "@/hooks/use-diagram-permission";
import { useDiagram } from "@/hooks/use-diagram";
import { toast } from "sonner";
import type { Item } from "@/types";

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
  const { copyDiagram, isCopyingDiagram } = useDiagram();

  // Only show context menu for diagrams (not folders)
  if (item.type !== "diagram") {
    return null;
  }

  const handleCopy = async () => {
    try {
      const newDiagram = await copyDiagram(item.id);
      if (newDiagram) {
        toast.success("Diagram copied successfully");
      } else {
        toast.error("Failed to copy diagram");
      }
    } catch (error) {
      console.error("Error copying diagram:", error);
      toast.error("An error occurred while copying the diagram");
    }
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
        </ContextMenuItem>
      )}

      {/* Separator if there are edit options */}
      {canEdit && <ContextMenuSeparator />}

      {/* Copy - available for all users */}
      <ContextMenuItem onSelect={handleCopy} disabled={isCopyingDiagram}>
        <Copy />
        Copy
      </ContextMenuItem>
    </>
  );
}
