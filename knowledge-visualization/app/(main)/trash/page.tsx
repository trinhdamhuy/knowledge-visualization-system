"use client";

import { useState } from "react";
import { ItemsList } from "@/app/_components/layouts/items-list";
import {
  useTrashItems,
  useRestoreTrash,
  usePermanentDeleteTrash,
} from "@/hooks/use-trash";
import { toast } from "sonner";
import type { TrashItem } from "@/types/trash";
import type { Item } from "@/types";
import {
  ContextMenuItem,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
import { RotateCcw, Trash2 } from "lucide-react";
import { useMemo } from "react";

/**
 * Convert TrashItem to Item format for display
 */
function trashItemToItem(trashItem: TrashItem): Item {
  if (trashItem.type === "diagram") {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { trash, type, ...diagram } = trashItem;
    return {
      type: "diagram",
      ...diagram,
      owner: diagram.owner || {
        id: diagram.ownerId || "",
        name: "Unknown",
        email: "",
        image: "",
      },
    } as Item;
  } else {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { trash, type, ...folder } = trashItem;
    return {
      type: "folder",
      ...folder,
      owner: folder.owner || {
        id: folder.ownerId || "",
        name: "Unknown",
        email: "",
        image: "",
      },
    } as Item;
  }
}

export default function TrashPage() {
  const [sortBy, setSortBy] = useState<
    "deletedAt" | "createdAt" | "updatedAt" | "title"
  >("deletedAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const {
    items: trashItems,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useTrashItems({ sortBy, sortDirection });
  const { restore, isRestoring } = useRestoreTrash();
  const { permanentDelete, isDeleting } = usePermanentDeleteTrash();

  // Convert TrashItem[] to Item[]
  const items = useMemo(() => {
    return trashItems.map(trashItemToItem);
  }, [trashItems]);

  // Store original trash items for context menu actions
  const trashItemsMap = useMemo(() => {
    const map = new Map<string, TrashItem>();
    trashItems.forEach((item) => {
      map.set(item.id, item);
    });
    return map;
  }, [trashItems]);

  /**
   * Handle restore action for trash items
   */
  const handleRestore = async (item: Item) => {
    const trashItem = trashItemsMap.get(item.id);
    if (!trashItem) {
      toast.error("Item not found");
      return;
    }

    try {
      const success = await restore({ item: trashItem });
      if (success) {
        toast.success(
          `${
            item.type === "diagram" ? "Diagram" : "Folder"
          } restored successfully`
        );
      } else {
        toast.error("Failed to restore item");
      }
    } catch (error) {
      console.error("Error restoring item:", error);
      toast.error("An error occurred while restoring the item");
    }
  };

  /**
   * Handle permanent delete action for trash items
   */
  const handlePermanentDelete = async (item: Item) => {
    const trashItem = trashItemsMap.get(item.id);
    if (!trashItem) {
      toast.error("Item not found");
      return;
    }

    const itemType = item.type === "diagram" ? "diagram" : "folder";
    if (
      !confirm(
        `Are you sure you want to permanently delete this ${itemType}? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const success = await permanentDelete({ item: trashItem });
      if (success) {
        toast.success(
          `${itemType === "diagram" ? "Diagram" : "Folder"} permanently deleted`
        );
      } else {
        toast.error("Failed to delete item");
      }
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error("An error occurred while deleting the item");
    }
  };

  const sortByOptions = useMemo(
    () => [
      {
        label: "Name",
        value: "title",
      },
      {
        label: "Date deleted",
        value: "deletedAt",
      },
      {
        label: "Date created",
        value: "createdAt",
      },
      {
        label: "Date updated",
        value: "updatedAt",
      },
    ],
    []
  );

  return (
    <ItemsList
      items={items}
      isLoading={isLoading}
      isFetchingNextPage={isFetchingNextPage}
      hasNextPage={hasNextPage}
      fetchNextPage={fetchNextPage}
      sortBy={sortBy}
      sortDirection={sortDirection}
      onSortByChange={(value) => setSortBy(value as typeof sortBy)}
      onSortDirectionChange={(value) =>
        setSortDirection(value as typeof sortDirection)
      }
      sortByOptions={sortByOptions}
      showCreateButtons={false}
      renderContextMenu={(item) => (
        <>
          <ContextMenuItem
            onClick={() => handleRestore(item)}
            disabled={isRestoring || isDeleting}
          >
            <RotateCcw className="size-4 mr-2" />
            Restore
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem
            onClick={() => handlePermanentDelete(item)}
            disabled={isRestoring || isDeleting}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="size-4 mr-2" />
            Delete Forever
          </ContextMenuItem>
        </>
      )}
    />
  );
}
