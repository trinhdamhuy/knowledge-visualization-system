import { useCallback } from "react";
import { useDiagramStore } from "../_stores/use-diagram-store";
import { useDiagramSync } from "@/hooks/use-diagram-sync";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardTitle,
  CardHeader,
  CardDescription,
} from "@/components/ui/card";
import {
  ColorPicker,
  ColorPickerAlphaSlider,
  ColorPickerArea,
  ColorPickerContent,
  ColorPickerEyeDropper,
  ColorPickerFormatSelect,
  ColorPickerHueSlider,
  ColorPickerInput,
  ColorPickerSwatch,
  ColorPickerTrigger,
} from "@/components/ui/color-picker";
import { Button } from "@/components/ui/button";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
} from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { Separator } from "@/components/ui/separator";

const FONT_FAMILIES = [
  { value: "Inter", label: "Inter" },
  { value: "Arial", label: "Arial" },
  { value: "Helvetica", label: "Helvetica" },
  { value: "Times New Roman", label: "Times New Roman" },
  { value: "Georgia", label: "Georgia" },
  { value: "Verdana", label: "Verdana" },
  { value: "Courier New", label: "Courier New" },
];

const FONT_SIZES = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72];

export function DiagramTextToolBar() {
  const { nodes, updateNodeData } = useDiagramSync();
  const { selectedNodeId, isEditingText } = useDiagramStore();

  const node = selectedNodeId
    ? nodes.find((n) => n.id === selectedNodeId)
    : null;

  // Get text styles from node data
  const textStyle = {
    fontFamily: (node?.data?.fontFamily as string) || "Inter",
    fontSize: (node?.data?.fontSize as number) || 14,
    fontWeight: (node?.data?.fontWeight as string) || "normal",
    fontStyle: (node?.data?.fontStyle as string) || "normal",
    textDecoration: (node?.data?.textDecoration as string) || "none",
    textAlign: (node?.data?.textAlign as string) || "center",
    textColor: (node?.data?.textColor as string) || "#000000",
  };

  const updateTextStyle = useCallback(
    (nodeId: string, styleUpdate: Record<string, unknown>) => {
      updateNodeData(nodeId, styleUpdate, undefined);
    },
    [updateNodeData]
  );

  if (!selectedNodeId || !node || !isEditingText) return null;

  // Prevent blur when interacting with toolbar and set a short-lived flag
  const preventBlur = (e: React.MouseEvent | React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      (window as any).__isInteractingWithTextToolbar = true;
    } catch (err) {
      /* ignore */
    }
  };

  const clearInteractFlag = () => {
    try {
      // Clear on next tick so any focus changes can be detected by the node
      setTimeout(() => {
        (window as any).__isInteractingWithTextToolbar = false;
      }, 0);
    } catch (err) {
      /* ignore */
    }
  };

  return (
    <Card 
      data-text-toolbar 
      className="fixed right-6 top-[10%] z-999 min-w-[300px]"
      onMouseDown={preventBlur}
      onPointerDown={preventBlur}
      onPointerUp={clearInteractFlag}
      onMouseUp={clearInteractFlag}
    >
      <CardHeader className="pb-3">
        <CardTitle>Text</CardTitle>
        <CardDescription>Edit the text style of the node.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Font Family */}
        <div>
          <label className="block text-sm font-medium mb-1.5">Font</label>
          <Select
            value={textStyle.fontFamily}
            onValueChange={(value) =>
              updateTextStyle(node.id, { fontFamily: value })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select font" />
            </SelectTrigger>
            <SelectContent>
              {FONT_FAMILIES.map((font) => (
                <SelectItem
                  key={font.value}
                  value={font.value}
                  style={{ fontFamily: font.value }}
                >
                  {font.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Font Size */}
        <div>
          <label className="block text-sm font-medium mb-1.5">Size</label>
          <div className="flex items-center gap-2">
            <Select
              value={String(textStyle.fontSize)}
              onValueChange={(value) =>
                updateTextStyle(node.id, { fontSize: Number(value) })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Size" />
              </SelectTrigger>
              <SelectContent>
                {FONT_SIZES.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}px
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Text Formatting */}
        <div>
          <label className="block text-sm font-medium mb-1.5">Format</label>
          <div className="flex items-center gap-1">
            <Toggle
              size="sm"
              className={textStyle.fontWeight === "bold" ? "bg-slate-200 dark:bg-slate-700" : ""}
              isSelected={textStyle.fontWeight === "bold"}
              onChange={(isSelected: boolean) =>
                updateTextStyle(node.id, {
                  fontWeight: isSelected ? "bold" : "normal",
                })
              }
              aria-label="Bold"
            >
              <Bold className="h-4 w-4" />
            </Toggle>
            <Toggle
              size="sm"
              className={textStyle.fontStyle === "italic" ? "bg-slate-200 dark:bg-slate-700" : ""}
              isSelected={textStyle.fontStyle === "italic"}
              onChange={(isSelected: boolean) =>
                updateTextStyle(node.id, {
                  fontStyle: isSelected ? "italic" : "normal",
                })
              }
              aria-label="Italic"
            >
              <Italic className="h-4 w-4" />
            </Toggle>
            <Toggle
              size="sm"
              className={textStyle.textDecoration === "underline" ? "bg-slate-200 dark:bg-slate-700" : ""}
              isSelected={textStyle.textDecoration === "underline"}
              onChange={(isSelected: boolean) =>
                updateTextStyle(node.id, {
                  textDecoration: isSelected ? "underline" : "none",
                })
              }
              aria-label="Underline"
            >
              <Underline className="h-4 w-4" />
            </Toggle>
            <Toggle
              size="sm"
              className={textStyle.textDecoration === "line-through" ? "bg-slate-200 dark:bg-slate-700" : ""}
              isSelected={textStyle.textDecoration === "line-through"}
              onChange={(isSelected: boolean) =>
                updateTextStyle(node.id, {
                  textDecoration: isSelected ? "line-through" : "none",
                })
              }
              aria-label="Strikethrough"
            >
              <Strikethrough className="h-4 w-4" />
            </Toggle>
          </div>
        </div>

        {/* Text Alignment */}
        <div>
          <label className="block text-sm font-medium mb-1.5">Alignment</label>
          <div className="flex items-center gap-1">
            <Toggle
              size="sm"
              className={textStyle.textAlign === "left" ? "bg-slate-200 dark:bg-slate-700" : ""}
              isSelected={textStyle.textAlign === "left"}
              onChange={() =>
                updateTextStyle(node.id, { textAlign: "left" })
              }
              aria-label="Align left"
            >
              <AlignLeft className="h-4 w-4" />
            </Toggle>
            <Toggle
              size="sm"
              className={textStyle.textAlign === "center" ? "bg-slate-200 dark:bg-slate-700" : ""}
              isSelected={textStyle.textAlign === "center"}
              onChange={() =>
                updateTextStyle(node.id, { textAlign: "center" })
              }
              aria-label="Align center"
            >
              <AlignCenter className="h-4 w-4" />
            </Toggle>
            <Toggle
              size="sm"
              className={textStyle.textAlign === "right" ? "bg-slate-200 dark:bg-slate-700" : ""}
              isSelected={textStyle.textAlign === "right"}
              onChange={() =>
                updateTextStyle(node.id, { textAlign: "right" })
              }
              aria-label="Align right"
            >
              <AlignRight className="h-4 w-4" />
            </Toggle>
            <Toggle
              size="sm"
              className={textStyle.textAlign === "justify" ? "bg-slate-200 dark:bg-slate-700" : ""}
              isSelected={textStyle.textAlign === "justify"}
              onChange={() =>
                updateTextStyle(node.id, { textAlign: "justify" })
              }
              aria-label="Justify"
            >
              <AlignJustify className="h-4 w-4" />
            </Toggle>
          </div>
        </div>

        <Separator />

        {/* Font Color */}
        <div>
          <label className="block text-sm font-medium mb-1.5">Font Color</label>
          <ColorPicker
            key={`text-color-picker-${selectedNodeId}`}
            defaultValue={textStyle.textColor}
            onValueChange={(newColor) =>
              updateTextStyle(node.id, { textColor: newColor })
            }
            format="hex"
          >
            <ColorPickerTrigger asChild>
              <Button
                variant="outline"
                className="flex items-center justify-between gap-2 w-full min-h-fit p-2"
              >
                <ColorPickerSwatch className="size-6" />
                <span className="text-sm">{textStyle.textColor}</span>
              </Button>
            </ColorPickerTrigger>
            <ColorPickerContent>
              <ColorPickerArea />
              <div className="flex items-center gap-2">
                <ColorPickerEyeDropper />
                <div className="flex flex-1 flex-col gap-2">
                  <ColorPickerHueSlider />
                  <ColorPickerAlphaSlider />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ColorPickerFormatSelect />
                <ColorPickerInput />
              </div>
            </ColorPickerContent>
          </ColorPicker>
        </div>
      </CardContent>
    </Card>
  );
}
