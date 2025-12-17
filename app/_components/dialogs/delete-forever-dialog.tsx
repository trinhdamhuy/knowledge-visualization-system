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
  permanentDeleteDiagram,
  permanentDeleteFolder,
} from "@/app/_actions/trash";
import { useQueryClient } from "@tanstack/react-query";
import { trashKeys } from "@/hooks/use-trash";

interface DeleteForeverDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: string;
  itemTitle: string;
  itemType: "diagram" | "folder";
}

export function DeleteForeverDialog({
  open,
  onOpenChange,
  itemId,
  itemTitle,
  itemType,
}: DeleteForeverDialogProps) {
  const [isDeleting, setIsDeleting] = React.useState(false);
  const queryClient = useQueryClient();

  async function handleDelete() {
    try {
      setIsDeleting(true);
      const success =
        itemType === "diagram"
          ? await permanentDeleteDiagram(itemId)
          : await permanentDeleteFolder(itemId);

      if (success) {
        toast.success(
          `${itemType === "diagram" ? "Diagram" : "Folder"} permanently deleted`
        );
        // Invalidate queries to refresh the list
        queryClient.invalidateQueries({ queryKey: trashKeys.list() });
        onOpenChange(false);
      } else {
        toast.error("Failed to delete item. You may not have permission.");
      }
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error("An error occurred while deleting the item");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete Forever</DialogTitle>
          <DialogDescription>
            Are you sure you want to permanently delete &quot;{itemTitle}&quot;?
            This action cannot be undone and the {itemType} will be permanently
            removed from your account.
          </DialogDescription>
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
