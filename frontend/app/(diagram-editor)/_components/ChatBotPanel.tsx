"use client";

import {
  ArrowRight,
  Paperclip,
  X,
  Sparkles,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { useState, useRef, useEffect, useMemo } from "react";
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
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Shimmer } from "@/components/ui/shimmer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUploadFile } from "@/hooks/use-upload-file";
import { toast } from "sonner";
import { useFile } from "@/hooks/use-file";
import { useChat } from "@/hooks/use-chat";
import { useChatbotStatus } from "@/hooks/use-chatbot-status";
import { useBroadcastEventListener } from "@/hooks/use-broadcast-event";
import { useDiagramSync } from "@/hooks/use-diagram-sync";
import { useSession } from "next-auth/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import type { BaseMessage, MindmapData } from "@/types/chat";
import { ImportMindmapDialog } from "./ImportMindmapDialog";
import { DeleteChatDialog } from "./DeleteChatDialog";
import { getUserById } from "@/app/_actions/user";
import { useChatSettingsStore } from "@/stores/chat-settings-store";
import { useChatUIStore } from "@/stores/chat-ui-store";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { chatKeys } from "@/hooks/use-chat";

export function ChatBotPanel() {
  const params = useParams();
  const diagramId = params?.diagramId as string | undefined;
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const [value, setValue] = useState("");
  const [deleteChatDialogOpen, setDeleteChatDialogOpen] = useState(false);

  // Use stores for chat settings and UI state
  const { mode, needInitializeData, setMode, setNeedInitializeData } =
    useChatSettingsStore();
  const {
    isOpen,
    currentStatus,
    importDialogOpen,
    pendingMindmapData,
    setIsOpen,
    setCurrentStatus,
    setImportDialogOpen,
    setPendingMindmapData,
  } = useChatUIStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 72,
    maxHeight: 300,
  });
  const {
    fileName,
    fileUrl,
    setFile,
    useFilesByDiagram,
    uploadAndCreateFile,
    deleteFile,
    deleteFileByUrlMutation,
  } = useFile();
  const {
    useChatHistory,
    streamChatMutation,
    deleteDiagramStore,
    deleteChatHistory,
  } = useChat();
  const { isBusy, setChatbotBusy, setChatbotIdle } = useChatbotStatus();
  const { importMindmapData, nodes, edges } = useDiagramSync();
  const queryClient = useQueryClient();

  // Use TanStack Query for chat history
  const { data: historyData, refetch: refetchHistory } = useChatHistory(
    diagramId || "",
    !!diagramId
  );
  const messages = historyData?.messages || [];

  // Load file from database using React Query
  const { data: latestFile } = useFilesByDiagram(diagramId || "", !!diagramId);

  // Sync file from query to store
  useEffect(() => {
    if (latestFile) {
      setFile(latestFile.fileName, latestFile.fileUrl);
    }
  }, [latestFile, setFile]);

  // Listen to broadcast events for stream chunks
  useBroadcastEventListener("stream_chunk", (payload) => {
    if (payload?.current_status) {
      setCurrentStatus(payload.current_status);
    }
  });

  // Listen to stream_complete event to set chatbot idle
  useBroadcastEventListener("stream_complete", () => {
    setChatbotIdle();
    setCurrentStatus(null);
    // Reset need_initialize_data after stream completes
    setNeedInitializeData(false);
    // Refetch chat history to get updated messages from AI
    if (diagramId) {
      // Small delay to ensure backend has saved the message
      setTimeout(() => {
        // Invalidate and refetch to get the latest AI response
        queryClient.invalidateQueries({
          queryKey: chatKeys.history(diagramId),
        });
        // Also explicitly refetch to ensure we get the latest data
        refetchHistory();
      }, 500);
    }
  });

  // Get unique user IDs from messages
  const userIds = useMemo(() => {
    const ids = new Set<string>();
    messages.forEach((msg: BaseMessage) => {
      if (msg.type === "human" && msg.additional_kwargs?.user_id) {
        ids.add(msg.additional_kwargs.user_id);
      }
    });
    return Array.from(ids);
  }, [messages]);

  // Use TanStack Query to fetch user info
  // Sort userIds to ensure consistent query key
  const sortedUserIds = useMemo(() => [...userIds].sort(), [userIds]);
  const userQueries = useQuery({
    queryKey: ["users", sortedUserIds.join(",")],
    queryFn: async () => {
      const userMap: Record<string, { name: string; image: string | null }> =
        {};
      await Promise.all(
        userIds.map(async (uid) => {
          const user = await getUserById(uid);
          if (user) {
            userMap[uid] = {
              name: user.name || "Unknown",
              image: user.image || null,
            };
          }
        })
      );
      return userMap;
    },
    enabled: userIds.length > 0,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const userCache = userQueries.data || {};

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = async () => {
    if (!value.trim() || !diagramId || !userId) return;
    if (isBusy) {
      toast.error("Chatbot is busy. Please wait...");
      return;
    }

    const messageContent = value.trim();
    setValue("");
    adjustHeight(true);

    // Set chatbot as busy
    setChatbotBusy();

    // Prepare mindmap_data if mode is generate
    const mindmapData: MindmapData | null =
      mode === "generate" && nodes.length > 0
        ? {
            nodes: nodes,
            edges: edges,
          }
        : null;

    try {
      // Wait for API to return success (message saved to database)
      await streamChatMutation.mutateAsync({
        user_id: userId,
        diagram_id: diagramId,
        mode: mode,
        file_url: fileUrl || null,
        messages: [
          {
            type: "human",
            content: messageContent,
            additional_kwargs: {
              user_id: userId,
            },
          },
        ],
        mindmap_data: mindmapData,
        need_initialize_data: needInitializeData,
      });
      // Query will be invalidated in onSuccess callback after API returns success
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message");
      setChatbotIdle();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !diagramId) return;

    const fileExtension = file.name.split(".").pop()?.toLowerCase();
    const allowedExtensions = ["pdf", "txt"];

    if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
      toast.error("Only PDF and TXT files are allowed");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    try {
      const savedFile = await uploadAndCreateFile(file, diagramId, diagramId);
      if (savedFile) {
        toast.success("File uploaded successfully");
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

  const handleDeleteChat = async () => {
    if (!diagramId) return;

    try {
      const result = await deleteChatHistory({ diagramId });
      if (result) {
        toast.success("Chat history deleted successfully");
      } else {
        toast.error("Failed to delete chat history");
      }
    } catch (error) {
      console.error("Failed to delete chat history:", error);
      toast.error("Failed to delete chat history");
    }
  };

  const handleRemoveFile = async () => {
    if (!fileUrl || !diagramId) return;

    try {
      const deleted = await deleteFile(fileUrl, diagramId);

      // Also delete diagram store (vector store) when file is removed
      if (deleted) {
        try {
          await deleteDiagramStore({ diagramId });
        } catch (error) {
          console.error("Failed to delete diagram store:", error);
          // Continue even if store deletion fails
        }
        toast.success("File removed successfully");
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

  const handleImportMindmap = (replaceExisting: boolean) => {
    if (!pendingMindmapData) return;

    importMindmapData(pendingMindmapData, replaceExisting);
    toast.success(
      replaceExisting
        ? "Mindmap imported successfully"
        : "Mindmap merged successfully"
    );
    setPendingMindmapData(null);
  };

  const renderMessage = (message: BaseMessage, index: number) => {
    const isHuman = message.type === "human";
    const isAI = message.type === "ai";
    const userInfo =
      message.additional_kwargs?.user_id &&
      userCache[message.additional_kwargs.user_id]
        ? userCache[message.additional_kwargs.user_id]
        : null;

    const mindmapData =
      message.name === "mindmap" && message.additional_kwargs?.mindmap_data
        ? (message.additional_kwargs.mindmap_data as MindmapData)
        : null;

    const content =
      typeof message.content === "string"
        ? message.content
        : Array.isArray(message.content)
        ? message.content
            .map((c) => (typeof c === "string" ? c : JSON.stringify(c)))
            .join("")
        : String(message.content);

    return (
      <div
        key={index}
        className={cn(
          "flex gap-3 mb-4",
          isHuman ? "flex-row-reverse" : "flex-row"
        )}
      >
        {isHuman ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Avatar className="size-8">
                <AvatarImage src={userInfo?.image || undefined} />
                <AvatarFallback>
                  {userInfo?.name?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent>
              <p>{userInfo?.name || "Unknown User"}</p>
            </TooltipContent>
          </Tooltip>
        ) : (
          <div className="size-8 rounded-full bg-primary flex items-center justify-center">
            <Bot className="size-5 text-primary-foreground" />
          </div>
        )}

        <div
          className={cn(
            "w-fit rounded-lg p-3 max-w-[80%]",
            isHuman
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-foreground"
          )}
        >
          {isAI ? (
            <div className="markdown-content">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
              >
                {content}
              </ReactMarkdown>
            </div>
          ) : (
            <div className="markdown-content">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
              >
                {content}
              </ReactMarkdown>
            </div>
          )}

          {mindmapData && (
            <Badge
              variant="outline"
              className="cursor-pointer hover:bg-accent mt-2"
              onClick={() => {
                setPendingMindmapData(mindmapData);
                setImportDialogOpen(true);
              }}
            >
              <Sparkles className="w-3 h-3" />
              Import Mindmap ({mindmapData.nodes?.length || 0} nodes,{" "}
              {mindmapData.edges?.length || 0} edges)
            </Badge>
          )}
        </div>
      </div>
    );
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
              ease: [0.16, 1, 0.3, 1],
            }}
            className="fixed bottom-3 right-3 w-3xl z-50"
          >
            <Card className="flex flex-col h-[90vh]">
              <CardHeader className="flex flex-col gap-3 shrink-0">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <Bot animate="blink" loop loopDelay={5000} animateOnHover />
                    <CardTitle>Chat Bot</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteChatDialogOpen(true)}
                      disabled={isBusy}
                      title="Delete chat history"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsOpen(false)}
                    >
                      <X />
                    </Button>
                  </div>
                </div>
                {/* Options */}
                <div className="flex items-center gap-4 flex-wrap text-sm">
                  <div className="flex items-center gap-2">
                    <Label
                      htmlFor="mode-select"
                      className="text-sm font-medium"
                    >
                      Mode:
                    </Label>
                    <Select
                      value={mode}
                      onValueChange={(value: "chat" | "generate") =>
                        setMode(value)
                      }
                      disabled={isBusy}
                    >
                      <SelectTrigger
                        id="mode-select"
                        size="sm"
                        className="w-[130px]"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="chat">Chat</SelectItem>
                        <SelectItem value="generate">Generate</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {fileUrl && fileName && (
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="reload-data"
                        checked={needInitializeData}
                        onCheckedChange={(checked) =>
                          setNeedInitializeData(checked === true)
                        }
                        disabled={isBusy}
                      />
                      <Label
                        htmlFor="reload-data"
                        className="text-sm cursor-pointer flex items-center gap-1.5"
                        title="Reload data from uploaded PDF file"
                      >
                        <RefreshCw className="size-3.5" />
                        Reload from file
                      </Label>
                    </div>
                  )}
                  {mode === "generate" && (
                    <Badge variant="secondary">
                      {nodes.length} nodes, {edges.length} edges
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex flex-col flex-1 min-h-0 gap-2">
                {/* Messages area */}
                <div className="flex-1 overflow-y-auto pr-2 mb-2">
                  {messages.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      No messages yet. Start a conversation!
                    </div>
                  ) : (
                    messages.map((msg: BaseMessage, index: number) =>
                      renderMessage(msg, index)
                    )
                  )}
                  {currentStatus && (
                    <div className="flex gap-3 mb-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
                      <div className="size-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                        <Bot className="size-5 text-primary-foreground" />
                      </div>
                      <div className="w-fit rounded-lg p-3 bg-muted text-muted-foreground text-sm italic">
                        <Shimmer>{currentStatus}</Shimmer>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input area */}
                <div className="relative shrink-0">
                  <div className="relative flex flex-col">
                    <div className="overflow-y-auto">
                      <Textarea
                        value={value}
                        placeholder="What can I do for you?"
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
                        disabled={isBusy}
                      />
                    </div>

                    <div className="h-14 bg-black/5 dark:bg-white/5 rounded-b-xl flex items-center">
                      <div className="absolute left-3 right-3 bottom-3 flex items-center justify-between w-[calc(100%-24px)]">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {fileUrl && fileName ? (
                            <Badge
                              variant="secondary"
                              className="flex items-center gap-1.5 max-w-full"
                            >
                              <span className="truncate max-w-[200px]">
                                {fileName}
                              </span>
                              <button
                                type="button"
                                onClick={handleRemoveFile}
                                disabled={deleteFileByUrlMutation.isPending}
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
                                (deleteFileByUrlMutation.isPending ||
                                  !!fileUrl ||
                                  isBusy) &&
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
                                disabled={
                                  deleteFileByUrlMutation.isPending ||
                                  !!fileUrl ||
                                  isBusy
                                }
                              />
                              <Paperclip className="w-4 h-4 transition-colors" />
                            </label>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={handleSend}
                          className={cn(
                            "rounded-lg p-2 bg-black/5 dark:bg-white/5",
                            "hover:bg-black/10 dark:hover:bg-white/10 focus-visible:ring-1 focus-visible:ring-offset-0 focus-visible:ring-blue-500",
                            "disabled:opacity-50 disabled:cursor-not-allowed"
                          )}
                          aria-label="Send message"
                          disabled={!value.trim() || isBusy}
                        >
                          <ArrowRight
                            className={cn(
                              "w-4 h-4 dark:text-white transition-opacity duration-200",
                              value.trim() && !isBusy
                                ? "opacity-100"
                                : "opacity-30"
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

      <ImportMindmapDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        mindmapData={pendingMindmapData}
        onConfirm={handleImportMindmap}
      />

      <DeleteChatDialog
        open={deleteChatDialogOpen}
        onOpenChange={setDeleteChatDialogOpen}
        onConfirm={handleDeleteChat}
      />
    </>
  );
}
