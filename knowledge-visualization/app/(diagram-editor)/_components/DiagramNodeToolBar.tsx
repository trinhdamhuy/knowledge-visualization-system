import { useDiagramStore } from "../_store/use-diagram-store";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

export function DiagramNodeToolBar() {
  const { selectedNodeId, nodes, setNodeColor, setNodeShape } =
    useDiagramStore();
  if (!selectedNodeId) return null;
  const node = nodes.find((n) => n.id === selectedNodeId);
  if (!node) return null;

  const shape = (node.data.shape as string) || "rectangle";
  const color = (node.data.color as string) || "#FF97A7";

  const presetColors = [
    "#FF97A7",
    "#A78BFA",
    "#60A5FA",
    "#34D399",
    "#FBBF24",
    "#F87171",
    "#FB923C",
    "#FDE047",
    "#86EFAC",
    "#67E8F9",
    "#C084FC",
    "#F472B6",
    "#FB7185",
    "#94A3B8",
    "#64748B",
  ];

  return (
    <div className="fixed right-6 top-[20%] z-[1000] bg-background border rounded-xl shadow-lg min-w-[220px] p-4">
      <div className="mb-3">
        <label className="block text-sm font-medium mb-1.5">
          Shape
        </label>
        <select
          value={shape}
          onChange={(e) =>
            setNodeShape(node.id, e.target.value as "rectangle" | "circle")
          }
          className="w-full px-3 py-2 text-sm rounded-md border bg-background outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="rectangle">Rectangle</option>
          <option value="circle">Circle</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1.5">
          Color
        </label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-start gap-2">
              <div
                style={{
                  width: "20px",
                  height: "20px",
                  borderRadius: "4px",
                  backgroundColor: color,
                  border: "1px solid #ddd",
                }}
              />
              <span className="text-sm">{color}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3">
            <div className="space-y-3">
              <div className="grid grid-cols-5 gap-2">
                {presetColors.map((presetColor) => (
                  <button
                    key={presetColor}
                    onClick={() => setNodeColor(node.id, presetColor)}
                    className="w-10 h-10 rounded-md border-2 hover:scale-110 transition-transform"
                    style={{
                      backgroundColor: presetColor,
                      borderColor: color === presetColor ? "#000" : "#ddd",
                    }}
                    title={presetColor}
                  />
                ))}
              </div>
              <div className="pt-2 border-t">
                <label className="text-xs text-muted-foreground mb-1 block">
                  Custom color
                </label>
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setNodeColor(node.id, e.target.value)}
                  className="w-full h-10 rounded-md border cursor-pointer bg-background"
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
