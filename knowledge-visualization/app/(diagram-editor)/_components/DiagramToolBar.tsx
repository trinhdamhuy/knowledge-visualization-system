"use client";
import { useDiagramStore } from "../_stores/use-diagram-store";
import { DiagramMode } from "@/enums/modes";
import { MousePointer2, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Panel } from "@xyflow/react";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/animate-ui/components/radix/toggle-group";

export function DiagramToolBar() {
  const { setActiveMode, activeMode } = useDiagramStore();

  const TOOLBAR_ITEMS = [
    {
      value: DiagramMode.Select,
      icon: MousePointer2,
    },
    {
      value: DiagramMode.CreateNode,
      icon: Plus,
    },
  ];

  return (
    <Panel position="center-left">
      <Card className="p-2">
        <ToggleGroup
          type="single"
          size="lg"
          className="flex flex-col"
          value={activeMode}
          onValueChange={setActiveMode}
        >
          {TOOLBAR_ITEMS.map((item) => (
            <ToggleGroupItem key={item.value} value={item.value}>
              <item.icon />
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </Card>
    </Panel>
  );
}
