"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useOthers, useSelf } from "@/lib/liveblocks.config";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";

const MAX_SHOWN_USERS = 3;

export function DiagramHeader() {
  const users = useOthers();
  const currentUser = useSelf();
  const hasMoreUsers = users.length > MAX_SHOWN_USERS;

  return (
    <div className="absolute top-3 px-3 w-full flex items-center justify-between z-50">
      {/* Left: Back button and title */}
      <Card className="flex items-center gap-2 p-2 w-fit">
        <CardContent className="flex items-center gap-2 p-0">
          <Link href="/dashboard">
            <Button variant="secondary" size="icon">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <Separator orientation="vertical" className="min-h-6" />
          <CardTitle>Diagram Editor</CardTitle>
        </CardContent>
      </Card>

      {/* Right: Participants */}
      <Card className="flex items-center gap-2 p-2 w-fit">
        <CardContent className="flex items-center gap-2 p-0">
          <div className="flex -space-x-2">
            {currentUser && (
              <Avatar className="h-8 w-8 border-2">
                <AvatarImage src={currentUser.info?.avatar} />
                <AvatarFallback className="text-xs bg-blue-500 text-white">
                  {currentUser.info?.name?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
            )}

            {users.slice(0, MAX_SHOWN_USERS).map(({ connectionId, info }) => (
              <Avatar key={connectionId} className="h-8 w-8 border-2">
                <AvatarImage src={info?.avatar} />
                <AvatarFallback className="text-xs bg-purple-500 text-white">
                  {info?.name?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
            ))}

            {hasMoreUsers && (
              <Avatar className="h-8 w-8 border-2">
                <AvatarFallback className="text-xs font-medium">
                  +{users.length - MAX_SHOWN_USERS}
                </AvatarFallback>
              </Avatar>
            )}
          </div>

          <Separator orientation="vertical" className="min-h-6" />

          <CardDescription className="font-medium">
            {users.length + 1} online
          </CardDescription>
        </CardContent>
      </Card>
    </div>
  );
}
