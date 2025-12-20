"use client";
import { useDiagramStore } from "../_stores/use-diagram-store";
import { DiagramMode } from "@/enums/modes";
import { MousePointer2, Box, Undo2, Redo2, FileText, Bot } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Panel } from "@xyflow/react";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/animate-ui/components/radix/toggle-group";
import {
  useUndo,
  useRedo,
  useCanRedo,
  useCanUndo,
} from "@liveblocks/react/suspense";
import { Button } from "@/components/ui/button";
import { useFileCardStore } from "../_stores/use-file-card-store";
import { useChatUIStore } from "@/stores/chat-ui-store";

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
    <Panel position="center-left" className="flex flex-col gap-2">
      <Card className="p-2">
        <ToggleGroup
          type="single"
          size="icon"
          className="flex flex-col"
          value={activeMode}
          onValueChange={setActiveMode}
        >
          {MODES_TO_ACTIVE.map((item) => (
            <ToggleGroupItem key={item.value} value={item.value}>
              <item.icon />
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </Card>

      <Card className="p-2 flex flex-col gap-0.5">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setFileOpen(!isFileOpen)}
          className={isFileOpen ? "bg-accent" : ""}
          title="File Viewer"
        >
          <FileText />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setChatOpen(!isChatOpen)}
          className={isChatOpen ? "bg-accent" : ""}
          title="Chat Bot"
        >
          <Bot />
        </Button>
      </Card>

      <Card className="p-2 flex flex-col gap-0.5">
        {ACTIONS.map((item, index) => (
          <Button
            variant="ghost"
            size="icon"
            key={index}
            value={item.icon.name}
            disabled={item.disabled}
            onClick={item.action}
          >
            <item.icon />
          </Button>
        ))}
      </Card>
    </Panel>
  );
}
