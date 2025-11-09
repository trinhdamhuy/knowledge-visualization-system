"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ArrowLeft, Users } from "lucide-react";
import { useOthers, useSelf } from "@/lib/liveblocks.config";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const MAX_SHOWN_USERS = 3;

interface DiagramHeaderProps {
  diagramId: string;
}

export function DiagramHeader({ diagramId }: DiagramHeaderProps) {
  const router = useRouter();
  const users = useOthers();
  const currentUser = useSelf();
  const hasMoreUsers = users.length > MAX_SHOWN_USERS;

  return (
    <div className="absolute top-0 left-0 right-0 p-3 flex items-center justify-between z-50">
      {/* Left: Back button and title */}
      <div className="bg-white rounded-lg px-4 h-12 flex items-center shadow-md gap-3 border border-neutral-200">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/dashboard")}
          className="hover:bg-neutral-100 -ml-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="h-6 w-px bg-neutral-200" />
        <span className="text-sm font-semibold text-neutral-900">
          Diagram Editor
        </span>
      </div>

      {/* Right: Participants */}
      <div className="bg-white rounded-lg px-4 h-12 flex items-center shadow-md gap-3 border border-neutral-200">
        <Users className="h-4 w-4 text-neutral-500" />
        
        <div className="flex -space-x-2">
          {currentUser && (
            <Avatar className="h-8 w-8 border-2 border-white ring-1 ring-neutral-200">
              <AvatarImage src={currentUser.info?.avatar} />
              <AvatarFallback className="text-xs bg-blue-500 text-white">
                {currentUser.info?.name?.[0] || "U"}
              </AvatarFallback>
            </Avatar>
          )}

          {users.slice(0, MAX_SHOWN_USERS).map(({ connectionId, info }) => (
            <Avatar 
              key={connectionId} 
              className="h-8 w-8 border-2 border-white ring-1 ring-neutral-200"
            >
              <AvatarImage src={info?.avatar} />
              <AvatarFallback className="text-xs bg-purple-500 text-white">
                {info?.name?.[0] || "U"}
              </AvatarFallback>
            </Avatar>
          ))}

          {hasMoreUsers && (
            <Avatar className="h-8 w-8 border-2 border-white ring-1 ring-neutral-200 bg-neutral-100">
              <AvatarFallback className="text-xs text-neutral-600 font-medium">
                +{users.length - MAX_SHOWN_USERS}
              </AvatarFallback>
            </Avatar>
          )}
        </div>

        <div className="h-6 w-px bg-neutral-200" />
        
        <span className="text-sm font-medium text-neutral-600">
          {users.length + 1} online
        </span>
      </div>
    </div>
  );
}
