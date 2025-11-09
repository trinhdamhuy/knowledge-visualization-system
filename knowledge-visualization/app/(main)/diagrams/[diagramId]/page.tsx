"use client";

import { use } from "react";
import { ClientSideSuspense } from "@liveblocks/react/suspense";
import { DiagramCanvas } from "@/app/_components/diagrams/DiagramCanvas";
import { Loader2 } from "lucide-react";
import { Room } from "@/app/_components/room";

type EditorPageProps = {
  params: Promise<{ diagramId: string }>;
};

export default function EditorPage({ params }: EditorPageProps) {
  const { diagramId } = use(params);

  return (
    <div className="fixed inset-0 z-50">
      <Room
        diagramId={diagramId}
        fallback={
          <div className="flex h-full w-full items-center justify-center bg-white">
            <Loader2 className="w-10 h-10 animate-spin text-gray-400" />
            <span className="ml-4 text-gray-700 text-base font-medium">
              Loading...
            </span>
          </div>
        }
      >
        <ClientSideSuspense
          fallback={
            <div className="flex h-full w-full items-center justify-center bg-white">
              <Loader2 className="w-10 h-10 animate-spin text-gray-400" />
              <span className="ml-4 text-gray-700 text-base font-medium">
                Loading...
              </span>
            </div>
          }
        >
          <DiagramCanvas diagramId={diagramId} />
        </ClientSideSuspense>
      </Room>
    </div>
  );
}
