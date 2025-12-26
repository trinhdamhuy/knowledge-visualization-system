"use client";

import { useEffect } from "react";
import { useUpdateMyPresence } from "@liveblocks/react";
import { useFile } from "@/hooks/use-file";
import { useFileCardStore } from "../../_stores/use-file-card-store";

/**
 * Hook to handle hash-based navigation for reference links
 * Listens to URL hash changes and automatically navigates to:
 * - PDF pages: #pdf/page_number
 * - Nodes: #node/node_id
 * - Combined: #node/node_id#pdf/page_number
 */
export function useHashNavigation() {
  const updateMyPresence = useUpdateMyPresence();
  const { fileUrl } = useFile();
  const { openPdfPage } = useFileCardStore();

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.substring(1); // Remove leading #
      if (!hash) return;

      // Split multiple hash fragments: node/node-123#pdf/96
      const fragments = hash.split("#");

      fragments.forEach((fragment) => {
        if (fragment.startsWith("node/")) {
          const nodeId = fragment.substring(5); // Remove "node/"
          if (nodeId) {
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
          }
        } else if (fragment.startsWith("pdf/")) {
          const pageStr = fragment.substring(4); // Remove "pdf/"
          const page = parseInt(pageStr, 10);
          if (page > 0 && fileUrl) {
            openPdfPage(page);
          }
        }
      });
    };

    // Check initial hash on mount
    handleHashChange();

    // Listen to hash changes
    window.addEventListener("hashchange", handleHashChange);

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, [updateMyPresence, fileUrl, openPdfPage]);
}
