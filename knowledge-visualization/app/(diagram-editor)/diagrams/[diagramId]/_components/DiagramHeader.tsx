"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import ZoomSelect from "@/components/zoom-select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AvatarGroup,
  AvatarGroupTooltip,
} from "@/components/animate-ui/components/animate/avatar-group";
import { useOthers, useSelf } from "@liveblocks/react/suspense";

const MAX_SHOWN_USERS = 3;

export function DiagramHeader() {
  const users = useOthers();
  const currentUser = useSelf();
  const allUsers = [...users, currentUser];
  const hasMoreUsers = allUsers.length > MAX_SHOWN_USERS;

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

      <ZoomSelect />

      {/* Right: Participants */}
      <Card className="flex items-center gap-2 p-2 w-fit">
        <CardContent className="flex items-center gap-2 p-0">
          <AvatarGroup
            translate="0%"
            className="h-full"
            sideOffset={10}
            tooltipTransition={{ type: "tween", duration: 0.2 }}
          >
            {allUsers
              .slice(0, MAX_SHOWN_USERS)
              .map(({ connectionId, info }) => (
                <Avatar key={connectionId}>
                  <AvatarImage src={info?.avatar} />
                  <AvatarFallback className="text-xs font-medium">
                    {info?.name?.[0] || "U"}
                  </AvatarFallback>
                  <AvatarGroupTooltip>
                    <p>{info?.name}</p>
                  </AvatarGroupTooltip>
                </Avatar>
              ))}
          </AvatarGroup>

          {hasMoreUsers && (
            <Avatar className="h-8 w-8 border-2">
              <AvatarFallback className="text-xs font-medium">
                +{allUsers.length - MAX_SHOWN_USERS}
              </AvatarFallback>
            </Avatar>
          )}
          <Separator orientation="vertical" className="min-h-6" />

          <CardDescription className="font-medium">
            {allUsers.length} online
          </CardDescription>
        </CardContent>
      </Card>
    </div>
  );
}
