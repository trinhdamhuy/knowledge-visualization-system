"use client";

import * as React from "react";
import { useForm } from "@tanstack/react-form";
import * as z from "zod";
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
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useTeam } from "@/hooks/use-team";
import { useActiveTeam } from "@/hooks/use-active-team";

interface CreateTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateTeamDialog({
  open,
  onOpenChange,
}: CreateTeamDialogProps) {
  const { createTeam, isCreatingTeam, refetchTeams } = useTeam();
  const { setActiveTeam } = useActiveTeam();

  const formSchema = z.object({
    name: z.string().min(1, {
      message: "Team name is required",
    }),
    imageUrl: z.string(),
  });

  const form = useForm({
    defaultValues: {
      name: "",
      imageUrl: "",
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async (values) => {
      await onSubmit(values.value);
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const team = await createTeam({
        name: values.name,
        imageUrl: values.imageUrl || "",
      });

      if (team) {
        toast.success("Team created successfully");
        form.reset();
        onOpenChange(false);

        // Wait for teams to be refetched before setting active team
        await refetchTeams();
        // Wait a bit to ensure teams are updated in context
        setTimeout(() => {
          setActiveTeam(team);
        }, 50);
      } else {
        toast.error("Failed to create team");
      }
    } catch (error) {
      console.error("Error creating team:", error);
      toast.error("An error occurred while creating the team");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Team</DialogTitle>
          <DialogDescription>
            Create a new team to collaborate with others. You can change this
            later.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
          className="space-y-4"
        >
          <FieldGroup>
            <form.Field name="name">
              {(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>
                      Team Name
                      <span className="text-red-500 text-xs">*</span>
                    </FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Enter team name"
                      disabled={isCreatingTeam}
                      aria-invalid={isInvalid}
                    />
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                );
              }}
            </form.Field>

            <form.Field name="imageUrl">
              {(field) => {
                return (
                  <Field>
                    <FieldLabel htmlFor={field.name}>
                      Team Image URL (Optional)
                    </FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="https://example.com/image.png"
                      disabled={isCreatingTeam}
                    />
                  </Field>
                );
              }}
            </form.Field>
          </FieldGroup>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isCreatingTeam}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isCreatingTeam}>
              {isCreatingTeam ? "Creating..." : "Create Team"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
