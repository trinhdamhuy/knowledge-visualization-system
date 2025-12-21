"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface PasteErrorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  error: string | null;
}

/**
 * Dialog component to display paste validation errors
 */
export function PasteErrorDialog({
  open,
  onOpenChange,
  error,
}: PasteErrorDialogProps) {
  return (
    <Dialog open={open && !!error} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Paste Error</DialogTitle>
          <DialogDescription>{error}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>OK</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
