"use client";

import { useState, useRef, useEffect, Activity, useCallback } from "react";
import { useParams } from "next/navigation";
import { X, FileText, Upload, GripVertical } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { useFile } from "@/hooks/use-file";
import { useFileCardStore } from "../_stores/use-file-card-store";
import { useChatPanelStore } from "../_stores/use-chat-panel-store";
import { useCanEditDiagram } from "@/hooks/use-diagram-permission";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import { getSignedFileUrl } from "@/lib/file-upload-handler";

export function FilePanel() {
  const params = useParams();
  const diagramId = params?.diagramId as string | undefined;
  const { isOpen, setIsOpen, pdfPage } = useFileCardStore();
  const { displayMode } = useChatPanelStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [currentFileType, setCurrentFileType] = useState<
    "pdf" | "txt" | "md" | null
  >(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [width, setWidth] = useState(500);
  const [isResizing, setIsResizing] = useState(false);
  const [hasRetriedSignedUrl, setHasRetriedSignedUrl] = useState(false);

  const {
    fileName,
    fileUrl: storeFileUrl,
    signedFileUrl,
    setFile,
    setSignedFileUrl: setStoreSignedFileUrl,
    clearFile,
    useFilesByDiagram,
    uploadAndCreateFile,
    deleteFileByUrlMutation,
    uploadProgress,
    reset,
  } = useFile();

  // Load file from database
  const { data: latestFile, refetch: refetchFile } = useFilesByDiagram(
    diagramId || "",
    !!diagramId
  );

  // Check edit permission
  const { data: canEdit = false, isLoading: isLoadingPermission } =
    useCanEditDiagram(diagramId);

  const refreshSignedUrl = useCallback(
    async (fileUrl: string, fileType: "pdf" | "txt" | "md") => {
      const signedUrl = await getSignedFileUrl(fileUrl, 3600 * 24);
      if (!signedUrl) {
        throw new Error("Failed to generate signed URL");
      }
      setStoreSignedFileUrl(signedUrl);

      if (fileType === "txt" || fileType === "md") {
        const res = await fetch(signedUrl);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const text = await res.text();
        setFileContent(text);
      } else {
        setFileContent(null);
      }

      setFileError(null);
      return signedUrl;
    },
    [setStoreSignedFileUrl]
  );

  // Sync file from query to store - support PDF, TXT, MD
  useEffect(() => {
    if (latestFile && ["pdf", "txt", "md"].includes(latestFile.fileType)) {
      if (
        storeFileUrl !== latestFile.fileUrl ||
        currentFileType !== latestFile.fileType
      ) {
        if (
          fileName !== latestFile.fileName ||
          storeFileUrl !== latestFile.fileUrl
        ) {
          setFile(latestFile.fileName, latestFile.fileUrl);
        }
        setCurrentFileType(latestFile.fileType as "pdf" | "txt" | "md");
        setHasRetriedSignedUrl(false);

        refreshSignedUrl(
          latestFile.fileUrl,
          latestFile.fileType as "pdf" | "txt" | "md"
        )
          .then(() => {
            reset();
          })
          .catch((err) => {
            console.error("Failed to load file:", err);
            setFileError("Failed to load file content");
            setFileContent(null);
            setStoreSignedFileUrl(null);
          });
      }
    } else {
      if (storeFileUrl !== null || currentFileType !== null) {
        setStoreSignedFileUrl(null);
        setCurrentFileType(null);
        setFileContent(null);
        setFileError(null);
        setHasRetriedSignedUrl(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    latestFile,
    currentFileType,
    refreshSignedUrl,
    reset,
    fileName,
    storeFileUrl,
  ]);

  const handleFileError = async () => {
    if (storeFileUrl && currentFileType && !hasRetriedSignedUrl) {
      try {
        setHasRetriedSignedUrl(true);
        await refreshSignedUrl(storeFileUrl, currentFileType);
        return;
      } catch (err) {
        console.error("Failed to refresh signed URL:", err);
      }
    }

    setFileError("Failed to load file. The file link may have expired.");
    setStoreSignedFileUrl(null);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !diagramId || !canEdit) {
      if (file && !canEdit) {
        toast.error("You don't have permission to upload files");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
      return;
    }

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
    if (!storeFileUrl || !diagramId || !canEdit) {
      if (!canEdit) {
        toast.error("You don't have permission to delete files");
      }
      return;
    }

    const fileUrlToDelete = storeFileUrl;
    setCurrentFileType(null);
    setFileContent(null);
    setStoreSignedFileUrl(null);
    setFileError(null);
    clearFile();

    try {
      console.log("Deleting file:", fileUrlToDelete);
      const deleted = await deleteFileByUrlMutation.mutateAsync({
        fileUrl: fileUrlToDelete,
      });

      console.log("Delete result:", deleted, "Type:", typeof deleted);

      const refetchResult = await refetchFile();
      const fileAfterDelete = refetchResult.data;

      if (deleted === true) {
        toast.success("File removed successfully");
      } else {
        if (!fileAfterDelete) {
          toast.success("File removed successfully");
        } else {
          console.warn("Delete file returned false but file still exists");
          toast.error("Failed to remove file");
        }
      }
    } catch (error) {
      console.error("Failed to remove file:", error);
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
          <CardTitle>File Viewer</CardTitle>
        </div>
        {displayMode === "docked" && (
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
            <X />
          </Button>
        )}
      </CardHeader>
      <CardContent className="relative flex-1 flex flex-col gap-3 min-h-0 overflow-hidden p-0">
        {/* Overlay when file error occurs (e.g., signed URL expired) */}
        {fileError && storeFileUrl && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-20 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 p-6 bg-card border rounded-lg shadow-lg max-w-sm text-center">
              <FileText className="size-8 mx-auto mb-1 opacity-70" />
              <p className="text-sm font-medium">Failed to load file</p>
              <p className="text-xs text-muted-foreground">
                The file link may have expired or become temporarily
                unavailable. Click the button below to try reloading the file.
              </p>
              <Button
                variant="default"
                size="sm"
                className="mt-1"
                onClick={() => {
                  setFileError(null);
                  refetchFile();
                }}
              >
                Reload file
              </Button>
            </div>
          </div>
        )}
        {storeFileUrl && fileName ? (
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
                  disabled={deleteFileByUrlMutation.isPending || !canEdit}
                  aria-label="Remove file"
                  title={
                    !canEdit
                      ? "You don't have permission to delete files"
                      : "Remove file"
                  }
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
              ) : signedFileUrl && currentFileType === "pdf" ? (
                <iframe
                  src={
                    pdfPage && pdfPage > 0
                      ? `${signedFileUrl}#page=${pdfPage}`
                      : signedFileUrl
                  }
                  className="w-full h-full border-0 p-0"
                  onError={handleFileError}
                  title="File Viewer"
                  // Force remount when navigating to a specific page.
                  // This makes page jumps reliable across browsers (some ignore hash-only changes on iframes).
                  // It does NOT remount on open/close (we no longer unmount the panel).
                  key={
                    pdfPage && pdfPage > 0
                      ? `pdf-page-${pdfPage}`
                      : "pdf-page-0"
                  }
                />
              ) : storeFileUrl &&
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
              disabled={deleteFileByUrlMutation.isPending || !canEdit}
            />
            {uploadProgress > 0 && (!storeFileUrl || !signedFileUrl) ? (
              <div className="h-full flex flex-col items-center justify-center gap-3 px-6">
                <p className="text-xs text-muted-foreground">
                  Uploading file... {uploadProgress}%
                </p>
                <Progress
                  value={uploadProgress}
                  className="w-48 bg-emerald-100"
                  indicatorClassName="bg-emerald-500"
                />
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="h-full border-dashed flex flex-col items-center justify-center gap-2"
                onClick={() => {
                  if (!canEdit) {
                    toast.error("You don't have permission to upload files");
                    return;
                  }
                  fileInputRef.current?.click();
                }}
                disabled={
                  deleteFileByUrlMutation.isPending ||
                  !canEdit ||
                  isLoadingPermission
                }
                title={
                  !canEdit
                    ? "You don't have permission to upload files"
                    : "Upload File"
                }
              >
                <Upload className="size-5" />
                <span className="text-xs">Upload File</span>
              </Button>
            )}
          </>
        )}
      </CardContent>
    </>
  );

  // Docked mode: card on the right side of toolbar
  if (displayMode === "docked") {
    return (
      <Activity mode={isOpen ? "visible" : "hidden"}>
        <div
          className="fixed left-20 bottom-3 z-10 h-[90vh] flex"
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
        </div>
      </Activity>
    );
  }

  // Sidebar mode: resizable panel on the left
  return (
    <Activity mode={isOpen ? "visible" : "hidden"}>
      <div className="h-full flex shrink-0">
        <Card
          className="h-full flex flex-col overflow-hidden rounded-none border-none shadow-none gap-3 p-3 shrink-0"
          style={{ width: `${width}px` }}
        >
          {fileContentJSX}
        </Card>
        {/* Resize handle */}
        <div
          className={cn(
            "w-2.5 bg-border cursor-ew-resize hover:bg-primary/50 transition-colors shrink-0",
            isResizing && "bg-primary"
          )}
          onMouseDown={(e) => {
            e.preventDefault();
            setIsResizing(true);
          }}
        >
          <div className="h-full flex items-center justify-center">
            <GripVertical className="text-muted-foreground" />
          </div>
        </div>
      </div>
    </Activity>
  );
}
