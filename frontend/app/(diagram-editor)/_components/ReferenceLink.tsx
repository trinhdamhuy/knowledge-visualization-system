"use client";

import { useCallback } from "react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Button } from "@/components/ui/button";
import { FileText, Focus } from "lucide-react";
import { useUpdateMyPresence } from "@liveblocks/react";
import { useFile } from "@/hooks/use-file";
import { useFileCardStore } from "../_stores/use-file-card-store";

interface ReferenceLinkProps {
  page?: number;
  nodeId?: string;
  children: React.ReactNode;
}

/**
 * Component to render reference links in AI messages with hover card
 * Format: [text content](#node/node-123#pdf/5) or [text](#pdf/5) or [text](#node/node-123)
 */
export function ReferenceLink({ page, nodeId, children }: ReferenceLinkProps) {
  const updateMyPresence = useUpdateMyPresence();
  const { fileUrl } = useFile();
  const { openPdfPage } = useFileCardStore();

  const handleOpenPDF = useCallback(() => {
    if (!fileUrl || !page) return;
    openPdfPage(page);
  }, [fileUrl, page, openPdfPage]);

  const handleFocusNode = useCallback(() => {
    if (!nodeId) return;

    // Select the node via Presence
    updateMyPresence({
      selectedObjectIds: {
        nodeIds: [nodeId],
        edgeIds: [],
      },
    });

    // Dispatch a custom event to focus on the node
    // This will be handled by DiagramCanvas
    window.dispatchEvent(
      new CustomEvent("focus-node", {
        detail: { nodeId },
      })
    );
  }, [nodeId, updateMyPresence]);

  const hasPage = page !== undefined && page > 0;
  const hasNode = nodeId !== undefined && nodeId.length > 0;

  if (!hasPage && !hasNode) {
    // If no valid ref data, just render as plain text
    return <>{children}</>;
  }

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Button className="p-0 text-blue-500" variant="link">
          {children}
        </Button>
      </HoverCardTrigger>
      <HoverCardContent className="w-64 flex flex-col gap-1 p-1 z-999">
        {hasPage && (
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={handleOpenPDF}
          >
            <FileText />
            Open PDF page {page}
          </Button>
        )}
        {hasNode && (
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={handleFocusNode}
          >
            <Focus />
            Focus on node
          </Button>
        )}
      </HoverCardContent>
    </HoverCard>
  );
}
