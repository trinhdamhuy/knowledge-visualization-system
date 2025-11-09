"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, X, ArrowRight, ChevronDown, Paperclip, Check, Bot, Stars, Brain, CircleUserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAutoResizeTextarea } from "@/hooks/use-auto-resize-textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "motion/react";

export function ChatBotPanel({ diagramId }: { diagramId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedModel, setSelectedModel] = useState("GPT-4-1 Mini");
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 24,
    maxHeight: 48,
  });

  const AI_MODELS = [
    "o3-mini",
    "Gemini 2.5 Flash",
    "Claude 3.5 Sonnet",
    "GPT-4-1 Mini",
    "GPT-4-1",
  ];

  const MODEL_ICONS: Record<string, React.ReactNode> = {
    "o3-mini": <Bot className="w-4 h-4" />,
    "Gemini 2.5 Flash": <Stars className="w-4 h-4" />,
    "Claude 3.5 Sonnet": <Brain className="w-4 h-4" />,
    "GPT-4-1 Mini": <CircleUserRound className="w-4 h-4" />,
    "GPT-4-1": <CircleUserRound className="w-4 h-4" />,
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      setMessage("");
      adjustHeight(true);
    }
  };

  const handleSend = () => {
    if (message.trim()) {
      setMessage("");
      adjustHeight(true);
      // Thêm logic gửi tin nhắn ở đây nếu cần
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-lg z-50"
        size="icon"
      >
        <MessageCircle size={18} />
      </Button>
    );
  }

  return (
    <Card
      className="fixed bottom-6 right-6 w-120 h-[320px] shadow-2xl flex flex-col z-50"
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg">AI Assistant</CardTitle>
        <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
          <X size={14} />
        </Button>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-4 pt-0">
        <div className="flex-1 bg-gray-50 dark:bg-gray-900 rounded-xl p-1 flex flex-col">
          <div className="flex-1 relative flex flex-col">
            <div
              className="flex-1 overflow-y-auto"
              style={{ maxHeight: "110px" }}
            >
              <Textarea
                value={message}
                placeholder="Type your message..."
                className={cn(
                  "w-full h-full rounded-lg rounded-b-none px-3 py-2 bg-white dark:bg-gray-800 border-none resize-none focus-visible:ring-0 focus-visible:ring-offset-0 text-sm",
                  "min-h-[24px]"
                )}
                ref={textareaRef}
                onKeyDown={handleKeyDown}
                onChange={(e) => {
                  setMessage(e.target.value);
                  adjustHeight();
                }}
              />
            </div>

            <div className="h-12 bg-white dark:bg-gray-800 rounded-b-lg flex items-center px-2">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-1">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="flex items-center gap-1 h-7 px-2 text-xs"
                      >
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={selectedModel}
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 5 }}
                            transition={{ duration: 0.15 }}
                            className="flex items-center gap-1"
                          >
                            {MODEL_ICONS[selectedModel]}
                            <span className="max-w-[80px] truncate">
                              {selectedModel}
                            </span>
                            <ChevronDown size={12} className="opacity-50" />
                          </motion.div>
                        </AnimatePresence>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="min-w-[8rem]">
                      {AI_MODELS.map((model) => (
                        <DropdownMenuItem
                          key={model}
                          onSelect={() => setSelectedModel(model)}
                          className="flex items-center justify-between gap-2"
                        >
                          <div className="flex items-center gap-2">
                            {MODEL_ICONS[model]}
                            <span className="text-xs">{model}</span>
                          </div>
                          {selectedModel === model && (
                            <Check size={12} className="text-blue-500" />
                          )}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <div className="h-4 w-px bg-gray-200 dark:bg-gray-700" />
                  <label className="rounded-md p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                    <input type="file" className="hidden" />
                    <Paperclip size={14} className="text-gray-500" />
                  </label>
                </div>
                <Button
                  size="icon"
                  onClick={handleSend}
                  disabled={!message.trim()}
                  className="h-7 w-7"
                >
                  <ArrowRight
                    size={14}
                    className={cn(
                      "transition-opacity",
                      message.trim() ? "opacity-100" : "opacity-30"
                    )}
                  />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
