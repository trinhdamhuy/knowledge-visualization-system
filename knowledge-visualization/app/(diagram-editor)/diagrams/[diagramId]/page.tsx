"use client";

import { use } from "react";
import { ClientSideSuspense } from "@liveblocks/react/suspense";
import { DiagramCanvas } from "./_components/DiagramCanvas";
import { Loader2 } from "lucide-react";
import { Room } from "@/app/_components/room";

type EditorPageProps = {
  params: Promise<{ diagramId: string }>;
};

export default function EditorPage({ params }: EditorPageProps) {
  const { diagramId } = use(params);

  return (
    <Room
      diagramId={diagramId}
      fallback={
        <div className="flex h-full w-full items-center justify-center bg-card">
          <Loader2 className="w-10 h-10 animate-spin" />
          <span className="ml-4 text-base font-medium">Loading...</span>
        </div>
      }
    >
      <ClientSideSuspense
        fallback={
          <div className="flex h-full w-full items-center justify-center bg-card">
            <Loader2 className="w-10 h-10 animate-spin" />
            <span className="ml-4 text-base font-medium">Loading...</span>
          </div>
        }
      >
        <DiagramCanvas />
      </ClientSideSuspense>
    </Room>
  );
}
