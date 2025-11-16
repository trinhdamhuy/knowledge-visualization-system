import { useDiagramStore } from "../_stores/use-diagram-store";
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
  const { selectedNodeId, nodes, setNodeColor, setNodeShape } =
    useDiagramStore();
  if (!selectedNodeId) return null;
  const node = nodes.find((n) => n.id === selectedNodeId);
  if (!node) return null;

  const shape = (node.data.shape as string) || "rectangle";
  const color = (node.data.color as string) || "#FF97A7";

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
              setNodeShape(node.id, value as "rectangle" | "circle")
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a shape" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rectangle">Rectangle</SelectItem>
              <SelectItem value="circle">Circle</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Color</label>
          <ColorPicker
            value={color}
            onChange={(colorValue) =>
              setNodeColor(node.id, colorValue as unknown as string)
            }
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
