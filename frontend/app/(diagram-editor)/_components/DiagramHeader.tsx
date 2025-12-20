"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useParams } from "next/navigation";
import { useDiagramById, useDiagram } from "@/hooks/use-diagram";
import { EditableTitle } from "@/app/_components/editable-title";
import { toast } from "sonner";
import { useCanEditDiagram } from "@/hooks/use-diagram-permission";
import { Panel } from "@xyflow/react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";

export function DiagramHeader() {
  const router = useRouter();
  const params = useParams();
  const diagramId = params?.diagramId as string | undefined;
  const { data: diagram, isLoading } = useDiagramById(diagramId);
  const { updateDiagram, isUpdatingDiagram } = useDiagram();
  const { data: canEdit = false, isLoading: isLoadingPermission } =
    useCanEditDiagram(diagramId);

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
    <Panel position="top-left">
      {/* Back button and title */}
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
    </Panel>
  );
}
