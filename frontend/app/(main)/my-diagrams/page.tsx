"use client";

import { useState } from "react";
import { ItemsList } from "@/app/_components/layouts/items-list";
import { RenameDiagramDialog } from "@/app/_components/dialogs/rename-diagram-dialog";
import { DeleteDiagramDialog } from "@/app/_components/dialogs/delete-diagram-dialog";
import { ShareDialog } from "@/app/_components/dialogs/share-dialog";
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
  const [shareDialog, setShareDialog] = useState<{
    open: boolean;
    item: Item | null;
  }>({ open: false, item: null });

  const handleRename = (item: Item) => {
    setRenameDialog({ open: true, item });
  };

  const handleDelete = (item: Item) => {
    setDeleteDialog({ open: true, item });
  };

  const handleShare = (item: Item) => {
    setShareDialog({ open: true, item });
  };

  return (
    <>
      <ItemsList
        onlyMine={true}
        onRename={handleRename}
        onDeleteItem={handleDelete}
        onShare={handleShare}
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
      {shareDialog.item && (
        <ShareDialog
          open={shareDialog.open}
          onOpenChange={(open) =>
            setShareDialog({ open, item: open ? shareDialog.item : null })
          }
          diagramId={shareDialog.item.id}
        />
      )}
    </>
  );
}
