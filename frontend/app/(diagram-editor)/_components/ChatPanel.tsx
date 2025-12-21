"use client";

import {
  ArrowRight,
  X,
  Sparkles,
  RefreshCw,
  Trash2,
  GripVertical,
} from "lucide-react";
import { useState, useRef, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useAutoResizeTextarea } from "@/hooks/use-auto-resize-textarea";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "motion/react";
import { Bot } from "@/components/animate-ui/icons/bot";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useChatPanelStore } from "../_stores/use-chat-panel-store";

export function ChatPanel() {
  const params = useParams();
  const diagramId = params?.diagramId as string | undefined;
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const [value, setValue] = useState("");
  const [deleteChatDialogOpen, setDeleteChatDialogOpen] = useState(false);
  const [messagesOffset, setMessagesOffset] = useState(0);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [allMessages, setAllMessages] = useState<BaseMessage[]>([]);
  const [width, setWidth] = useState(400);
  const [isResizing, setIsResizing] = useState(false);
  const [promptSuggestions, setPromptSuggestions] = useState<string[]>([]);

  // Default prompt suggestions (detailed prompts)
  const defaultPrompts = [
    "Summarize the main points and key concepts from the document",
    "Explain the important details and provide examples",
    "Create a comprehensive mindmap showing relationships between concepts",
  ];

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
  const { displayMode } = useChatPanelStore();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 72,
    maxHeight: 300,
  });
  const { fileName, fileUrl, useFilesByDiagram } = useFile();

  // Load file data to get content for prompts
  const { data: latestFile } = useFilesByDiagram(
    diagramId || "",
    !!diagramId && !!fileUrl
  );

  const {
    useChatHistory,
    sendChatRequestMutation,
    deleteChatHistory,
    cancelChatRequest,
  } = useChat();
  const { isBusy, setChatbotBusy, setChatbotIdle } = useChatbotStatus();
  const { importMindmapData, nodes, edges } = useDiagramSync();
  const queryClient = useQueryClient();

  // Use TanStack Query for chat history with pagination
  const { data: historyData, refetch: refetchHistory } = useChatHistory(
    diagramId || "",
    !!diagramId,
    10, // limit
    messagesOffset
  );

  // Update messages and hasMore when historyData changes
  useEffect(() => {
    if (historyData?.messages && Array.isArray(historyData.messages)) {
      if (messagesOffset === 0) {
        // First load or reset: replace all messages
        setAllMessages(historyData.messages);
      } else {
        // Load more: prepend older messages to the beginning
        setAllMessages((prev) => [...historyData.messages!, ...prev]);
      }
      setHasMoreMessages(historyData.has_more || false);
      setIsLoadingMore(false);
    }
  }, [historyData, messagesOffset]);

  // Reset pagination when diagramId changes
  useEffect(() => {
    setMessagesOffset(0);
    setAllMessages([]);
    setHasMoreMessages(false);
  }, [diagramId]);

  const messages = useMemo(() => allMessages, [allMessages]);

  // Load and parse prompts from file when "reload from file" is checked
  useEffect(() => {
    const loadPromptsFromFile = async () => {
      if (!needInitializeData || !latestFile || !fileUrl) {
        // Use default prompts when not loading from file
        setPromptSuggestions(defaultPrompts);
        return;
      }

      // Only load from text files (txt, md)
      if (latestFile.fileType === "txt" || latestFile.fileType === "md") {
        try {
          const response = await fetch(fileUrl);
          const text = await response.text();

          // Try to parse as JSON first (array of prompts)
          try {
            const jsonData = JSON.parse(text);
            if (
              Array.isArray(jsonData) &&
              jsonData.every((item) => typeof item === "string")
            ) {
              // Filter to only detailed prompts (>= 20 chars) and limit to 3
              const detailedPrompts = jsonData
                .filter((p: string) => p.length >= 20 && p.length < 300)
                .slice(0, 3);
              setPromptSuggestions(
                detailedPrompts.length > 0 ? detailedPrompts : defaultPrompts
              );
              return;
            }
          } catch {
            // Not JSON, continue to parse as text
          }

          // Parse as text: each line is a prompt, or look for markdown list
          const lines = text.split("\n").filter((line) => line.trim());
          const prompts: string[] = [];

          for (const line of lines) {
            const trimmed = line.trim();
            // Skip empty lines and markdown headers
            if (!trimmed || trimmed.startsWith("#")) continue;

            // Extract from markdown list items (-, *, 1.)
            const listMatch = trimmed.match(/^[-*]\s+(.+)$|^\d+\.\s+(.+)$/);
            if (listMatch) {
              const promptText = (listMatch[1] || listMatch[2]).trim();
              // Only include prompts that are detailed enough (at least 20 characters)
              if (promptText.length >= 20) {
                prompts.push(promptText);
              }
            } else if (trimmed.length >= 20 && trimmed.length < 300) {
              // Use line as prompt if it's detailed enough (20-300 chars)
              prompts.push(trimmed);
            }
          }

          // Use parsed prompts (limit to 3) or fallback to default
          setPromptSuggestions(
            prompts.length > 0 ? prompts.slice(0, 3) : defaultPrompts
          );
        } catch (error) {
          console.error("Failed to load prompts from file:", error);
          setPromptSuggestions(defaultPrompts);
        }
      } else {
        // For PDF files, use default prompts
        setPromptSuggestions(defaultPrompts);
      }
    };

    loadPromptsFromFile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needInitializeData, latestFile, fileUrl]);

  // Initialize with default prompts on mount
  useEffect(() => {
    if (promptSuggestions.length === 0) {
      setPromptSuggestions(defaultPrompts);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load file from database using React Query (read-only for chat)
  // File is managed in FilePanel, we just read it here for chat context
  useFilesByDiagram(diagramId || "", !!diagramId);

  // Listen to broadcast events for stream chunks
  useBroadcastEventListener("stream_chunk", (payload) => {
    if (payload && typeof payload === "object" && "current_status" in payload) {
      setCurrentStatus(payload.current_status as "busy" | "idle");
    } else {
      setCurrentStatus(null);
    }
    if (payload && typeof payload === "object" && "current_status" in payload) {
      setCurrentStatus(payload.current_status as "busy" | "idle");
    }
  });

  // Listen to stream_complete event to set chatbot idle
  useBroadcastEventListener("stream_complete", () => {
    setChatbotIdle();
    setCurrentStatus(null);
    // Refetch chat history to get updated messages from AI
    if (diagramId) {
      // Small delay to ensure backend has saved the message
      setTimeout(() => {
        // Reset pagination and refetch to get the latest messages
        setMessagesOffset(0);
        queryClient.invalidateQueries({
          queryKey: chatKeys.history(diagramId),
        });
        // Also explicitly refetch to ensure we get the latest data
        refetchHistory();
      }, 500);
    }
  });

  // Handle resize for sidebar and docked mode
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (displayMode === "sidebar") {
        // Sidebar mode: resize from left edge
        const newWidth = e.clientX;
        if (newWidth >= 300 && newWidth <= window.innerWidth * 0.6) {
          setWidth(newWidth);
        }
      } else if (displayMode === "docked") {
        // Docked mode: resize from right edge (resize to left)
        const newWidth = window.innerWidth - e.clientX - 12; // 12px for right-3 (0.75rem)
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

  // Get unique user IDs from messages
  const userIds = useMemo(() => {
    const ids = new Set<string>();
    messages.forEach((msg: BaseMessage) => {
      if (msg.type === "human" && msg.additional_kwargs?.user_id) {
        ids.add(msg.additional_kwargs.user_id as string);
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

  // Function to scroll to bottom
  const scrollToBottom = (smooth: boolean = true) => {
    const container = messagesContainerRef.current;
    if (container) {
      // Use requestAnimationFrame to ensure DOM is updated
      requestAnimationFrame(() => {
        if (smooth) {
          // Use scrollIntoView for smooth scrolling
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        } else {
          // Use scrollTop for instant scrolling
          container.scrollTop = container.scrollHeight;
        }
      });
    }
  };

  // Scroll to bottom when panel opens
  useEffect(() => {
    if (isOpen) {
      // Delay to ensure panel animation completes and DOM is ready
      // Use double requestAnimationFrame to ensure layout is complete
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTimeout(() => {
            scrollToBottom(true); // Smooth scroll when opening
          }, 150);
        });
      });
    }
  }, [isOpen]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (isOpen && messages.length > 0) {
      scrollToBottom(true); // Smooth scroll when messages update
    }
  }, [messages, isOpen]);

  // Scroll to bottom when currentStatus changes (streaming)
  useEffect(() => {
    if (isOpen && currentStatus) {
      scrollToBottom(true);
    }
  }, [currentStatus, isOpen]);

  // Handle scroll to detect when user is at top
  const [isAtTop, setIsAtTop] = useState(false);
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const isScrolledToTop = container.scrollTop <= 10; // 10px threshold
      setIsAtTop(isScrolledToTop);
    };

    container.addEventListener("scroll", handleScroll);
    // Check initial state
    handleScroll();

    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, [isOpen, messages]);

  // Load more messages
  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMoreMessages || !diagramId) return;

    setIsLoadingMore(true);
    const container = messagesContainerRef.current;
    const previousScrollHeight = container?.scrollHeight || 0;
    const previousScrollTop = container?.scrollTop || 0;

    // Load next batch
    const nextOffset = messagesOffset + 10;
    setMessagesOffset(nextOffset);

    // Wait for messages to load and then adjust scroll position to maintain view
    setTimeout(() => {
      if (container) {
        const newScrollHeight = container.scrollHeight;
        const scrollDifference = newScrollHeight - previousScrollHeight;
        // Maintain scroll position relative to the new content
        container.scrollTop = previousScrollTop + scrollDifference;
      }
      setIsLoadingMore(false);
    }, 500);
  };

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
      await sendChatRequestMutation.mutateAsync({
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

  const handleCancelChat = async () => {
    if (!diagramId) return;

    try {
      const result = await cancelChatRequest({ diagramId });
      if (result) {
        toast.success("Chat request cancelled");
        setChatbotIdle();
      } else {
        toast.error("Failed to cancel chat request");
      }
    } catch (error) {
      console.error("Failed to cancel chat request:", error);
      toast.error("Failed to cancel chat request");
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

  // Handle resize for sidebar mode
  useEffect(() => {
    if (!isResizing || displayMode !== "sidebar") return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth >= 300 && newWidth <= window.innerWidth * 0.6) {
        setWidth(newWidth);
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

  const renderMessage = (message: BaseMessage, index: number) => {
    const isHuman = message.type === "human";
    const isAI = message.type === "ai";
    const userInfo =
      message.additional_kwargs?.user_id &&
      userCache[message.additional_kwargs.user_id as string]
        ? userCache[message.additional_kwargs.user_id as string]
        : null;

    const mindmapData =
      message.name === "mindmap" && message.additional_kwargs?.mindmap_data
        ? (message.additional_kwargs.mindmap_data as unknown as MindmapData)
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
              Import Mindmap (
              {Array.isArray(mindmapData.nodes)
                ? mindmapData.nodes.length
                : Object.keys(mindmapData.nodes || {}).length}{" "}
              nodes,{" "}
              {Array.isArray(mindmapData.edges)
                ? mindmapData.edges.length
                : Object.keys(mindmapData.edges || {}).length}{" "}
              edges)
            </Badge>
          )}
        </div>
      </div>
    );
  };

  const chatContent = (
    <div className="flex flex-col h-full gap-3">
      <CardHeader className="flex flex-col gap-3 shrink-0 p-0">
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
              <Trash2 />
            </Button>
            {displayMode === "docked" && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
              >
                <X />
              </Button>
            )}
          </div>
        </div>
        {/* Options */}
        <div className="flex items-center gap-4 flex-wrap text-sm">
          <div className="flex items-center gap-2">
            <Label htmlFor="mode-select" className="text-sm font-medium">
              Mode:
            </Label>
            <Select
              value={mode}
              onValueChange={(value: "chat" | "generate") => setMode(value)}
              disabled={isBusy}
            >
              <SelectTrigger id="mode-select" size="sm" className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-100">
                <SelectItem value="chat" className="text-xs">
                  Chat
                </SelectItem>
                <SelectItem value="generate" className="text-xs">
                  Generate
                </SelectItem>
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
      <CardContent className="flex flex-col flex-1 min-h-0 gap-2 p-0">
        {/* Messages area */}
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto relative"
        >
          {/* Load More Button - shown when at top and has more messages */}
          {isAtTop && hasMoreMessages && (
            <div className="flex justify-center pb-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="text-xs"
              >
                {isLoadingMore ? (
                  <>
                    <RefreshCw className="size-3 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <p className="text-xs">Load more messages</p>
                )}
              </Button>
            </div>
          )}
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 px-4">
              <p className="text-center text-muted-foreground mb-4">
                No messages yet. Start a conversation!
              </p>
              {promptSuggestions.length > 0 && (
                <div className="w-full max-w-2xl space-y-3">
                  <p className="text-xs font-medium text-muted-foreground text-center">
                    Suggested prompts:
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {promptSuggestions.map((prompt, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setValue(prompt);
                          adjustHeight();
                          textareaRef.current?.focus();
                        }}
                        disabled={isBusy}
                        className={cn(
                          "px-3 py-1.5 text-sm rounded-md border transition-all",
                          "bg-background hover:bg-accent hover:text-accent-foreground",
                          "border-border hover:border-primary/50 hover:shadow-sm",
                          "disabled:opacity-50 disabled:cursor-not-allowed",
                          "text-left max-w-xs"
                        )}
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            messages.map((msg: BaseMessage, index: number) =>
              renderMessage(msg, index)
            )
          )}
          <AnimatePresence>
            {currentStatus && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{
                  duration: 0.4,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="flex gap-3 mb-4"
              >
                <div className="size-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                  <Bot className="size-5 text-primary-foreground" />
                </div>
                <div className="w-fit rounded-lg p-3 bg-muted text-muted-foreground text-sm italic relative overflow-hidden">
                  <span className="animate-pulse">{currentStatus}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="relative shrink-0">
          <div className="relative flex flex-col gap-px">
            <div className="relative">
              <Textarea
                value={value}
                placeholder="What can I do for you?"
                className={cn(
                  "w-full px-4 py-3 border-none shadow-none bg-secondary dark:bg-secondary rounded-b-none resize-none focus-visible:ring-0 focus-visible:ring-offset-0",
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
              {isBusy && (
                <div className="absolute bottom-3 right-3 pointer-events-none">
                  <RefreshCw className="size-4 text-muted-foreground animate-spin" />
                </div>
              )}
            </div>

            <div className="flex items-center p-3 bg-secondary rounded-b-md">
              <div className="flex items-center justify-between w-full gap-2">
                {fileUrl && fileName && (
                  <Badge
                    variant="secondary"
                    className="flex items-center justify-items-center gap-1.5 max-w-full"
                  >
                    <span className="truncate max-w-[200px]">{fileName}</span>
                  </Badge>
                )}
                {isBusy ? (
                  <Button
                    variant="secondary"
                    size="icon"
                    className="hover:bg-black/5 dark:hover:bg-white/10 ml-auto"
                    onClick={handleCancelChat}
                    aria-label="Cancel chat"
                  >
                    <X />
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    size="icon"
                    className="hover:bg-black/5 dark:hover:bg-white/10 ml-auto"
                    onClick={handleSend}
                    disabled={!value.trim()}
                    aria-label="Send message"
                  >
                    <ArrowRight />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </div>
  );

  // Docked mode: floating card
  if (displayMode === "docked") {
    if (!isOpen) return null;

    return (
      <>
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
              className="fixed bottom-3 right-3 max-w-3xl min-w-sm z-100 flex"
              style={{ width: `${width}px` }}
            >
              {/* Resize handle - invisible in docked mode */}
              <div
                className="w-2 cursor-ew-resize shrink-0"
                onMouseDown={(e) => {
                  e.preventDefault();
                  setIsResizing(true);
                }}
              />
              <Card className="flex-1 flex flex-col h-[90vh] p-3">
                {chatContent}
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

  // Sidebar mode: resizable panel
  if (!isOpen) return null;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="h-full flex shrink-0 border-none shadow-none"
            style={{ width: `${width}px` }}
          >
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
            <Card className="flex-1 h-full flex flex-col overflow-hidden rounded-none border-none shadow-none p-3">
              {chatContent}
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
