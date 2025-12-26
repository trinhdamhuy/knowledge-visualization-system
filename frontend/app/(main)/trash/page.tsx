"use client";

import { useState, useMemo } from "react";
import { ItemsList } from "@/app/_components/layouts/items-list";
import { useTrashItems, useRestoreTrash } from "@/hooks/use-trash";
import { toast } from "sonner";
import type { TrashItem } from "@/types/trash";
import type { Item } from "@/types";
import {
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
} from "@/components/ui/context-menu";
import { RotateCcw, Trash2 } from "lucide-react";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { DeleteForeverDialog } from "@/app/_components/dialogs/delete-forever-dialog";

/**
 * Convert TrashItem to Item format for display
 */
function trashItemToItem(trashItem: TrashItem): Item {
  if (trashItem.type === "diagram") {
    const { trash, type, ...diagram } = trashItem;
    return {
      trash,
      type,
      ...diagram,
      owner: diagram.owner,
    } as Item;
  } else {
    const { trash, type, ...folder } = trashItem;
    return {
      trash,
      type,
      ...folder,
      owner: folder.owner,
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
  const [deleteForeverDialog, setDeleteForeverDialog] = useState<{
    open: boolean;
    items: Item[];
  }>({ open: false, items: [] });

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
  const handleDeleteForever = (item: Item) => {
    setDeleteForeverDialog({ open: true, items: [item] });
  };

  const handleDeleteForeverSelection = (selected: Item[]) => {
    if (!selected || selected.length === 0) return;
    setDeleteForeverDialog({ open: true, items: selected });
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
    <>
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
        isTrashMode={true}
        trashItemsMap={trashItemsMap}
        onRequestDeleteForever={handleDeleteForeverSelection}
        renderContextMenu={(item) => (
          <>
            <ContextMenuItem
              onSelect={() => handleRestore(item)}
              disabled={isRestoring}
            >
              <RotateCcw />
              Restore
              <ContextMenuShortcut>
                <KbdGroup>
                  <Kbd>Ctrl</Kbd>
                  <Kbd>R</Kbd>
                </KbdGroup>
              </ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem
              onSelect={() => handleDeleteForever(item)}
              disabled={isRestoring}
              variant="destructive"
            >
              <Trash2 />
              Delete Forever
              <ContextMenuShortcut>
                <Kbd>Del</Kbd>
              </ContextMenuShortcut>
            </ContextMenuItem>
          </>
        )}
      />
      {deleteForeverDialog.open && deleteForeverDialog.items.length > 0 && (
        <DeleteForeverDialog
          open={deleteForeverDialog.open}
          onOpenChange={(open) =>
            setDeleteForeverDialog({
              open,
              items: open ? deleteForeverDialog.items : [],
            })
          }
          items={deleteForeverDialog.items.map((i) => ({
            id: i.id,
            title: i.name,
            type: i.type,
          }))}
        />
      )}
    </>
  );
}
