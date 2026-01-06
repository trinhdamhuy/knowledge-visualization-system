"use client";

import * as React from "react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { teamKeys, useTeam } from "@/hooks/use-team";
import { useActiveTeam } from "@/hooks/use-active-team";
import type { Team } from "@/generated/prisma/client";

interface DeleteTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
  teamName: string;
  onDeleteSuccess?: () => void;
}

export function DeleteTeamDialog({
  open,
  onOpenChange,
  teamId,
  teamName,
  onDeleteSuccess,
}: DeleteTeamDialogProps) {
  const [isDeleting, setIsDeleting] = React.useState(false);
  const queryClient = useQueryClient();
  const { activeTeam, setActiveTeam } = useActiveTeam();
  const { deleteTeam, refetchTeams } = useTeam();

  async function handleDelete() {
    try {
      setIsDeleting(true);
      const isDeletingActiveTeam = activeTeam?.id === teamId;
      const success = await deleteTeam({ teamId });

      if (success) {
        toast.success("Team deleted successfully");

        // Invalidate and refetch teams to get updated list
        await queryClient.invalidateQueries({ queryKey: teamKeys.lists() });
        await refetchTeams();

        // Only switch team if we deleted the currently active team
        if (isDeletingActiveTeam) {
          // Wait a bit for the query to update
          await new Promise((resolve) => setTimeout(resolve, 100));

          // Get updated teams from cache after refetch
          const updatedTeams =
            queryClient.getQueryData<Team[]>(teamKeys.lists()) ?? [];

          if (updatedTeams.length > 0) {
            // Switch to the first available team (excluding the deleted one)
            const otherTeam =
              updatedTeams.find((t) => t.id !== teamId) || updatedTeams[0];
            if (otherTeam) {
              setActiveTeam(otherTeam);
            }
          } else {
            // No teams left, clear active team
            setActiveTeam(null);
          }
        }

        onOpenChange(false);
        if (onDeleteSuccess) {
          onDeleteSuccess();
        }
      } else {
        toast.error("Failed to delete team. You may not have permission.");
      }
    } catch (error) {
      console.error("Error deleting team:", error);
      toast.error("An error occurred while deleting the team");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete Team</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete &quot;{teamName}&quot;? This action
            cannot be undone. All team data, folders, and diagrams will be
            permanently deleted.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete Team"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
