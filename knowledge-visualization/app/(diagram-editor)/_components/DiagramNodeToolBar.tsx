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

export function DiagramNodeToolBar() {
  const { nodes, updateNodeData } = useDiagramSync();
  const { selectedNodeId } = useDiagramStore();

  const node = selectedNodeId ? nodes.find((n) => n.id === selectedNodeId) : null;

  const shape = (node?.data?.shape as string) || "rectangle";
  const color = (node?.data?.color as string) || "#FF97A7";
  const nodeWidth = (node?.width as number) || 150;
  const nodeHeight = (node?.height as number) || 50;

  type ShapeType = "rectangle" | "square" | "circle" | "diamond";

  const setNodeShape = useCallback((nodeId: string, newShape: ShapeType) => {
    // Shapes that need equal width/height (aspect ratio 1:1)
    const squareShapes = ["square", "circle", "diamond"];
    const currentIsSquare = squareShapes.includes(shape);
    const newIsSquare = squareShapes.includes(newShape);

    if (newIsSquare) {
      // If current shape is already square, keep the size
      // Otherwise use the smaller dimension to avoid enlargement
      const size = currentIsSquare
        ? Math.min(nodeWidth, nodeHeight)
        : Math.min(Math.max(nodeWidth, nodeHeight), 100);
      updateNodeData(nodeId, { shape: newShape }, { width: size, height: size });
    } else {
      // Rectangle - keep current dimensions or use reasonable default
      const newWidth = currentIsSquare ? 150 : nodeWidth;
      const newHeight = currentIsSquare ? 50 : nodeHeight;
      updateNodeData(nodeId, { shape: newShape }, { width: newWidth, height: newHeight });
    }
  }, [shape, nodeWidth, nodeHeight, updateNodeData]);

  const setNodeColor = useCallback((nodeId: string, newColor: string) => {
    updateNodeData(nodeId, { color: newColor }, undefined);
  }, [updateNodeData]);
  
  if (!selectedNodeId || !node) return null;

  return (
    <Card className="fixed right-6 top-[10%] z-999 min-w-2xs">
      <CardHeader>
        <CardTitle>Node Properties</CardTitle>
        <CardDescription>
          Edit the properties of the selected node.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">Shape</label>
          <Select
            value={shape}
            onValueChange={(value) =>
              setNodeShape(node.id, value as ShapeType)
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a shape" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rectangle">Rectangle</SelectItem>
              <SelectItem value="square">Square</SelectItem>
              <SelectItem value="circle">Circle</SelectItem>
              <SelectItem value="diamond">Diamond</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Color</label>
          <ColorPicker
            key={`color-picker-${selectedNodeId}`}
            defaultValue={color}
            onValueChange={(newColor) => setNodeColor(node.id, newColor)}
            format="hex"
          >
            <ColorPickerTrigger asChild>
              <Button
                variant="outline"
                className="flex items-center justify-between gap-2 w-full min-h-fit p-2"
              >
                <ColorPickerSwatch className="size-6" />
                <span className="text-sm">{color}</span>
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
