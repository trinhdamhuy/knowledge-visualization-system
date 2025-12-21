"use client";

import { useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Button } from "@/components/ui/button";
import { FileText, Focus } from "lucide-react";
import { useUpdateMyPresence } from "@liveblocks/react";
import { useFile } from "@/hooks/use-file";
import { useChatPanelStore } from "../_stores/use-chat-panel-store";

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
  const { setIsOpen: setFilePanelOpen } = useChatPanelStore();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleOpenPDF = useCallback(() => {
    if (!fileUrl || !page) return;

    // Open file panel if not already open
    setFilePanelOpen(true);

    // Set page number in URL params
    const params = new URLSearchParams(searchParams.toString());
    params.set("pdf-page", page.toString());
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [fileUrl, page, setFilePanelOpen, router, pathname, searchParams]);

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
      <HoverCardTrigger>{children}</HoverCardTrigger>
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
