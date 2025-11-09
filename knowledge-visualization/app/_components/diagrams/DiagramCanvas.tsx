"use client";

import { useCallback } from "react";
import { useUpdateMyPresence } from "@/lib/liveblocks.config";
import { CollaborationCursors } from "./CollaborationCursors";
import { ChatBotPanel } from "./ChatBotPanel";
import { DiagramHeader } from "./DiagramHeader";

interface DiagramCanvasProps {
  diagramId: string;
}

export function DiagramCanvas({ diagramId }: DiagramCanvasProps) {
  const updateMyPresence = useUpdateMyPresence();

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();

      const current = e.currentTarget;
      const rect = current.getBoundingClientRect();

      const x = Math.round(e.clientX - rect.left);
      const y = Math.round(e.clientY - rect.top);

      updateMyPresence({ cursor: { x, y } });
    },
    [updateMyPresence]
  );

  const onPointerLeave = useCallback(() => {
    updateMyPresence({ cursor: null });
  }, [updateMyPresence]);

  return (
    <main className="h-screen w-screen relative bg-white touch-none overflow-hidden">
      {/* Grid background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-60"
        style={{
          backgroundImage: `
            linear-gradient(to right, #e5e7eb 1px, transparent 1px),
            linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
          `,
          backgroundSize: "30px 30px",
        }}
      />

      <DiagramHeader diagramId={diagramId} />

      <div
        className="h-full w-full absolute inset-0"
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        style={{ cursor: "crosshair" }}
      >
        <CollaborationCursors />
      </div>

      <ChatBotPanel diagramId={diagramId} />
    </main>
  );
}
