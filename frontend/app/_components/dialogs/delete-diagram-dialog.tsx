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
import { deleteDiagrams } from "@/app/_actions/diagram";
import { useQueryClient } from "@tanstack/react-query";
import { itemsKeys } from "@/hooks/use-items";
import { diagramKeys } from "@/hooks/use-diagram";

interface DeleteDiagramDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  diagramId: string;
  diagramTitle: string;
}

export function DeleteDiagramDialog({
  open,
  onOpenChange,
  diagramId,
  diagramTitle,
}: DeleteDiagramDialogProps) {
  const [isDeleting, setIsDeleting] = React.useState(false);
  const queryClient = useQueryClient();

  async function handleDelete() {
    try {
      setIsDeleting(true);
      const successCount = await deleteDiagrams([diagramId]);

      if (successCount > 0) {
        toast.success("Diagram moved to trash");
        // Invalidate queries to refresh the list
        queryClient.invalidateQueries({ queryKey: itemsKeys.all });
        queryClient.invalidateQueries({ queryKey: diagramKeys.lists() });
        onOpenChange(false);
      } else {
        toast.error("Failed to delete diagram. You may not have permission.");
      }
    } catch (error) {
      console.error("Error deleting diagram:", error);
      toast.error("An error occurred while deleting the diagram");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete Diagram</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete &quot;{diagramTitle}&quot;? This
            action will move the diagram to trash. You can restore it later if
            needed.
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
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
