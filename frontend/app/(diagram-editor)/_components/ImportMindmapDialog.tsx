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
import type { MindmapData } from "@/types/chat";

interface ImportMindmapDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mindmapData: MindmapData | null;
  onConfirm: (replaceExisting: boolean) => void;
}

export function ImportMindmapDialog({
  open,
  onOpenChange,
  mindmapData,
  onConfirm,
}: ImportMindmapDialogProps) {
  const handleReplace = () => {
    onConfirm(true);
    onOpenChange(false);
  };

  const handleMerge = () => {
    onConfirm(false);
    onOpenChange(false);
  };

  if (!mindmapData) return null;

  const nodeCount = mindmapData.nodes?.length ?? 0;
  const edgeCount = mindmapData.edges?.length ?? 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Mindmap Data</DialogTitle>
          <DialogDescription>
            This mindmap contains {nodeCount} nodes and {edgeCount} edges. How
            would you like to import it?
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-2">
          <p className="text-sm text-muted-foreground">
            <strong>Replace existing:</strong> This will remove all current
            nodes and edges, then import the new mindmap data.
          </p>
          <p className="text-sm text-muted-foreground">
            <strong>Merge with existing:</strong> This will add the new nodes
            and edges to your current diagram. Note: If there are ID conflicts,
            existing items may be overwritten.
          </p>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleReplace}>
            Replace Existing
          </Button>
          <Button onClick={handleMerge}>Merge with Existing</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
