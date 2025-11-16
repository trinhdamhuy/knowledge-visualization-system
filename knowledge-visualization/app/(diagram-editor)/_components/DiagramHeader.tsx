"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AvatarGroup,
  AvatarGroupTooltip,
} from "@/components/animate-ui/components/animate/avatar-group";
import { useOthers, useSelf } from "@liveblocks/react/suspense";
import { useParams } from "next/navigation";
import { useDiagramById, useDiagram } from "@/hooks/use-diagram";
import { EditableTitle } from "@/app/_components/editable-title";
import { toast } from "sonner";
import { useCanEditDiagram } from "@/hooks/use-diagram-permission";
import ZoomSelect from "@/components/zoom-select";

const MAX_SHOWN_USERS = 3;

export function DiagramHeader() {
  const params = useParams();
  const diagramId = params?.diagramId as string | undefined;
  const { data: diagram, isLoading } = useDiagramById(diagramId);
  const { updateDiagram, isUpdatingDiagram } = useDiagram();
  const { data: canEdit = false, isLoading: isLoadingPermission } =
    useCanEditDiagram(diagramId);

  const users = useOthers();
  const currentUser = useSelf();
  const allUsers = [...users, currentUser];
  const hasMoreUsers = allUsers.length > MAX_SHOWN_USERS;

  const handleSaveTitle = async (newTitle: string) => {
    if (!diagramId || !newTitle.trim()) {
      toast.error("Name cannot be empty");
      return;
    }

    try {
      const success = await updateDiagram({
        diagramId,
        data: { name: newTitle },
      });

      if (success) {
        toast.success("Diagram name updated");
      } else {
        toast.error("Failed to update diagram name");
      }
    } catch (error) {
      console.error("Error updating diagram name:", error);
      toast.error("An error occurred while updating the name");
      throw error;
    }
  };

  return (
    <div className="absolute top-3 px-3 w-full flex items-center justify-between z-50">
      {/* Left: Back button and title */}
      <Card className="flex items-center gap-2 p-2 w-fit">
        <CardContent className="flex items-center gap-2 p-0">
          <Link href="/home">
            <Button variant="secondary" size="icon">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <Separator orientation="vertical" className="min-h-6" />
          {isLoading || isLoadingPermission ? (
            <span className="text-sm font-medium text-muted-foreground">
              Loading...
            </span>
          ) : (
            <EditableTitle
              value={diagram?.name || "Untitled Diagram"}
              onSave={handleSaveTitle}
              disabled={isUpdatingDiagram || !diagram || !canEdit}
              className="text-sm font-medium"
            />
          )}
        </CardContent>
      </Card>

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
            <ZoomSelect />
          </CardDescription>
        </CardContent>
      </Card>
    </div>
  );
}
