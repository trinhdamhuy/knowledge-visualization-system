"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription } from "@/components/ui/card";
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
import { Panel } from "@xyflow/react";
import { ThemeToggle } from "@/app/_components/buttons/theme-toggle";
import ZoomSelect from "@/components/zoom-select";
import { ButtonGroup } from "@/components/ui/button-group";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { useChatPanelStore } from "../_stores/use-chat-panel-store";
import { Layout, LayoutGrid } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const MAX_SHOWN_USERS = 3;

export function DiagramHeader() {
  const router = useRouter();
  const params = useParams();
  const diagramId = params?.diagramId as string | undefined;
  const { data: diagram, isLoading } = useDiagramById(diagramId);
  const { updateDiagram, isUpdatingDiagram } = useDiagram();
  const { data: canEdit = false, isLoading: isLoadingPermission } =
    useCanEditDiagram(diagramId);
  const { displayMode, setDisplayMode } = useChatPanelStore();

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
    <Panel
      position="top-center"
      className="w-full flex items-center justify-between z-50 px-3"
    >
      {/* Left: Back button and title */}
      <Card className="flex items-center gap-2 p-2 w-fit">
        <CardContent className="flex items-center gap-2 p-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/home")}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <Separator orientation="vertical" className="min-h-6" />
          {isLoading || isLoadingPermission ? (
            <Skeleton className="w-24 h-6 rounded-md" />
          ) : (
            <EditableTitle
              value={diagram?.name || "Untitled Diagram"}
              onSave={handleSaveTitle}
              disabled={isUpdatingDiagram || !diagram || !canEdit}
              className="text-md font-medium"
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

          <CardDescription className="font-medium flex items-center gap-2">
            <ButtonGroup>
              <ZoomSelect />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      setDisplayMode(
                        displayMode === "docked" ? "sidebar" : "docked"
                      )
                    }
                  >
                    {displayMode === "docked" ? (
                      <LayoutGrid className="size-4" />
                    ) : (
                      <Layout className="size-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {displayMode === "docked"
                      ? "Switch to Sidebar mode"
                      : "Switch to Docked mode"}
                  </p>
                </TooltipContent>
              </Tooltip>
              <ThemeToggle variant="outline" size="icon" />
            </ButtonGroup>
          </CardDescription>
        </CardContent>
      </Card>
    </Panel>
  );
}
