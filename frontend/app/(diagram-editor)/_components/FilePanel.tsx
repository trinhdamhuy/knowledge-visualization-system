"use client";

import { useState, useRef, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { X, FileText, Upload, GripVertical } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useFile } from "@/hooks/use-file";
import { useFileCardStore } from "../_stores/use-file-card-store";
import { useChatPanelStore } from "../_stores/use-chat-panel-store";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";

export function FilePanel() {
  const params = useParams();
  const searchParams = useSearchParams();
  const diagramId = params?.diagramId as string | undefined;
  const { isOpen, setIsOpen } = useFileCardStore();
  const { displayMode } = useChatPanelStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [currentFileUrl, setCurrentFileUrl] = useState<string | null>(null);
  const [currentFileType, setCurrentFileType] = useState<
    "pdf" | "txt" | "md" | null
  >(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [width, setWidth] = useState(400);
  const [isResizing, setIsResizing] = useState(false);

  // Get page number from URL params (check both "page" and "pdf-page")
  const pageParam = searchParams.get("page") || searchParams.get("pdf-page");
  const pdfPage = pageParam ? parseInt(pageParam, 10) : null;

  const {
    fileName,
    fileUrl: storeFileUrl,
    setFile,
    useFilesByDiagram,
    uploadAndCreateFile,
    deleteFile,
    deleteFileByUrlMutation,
  } = useFile();

  // Load file from database
  const { data: latestFile, refetch: refetchFile } = useFilesByDiagram(
    diagramId || "",
    !!diagramId && isOpen
  );

  // Sync file from query to store - support PDF, TXT, MD
  useEffect(() => {
    if (latestFile && ["pdf", "txt", "md"].includes(latestFile.fileType)) {
      setFile(latestFile.fileName, latestFile.fileUrl);
      setCurrentFileUrl(latestFile.fileUrl);
      setCurrentFileType(latestFile.fileType as "pdf" | "txt" | "md");
      setFileError(null);

      // Load text content for TXT and MD files
      if (latestFile.fileType === "txt" || latestFile.fileType === "md") {
        fetch(latestFile.fileUrl)
          .then((res) => res.text())
          .then((text) => setFileContent(text))
          .catch(() => {
            setFileError("Failed to load file content");
            setFileContent(null);
          });
      } else {
        setFileContent(null);
      }
    } else {
      setCurrentFileUrl(null);
      setCurrentFileType(null);
      setFileContent(null);
      setFileError(null);
    }
  }, [latestFile, setFile]);

  const handleFileError = () => {
    setFileError("Failed to load file. The file may have been deleted.");
    setCurrentFileUrl(null);
    setCurrentFileType(null);
    setFileContent(null);
    if (storeFileUrl) {
      setFile("", "");
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !diagramId) return;

    const fileExtension = file.name.split(".").pop()?.toLowerCase();
    const allowedExtensions = ["pdf", "txt", "md"];

    if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
      toast.error("Only PDF, TXT, and MD files are allowed");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    try {
      const savedFile = await uploadAndCreateFile(file, diagramId, diagramId);
      if (savedFile) {
        toast.success("File uploaded successfully");
        refetchFile();
      } else {
        toast.error("Failed to upload file");
      }
    } catch (error) {
      console.error("Failed to upload file:", error);
      toast.error("Failed to upload file");
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveFile = async () => {
    if (!currentFileUrl || !diagramId) return;

    try {
      const deleted = await deleteFile(currentFileUrl, diagramId);
      if (deleted) {
        toast.success("File removed successfully");
        setCurrentFileUrl(null);
        setCurrentFileType(null);
        setFileContent(null);
        setFileError(null);
        refetchFile();
      } else {
        toast.error("Failed to remove file");
      }
    } catch (error) {
      console.error("Failed to remove file:", error);
      toast.error("Failed to remove file");
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle resize for sidebar and docked mode
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (displayMode === "sidebar") {
        // Sidebar mode: resize from right edge
        const newWidth = e.clientX;
        if (newWidth >= 300 && newWidth <= window.innerWidth * 0.6) {
          setWidth(newWidth);
        }
      } else if (displayMode === "docked") {
        // Docked mode: resize from right edge (resize to right)
        // Panel starts at left-20 (80px), so width = mouseX - 80
        const newWidth = e.clientX - 80; // 80px for left-20 (5rem)
        if (newWidth >= 300 && newWidth <= window.innerWidth * 0.6) {
          setWidth(newWidth);
        }
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, displayMode]);

  const fileContentJSX = (
    <>
      <CardHeader className="flex flex-row items-center justify-between shrink-0 p-0">
        <div className="flex items-center gap-2">
          <FileText className="size-5" />
          <CardTitle className="text-sm">File Viewer</CardTitle>
        </div>
        {displayMode === "docked" && (
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
            <X />
          </Button>
        )}
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-3 min-h-0 overflow-hidden p-0">
        {currentFileUrl && fileName ? (
          <>
            <div className="shrink-0 flex items-center gap-2">
              <Badge
                variant="secondary"
                className="flex items-center gap-1.5 max-w-full text-xs"
              >
                <span className="truncate max-w-[150px]">{fileName}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-auto w-auto p-0.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10"
                  onClick={handleRemoveFile}
                  disabled={deleteFileByUrlMutation.isPending}
                  aria-label="Remove file"
                >
                  <X className="size-3 h-3" />
                </Button>
              </Badge>
            </div>

            <div className="flex-1 min-h-0 border overflow-hidden bg-muted/50">
              {fileError ? (
                <div className="h-full flex items-center justify-center p-4 text-center text-muted-foreground">
                  <div>
                    <FileText className="size-8 mx-auto mb-2 opacity-50" />
                    <p className="text-xs">{fileError}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 h-7 text-xs"
                      onClick={() => {
                        setFileError(null);
                        refetchFile();
                      }}
                    >
                      Retry
                    </Button>
                  </div>
                </div>
              ) : currentFileUrl && currentFileType === "pdf" ? (
                <iframe
                  src={
                    pdfPage && pdfPage > 0
                      ? `${currentFileUrl}#page=${pdfPage}`
                      : currentFileUrl
                  }
                  className="w-full h-full border-0 p-0"
                  onError={handleFileError}
                  title="File Viewer"
                  key={pdfPage || 0}
                />
              ) : currentFileUrl &&
                (currentFileType === "txt" || currentFileType === "md") ? (
                <div className="h-full overflow-auto p-4">
                  {fileContent !== null ? (
                    currentFileType === "md" ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          rehypePlugins={[rehypeHighlight]}
                        >
                          {fileContent}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <pre className="whitespace-pre-wrap font-mono text-xs">
                        {fileContent}
                      </pre>
                    )
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-xs text-muted-foreground">
                        Loading...
                      </p>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </>
        ) : (
          <>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.txt,.md"
              onChange={handleFileChange}
              disabled={deleteFileByUrlMutation.isPending}
            />
            <Button
              variant="outline"
              size="sm"
              className="h-full border-dashed flex flex-col items-center justify-center gap-2"
              onClick={() => fileInputRef.current?.click()}
              disabled={deleteFileByUrlMutation.isPending}
            >
              <Upload className="size-5" />
              <span className="text-xs">Upload File</span>
            </Button>
          </>
        )}
      </CardContent>
    </>
  );

  if (!isOpen) return null;

  // Docked mode: card on the right side of toolbar
  if (displayMode === "docked") {
    if (!isOpen) return null;

    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="fixed left-20 bottom-3 z-100 h-[90vh] flex"
            style={{ width: `${width}px` }}
          >
            <Card className="flex-1 flex flex-col gap-3 max-w-3xl min-w-sm h-full p-3">
              {fileContentJSX}
            </Card>
            {/* Resize handle - invisible in docked mode */}
            <div
              className="w-2 cursor-ew-resize shrink-0"
              onMouseDown={(e) => {
                e.preventDefault();
                setIsResizing(true);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  // Sidebar mode: resizable panel on the left
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="h-full flex shrink-0 border-none shadow-none"
          style={{ width: `${width}px` }}
        >
          <Card className="flex-1 h-full flex flex-col gap-3 overflow-hidden rounded-none border-none shadow-none p-3">
            {fileContentJSX}
          </Card>
          {/* Resize handle */}
          <div
            className={cn(
              "w-1 bg-border cursor-ew-resize hover:bg-primary/50 transition-colors shrink-0",
              isResizing && "bg-primary"
            )}
            onMouseDown={(e) => {
              e.preventDefault();
              setIsResizing(true);
            }}
          >
            <div className="h-full flex items-center justify-center">
              <GripVertical className="size-4 text-muted-foreground" />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
