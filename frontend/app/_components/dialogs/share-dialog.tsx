"use client";

import * as React from "react";
import { toast } from "sonner";
import { Copy, Mail, X } from "lucide-react";
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
import { getShareData, saveShareSettings } from "@/app/_actions/diagram";
import { inviteUserToDiagram } from "@/app/_actions/diagram/share/invite-user";
import { removeShare } from "@/app/_actions/diagram/share/remove-share";
import { Permission } from "@/generated/prisma/enums";
import { useQueryClient } from "@tanstack/react-query";
import { diagramKeys } from "@/hooks/use-diagram";
import { itemsKeys } from "@/hooks/use-items";
import { useCanEditDiagram } from "@/hooks/use-diagram-permission";
import { useState, useCallback, useEffect, Activity } from "react";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  diagramId: string;
}

type PrivacyType = "restricted" | "view" | "edit";

export function ShareDialog({
  open,
  onOpenChange,
  diagramId,
}: ShareDialogProps) {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [shareData, setShareData] = useState<Awaited<
    ReturnType<typeof getShareData>
  > | null>(null);

  // Check edit permission
  const { data: canEdit = false, isLoading: isLoadingPermission } =
    useCanEditDiagram(diagramId);

  // Form state
  const [privacyType, setPrivacyType] = useState<PrivacyType>("restricted");
  const [teamPermission, setTeamPermission] = useState<Permission | null>(null);
  const [userShares, setUserShares] = useState<
    Array<{
      userId: string;
      userName: string | null;
      userEmail: string | null;
      userImage: string | null;
      permission: Permission;
    }>
  >([]);
  const [emailInput, setEmailInput] = useState("");
  const [invitePermission, setInvitePermission] = useState<Permission>(
    Permission.VIEWER
  );

  // Validate email format
  const isValidEmail = React.useMemo(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailInput.trim() !== "" && emailRegex.test(emailInput.trim());
  }, [emailInput]);

  const loadShareData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getShareData(diagramId);
      if (data) {
        setShareData(data);
        setTeamPermission(data.teamPermission);
        setUserShares(data.shares);
        // Use privacy type from data
        setPrivacyType(data.privacyType);
      }
    } catch (error) {
      console.error("Failed to load share data:", error);
      toast.error("Failed to load share settings");
    } finally {
      setIsLoading(false);
    }
  }, [diagramId]);

  // Load share data when dialog opens
  useEffect(() => {
    if (open && diagramId) {
      loadShareData();
    }
  }, [open, diagramId, loadShareData]);

  const handleCopyLink = () => {
    const link = `${window.location.origin}/diagrams/${diagramId}`;
    navigator.clipboard.writeText(link);
    toast.success("Link copied to clipboard");
  };

  const handleInviteByEmail = async () => {
    if (!canEdit) {
      toast.error("You don't have permission to invite users");
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

    try {
      const result = await inviteUserToDiagram(
        diagramId,
        emailInput.trim(),
        invitePermission
      );

      if (result.success) {
        toast.success("Invitation sent successfully");
        setEmailInput("");
        setInvitePermission(Permission.VIEWER);
        // Reload share data to show new invite
        loadShareData();
      } else {
        toast.error(result.error || "Failed to send invitation");
      }
    } catch (error) {
      console.error("Failed to invite user:", error);
      toast.error("Failed to send invitation");
    }
  };

  const handleUpdateUserPermission = (
    userId: string,
    permission: Permission
  ) => {
    setUserShares((prev) =>
      prev.map((share) =>
        share.userId === userId ? { ...share, permission } : share
      )
    );
  };

  const handleRemoveShare = async (userId: string) => {
    if (!canEdit) {
      toast.error("You don't have permission to remove users");
      return;
    }

    try {
      const result = await removeShare(diagramId, userId);

      if (result.success) {
        toast.success("User removed successfully");
        // Remove from local state
        setUserShares((prev) =>
          prev.filter((share) => share.userId !== userId)
        );
        // Reload share data to ensure consistency
        loadShareData();
      } else {
        toast.error(result.error || "Failed to remove user");
      }
    } catch {
      toast.error("Failed to remove user");
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const success = await saveShareSettings({
        diagramId,
        privacyType,
        teamPermission: privacyType === "edit" ? teamPermission : null,
        userShares: userShares.map((share) => ({
          userId: share.userId,
          permission: share.permission,
        })),
      });

      if (success) {
        toast.success("Share settings saved successfully");
        queryClient.invalidateQueries({ queryKey: diagramKeys.all });
        queryClient.invalidateQueries({ queryKey: itemsKeys.all });
        onOpenChange(false);
      } else {
        toast.error("Failed to save share settings");
      }
    } catch (error) {
      console.error("Failed to save share settings:", error);
      toast.error("An error occurred while saving share settings");
    } finally {
      setIsSaving(false);
    }
  };

  const diagramLink = `${window.location.origin}/diagrams/${diagramId}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Share Diagram</DialogTitle>
          <DialogDescription>
            Control who can access this diagram and their permissions.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Link Section */}
            <div className="space-y-2">
              <FieldLabel>Link</FieldLabel>
              <div className="flex gap-2">
                <Input value={diagramLink} readOnly className="flex-1" />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleCopyLink}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Privacy Settings */}
            <div className="space-y-2">
              <FieldLabel>Privacy</FieldLabel>
              <Select
                value={privacyType}
                onValueChange={(value) => setPrivacyType(value as PrivacyType)}
                disabled={!canEdit || isLoadingPermission}
              >
                <SelectTrigger disabled={!canEdit || isLoadingPermission}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="start">
                  <SelectItem value="restricted">Restricted</SelectItem>
                  <SelectItem value="view">View</SelectItem>
                  <SelectItem value="edit">Edit</SelectItem>
                </SelectContent>
              </Select>
              <Activity mode={!canEdit ? "visible" : "hidden"}>
                <p className="text-xs text-muted-foreground">
                  You don&apos;t have permission to change privacy settings
                </p>
              </Activity>
            </div>

            {/* Team Permission (if diagram belongs to a team) */}
            {shareData?.teamId && (
              <div className="space-y-2">
                <FieldLabel>Team Permission</FieldLabel>
                <Select
                  value={teamPermission ?? "restricted"}
                  onValueChange={(value) => {
                    if (value === "restricted") {
                      setTeamPermission(null);
                    } else {
                      setTeamPermission(value as Permission);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="start">
                    <SelectItem value="restricted">Restricted</SelectItem>
                    <SelectItem value={Permission.VIEWER}>View</SelectItem>
                    <SelectItem value={Permission.EDITOR}>Edit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Invite by Email */}
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
                        handleInviteByEmail();
                      }
                    }}
                    disabled={!canEdit || isLoadingPermission}
                    className={isValidEmail ? "pr-32" : ""}
                  />
                  {isValidEmail && canEdit && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                      <Select
                        value={invitePermission}
                        onValueChange={(value) =>
                          setInvitePermission(value as Permission)
                        }
                      >
                        <SelectTrigger size="sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent align="end">
                          <SelectItem
                            value={Permission.VIEWER}
                            className="py-1 px-2 text-sm"
                          >
                            View
                          </SelectItem>
                          <SelectItem
                            value={Permission.EDITOR}
                            className="py-1 px-2 text-sm"
                          >
                            Edit
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleInviteByEmail}
                  disabled={!canEdit || isLoadingPermission || !isValidEmail}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Invite
                </Button>
              </div>
              {!canEdit && (
                <p className="text-xs text-muted-foreground">
                  You don&apos;t have permission to invite users
                </p>
              )}
            </div>

            {/* Shared Users List */}
            {userShares.length > 0 && (
              <div className="space-y-2">
                <FieldLabel>People with access</FieldLabel>
                <div className="space-y-2 border rounded-md p-4">
                  {userShares.map((share) => (
                    <div
                      key={share.userId}
                      className="flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={share.userImage ?? ""}
                            alt={share.userName ?? ""}
                          />
                          <AvatarFallback>
                            {share.userName?.charAt(0) ?? "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {share.userName ?? "Unknown"}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {share.userEmail ?? ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Select
                          value={share.permission}
                          onValueChange={(value) =>
                            handleUpdateUserPermission(
                              share.userId,
                              value as Permission
                            )
                          }
                          disabled={!canEdit}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={Permission.VIEWER}>
                              View
                            </SelectItem>
                            <SelectItem value={Permission.EDITOR}>
                              Edit
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        {canEdit && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleRemoveShare(share.userId)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving || isLoading || !canEdit || isLoadingPermission}
          >
            {isSaving ? "Saving..." : "Done"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
