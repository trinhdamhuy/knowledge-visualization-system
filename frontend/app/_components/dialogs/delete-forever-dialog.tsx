"use client";

import * as React from "react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  permanentDeleteDiagrams,
  permanentDeleteFolders,
} from "@/app/_actions/trash";
import { useQueryClient } from "@tanstack/react-query";
import { trashKeys } from "@/hooks/use-trash";
import { itemsKeys } from "@/hooks/use-items";
import { diagramKeys } from "@/hooks/use-diagram";

type DeleteForeverItem = {
  id: string;
  title: string;
  type: "diagram" | "folder";
};

type DeleteForeverDialogProps =
  | {
      open: boolean;
      onOpenChange: (open: boolean) => void;
      // Single item (backward compatible)
      itemId: string;
      itemTitle: string;
      itemType: "diagram" | "folder";
      items?: never;
    }
  | {
      open: boolean;
      onOpenChange: (open: boolean) => void;
      // Multi items
      items: DeleteForeverItem[];
      itemId?: never;
      itemTitle?: never;
      itemType?: never;
    };

function getTargets(props: DeleteForeverDialogProps): DeleteForeverItem[] {
  if ("items" in props) return props.items ?? [];
  return [{ id: props.itemId, title: props.itemTitle, type: props.itemType }];
}

function getDescription(targets: DeleteForeverItem[]) {
  if (targets.length === 1) {
    return `Are you sure you want to permanently delete "${targets[0].title}"? This action cannot be undone and the ${targets[0].type} will be permanently removed from your account.`;
  }
  const diagrams = targets.filter((t) => t.type === "diagram").length;
  const folders = targets.filter((t) => t.type === "folder").length;
  const parts: string[] = [];
  if (diagrams) parts.push(`${diagrams} diagram(s)`);
  if (folders) parts.push(`${folders} folder(s)`);
  return `Are you sure you want to permanently delete ${parts.join(
    " and "
  )}? This action cannot be undone.`;
}

export function DeleteForeverDialog(props: DeleteForeverDialogProps) {
  const { open, onOpenChange } = props;
  const [isDeleting, setIsDeleting] = React.useState(false);
  const queryClient = useQueryClient();
  const targets = getTargets(props);
  const description = getDescription(targets);

  async function handleDelete() {
    try {
      setIsDeleting(true);
      const currentTargets = getTargets(props);
      const diagramIds = currentTargets
        .filter((t) => t.type === "diagram")
        .map((t) => t.id);
      const folderIds = currentTargets
        .filter((t) => t.type === "folder")
        .map((t) => t.id);

      const [deletedDiagrams, deletedFolders] = await Promise.all([
        diagramIds.length > 0
          ? permanentDeleteDiagrams(diagramIds)
          : Promise.resolve(0),
        folderIds.length > 0
          ? permanentDeleteFolders(folderIds)
          : Promise.resolve(0),
      ]);

      const deletedCount = deletedDiagrams + deletedFolders;

      if (deletedCount > 0) {
        toast.success(`Permanently deleted ${deletedCount} item(s)`);
        // Invalidate queries to refresh UI across trash + home/diagrams pages
        queryClient.invalidateQueries({ queryKey: trashKeys.list() });
        queryClient.invalidateQueries({ queryKey: itemsKeys.all });
        queryClient.invalidateQueries({ queryKey: diagramKeys.lists() });
        onOpenChange(false);
      } else {
        toast.error("Failed to delete item(s). You may not have permission.");
      }
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error("An error occurred while deleting the item(s)");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete Forever</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete Forever"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
