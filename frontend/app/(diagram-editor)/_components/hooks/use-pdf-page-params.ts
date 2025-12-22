"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useFileCardStore } from "../../_stores/use-file-card-store";

/**
 * Hook to listen for pdf-page URL parameter changes and automatically:
 * 1. Open FilePanel when pdf-page param is present
 * 2. Convert pdf-page param to page param for PDF viewer
 */
export function usePdfPageParams() {
  const searchParams = useSearchParams();
  const { setIsOpen: setFilePanelOpen } = useFileCardStore();

  useEffect(() => {
    const pdfPageParam = searchParams.get("pdf-page");

    if (pdfPageParam) {
      const pageNumber = parseInt(pdfPageParam, 10);

      // Only proceed if it's a valid page number
      if (pageNumber > 0) {
        // Open file panel if not already open
        // FilePanel will automatically read the pdf-page param and navigate to the page
        setFilePanelOpen(true);
      }
    }
  }, [searchParams, setFilePanelOpen]);
}
