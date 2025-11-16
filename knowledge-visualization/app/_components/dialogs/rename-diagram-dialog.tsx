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

interface RenameDiagramDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  diagramId: string;
  currentTitle: string;
}

export function RenameDiagramDialog({
  open,
  onOpenChange,
  diagramId,
  currentTitle,
}: RenameDiagramDialogProps) {
  const { updateDiagram, isUpdatingDiagram } = useDiagram();

  const formSchema = z.object({
    name: z.string().min(1, {
      message: "Diagram name is required",
    }),
  });

  const form = useForm({
    defaultValues: {
      name: currentTitle,
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async (values) => {
      await onSubmit(values.value);
    },
  });

  // Reset form when dialog opens or currentTitle changes
  React.useEffect(() => {
    if (open) {
      form.setFieldValue("name", currentTitle);
    }
  }, [open, currentTitle, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const name = values.name.trim();
      if (name === currentTitle) {
        onOpenChange(false);
        return;
      }

      const success = await updateDiagram({
        diagramId,
        data: { name },
      });

      if (success) {
        toast.success("Diagram renamed successfully");
        onOpenChange(false);
      } else {
        toast.error("Failed to rename diagram. You may not have permission.");
      }
    } catch (error) {
      console.error("Error renaming diagram:", error);
      toast.error("An error occurred while renaming the diagram");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Rename Diagram</DialogTitle>
          <DialogDescription>
            Enter a new name for this diagram.
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
                      Diagram Name
                      <span className="text-red-500 text-xs">*</span>
                    </FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Untitled Diagram"
                      disabled={isUpdatingDiagram}
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
              disabled={isUpdatingDiagram}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isUpdatingDiagram}>
              {isUpdatingDiagram ? "Renaming..." : "Rename"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
