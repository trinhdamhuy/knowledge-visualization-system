"use client";

import { ArrowRight, Paperclip, X } from "lucide-react";
import { useState, useRef } from "react";
import { useParams } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useAutoResizeTextarea } from "@/hooks/use-auto-resize-textarea";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "motion/react";
import { Bot } from "@/components/animate-ui/icons/bot";
import { AnimateIcon } from "@/components/animate-ui/icons/icon";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useUploadFile } from "@/hooks/use-upload-file";
import { toast } from "sonner";

export function ChatBotPanel() {
  const params = useParams();
  const diagramId = params?.diagramId as string | undefined;
  const [value, setValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{
    fileName: string;
    fileUrl: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 72,
    maxHeight: 300,
  });
  const { uploadFileHandler, deleteFileHandler, loading } = useUploadFile();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      setValue("");
      adjustHeight(true);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !diagramId) return;

    // Validate file type - only PDF and TXT are allowed
    const fileExtension = file.name.split(".").pop()?.toLowerCase();
    const allowedExtensions = ["pdf", "txt"];

    if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
      toast.error("Only PDF and TXT files are allowed");
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    const fileUrl = await uploadFileHandler(file, diagramId);
    if (fileUrl) {
      setUploadedFile({
        fileName: file.name,
        fileUrl,
      });
      toast.success("File uploaded successfully");
    } else {
      toast.error("Failed to upload file");
    }
    // Reset input to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveFile = async () => {
    if (!uploadedFile) return;

    await deleteFileHandler(uploadedFile.fileUrl);
    setUploadedFile(null);
    toast.success("File removed successfully");
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <AnimateIcon
              className="size-12 fixed bottom-3 right-3 rounded-full z-50 bg-secondary hover:bg-secondary/80 flex items-center justify-center"
              animateOnHover
              onClick={() => setIsOpen(true)}
            >
              <Bot />
            </AnimateIcon>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{
              duration: 0.3,
              ease: [0.16, 1, 0.3, 1], // Custom easing for smooth animation
            }}
            className="fixed bottom-3 right-3 w-xl z-50"
          >
            <Card>
              <CardHeader className="flex items-center justify-between">
                <Bot animate="blink" loop loopDelay={5000} animateOnHover />
                <CardTitle>Chat Bot</CardTitle>
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                >
                  <X />
                </Button>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <div className="relative">
                  <div className="relative flex flex-col">
                    <div
                      className="overflow-y-auto"
                      style={{ maxHeight: "400px" }}
                    >
                      <Textarea
                        id="ai-input-15"
                        value={value}
                        placeholder={"What can I do for you?"}
                        className={cn(
                          "w-full rounded-xl rounded-b-none px-4 py-3 bg-black/5 dark:bg-white/5 border-none dark:text-white placeholder:text-black/70 dark:placeholder:text-white/70 resize-none focus-visible:ring-0 focus-visible:ring-offset-0",
                          "min-h-[72px]"
                        )}
                        ref={textareaRef}
                        onKeyDown={handleKeyDown}
                        onChange={(e) => {
                          setValue(e.target.value);
                          adjustHeight();
                        }}
                      />
                    </div>

                    <div className="h-14 bg-black/5 dark:bg-white/5 rounded-b-xl flex items-center">
                      <div className="absolute left-3 right-3 bottom-3 flex items-center justify-between w-[calc(100%-24px)]">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {uploadedFile ? (
                            <Badge
                              variant="secondary"
                              className="flex items-center gap-1.5 max-w-full"
                            >
                              <span className="truncate max-w-[200px]">
                                {uploadedFile.fileName}
                              </span>
                              <button
                                type="button"
                                onClick={handleRemoveFile}
                                disabled={loading}
                                className="rounded-full hover:bg-black/10 dark:hover:bg-white/10 p-0.5 transition-colors disabled:opacity-50"
                                aria-label="Remove file"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                          ) : (
                            <label
                              className={cn(
                                "rounded-lg p-2 bg-black/5 dark:bg-white/5 cursor-pointer",
                                "hover:bg-black/10 dark:hover:bg-white/10 focus-visible:ring-1 focus-visible:ring-offset-0 focus-visible:ring-blue-500",
                                "text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white",
                                (loading || !!uploadedFile) &&
                                  "opacity-50 cursor-not-allowed pointer-events-none"
                              )}
                              aria-label="Attach file"
                            >
                              <input
                                ref={fileInputRef}
                                type="file"
                                className="hidden"
                                accept=".pdf,.txt"
                                onChange={handleFileChange}
                                disabled={loading || !!uploadedFile}
                              />
                              <Paperclip className="w-4 h-4 transition-colors" />
                            </label>
                          )}
                        </div>
                        <button
                          type="button"
                          className={cn(
                            "rounded-lg p-2 bg-black/5 dark:bg-white/5",
                            "hover:bg-black/10 dark:hover:bg-white/10 focus-visible:ring-1 focus-visible:ring-offset-0 focus-visible:ring-blue-500"
                          )}
                          aria-label="Send message"
                          disabled={!value.trim()}
                        >
                          <ArrowRight
                            className={cn(
                              "w-4 h-4 dark:text-white transition-opacity duration-200",
                              value.trim() ? "opacity-100" : "opacity-30"
                            )}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
