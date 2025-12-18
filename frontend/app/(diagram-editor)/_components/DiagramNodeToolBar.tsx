import { useCallback, useMemo } from "react";
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

// Helper type to represent style values that can be the same or mixed
type StyleValue<T> = T | "mixed";

interface NodeStyle {
  fontFamily: StyleValue<string>;
  fontSize: StyleValue<number>;
  fontWeight: StyleValue<string>;
  fontStyle: StyleValue<string>;
  textDecoration: StyleValue<string>;
  textAlign: StyleValue<string>;
  textColor: StyleValue<string>;
  shape: StyleValue<string>;
  color: StyleValue<string>;
}

export function DiagramNodeToolBar() {
  const { nodes, updateNodeData } = useDiagramSync();
  const { selectedNodeIds } = useDiagramStore();

  // Get selected nodes
  const selectedNodes = useMemo(
    () => nodes.filter((n) => selectedNodeIds.includes(n.id)),
    [nodes, selectedNodeIds]
  );

  // Helper to get unified or mixed value for a style key
  const getStyleValue = <T,>(key: string, defaultValue: T): StyleValue<T> => {
    if (selectedNodes.length === 0) return defaultValue;
    const values: T[] = [];
    for (const node of selectedNodes) {
      const value = (node.data?.[key] as T) || defaultValue;
      values.push(value);
    }
    const firstValue = values[0];
    const allSame = values.every((v) => v === firstValue);
    return allSame ? firstValue : ("mixed" as StyleValue<T>);
  };

  // Unified style for all selected nodes
  const unifiedStyle: NodeStyle = {
    fontFamily: getStyleValue("fontFamily", "Inter"),
    fontSize: getStyleValue("fontSize", 14),
    fontWeight: getStyleValue("fontWeight", "normal"),
    fontStyle: getStyleValue("fontStyle", "normal"),
    textDecoration: getStyleValue("textDecoration", "none"),
    textAlign: getStyleValue("textAlign", "center"),
    textColor: getStyleValue("textColor", "#000000"),
    shape: getStyleValue("shape", "rectangle"),
    color: getStyleValue("color", "#FF97A7"),
  };

  // Update style for all selected nodes
  const updateSelectedNodesStyle = useCallback(
    (styleUpdate: Record<string, unknown>) => {
      selectedNodeIds.forEach((nodeId) => {
        updateNodeData(nodeId, styleUpdate, undefined);
      });
    },
    [selectedNodeIds, updateNodeData]
  );

  // Update shape for all selected nodes
  const setNodesShape = useCallback(
    (newShape: string) => {
      const squareShapes = ["square", "circle", "diamond"];
      selectedNodeIds.forEach((nodeId) => {
        const node = nodes.find((n) => n.id === nodeId);
        if (!node) return;
        const currentShape = (node.data?.shape as string) || "rectangle";
        const currentWidth = (node.width as number) || 150;
        const currentHeight = (node.height as number) || 50;
        const currentIsSquare = squareShapes.includes(currentShape);
        const newIsSquare = squareShapes.includes(newShape);
        if (newIsSquare) {
          const size = currentIsSquare
            ? Math.min(currentWidth, currentHeight)
            : Math.min(Math.max(currentWidth, currentHeight), 100);
          updateNodeData(
            nodeId,
            { shape: newShape },
            { width: size, height: size }
          );
        } else {
          const newWidth = currentIsSquare ? 150 : currentWidth;
          const newHeight = currentIsSquare ? 50 : currentHeight;
          updateNodeData(
            nodeId,
            { shape: newShape },
            { width: newWidth, height: newHeight }
          );
        }
      });
    },
    [selectedNodeIds, nodes, updateNodeData]
  );

  if (selectedNodes.length === 0) return null;

  // Prevent blur when interacting with toolbar
  const preventBlur = (e: React.MouseEvent | React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const isMixed = (value: StyleValue<number | string>) => value === "mixed";

  return (
    <Card
      data-text-toolbar
      className="fixed right-6 top-[10%] z-10 min-w-[320px] max-h-[90vh] overflow-y-auto"
      onMouseDown={preventBlur}
      onPointerDown={preventBlur}
    >
      <CardHeader className="pb-3">
        <CardTitle>
          {selectedNodes.length === 1
            ? "Node Properties"
            : `Properties (${selectedNodes.length} nodes)`}
        </CardTitle>
        <CardDescription>
          {selectedNodes.length === 1
            ? "Edit the properties of the selected node."
            : "Edit the properties of the selected nodes."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Node Section */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Node</h3>

          {/* Shape */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Shape</label>
            <Select
              value={
                isMixed(unifiedStyle.shape)
                  ? ""
                  : (unifiedStyle.shape as string)
              }
              onValueChange={setNodesShape}
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={
                    isMixed(unifiedStyle.shape)
                      ? "Mixed shapes"
                      : "Select a shape"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rectangle">Rectangle</SelectItem>
                <SelectItem value="square">Square</SelectItem>
                <SelectItem value="circle">Circle</SelectItem>
                <SelectItem value="diamond">Diamond</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Color</label>
            <ColorPicker
              key={`color-picker-${selectedNodeIds.join(",")}`}
              defaultValue={
                isMixed(unifiedStyle.color)
                  ? "#FF97A7"
                  : (unifiedStyle.color as string)
              }
              onValueChange={(newColor) =>
                updateSelectedNodesStyle({ color: newColor })
              }
              format="hex"
            >
              <ColorPickerTrigger asChild>
                <Button
                  variant="outline"
                  className="flex items-center justify-between gap-2 w-full min-h-fit p-2"
                >
                  <ColorPickerSwatch className="size-6" />
                  <span className="text-sm">
                    {isMixed(unifiedStyle.color) ? "Mixed" : unifiedStyle.color}
                  </span>
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
        </div>

        <Separator />

        {/* Text Section */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Text</h3>

          {/* Font Family */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Font</label>
            <Select
              value={
                isMixed(unifiedStyle.fontFamily)
                  ? ""
                  : (unifiedStyle.fontFamily as string)
              }
              onValueChange={(value) =>
                updateSelectedNodesStyle({ fontFamily: value })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={
                    isMixed(unifiedStyle.fontFamily)
                      ? "Mixed fonts"
                      : "Select font"
                  }
                />
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
            <Select
              value={
                isMixed(unifiedStyle.fontSize)
                  ? ""
                  : String(unifiedStyle.fontSize)
              }
              onValueChange={(value) =>
                updateSelectedNodesStyle({ fontSize: Number(value) })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={
                    isMixed(unifiedStyle.fontSize) ? "Mixed sizes" : "Size"
                  }
                />
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

          {/* Text Formatting */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Format</label>
            <div className="flex items-center gap-1 flex-wrap">
              <Toggle
                size="sm"
                className={
                  isMixed(unifiedStyle.fontWeight)
                    ? "bg-slate-300 dark:bg-slate-600"
                    : unifiedStyle.fontWeight === "bold"
                    ? "bg-slate-200 dark:bg-slate-700"
                    : ""
                }
                isSelected={unifiedStyle.fontWeight === "bold"}
                onChange={(isSelected: boolean) =>
                  updateSelectedNodesStyle({
                    fontWeight: isSelected ? "bold" : "normal",
                  })
                }
                aria-label="Bold"
              >
                <Bold className="h-4 w-4" />
              </Toggle>
              <Toggle
                size="sm"
                className={
                  isMixed(unifiedStyle.fontStyle)
                    ? "bg-slate-300 dark:bg-slate-600"
                    : unifiedStyle.fontStyle === "italic"
                    ? "bg-slate-200 dark:bg-slate-700"
                    : ""
                }
                isSelected={unifiedStyle.fontStyle === "italic"}
                onChange={(isSelected: boolean) =>
                  updateSelectedNodesStyle({
                    fontStyle: isSelected ? "italic" : "normal",
                  })
                }
                aria-label="Italic"
              >
                <Italic className="h-4 w-4" />
              </Toggle>
              <Toggle
                size="sm"
                className={
                  isMixed(unifiedStyle.textDecoration) ||
                  unifiedStyle.textDecoration === "underline"
                    ? unifiedStyle.textDecoration === "underline"
                      ? "bg-slate-200 dark:bg-slate-700"
                      : "bg-slate-300 dark:bg-slate-600"
                    : ""
                }
                isSelected={unifiedStyle.textDecoration === "underline"}
                onChange={(isSelected: boolean) =>
                  updateSelectedNodesStyle({
                    textDecoration: isSelected ? "underline" : "none",
                  })
                }
                aria-label="Underline"
              >
                <Underline className="h-4 w-4" />
              </Toggle>
              <Toggle
                size="sm"
                className={
                  isMixed(unifiedStyle.textDecoration) ||
                  unifiedStyle.textDecoration === "line-through"
                    ? unifiedStyle.textDecoration === "line-through"
                      ? "bg-slate-200 dark:bg-slate-700"
                      : "bg-slate-300 dark:bg-slate-600"
                    : ""
                }
                isSelected={unifiedStyle.textDecoration === "line-through"}
                onChange={(isSelected: boolean) =>
                  updateSelectedNodesStyle({
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
            <label className="block text-sm font-medium mb-1.5">
              Alignment
            </label>
            <div className="flex items-center gap-1 flex-wrap">
              <Toggle
                size="sm"
                className={
                  isMixed(unifiedStyle.textAlign)
                    ? "bg-slate-300 dark:bg-slate-600"
                    : unifiedStyle.textAlign === "left"
                    ? "bg-slate-200 dark:bg-slate-700"
                    : ""
                }
                isSelected={unifiedStyle.textAlign === "left"}
                onChange={() => updateSelectedNodesStyle({ textAlign: "left" })}
                aria-label="Align left"
              >
                <AlignLeft className="h-4 w-4" />
              </Toggle>
              <Toggle
                size="sm"
                className={
                  isMixed(unifiedStyle.textAlign)
                    ? "bg-slate-300 dark:bg-slate-600"
                    : unifiedStyle.textAlign === "center"
                    ? "bg-slate-200 dark:bg-slate-700"
                    : ""
                }
                isSelected={unifiedStyle.textAlign === "center"}
                onChange={() =>
                  updateSelectedNodesStyle({ textAlign: "center" })
                }
                aria-label="Align center"
              >
                <AlignCenter className="h-4 w-4" />
              </Toggle>
              <Toggle
                size="sm"
                className={
                  isMixed(unifiedStyle.textAlign)
                    ? "bg-slate-300 dark:bg-slate-600"
                    : unifiedStyle.textAlign === "right"
                    ? "bg-slate-200 dark:bg-slate-700"
                    : ""
                }
                isSelected={unifiedStyle.textAlign === "right"}
                onChange={() =>
                  updateSelectedNodesStyle({ textAlign: "right" })
                }
                aria-label="Align right"
              >
                <AlignRight className="h-4 w-4" />
              </Toggle>
              <Toggle
                size="sm"
                className={
                  isMixed(unifiedStyle.textAlign)
                    ? "bg-slate-300 dark:bg-slate-600"
                    : unifiedStyle.textAlign === "justify"
                    ? "bg-slate-200 dark:bg-slate-700"
                    : ""
                }
                isSelected={unifiedStyle.textAlign === "justify"}
                onChange={() =>
                  updateSelectedNodesStyle({ textAlign: "justify" })
                }
                aria-label="Justify"
              >
                <AlignJustify className="h-4 w-4" />
              </Toggle>
            </div>
          </div>

          {/* Font Color */}
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Font Color
            </label>
            <ColorPicker
              key={`text-color-picker-${selectedNodeIds.join(",")}`}
              defaultValue={
                isMixed(unifiedStyle.textColor)
                  ? "#000000"
                  : (unifiedStyle.textColor as string)
              }
              onValueChange={(newColor) =>
                updateSelectedNodesStyle({ textColor: newColor })
              }
              format="hex"
            >
              <ColorPickerTrigger asChild>
                <Button
                  variant="outline"
                  className="flex items-center justify-between gap-2 w-full min-h-fit p-2"
                >
                  <ColorPickerSwatch className="size-6" />
                  <span className="text-sm">
                    {isMixed(unifiedStyle.textColor)
                      ? "Mixed"
                      : unifiedStyle.textColor}
                  </span>
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
        </div>
      </CardContent>
    </Card>
  );
}
