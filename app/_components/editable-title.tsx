"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface EditableTitleProps {
  value: string;
  onSave: (value: string) => Promise<void>;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

export function EditableTitle({
  value,
  onSave,
  className,
  placeholder = "Untitled",
  disabled = false,
}: EditableTitleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const [inputWidth, setInputWidth] = useState<number>();
  const inputRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLSpanElement>(null);

  // Update editValue when value prop changes
  useEffect(() => {
    setEditValue(value);
  }, [value]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleClick = () => {
    if (disabled) return;

    if (titleRef.current) {
      const width = Math.max(titleRef.current.offsetWidth, 120);
      setInputWidth(width);
    } else {
      setInputWidth(undefined);
    }

    setIsEditing(true);
  };

  const handleSave = async () => {
    const trimmedValue = editValue.trim();

    // Validate: cannot be empty
    if (!trimmedValue) {
      // Reset to original value if empty
      setEditValue(value);
      setIsEditing(false);
      return;
    }

    // Only save if value changed
    if (trimmedValue === value) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(trimmedValue);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to save title:", error);
      // Reset to original value on error
      setEditValue(value);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancel();
    }
  };

  const handleBlur = () => {
    handleSave();
  };

  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        disabled={isSaving || disabled}
        placeholder={placeholder}
        className={cn(
          "h-auto min-w-[120px] px-2 py-1.5 text-md font-medium",
          className
        )}
        style={inputWidth ? { width: inputWidth } : undefined}
      />
    );
  }

  return (
    <span
      ref={titleRef}
      onClick={handleClick}
      className={cn(
        "px-2 py-1.5 text-md font-medium cursor-pointer hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 rounded-md transition-colors min-w-[120px] inline-block",
        disabled && "cursor-default hover:bg-transparent",
        className
      )}
      title={disabled ? undefined : "Click to edit"}
    >
      {value || placeholder}
    </span>
  );
}
