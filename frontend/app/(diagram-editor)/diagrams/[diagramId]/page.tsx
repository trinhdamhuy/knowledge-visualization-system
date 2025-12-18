"use client";

import { use } from "react";
import { ClientSideSuspense } from "@liveblocks/react/suspense";
import { DiagramCanvas } from "../../_components/DiagramCanvas";
import { Room } from "@/app/_components/room";
import { Spinner } from "@/components/ui/spinner";

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
          <Spinner className="size-8" />
        </div>
      }
    >
      <ClientSideSuspense
        fallback={
          <div className="flex h-full w-full items-center justify-center bg-card">
            <Spinner className="size-8" />
          </div>
        }
      >
        <DiagramCanvas />
      </ClientSideSuspense>
    </Room>
  );
}
