"use client";

import {
  ArrowRight,
  X,
  Sparkles,
  RefreshCw,
  Trash2,
  GripVertical,
  Square,
} from "lucide-react";
import {
  useState,
  useRef,
  useEffect,
  useMemo,
  Activity,
  useCallback,
} from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
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
import { toast } from "sonner";
import { useFile } from "@/hooks/use-file";
import { useChat } from "@/hooks/use-chat";
import { useDiagramSync } from "@/hooks/use-diagram-sync";
import { useSession } from "next-auth/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import type { BaseMessage, MindmapData, ChatRequest } from "@/types/chat";
import { ImportMindmapDialog } from "./ImportMindmapDialog";
import { DeleteChatDialog } from "./DeleteChatDialog";
import { getUserById } from "@/app/_actions/user";
import { useChatSettingsStore } from "@/stores/chat-settings-store";
import { useChatUIStore } from "@/stores/chat-ui-store";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { chatKeys } from "@/hooks/use-chat";
import { useChatPanelStore } from "../_stores/use-chat-panel-store";
import { ReferenceLink } from "./ReferenceLink";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { getSignedFileUrl } from "@/lib/file-upload-handler";

export function ChatPanel() {
  const params = useParams();
  const diagramId = params?.diagramId as string | undefined;
  const { data: session } = useSession();
  // Only use authenticated user ID (not anonymous Liveblocks ID)
  const userId = session?.user?.id || null;

  const [value, setValue] = useState("");
  const [deleteChatDialogOpen, setDeleteChatDialogOpen] = useState(false);
  const [messagesOffset, setMessagesOffset] = useState(0);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [allMessages, setAllMessages] = useState<BaseMessage[]>([]);
  const [width, setWidth] = useState(500);
  const [isResizing, setIsResizing] = useState(false);
  const [promptSuggestions, setPromptSuggestions] = useState<string[]>([]);
  const hasRestoredFromCacheRef = useRef(false);
  const streamControllerRef = useRef<AbortController | null>(null);

  // Default prompt suggestions (detailed prompts)
  const defaultPrompts = [
    "Summarize the main points and key concepts from the document",
    "Explain the important details and provide examples",
    "Create a comprehensive mindmap showing relationships between concepts",
  ];

  // Use stores for chat settings and UI state
  const { needInitializeData, setNeedInitializeData } = useChatSettingsStore();
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
  const hasInitialAutoScrolledRef = useRef(false);
  const isNearBottomRef = useRef(true);
  const prevMessagesLenRef = useRef(0);
  const [needsInitialScroll, setNeedsInitialScroll] = useState(false);
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
    deleteChatHistory,
    cancelChatRequest,
    deleteDiagramStore,
  } = useChat();
  const [isBusy, setIsBusy] = useState(false);
  const { importMindmapData, nodes, edges } = useDiagramSync();
  const queryClient = useQueryClient();

  // Use TanStack Query for chat history with pagination
  // Only fetch history if user is authenticated
  const { data: historyData, refetch: refetchHistory } = useChatHistory(
    diagramId || "",
    userId,
    !!diagramId && !!userId,
    10, // limit
    messagesOffset
  );

  // Load messages from cache when component mounts or when switching modes
  // This ensures chat history persists when switching between sidebar and dock modes
  useEffect(() => {
    if (!diagramId) return;

    // Only restore from cache once per diagramId
    if (hasRestoredFromCacheRef.current) return;

    // Try to get cached data for offset 0 (latest messages)
    const cachedData = queryClient.getQueryData<typeof historyData>([
      ...chatKeys.history(diagramId, userId),
      10,
      0,
    ]);

    if (cachedData?.messages && Array.isArray(cachedData.messages)) {
      // Restore from cache if available
      setAllMessages(cachedData.messages);
      setHasMoreMessages(cachedData.has_more || false);
      hasRestoredFromCacheRef.current = true;
    }
  }, [diagramId, queryClient, userId]);

  // Reset restore flag when diagramId changes
  useEffect(() => {
    hasRestoredFromCacheRef.current = false;
  }, [diagramId]);

  // Update messages and hasMore when historyData changes
  useEffect(() => {
    if (historyData?.messages && Array.isArray(historyData.messages)) {
      if (messagesOffset === 0) {
        // First load or reset: replace all messages
        setAllMessages(historyData.messages);
        // Only auto-scroll to bottom ONCE for the initial fetch of latest messages.
        if (!hasInitialAutoScrolledRef.current) {
          hasInitialAutoScrolledRef.current = true;
          setNeedsInitialScroll(true);
        }
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
    setHasMoreMessages(false);
    // Don't reset allMessages here - let it be restored from cache or loaded from query
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
          const signedUrl = await getSignedFileUrl(fileUrl);
          if (!signedUrl) {
            throw new Error("Failed to generate signed URL");
          }
          const response = await fetch(signedUrl);
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
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

  // Handle resize for sidebar and docked mode
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (displayMode === "docked") {
        // Docked mode: resize from right edge (resize to left) (left drag for bigger, right drag for smaller)
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

  const getScrollViewport = useCallback(() => {
    const root = messagesContainerRef.current;
    if (!root) return null;
    return root.querySelector(
      '[data-slot="scroll-area-viewport"]'
    ) as HTMLDivElement | null;
  }, []);

  // Function to scroll to bottom
  const scrollToBottom = useCallback(
    (smooth: boolean = true) => {
      const viewport = getScrollViewport();
      if (viewport) {
        // Use requestAnimationFrame to ensure DOM is updated
        requestAnimationFrame(() => {
          if (smooth) {
            // Use scrollIntoView for smooth scrolling
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
          } else {
            // Use scrollTop for instant scrolling
            viewport.scrollTop = viewport.scrollHeight;
          }
        });
      }
    },
    [getScrollViewport]
  );

  // Reset initial scroll flags when switching diagrams
  useEffect(() => {
    hasInitialAutoScrolledRef.current = false;
    prevMessagesLenRef.current = 0;
  }, [diagramId]);

  // Scroll to bottom exactly once after the initial fetch (when the panel is open).
  // If data arrives while closed, this will trigger on the next open.
  useEffect(() => {
    if (!needsInitialScroll) return;
    if (!isOpen) return;
    setNeedsInitialScroll(false);
    // Delay to ensure panel animation completes and DOM is ready
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTimeout(() => {
          scrollToBottom(false);
        }, 0);
      });
    });
  }, [needsInitialScroll, isOpen, scrollToBottom]);

  // Auto-scroll on new messages only if user is already near the bottom.
  useEffect(() => {
    if (!isOpen) return;
    const prevLen = prevMessagesLenRef.current;
    const nextLen = messages.length;
    prevMessagesLenRef.current = nextLen;

    // Only auto-scroll for appended messages (typical chat flow), not when user paginates older messages.
    if (nextLen > prevLen && isNearBottomRef.current) {
      scrollToBottom(true);
    }
  }, [messages.length, isOpen, scrollToBottom]);

  // Scroll to bottom when currentStatus changes (streaming)
  useEffect(() => {
    if (isOpen && currentStatus && isNearBottomRef.current) {
      scrollToBottom(true);
    }
  }, [currentStatus, isOpen, scrollToBottom]);

  // Handle scroll to detect when user is at top
  const [isAtTop, setIsAtTop] = useState(false);
  useEffect(() => {
    const viewport = getScrollViewport();
    if (!viewport) return;

    const handleScroll = () => {
      const isScrolledToTop = viewport.scrollTop <= 10; // 10px threshold
      setIsAtTop(isScrolledToTop);

      const distanceFromBottom =
        viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
      isNearBottomRef.current = distanceFromBottom <= 24; // px threshold
    };

    viewport.addEventListener("scroll", handleScroll);
    // Check initial state
    handleScroll();

    return () => {
      viewport.removeEventListener("scroll", handleScroll);
    };
  }, [getScrollViewport, messages.length]);

  // Load more messages
  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMoreMessages || !diagramId) return;

    setIsLoadingMore(true);
    const viewport = getScrollViewport();
    const previousScrollHeight = viewport?.scrollHeight || 0;
    const previousScrollTop = viewport?.scrollTop || 0;

    // Load next batch
    const nextOffset = messagesOffset + 10;
    setMessagesOffset(nextOffset);

    // Wait for messages to load and then adjust scroll position to maintain view
    setTimeout(() => {
      const viewportNow = getScrollViewport();
      if (viewportNow) {
        const newScrollHeight = viewportNow.scrollHeight;
        const scrollDifference = newScrollHeight - previousScrollHeight;
        // Maintain scroll position relative to the new content
        viewportNow.scrollTop = previousScrollTop + scrollDifference;
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

  const streamChat = async (payload: ChatRequest) => {
    const controller = new AbortController();
    streamControllerRef.current = controller;

    try {
      const response = await fetch(`/api/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(`Stream failed: ${response.statusText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          const line = part.trim();
          if (!line) continue;

          if (line.startsWith("event: stream_complete")) {
            setIsBusy(false);
            setCurrentStatus(null);
            if (diagramId) {
              setMessagesOffset(0);
              queryClient.invalidateQueries({
                queryKey: chatKeys.history(diagramId, userId),
              });
              refetchHistory();
            }
            continue;
          }

          if (line.startsWith("data:")) {
            const jsonStr = line.slice(5).trim();
            if (!jsonStr) continue;
            try {
              const payloadObj = JSON.parse(jsonStr) as Record<string, unknown>;
              if ("current_status" in payloadObj) {
                setCurrentStatus(
                  payloadObj.current_status as "busy" | "idle" | null
                );
              }
            } catch (err) {
              console.error("Failed to parse stream chunk", err);
            }
          }
        }
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        console.error("Stream error:", error);
        toast.error("Failed to stream response");
        setIsBusy(false);
      }
    } finally {
      streamControllerRef.current = null;
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
    setIsBusy(true);

    // Always send mindmap_data if we have nodes
    const mindmapData: MindmapData | null =
      nodes.length > 0
        ? {
            nodes: nodes,
            edges: edges,
          }
        : null;

    // Optimistically show user message
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: BaseMessage = {
      id: tempId,
      type: "human",
      content: messageContent,
      additional_kwargs: { user_id: userId },
    };
    setAllMessages((prev) => [...prev, optimisticMessage]);

    const payload: ChatRequest = {
      user_id: userId,
      diagram_id: diagramId,
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
    };

    try {
      await streamChat(payload);
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message");
      // revert optimistic message
      setAllMessages((prev) => prev.filter((m) => m.id !== tempId));
      setIsBusy(false);
    }
  };

  const handleDeleteChat = async () => {
    if (!diagramId) return;

    try {
      const result = await deleteChatHistory({ diagramId });
      const storeResult = await deleteDiagramStore({ diagramId });
      if (result && storeResult) {
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

    if (streamControllerRef.current) {
      streamControllerRef.current.abort();
      streamControllerRef.current = null;
    }

    try {
      const result = await cancelChatRequest({ diagramId });
      if (result) {
        toast.success("Chat request cancelled");
        setIsBusy(false);
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

  // Pre-process content to support multiple reference link formats.
  // Preferred format is hash-based: [**Text**](#node/<id>#pdf/<page>) or [**Text**](#pdf/<page>)
  // We also accept legacy formats like: [Text](ref:page:26:node:node-123) or [Text](#ref/node-123)
  const processRefLinks = (text: string): string => {
    let out = text;

    // Convert legacy "#ref/<nodeId>" to "#node/<nodeId>"
    out = out.replace(/\(#ref\/([^)#\s]+)\)/g, "(#node/$1)");

    // Convert legacy "ref:" scheme inside markdown links:
    // - (ref:page:26) -> (#pdf/26)
    // - (ref:node:node-123) -> (#node/node-123)
    // - (ref:page:26:node:node-123) / (ref:node:node-123:page:26) -> (#node/node-123#pdf/26)
    out = out.replace(/\(ref:([^)]*)\)/g, (_m, payload: string) => {
      const parts = String(payload).split(":").filter(Boolean);
      let page: number | undefined;
      let nodeId: string | undefined;

      for (let i = 0; i < parts.length; i += 2) {
        const key = parts[i];
        const value = parts[i + 1];
        if (!key || !value) continue;
        if (key === "page") {
          const match = value.match(/\d+/);
          if (match) page = parseInt(match[0], 10);
        }
        if (key === "node") {
          nodeId = value;
        }
      }

      const fragments: string[] = [];
      if (nodeId) fragments.push(`node/${nodeId}`);
      if (page && page > 0) fragments.push(`pdf/${page}`);
      if (fragments.length === 0) return "(#)";
      return `(#${fragments.join("#")})`;
    });

    return out;
  };

  const renderMessage = (message: BaseMessage, index: number) => {
    const isHuman = message.type === "human";
    const isAI = message.type === "ai";
    const userInfo =
      message.additional_kwargs?.user_id &&
      userCache[message.additional_kwargs.user_id as string]
        ? userCache[message.additional_kwargs.user_id as string]
        : null;

    const mindmapData = message.additional_kwargs?.mindmap_data
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
                <AvatarFallback className="size-8">
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
          className={`w-fit rounded-lg max-w-[80%] ${
            isHuman && "bg-primary text-primary-foreground px-3 py-2"
          }`}
        >
          {isAI ? (
            <div className="markdown-content">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                components={{
                  // Override link rendering to handle hash-based ref links
                  a: ({ href, children, ...props }) => {
                    // Check if this is a hash-based ref link (#node/... or #pdf/...)
                    if (
                      href &&
                      typeof href === "string" &&
                      href.startsWith("#")
                    ) {
                      // Parse hash fragments: #node/node-123#pdf/96
                      const hashString = href.substring(1); // Remove leading #
                      const fragments = hashString.split("#"); // Split multiple hash fragments
                      let page: number | undefined;
                      let nodeId: string | undefined;

                      fragments.forEach((fragment) => {
                        if (fragment.startsWith("node/")) {
                          nodeId = fragment.substring(5); // Remove "node/"
                        } else if (fragment.startsWith("pdf/")) {
                          // Accept formats like: pdf/26, pdf/page-26, pdf/page:26
                          const pageRaw = fragment.substring(4); // Remove "pdf/"
                          const match = pageRaw.match(/\d+/);
                          if (match) page = parseInt(match[0], 10);
                        }
                      });

                      if (page || nodeId) {
                        return (
                          <ReferenceLink page={page} nodeId={nodeId}>
                            {children}
                          </ReferenceLink>
                        );
                      }
                    }
                    // Regular link - render as normal <a> tag
                    return (
                      <a href={href} {...props}>
                        {children}
                      </a>
                    );
                  },
                }}
              >
                {processRefLinks(content)}
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

          {mindmapData && isAI && (
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
    <div className="relative h-full flex flex-col">
      {/* Blur overlay when not authenticated */}
      {!userId && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center rounded-lg">
          <div className="flex flex-col items-center gap-4 p-6 bg-card border rounded-lg shadow-lg max-w-sm">
            <Bot className="size-12 text-primary" />
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Please log in to chat</h3>
              <p className="text-sm text-muted-foreground">
                You need to be logged in to use the chat feature. Each user has
                their own chat history.
              </p>
            </div>
            <div className="flex flex-col gap-2 w-full">
              <Link href="/login" className="w-full">
                <Button className="w-full" size="lg">
                  Log in
                </Button>
              </Link>
              <Link href="/sign-up" className="w-full">
                <Button variant="outline" className="w-full" size="lg">
                  Sign up
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      <CardHeader
        className={cn(
          "flex flex-col gap-3 shrink-0 p-0 pb-3",
          !userId && "blur-sm pointer-events-none"
        )}
      >
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
              disabled={isBusy || !userId}
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
          {fileUrl && fileName && (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="reload-data"
                  checked={needInitializeData}
                  onCheckedChange={(checked) =>
                    setNeedInitializeData(checked === true)
                  }
                  disabled={isBusy || !userId}
                />
                <Label
                  htmlFor="reload-data"
                  className="text-sm cursor-pointer flex items-center gap-1.5"
                  title="Tip: After uploading a file, turn this on for your first message so the system can load and index the file. You can turn it off after that."
                >
                  <RefreshCw className="size-3.5" />
                  Answer with full context of the uploaded file
                </Label>
              </div>
              <p className="text-xs text-muted-foreground">
                After uploading a file, turn this on for your first message to
                load/index the file. You can turn it off for follow-up
                questions.
              </p>
            </div>
          )}
          {nodes.length > 0 && (
            <Badge variant="secondary">
              {nodes.length} nodes, {edges.length} edges
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent
        className={cn(
          "flex flex-col flex-1 min-h-0 gap-2 p-0",
          !userId && "blur-sm pointer-events-none"
        )}
      >
        {/* Messages area */}
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-hidden relative"
        >
          <ScrollArea className="h-full pr-4">
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
              <div className="flex flex-col items-center justify-center py-6 px-4">
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
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>

        {/* Input area */}
        <div className="relative shrink-0">
          <div className="relative flex flex-col gap-px">
            <div className="relative">
              <Textarea
                value={value}
                placeholder={
                  userId ? "What can I do for you?" : "Please log in to chat"
                }
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
                disabled={isBusy || !userId}
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
                    <Square className="text-red-500" />
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    size="icon"
                    className="hover:bg-black/5 dark:hover:bg-white/10 ml-auto"
                    onClick={handleSend}
                    disabled={!value.trim() || !userId}
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
    return (
      <>
        <Activity mode={isOpen ? "visible" : "hidden"}>
          <div className="fixed right-3 bottom-3 z-10 h-[90vh] flex">
            <div
              className="w-2 cursor-ew-resize shrink-0"
              onMouseDown={(e) => {
                e.preventDefault();
                setIsResizing(true);
              }}
            />
            <Card
              className="flex flex-col gap-3 max-w-3xl min-w-sm h-full p-3 shrink-0"
              style={{ width: `${width}px` }}
            >
              {chatContent}
            </Card>
          </div>
        </Activity>

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

  return (
    <>
      <Activity mode={isOpen ? "visible" : "hidden"}>
        <div className="h-full flex shrink-0">
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
          <Card
            className="h-full flex flex-col overflow-hidden rounded-none border-none shadow-none p-3 shrink-0"
            style={{ width: `${width}px` }}
          >
            {chatContent}
          </Card>
        </div>
      </Activity>

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
