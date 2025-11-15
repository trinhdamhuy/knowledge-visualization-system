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
import { useDiagram } from "@/hooks/use-diagram";
import { useTeamContext } from "@/contexts/team-context";

interface CreateDiagramDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateDiagramDialog({
  open,
  onOpenChange,
}: CreateDiagramDialogProps) {
  const { createDiagram, isCreatingDiagram } = useDiagram();
  const { activeTeam } = useTeamContext();

  const formSchema = z.object({
    title: z.string().min(1, {
      message: "Diagram title is required",
    }),
  });

  const form = useForm({
    defaultValues: {
      title: "Untitled Diagram",
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
      const title = values.title.trim() || "Untitled Diagram";
      const diagram = await createDiagram({
        title: title,
        teamId: activeTeam?.id || null,
        folderId: null,
        imageUrl: null,
      });

      if (diagram) {
        toast.success("Diagram created successfully");
        form.reset();
        onOpenChange(false);

        // Open diagram in a new tab
        window.open(`/diagrams/${diagram.id}`, "_blank");
      } else {
        toast.error("Failed to create diagram");
      }
    } catch (error) {
      console.error("Error creating diagram:", error);
      toast.error("An error occurred while creating the diagram");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Diagram</DialogTitle>
          <DialogDescription>
            Create a new diagram. You can change the name later.
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
            <form.Field name="title">
              {(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>
                      Diagram Title
                      <span className="text-red-500 text-xs">*</span>
                    </FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Untitled Diagram"
                      disabled={isCreatingDiagram}
                      aria-invalid={isInvalid}
                      autoFocus
                    />
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
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
              disabled={isCreatingDiagram}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isCreatingDiagram}>
              {isCreatingDiagram ? "Creating..." : "Create Diagram"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
