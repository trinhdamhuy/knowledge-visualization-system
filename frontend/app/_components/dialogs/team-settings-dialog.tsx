"use client";

import * as React from "react";
import { toast } from "sonner";
import { Mail, Trash2, MoreVertical } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FieldLabel } from "@/components/ui/field";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useTeam } from "@/hooks/use-team";
import { Permission } from "@/generated/prisma/enums";
import { FullTeam } from "@/types/team";
import { getTeamMembers, getTeamRole } from "@/app/_actions/team";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { teamKeys } from "@/hooks/use-team";
import { DeleteTeamDialog } from "./delete-team-dialog";

interface TeamSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
}

export function TeamSettingsDialog({
  open,
  onOpenChange,
  teamId,
}: TeamSettingsDialogProps) {
  const queryClient = useQueryClient();
  const { updateTeam, isUpdatingTeam, isDeletingTeam } = useTeam();
  const [isEditingName, setIsEditingName] = React.useState(false);
  const [teamName, setTeamName] = React.useState("");
  const [emailInput, setEmailInput] = React.useState("");
  const [invitePermission, setInvitePermission] = React.useState<Permission>(
    Permission.VIEWER
  );
  const [isInviting, setIsInviting] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);

  // Fetch team with members
  const {
    data: team,
    isLoading,
    refetch: refetchTeam,
  } = useQuery<FullTeam | null>({
    queryKey: [...teamKeys.details(), teamId, "members"],
    queryFn: async () => {
      return await getTeamMembers(teamId);
    },
    enabled: open && !!teamId,
  });

  // Get current user's role in the team
  const { data: currentUserRole } = useQuery<Permission | null>({
    queryKey: [...teamKeys.details(), teamId, "currentUserRole"],
    queryFn: async () => {
      return await getTeamRole(teamId);
    },
    enabled: open && !!teamId,
  });

  const canEdit =
    currentUserRole === Permission.OWNER ||
    currentUserRole === Permission.EDITOR;
  const isOwner = currentUserRole === Permission.OWNER;

  // Initialize team name when team loads
  React.useEffect(() => {
    if (team) {
      setTeamName(team.name);
    }
  }, [team]);

  // Validate email format
  const isValidEmail = React.useMemo(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailInput.trim() !== "" && emailRegex.test(emailInput.trim());
  }, [emailInput]);

  const handleUpdateTeamName = async () => {
    if (!teamName.trim() || teamName === team?.name) {
      setIsEditingName(false);
      return;
    }

    try {
      const success = await updateTeam({
        teamId,
        data: { name: teamName.trim() },
      });

      if (success) {
        toast.success("Team name updated successfully");
        setIsEditingName(false);
        queryClient.invalidateQueries({ queryKey: teamKeys.lists() });
        refetchTeam();
      } else {
        toast.error("Failed to update team name");
        setTeamName(team?.name || "");
      }
    } catch (error) {
      console.error("Error updating team name:", error);
      toast.error("An error occurred while updating team name");
      setTeamName(team?.name || "");
    }
  };

  const handleInviteMember = async () => {
    if (!canEdit) {
      toast.error("You don't have permission to invite members");
      return;
    }

    if (!emailInput.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    if (!isValidEmail) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsInviting(true);
    try {
      const { inviteMember } = await import("@/app/_actions/team");
      const result = await inviteMember(
        teamId,
        emailInput.trim(),
        invitePermission
      );

      if (result.success) {
        toast.success("Member invited successfully");
        setEmailInput("");
        setInvitePermission(Permission.VIEWER);
        refetchTeam();
        queryClient.invalidateQueries({ queryKey: teamKeys.lists() });
      } else {
        toast.error(result.error || "Failed to invite member");
      }
    } catch (error) {
      console.error("Error inviting member:", error);
      toast.error("An error occurred while inviting member");
    } finally {
      setIsInviting(false);
    }
  };

  const handleUpdateMemberRole = async (
    userId: string,
    permission: Permission
  ) => {
    if (!canEdit) {
      toast.error("You don't have permission to update member roles");
      return;
    }

    try {
      const { updateMemberRole } = await import("@/app/_actions/team");
      const result = await updateMemberRole(teamId, userId, permission);

      if (result.success) {
        toast.success("Member role updated successfully");
        refetchTeam();
        queryClient.invalidateQueries({ queryKey: teamKeys.lists() });
      } else {
        toast.error(result.error || "Failed to update member role");
      }
    } catch (error) {
      console.error("Error updating member role:", error);
      toast.error("An error occurred while updating member role");
    }
  };

  const handleRemoveMember = async (
    userId: string,
    userName: string | null
  ) => {
    if (!canEdit) {
      toast.error("You don't have permission to remove members");
      return;
    }

    if (
      !confirm(
        `Are you sure you want to remove ${
          userName || "this member"
        } from the team?`
      )
    ) {
      return;
    }

    try {
      const { removeMember } = await import("@/app/_actions/team");
      const result = await removeMember(teamId, userId);

      if (result.success) {
        toast.success("Member removed successfully");
        refetchTeam();
        queryClient.invalidateQueries({ queryKey: teamKeys.lists() });
      } else {
        toast.error(result.error || "Failed to remove member");
      }
    } catch (error) {
      console.error("Error removing member:", error);
      toast.error("An error occurred while removing member");
    }
  };

  const handleDeleteTeam = () => {
    if (!isOwner) {
      toast.error("Only team owners can delete the team");
      return;
    }
    setIsDeleteDialogOpen(true);
  };

  const getRoleBadgeVariant = (permission: Permission) => {
    switch (permission) {
      case Permission.OWNER:
        return "default";
      case Permission.EDITOR:
        return "secondary";
      case Permission.VIEWER:
        return "outline";
      default:
        return "outline";
    }
  };

  const getRoleLabel = (permission: Permission) => {
    switch (permission) {
      case Permission.OWNER:
        return "Owner";
      case Permission.EDITOR:
        return "Editor";
      case Permission.VIEWER:
        return "Viewer";
      default:
        return "Unknown";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Team Settings</DialogTitle>
          <DialogDescription>
            Manage your team members, permissions, and settings.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        ) : !team ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">Team not found</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Team Name Section */}
            <div className="space-y-2">
              <FieldLabel>Team Name</FieldLabel>
              {isEditingName ? (
                <div className="flex gap-2">
                  <Input
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    onBlur={handleUpdateTeamName}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleUpdateTeamName();
                      } else if (e.key === "Escape") {
                        setTeamName(team.name);
                        setIsEditingName(false);
                      }
                    }}
                    disabled={!canEdit || isUpdatingTeam}
                    autoFocus
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setTeamName(team.name);
                      setIsEditingName(false);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{team.name}</p>
                  {canEdit && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditingName(true)}
                    >
                      Edit
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Invite Section */}
            {canEdit && (
              <div className="space-y-2">
                <FieldLabel>Invite people</FieldLabel>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Input
                      type="email"
                      placeholder="Enter email address"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleInviteMember();
                        }
                      }}
                      disabled={isInviting}
                      className={isValidEmail ? "pr-32" : ""}
                    />
                    {isValidEmail && (
                      <div className="absolute right-2 top-1/2 -translate-y-1/2">
                        <Select
                          value={invitePermission}
                          onValueChange={(value) =>
                            setInvitePermission(value as Permission)
                          }
                        >
                          <SelectTrigger size="sm" className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent align="end">
                            <SelectItem value={Permission.VIEWER}>
                              Viewer
                            </SelectItem>
                            <SelectItem value={Permission.EDITOR}>
                              Editor
                            </SelectItem>
                            {isOwner && (
                              <SelectItem value={Permission.OWNER}>
                                Owner
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleInviteMember}
                    disabled={!isValidEmail || isInviting}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    {isInviting ? "Inviting..." : "Invite"}
                  </Button>
                </div>
              </div>
            )}

            {/* Members List */}
            {team.members.length > 0 && (
              <div className="space-y-2">
                <FieldLabel>Members ({team.members.length})</FieldLabel>
                <div className="space-y-2 border rounded-md p-4">
                  {team.members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={member.user.image ?? ""}
                            alt={member.user.name ?? ""}
                          />
                          <AvatarFallback>
                            {member.user.name?.charAt(0) ?? "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium truncate">
                              {member.user.name ?? "Unknown"}
                            </p>
                            <Badge
                              variant={getRoleBadgeVariant(member.permission)}
                              className="text-xs"
                            >
                              {getRoleLabel(member.permission)}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {member.user.email ?? ""}
                          </p>
                        </div>
                      </div>
                      {canEdit && (
                        <div className="flex items-center gap-2">
                          <Select
                            value={member.permission}
                            onValueChange={(value) =>
                              handleUpdateMemberRole(
                                member.userId,
                                value as Permission
                              )
                            }
                            disabled={
                              (!isOwner &&
                                member.permission === Permission.OWNER) ||
                              (member.permission === Permission.OWNER &&
                                team.members.filter(
                                  (m) => m.permission === Permission.OWNER
                                ).length === 1)
                            }
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {isOwner && (
                                <SelectItem value={Permission.OWNER}>
                                  Owner
                                </SelectItem>
                              )}
                              <SelectItem value={Permission.EDITOR}>
                                Editor
                              </SelectItem>
                              <SelectItem value={Permission.VIEWER}>
                                Viewer
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() =>
                                  handleRemoveMember(
                                    member.userId,
                                    member.user.name
                                  )
                                }
                                disabled={
                                  member.permission === Permission.OWNER &&
                                  team.members.filter(
                                    (m) => m.permission === Permission.OWNER
                                  ).length === 1
                                }
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Remove
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Danger Zone */}
            {isOwner && (
              <>
                <Separator />
                <div className="space-y-2">
                  <FieldLabel className="text-destructive">
                    Danger Zone
                  </FieldLabel>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDeleteTeam}
                    disabled={isDeletingTeam}
                    className="w-full"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Team
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Permanently delete this team and all its data. This action
                    cannot be undone.
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeletingTeam}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
      {team && (
        <DeleteTeamDialog
          open={isDeleteDialogOpen}
          onOpenChange={(open) => {
            setIsDeleteDialogOpen(open);
          }}
          teamId={teamId}
          teamName={team.name}
          onDeleteSuccess={() => {
            onOpenChange(false);
          }}
        />
      )}
    </Dialog>
  );
}
