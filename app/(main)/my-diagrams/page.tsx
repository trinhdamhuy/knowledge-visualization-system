"use client";

import { useState } from "react";
import { ItemsList } from "@/app/_components/layouts/items-list";
import { DiagramContextMenu } from "@/app/_components/context-menus/diagram-context-menu";
import { RenameDiagramDialog } from "@/app/_components/dialogs/rename-diagram-dialog";
import { DeleteDiagramDialog } from "@/app/_components/dialogs/delete-diagram-dialog";
import type { Item } from "@/types";

export default function MyDiagramsPage() {
  const [renameDialog, setRenameDialog] = useState<{
    open: boolean;
    item: Item | null;
  }>({ open: false, item: null });
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    item: Item | null;
  }>({ open: false, item: null });

  const handleRename = (item: Item) => {
    setRenameDialog({ open: true, item });
  };

  const handleDelete = (item: Item) => {
    setDeleteDialog({ open: true, item });
  };

  return (
    <>
      <ItemsList
        onlyMine={true}
        renderContextMenu={(item: Item) => (
          <DiagramContextMenu
            item={item}
            onRename={handleRename}
            onDelete={handleDelete}
          />
        )}
      />
      {renameDialog.item && (
        <RenameDiagramDialog
          open={renameDialog.open}
          onOpenChange={(open) =>
            setRenameDialog({ open, item: open ? renameDialog.item : null })
          }
          diagramId={renameDialog.item.id}
          currentTitle={renameDialog.item.name}
        />
      )}
      {deleteDialog.item && (
        <DeleteDiagramDialog
          open={deleteDialog.open}
          onOpenChange={(open) =>
            setDeleteDialog({ open, item: open ? deleteDialog.item : null })
          }
          diagramId={deleteDialog.item.id}
          diagramTitle={deleteDialog.item.name}
        />
      )}
    </>
  );
}
