"use client";

import { use } from "react";
import { ClientSideSuspense } from "@liveblocks/react/suspense";
import { DiagramCanvas } from "../../_components/DiagramCanvas";
import { FilePanel } from "../../_components/FilePanel";
import { ChatPanel } from "../../_components/ChatPanel";
import { Room } from "@/app/_components/room";
import { Spinner } from "@/components/ui/spinner";
import { useChatPanelStore } from "../../_stores/use-chat-panel-store";
import { DiagramProvider } from "../../_components/DiagramProvider";

type EditorPageProps = {
  params: Promise<{ diagramId: string }>;
};

export default function EditorPage({ params }: EditorPageProps) {
  const { diagramId } = use(params);
  const { displayMode } = useChatPanelStore();

  return (
    <Room
      diagramId={diagramId}
      fallback={
        <div className="flex h-full w-full items-center justify-center bg-card">
          <Spinner className="size-8" />
        </div>
      }
    >
      <div className="flex h-full w-full relative">
        <ClientSideSuspense
          fallback={
            <div className="flex h-full w-full items-center justify-center bg-card">
              <Spinner className="size-8" />
            </div>
          }
        >
          {/* Sidebar mode: File panel on left, Chat panel on right */}
          {displayMode === "sidebar" && (
            <>
              <FilePanel />
              <div className="flex-1 h-full relative">
                <DiagramProvider>
                  <DiagramCanvas />
                </DiagramProvider>
              </div>
              <ChatPanel />
            </>
          )}
          {/* Docked mode: Canvas with floating panels */}
          {displayMode === "docked" && (
            <>
              <div className="flex-1 h-full relative">
                <DiagramProvider>
                  <DiagramCanvas />
                </DiagramProvider>
              </div>
              <FilePanel />
              <ChatPanel />
            </>
          )}
        </ClientSideSuspense>
      </div>
    </Room>
  );
}
