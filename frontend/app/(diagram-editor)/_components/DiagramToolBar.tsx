"use client";

import { useDiagramStore } from "../_stores/use-diagram-store";
import { DiagramMode } from "@/enums/modes";
import { MousePointer2, Box, Undo2, Redo2, FileText, Bot } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useFileCardStore } from "../_stores/use-file-card-store";
import { useChatUIStore } from "@/stores/chat-ui-store";
import {
  useUndo,
  useRedo,
  useCanRedo,
  useCanUndo,
} from "@liveblocks/react/suspense";

export function DiagramToolBar() {
  const { setActiveMode, activeMode } = useDiagramStore();
  const { isOpen: isFileOpen, setIsOpen: setFileOpen } = useFileCardStore();
  const { isOpen: isChatOpen, setIsOpen: setChatOpen } = useChatUIStore();
  const undo = useUndo();
  const redo = useRedo();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();

  const MODES_TO_ACTIVE = [
    {
      value: DiagramMode.Select,
      icon: MousePointer2,
    },
    {
      value: DiagramMode.CreateNode,
      icon: Box,
    },
  ];

  const ACTIONS = [
    {
      icon: Undo2,
      action: undo,
      disabled: !canUndo,
    },
    {
      icon: Redo2,
      action: redo,
      disabled: !canRedo,
    },
  ];

  return (
    <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-2">
      <Card className="p-2 flex flex-col gap-0.5">
        {MODES_TO_ACTIVE.map((item) => (
          <Button
            key={item.value}
            variant={activeMode === item.value ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setActiveMode(item.value)}
          >
            <item.icon />
          </Button>
        ))}
      </Card>

      <Card className="p-2 flex flex-col gap-0.5">
        <Button
          title="File Viewer"
          onClick={() => setFileOpen(!isFileOpen)}
          variant={isFileOpen ? "secondary" : "ghost"}
          size="icon"
        >
          <FileText />
        </Button>
        <Button
          title="Chat Bot"
          onClick={() => setChatOpen(!isChatOpen)}
          variant={isChatOpen ? "secondary" : "ghost"}
          size="icon"
        >
          <Bot />
        </Button>
      </Card>

      <Card className="p-2 flex flex-col gap-0.5">
        {ACTIONS.map((item, index) => (
          <Button
          key={index}
          value={item.icon.name}
          disabled={item.disabled}
          onClick={item.action}
            variant="ghost"
            size="icon"
          >
            <item.icon />
          </Button>
        ))}
      </Card>
    </div>
  );
}
