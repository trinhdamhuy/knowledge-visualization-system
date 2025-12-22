"use client";

import * as React from "react";
import { toast } from "sonner";
import { Copy, Mail } from "lucide-react";
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
import { Permission } from "@/generated/prisma/enums";
import { useQueryClient } from "@tanstack/react-query";
import { diagramKeys } from "@/hooks/use-diagram";
import { itemsKeys } from "@/hooks/use-items";

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
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [shareData, setShareData] = React.useState<Awaited<
    ReturnType<typeof getShareData>
  > | null>(null);

  // Form state
  const [privacyType, setPrivacyType] =
    React.useState<PrivacyType>("restricted");
  const [teamPermission, setTeamPermission] = React.useState<Permission | null>(
    null
  );
  const [userShares, setUserShares] = React.useState<
    Array<{
      userId: string;
      userName: string | null;
      userEmail: string | null;
      userImage: string | null;
      permission: Permission;
    }>
  >([]);
  const [emailInput, setEmailInput] = React.useState("");

  const loadShareData = React.useCallback(async () => {
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
  React.useEffect(() => {
    if (open && diagramId) {
      loadShareData();
    }
  }, [open, diagramId, loadShareData]);

  const handleCopyLink = () => {
    const link = `${window.location.origin}/diagrams/${diagramId}`;
    navigator.clipboard.writeText(link);
    toast.success("Link copied to clipboard");
  };

  const handleInviteByEmail = () => {
    // TODO: Implement email invitation
    if (!emailInput.trim()) {
      toast.error("Please enter an email address");
      return;
    }
    toast.info("Email invitation feature coming soon");
    setEmailInput("");
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
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="start">
                  <SelectItem value="restricted">Restricted</SelectItem>
                  <SelectItem value="view">View</SelectItem>
                  <SelectItem value="edit">Edit</SelectItem>
                </SelectContent>
              </Select>
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
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleInviteByEmail}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Invite
                </Button>
              </div>
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
                      <Select
                        value={share.permission}
                        onValueChange={(value) =>
                          handleUpdateUserPermission(
                            share.userId,
                            value as Permission
                          )
                        }
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
            disabled={isSaving || isLoading}
          >
            {isSaving ? "Saving..." : "Done"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
