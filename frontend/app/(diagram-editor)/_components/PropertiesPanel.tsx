import { useCallback, useMemo, useState } from "react";
import { useDiagramStore } from "../_stores/use-diagram-store";
import { useDiagramSync } from "@/hooks/use-diagram-sync";
import { useTheme } from "next-themes";
import type { Edge } from "@xyflow/react";
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
import { Panel } from "@xyflow/react";
import { CustomColorPicker } from "./CustomColorPicker";
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
  Layout,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AvatarGroup,
  AvatarGroupTooltip,
} from "@/components/animate-ui/components/animate/avatar-group";
import { useOthers, useSelf } from "@liveblocks/react/suspense";
import { ThemeToggle } from "@/app/_components/buttons/theme-toggle";
import ZoomSelect from "@/components/zoom-select";
import { ButtonGroup } from "@/components/ui/button-group";
import { useChatPanelStore } from "../_stores/use-chat-panel-store";
import { LayoutGrid } from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";

const MAX_SHOWN_USERS = 3;

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

interface EdgeStyle {
  type: StyleValue<string>;
  stroke: StyleValue<string>;
  strokeWidth: StyleValue<string>;
  animated: StyleValue<boolean>;
}

// Get card background color hex based on theme
// Light mode: oklch(1 0 0) = white = #ffffff
// Dark mode: oklch(0.21 0.006 285.885) ≈ #353535 (dark gray)
function getCardColorHex(theme: string | undefined): string {
  if (theme === "dark") {
    return "#353535"; // Approximate hex for oklch(0.21 0.006 285.885)
  }
  return "#ffffff"; // White for light mode
}

export function PropertiesPanel() {
  const { nodes, edges, updateNodeData, updateEdgeData } = useDiagramSync();
  const { selectedObjectIds } = useDiagramStore();
  const { resolvedTheme } = useTheme();
  const { displayMode, setDisplayMode } = useChatPanelStore();

  // State to track expanded color pickers
  const [expandedColors, setExpandedColors] = useState({
    nodeColor: false,
    textColor: false,
    edgeColor: false,
  });

  // State to track expanded properties
  const [expandedProperties, setExpandedProperties] = useState({
    shape: false,
    fontFamily: false,
    fontSize: false,
    edgeType: false,
    edgeWidth: false,
  });

  const users = useOthers();
  const currentUser = useSelf();
  const allUsers = [...users, currentUser];
  const hasMoreUsers = allUsers.length > MAX_SHOWN_USERS;

  // Get selected nodes
  const selectedNodes = useMemo(
    () => nodes.filter((n) => selectedObjectIds.nodeIds.includes(n.id)),
    [nodes, selectedObjectIds.nodeIds]
  );

  // Get selected edges
  const selectedEdges = useMemo(
    () => edges.filter((e) => selectedObjectIds.edgeIds.includes(e.id)),
    [edges, selectedObjectIds.edgeIds]
  );

  // Helper function to group nodes by color
  const groupNodesByColor = useCallback(
    (colorKey: "color" | "textColor") => {
      const groups = new Map<string, string[]>();
      selectedNodes.forEach((node) => {
        let color: string;
        if (colorKey === "color") {
          color = (node.data?.color as string) || "var(--card)";
        } else {
          color = (node.data?.textColor as string) || "#000000";
        }
        if (!groups.has(color)) {
          groups.set(color, []);
        }
        groups.get(color)!.push(node.id);
      });
      return Array.from(groups.entries()).map(([color, ids]) => ({
        color,
        ids,
      }));
    },
    [selectedNodes]
  );

  // Helper function to group edges by color
  const groupEdgesByColor = useCallback(() => {
    const groups = new Map<string, string[]>();
    selectedEdges.forEach((edge) => {
      const color =
        ((edge.style as Record<string, string>)?.stroke as string) || "#b1b1b7";
      if (!groups.has(color)) {
        groups.set(color, []);
      }
      groups.get(color)!.push(edge.id);
    });
    return Array.from(groups.entries()).map(([color, ids]) => ({
      color,
      ids,
    }));
  }, [selectedEdges]);

  // Helper function to group nodes by shape
  const groupNodesByShape = useCallback(() => {
    const groups = new Map<string, string[]>();
    selectedNodes.forEach((node) => {
      const shape = (node.data?.shape as string) || "rectangle";
      if (!groups.has(shape)) {
        groups.set(shape, []);
      }
      groups.get(shape)!.push(node.id);
    });
    return Array.from(groups.entries()).map(([shape, ids]) => ({
      shape,
      ids,
    }));
  }, [selectedNodes]);

  // Helper function to group nodes by font family
  const groupNodesByFontFamily = useCallback(() => {
    const groups = new Map<string, string[]>();
    selectedNodes.forEach((node) => {
      const fontFamily = (node.data?.fontFamily as string) || "Inter";
      if (!groups.has(fontFamily)) {
        groups.set(fontFamily, []);
      }
      groups.get(fontFamily)!.push(node.id);
    });
    return Array.from(groups.entries()).map(([fontFamily, ids]) => ({
      fontFamily,
      ids,
    }));
  }, [selectedNodes]);

  // Helper function to group nodes by font size
  const groupNodesByFontSize = useCallback(() => {
    const groups = new Map<string, string[]>();
    selectedNodes.forEach((node) => {
      const fontSize = String((node.data?.fontSize as number) || 14);
      if (!groups.has(fontSize)) {
        groups.set(fontSize, []);
      }
      groups.get(fontSize)!.push(node.id);
    });
    return Array.from(groups.entries()).map(([fontSize, ids]) => ({
      fontSize,
      ids,
    }));
  }, [selectedNodes]);

  // Helper function to group edges by type
  const groupEdgesByType = useCallback(() => {
    const groups = new Map<string, string[]>();
    selectedEdges.forEach((edge) => {
      const type = (edge.type as string) || "smoothstep";
      if (!groups.has(type)) {
        groups.set(type, []);
      }
      groups.get(type)!.push(edge.id);
    });
    return Array.from(groups.entries()).map(([type, ids]) => ({
      type,
      ids,
    }));
  }, [selectedEdges]);

  // Helper function to group edges by width
  const groupEdgesByWidth = useCallback(() => {
    const groups = new Map<string, string[]>();
    selectedEdges.forEach((edge) => {
      const width =
        String(
          ((edge.style as Record<string, string>)?.strokeWidth as string) || "1"
        ) || "1";
      if (!groups.has(width)) {
        groups.set(width, []);
      }
      groups.get(width)!.push(edge.id);
    });
    return Array.from(groups.entries()).map(([width, ids]) => ({
      width,
      ids,
    }));
  }, [selectedEdges]);

  // Unified style for all selected nodes - memoized to update when selectedNodes change
  const unifiedStyle: NodeStyle = useMemo(() => {
    if (selectedNodes.length === 0) {
      return {
        fontFamily: "Inter",
        fontSize: 14,
        fontWeight: "normal",
        fontStyle: "normal",
        textDecoration: "none",
        textAlign: "center",
        textColor: "#000000",
        shape: "rectangle",
        color: "var(--card)", // Use CSS variable for card background
      };
    }

    // Helper function inside useMemo to access selectedNodes
    const getValue = <T,>(key: string, defaultValue: T): StyleValue<T> => {
      const values: T[] = [];
      for (const node of selectedNodes) {
        const value = (node.data?.[key] as T) ?? defaultValue;
        values.push(value);
      }
      const firstValue = values[0];
      const allSame = values.every((v) => v === firstValue);
      return allSame ? firstValue : ("mixed" as StyleValue<T>);
    };

    // For color, if node doesn't have color in data, it uses var(--card) in CustomNode
    const getColorValue = (): StyleValue<string> => {
      const values: string[] = [];
      for (const node of selectedNodes) {
        // If node has color in data, use it; otherwise it's using var(--card)
        const value = (node.data?.color as string) || "var(--card)";
        values.push(value);
      }
      const firstValue = values[0];
      const allSame = values.every((v) => v === firstValue);
      return allSame ? firstValue : ("mixed" as StyleValue<string>);
    };

    return {
      fontFamily: getValue("fontFamily", "Inter"),
      fontSize: getValue("fontSize", 14),
      fontWeight: getValue("fontWeight", "normal"),
      fontStyle: getValue("fontStyle", "normal"),
      textDecoration: getValue("textDecoration", "none"),
      textAlign: getValue("textAlign", "center"),
      textColor: getValue("textColor", "#000000"),
      shape: getValue("shape", "rectangle"),
      color: getColorValue(),
    };
  }, [selectedNodes]);

  // Update style for all selected nodes
  const updateSelectedNodesStyle = useCallback(
    (styleUpdate: Record<string, unknown>) => {
      selectedObjectIds.nodeIds.forEach((nodeId) => {
        updateNodeData(nodeId, styleUpdate, undefined);
      });
    },
    [selectedObjectIds.nodeIds, updateNodeData]
  );

  // Update shape for all selected nodes
  const setNodesShape = useCallback(
    (newShape: string) => {
      const squareShapes = ["square", "circle", "diamond"];
      selectedObjectIds.nodeIds.forEach((nodeId) => {
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
    [selectedObjectIds.nodeIds, nodes, updateNodeData]
  );

  // Unified style for selected edges
  const unifiedEdgeStyle: EdgeStyle = useMemo(() => {
    if (selectedEdges.length === 0) {
      return {
        type: "smoothstep",
        stroke: "#b1b1b7",
        strokeWidth: "1",
        animated: false,
      };
    }

    const getValue = <T,>(key: string, defaultValue: T): StyleValue<T> => {
      const values: T[] = [];
      for (const edge of selectedEdges) {
        let value: T;
        if (key === "stroke") {
          value =
            ((edge.style as Record<string, string>)?.stroke as T) ??
            defaultValue;
        } else if (key === "strokeWidth") {
          value =
            ((edge.style as Record<string, string>)?.strokeWidth as T) ??
            defaultValue;
        } else if (key === "type") {
          value = (edge.type as T) ?? defaultValue;
        } else if (key === "animated") {
          value = (edge.animated as T) ?? defaultValue;
        } else {
          value = defaultValue;
        }
        values.push(value);
      }
      const firstValue = values[0];
      const allSame = values.every((v) => v === firstValue);
      return allSame ? firstValue : ("mixed" as StyleValue<T>);
    };

    return {
      type: getValue("type", "smoothstep"),
      stroke: getValue("stroke", "#b1b1b7"),
      strokeWidth: getValue("strokeWidth", "1"),
      animated: getValue("animated", false),
    };
  }, [selectedEdges]);

  // Update edge style for all selected edges
  const updateSelectedEdgesStyle = useCallback(
    (styleUpdate: Partial<Edge>) => {
      selectedObjectIds.edgeIds.forEach((edgeId) => {
        const edge = edges.find((e) => e.id === edgeId);
        if (!edge) return;

        // Prepare the update object
        const updatedEdge: Partial<Edge> = {};

        // Update type if provided
        if (styleUpdate.type !== undefined) {
          updatedEdge.type = styleUpdate.type;
        }

        // Update animated if provided
        if (styleUpdate.animated !== undefined) {
          updatedEdge.animated = styleUpdate.animated;
        }

        // Merge style updates
        if (styleUpdate.style) {
          updatedEdge.style = {
            ...(edge.style as Record<string, string>),
            ...(styleUpdate.style as Record<string, string>),
          };
        }

        updateEdgeData(edgeId, updatedEdge);
      });
    },
    [selectedObjectIds.edgeIds, edges, updateEdgeData]
  );

  // Prevent blur when interacting with toolbar
  const preventBlur = (e: React.MouseEvent | React.PointerEvent) => {
    e.stopPropagation();
  };

  const isMixed = (value: StyleValue<number | string | boolean>) =>
    value === "mixed";

  const hasSelectedNodesOrEdges =
    selectedNodes.length > 0 || selectedEdges.length > 0;

  return (
    <Panel position="top-right">
      <Card
        onMouseDown={preventBlur}
        onPointerDown={preventBlur}
        className={`min-w-72 ${
          hasSelectedNodesOrEdges ? "h-[97vh]" : "h-fit"
        } overflow-hidden py-3 gap-2`}
      >
        {/* Participants and settings */}
        <div className="flex items-center justify-between w-full gap-2 px-3">
          <AvatarGroup
            translate="0%"
            className="h-full"
            sideOffset={10}
            tooltipTransition={{ type: "tween", duration: 0.2 }}
          >
            {[
              ...allUsers
                .slice(0, MAX_SHOWN_USERS)
                .map(({ connectionId, info }) => (
                  <Avatar key={connectionId}>
                    <AvatarImage src={info?.avatar} />
                    <AvatarFallback className="text-xs font-medium">
                      {info?.name?.[0] || "U"}
                    </AvatarFallback>
                    <AvatarGroupTooltip>
                      <p>{info?.name}</p>
                    </AvatarGroupTooltip>
                  </Avatar>
                )),
              ...(hasMoreUsers
                ? [
                    <Avatar key="more-users" className="h-8 w-8 border-2">
                      <AvatarFallback className="text-xs font-medium">
                        +{allUsers.length - MAX_SHOWN_USERS}
                      </AvatarFallback>
                      <AvatarGroupTooltip>
                        <div className="space-y-2">
                          {allUsers
                            .slice(MAX_SHOWN_USERS)
                            .map(({ connectionId, info }) => (
                              <div
                                key={connectionId}
                                className="flex items-center gap-2"
                              >
                                <Avatar className="size-6">
                                  <AvatarImage src={info?.avatar} />
                                  <AvatarFallback className="text-xs">
                                    {info?.name?.[0] || "U"}
                                  </AvatarFallback>
                                </Avatar>
                                <p className="text-sm">
                                  {info?.name || "Unknown"}
                                </p>
                              </div>
                            ))}
                        </div>
                      </AvatarGroupTooltip>
                    </Avatar>,
                  ]
                : []),
            ]}
          </AvatarGroup>

          <CardDescription className="font-medium flex items-center gap-2">
            <ButtonGroup>
              <ZoomSelect />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      setDisplayMode(
                        displayMode === "docked" ? "sidebar" : "docked"
                      )
                    }
                  >
                    {displayMode === "docked" ? <LayoutGrid /> : <Layout />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {displayMode === "docked"
                      ? "Switch to Sidebar mode"
                      : "Switch to Docked mode"}
                  </p>
                </TooltipContent>
              </Tooltip>
              <ThemeToggle variant="outline" size="icon" />
            </ButtonGroup>
          </CardDescription>
        </div>

        {hasSelectedNodesOrEdges && (
          <ScrollArea className="h-[90vh]" data-text-toolbar>
            <CardHeader className="px-2 pb-2">
              <CardTitle>Properties</CardTitle>
              <CardDescription>
                Edit the properties of the selected node or edge.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-3 space-y-4">
              {/* Node Section - Only show when nodes are selected */}
              {selectedNodes.length > 0 && (
                <>
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold">Node</h3>

                    {/* Shape */}
                    <div className="px-2 space-y-2">
                      <label className="block text-xs text-muted-foreground mb-1.5">
                        Shape
                      </label>
                      <Select
                        value={
                          isMixed(unifiedStyle.shape)
                            ? ""
                            : (unifiedStyle.shape as string)
                        }
                        onValueChange={setNodesShape}
                      >
                        <SelectTrigger className="w-full" size="sm">
                          <SelectValue
                            placeholder={
                              isMixed(unifiedStyle.shape)
                                ? "Mixed shapes"
                                : "Select a shape"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {[
                            { value: "rectangle", label: "Rectangle" },
                            { value: "square", label: "Square" },
                            { value: "circle", label: "Circle" },
                            { value: "diamond", label: "Diamond" },
                          ].map(({ value, label }) => (
                            <SelectItem
                              key={value}
                              value={value}
                              className="text-xs"
                            >
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {isMixed(unifiedStyle.shape) && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full"
                            onClick={() =>
                              setExpandedProperties((prev) => ({
                                ...prev,
                                shape: !prev.shape,
                              }))
                            }
                          >
                            {expandedProperties.shape ? (
                              <>
                                <ChevronUp className="h-3.5 w-3.5" />
                                Hide individual shapes
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-3.5 w-3.5" />
                                Show individual shapes
                              </>
                            )}
                          </Button>
                          {expandedProperties.shape && (
                            <div className="space-y-2 pl-2 border-l-2 border-border">
                              {groupNodesByShape().map((group) => (
                                <Select
                                  key={`shape-group-${group.shape}`}
                                  value={group.shape}
                                  onValueChange={(newShape) => {
                                    group.ids.forEach((nodeId) => {
                                      const node = nodes.find(
                                        (n) => n.id === nodeId
                                      );
                                      if (!node) return;
                                      const currentShape =
                                        (node.data?.shape as string) ||
                                        "rectangle";
                                      const currentWidth =
                                        (node.width as number) || 150;
                                      const currentHeight =
                                        (node.height as number) || 50;
                                      const squareShapes = [
                                        "square",
                                        "circle",
                                        "diamond",
                                      ];
                                      const currentIsSquare =
                                        squareShapes.includes(currentShape);
                                      const newIsSquare =
                                        squareShapes.includes(newShape);
                                      if (newIsSquare) {
                                        const size = currentIsSquare
                                          ? Math.min(
                                              currentWidth,
                                              currentHeight
                                            )
                                          : Math.min(
                                              Math.max(
                                                currentWidth,
                                                currentHeight
                                              ),
                                              100
                                            );
                                        updateNodeData(
                                          nodeId,
                                          { shape: newShape },
                                          { width: size, height: size }
                                        );
                                      } else {
                                        const newWidth = currentIsSquare
                                          ? 150
                                          : currentWidth;
                                        const newHeight = currentIsSquare
                                          ? 50
                                          : currentHeight;
                                        updateNodeData(
                                          nodeId,
                                          { shape: newShape },
                                          { width: newWidth, height: newHeight }
                                        );
                                      }
                                    });
                                  }}
                                >
                                  <SelectTrigger className="w-full" size="sm">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {[
                                      {
                                        value: "rectangle",
                                        label: "Rectangle",
                                      },
                                      { value: "square", label: "Square" },
                                      { value: "circle", label: "Circle" },
                                      { value: "diamond", label: "Diamond" },
                                    ].map(({ value, label }) => (
                                      <SelectItem
                                        key={value}
                                        value={value}
                                        className="text-xs"
                                      >
                                        {label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Color */}
                    <div className="px-2 space-y-2">
                      <label className="block text-xs text-muted-foreground mb-1.5">
                        Color
                      </label>
                      <CustomColorPicker
                        pickerKey={`color-picker-${selectedObjectIds.nodeIds.join(
                          ","
                        )}`}
                        defaultValue={
                          isMixed(unifiedStyle.color)
                            ? getCardColorHex(resolvedTheme)
                            : unifiedStyle.color === "var(--card)"
                            ? getCardColorHex(resolvedTheme)
                            : (unifiedStyle.color as string)
                        }
                        onValueChange={(newColor) =>
                          updateSelectedNodesStyle({ color: newColor })
                        }
                        displayValue={
                          isMixed(unifiedStyle.color)
                            ? "Mixed"
                            : unifiedStyle.color === "var(--card)"
                            ? "Default"
                            : unifiedStyle.color
                        }
                        format="hex"
                        size="sm"
                        className="max-w-70"
                      />
                      {isMixed(unifiedStyle.color) && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full"
                            onClick={() =>
                              setExpandedColors((prev) => ({
                                ...prev,
                                nodeColor: !prev.nodeColor,
                              }))
                            }
                          >
                            {expandedColors.nodeColor ? (
                              <>
                                <ChevronUp className="h-3.5 w-3.5" />
                                Hide individual colors
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-3.5 w-3.5" />
                                Show individual colors
                              </>
                            )}
                          </Button>
                          {expandedColors.nodeColor && (
                            <div className="space-y-2 pl-2 border-l-2 border-border">
                              {groupNodesByColor("color").map((group) => {
                                const displayColor =
                                  group.color === "var(--card)"
                                    ? getCardColorHex(resolvedTheme)
                                    : group.color;
                                return (
                                  <CustomColorPicker
                                    key={`node-color-group-${group.color}`}
                                    pickerKey={`node-color-group-${
                                      group.color
                                    }-${group.ids.join("-")}`}
                                    defaultValue={displayColor}
                                    onValueChange={(newColor) => {
                                      group.ids.forEach((nodeId) => {
                                        updateNodeData(
                                          nodeId,
                                          { color: newColor },
                                          undefined
                                        );
                                      });
                                    }}
                                    displayValue={
                                      group.color === "var(--card)"
                                        ? "Default"
                                        : group.color
                                    }
                                    format="hex"
                                    size="sm"
                                    className="max-w-70"
                                  />
                                );
                              })}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Text Section */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold">Text</h3>

                    {/* Font Family */}
                    <div className="px-2 space-y-2">
                      <label className="block text-xs text-muted-foreground mb-1.5">
                        Font
                      </label>
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
                        <SelectTrigger size="sm" className="w-full text-xs">
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
                              className="text-xs"
                            >
                              {font.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {isMixed(unifiedStyle.fontFamily) && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full"
                            onClick={() =>
                              setExpandedProperties((prev) => ({
                                ...prev,
                                fontFamily: !prev.fontFamily,
                              }))
                            }
                          >
                            {expandedProperties.fontFamily ? (
                              <>
                                <ChevronUp className="h-3.5 w-3.5" />
                                Hide individual fonts
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-3.5 w-3.5" />
                                Show individual fonts
                              </>
                            )}
                          </Button>
                          {expandedProperties.fontFamily && (
                            <div className="space-y-2 pl-2 border-l-2 border-border">
                              {groupNodesByFontFamily().map((group) => (
                                <Select
                                  key={`font-family-group-${group.fontFamily}`}
                                  value={group.fontFamily}
                                  onValueChange={(newFontFamily) => {
                                    group.ids.forEach((nodeId) => {
                                      updateNodeData(
                                        nodeId,
                                        { fontFamily: newFontFamily },
                                        undefined
                                      );
                                    });
                                  }}
                                >
                                  <SelectTrigger
                                    size="sm"
                                    className="w-full text-xs"
                                  >
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {FONT_FAMILIES.map((font) => (
                                      <SelectItem
                                        key={font.value}
                                        value={font.value}
                                        style={{ fontFamily: font.value }}
                                        className="text-xs"
                                      >
                                        {font.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Font Size */}
                    <div className="px-2 space-y-2">
                      <label className="block text-xs text-muted-foreground mb-1.5">
                        Size
                      </label>
                      <Select
                        value={
                          isMixed(unifiedStyle.fontSize)
                            ? ""
                            : String(unifiedStyle.fontSize)
                        }
                        onValueChange={(value) =>
                          updateSelectedNodesStyle({
                            fontSize: Number(value),
                          })
                        }
                      >
                        <SelectTrigger size="sm" className="w-full text-xs">
                          <SelectValue
                            placeholder={
                              isMixed(unifiedStyle.fontSize)
                                ? "Mixed sizes"
                                : "Size"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {FONT_SIZES.map((size) => (
                            <SelectItem
                              key={size}
                              value={String(size)}
                              className="text-xs"
                            >
                              {size}px
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {isMixed(unifiedStyle.fontSize) && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full"
                            onClick={() =>
                              setExpandedProperties((prev) => ({
                                ...prev,
                                fontSize: !prev.fontSize,
                              }))
                            }
                          >
                            {expandedProperties.fontSize ? (
                              <>
                                <ChevronUp className="h-3.5 w-3.5" />
                                Hide individual sizes
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-3.5 w-3.5" />
                                Show individual sizes
                              </>
                            )}
                          </Button>
                          {expandedProperties.fontSize && (
                            <div className="space-y-2 pl-2 border-l-2 border-border">
                              {groupNodesByFontSize().map((group) => (
                                <Select
                                  key={`font-size-group-${group.fontSize}`}
                                  value={group.fontSize}
                                  onValueChange={(newFontSize) => {
                                    group.ids.forEach((nodeId) => {
                                      updateNodeData(
                                        nodeId,
                                        { fontSize: Number(newFontSize) },
                                        undefined
                                      );
                                    });
                                  }}
                                >
                                  <SelectTrigger
                                    size="sm"
                                    className="w-full text-xs"
                                  >
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {FONT_SIZES.map((size) => (
                                      <SelectItem
                                        key={size}
                                        value={String(size)}
                                        className="text-xs"
                                      >
                                        {size}px
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Text Formatting */}
                    <div className="px-2">
                      <label className="block text-xs text-muted-foreground mb-1.5">
                        Format
                      </label>
                      <div className="flex items-center gap-1 flex-wrap">
                        <Toggle
                          size="sm"
                          pressed={unifiedStyle.fontWeight === "bold"}
                          onPressedChange={(pressed: boolean) =>
                            updateSelectedNodesStyle({
                              fontWeight: pressed ? "bold" : "normal",
                            })
                          }
                          aria-label="Bold"
                        >
                          <Bold className="h-3.5 w-3.5" />
                        </Toggle>
                        <Toggle
                          size="sm"
                          pressed={unifiedStyle.fontStyle === "italic"}
                          onPressedChange={(pressed: boolean) =>
                            updateSelectedNodesStyle({
                              fontStyle: pressed ? "italic" : "normal",
                            })
                          }
                          aria-label="Italic"
                        >
                          <Italic className="h-3.5 w-3.5" />
                        </Toggle>
                        <Toggle
                          size="sm"
                          pressed={unifiedStyle.textDecoration === "underline"}
                          onPressedChange={(pressed: boolean) =>
                            updateSelectedNodesStyle({
                              textDecoration: pressed ? "underline" : "none",
                            })
                          }
                          aria-label="Underline"
                        >
                          <Underline className="h-3.5 w-3.5" />
                        </Toggle>
                        <Toggle
                          size="sm"
                          pressed={
                            unifiedStyle.textDecoration === "line-through"
                          }
                          onPressedChange={(pressed: boolean) =>
                            updateSelectedNodesStyle({
                              textDecoration: pressed ? "line-through" : "none",
                            })
                          }
                          aria-label="Strikethrough"
                        >
                          <Strikethrough className="h-3.5 w-3.5" />
                        </Toggle>
                      </div>
                    </div>

                    {/* Text Alignment */}
                    <div className="px-2">
                      <label className="block text-xs text-muted-foreground mb-1.5">
                        Alignment
                      </label>
                      <div className="flex items-center gap-1 flex-wrap">
                        <Toggle
                          size="sm"
                          pressed={unifiedStyle.textAlign === "left"}
                          onPressedChange={() =>
                            updateSelectedNodesStyle({ textAlign: "left" })
                          }
                          aria-label="Align left"
                        >
                          <AlignLeft className="h-3.5 w-3.5" />
                        </Toggle>
                        <Toggle
                          size="sm"
                          pressed={unifiedStyle.textAlign === "center"}
                          onPressedChange={() =>
                            updateSelectedNodesStyle({ textAlign: "center" })
                          }
                          aria-label="Align center"
                        >
                          <AlignCenter className="h-3.5 w-3.5" />
                        </Toggle>
                        <Toggle
                          size="sm"
                          pressed={unifiedStyle.textAlign === "right"}
                          onPressedChange={() =>
                            updateSelectedNodesStyle({ textAlign: "right" })
                          }
                          aria-label="Align right"
                        >
                          <AlignRight className="h-3.5 w-3.5" />
                        </Toggle>
                        <Toggle
                          size="sm"
                          pressed={unifiedStyle.textAlign === "justify"}
                          onPressedChange={() =>
                            updateSelectedNodesStyle({ textAlign: "justify" })
                          }
                          aria-label="Justify"
                        >
                          <AlignJustify className="h-3.5 w-3.5" />
                        </Toggle>
                      </div>
                    </div>

                    {/* Font Color */}
                    <div className="px-2 space-y-2">
                      <label className="block text-xs text-muted-foreground mb-1.5">
                        Font Color
                      </label>
                      <CustomColorPicker
                        pickerKey={`text-color-picker-${selectedObjectIds.nodeIds.join(
                          ","
                        )}`}
                        defaultValue={
                          isMixed(unifiedStyle.textColor)
                            ? "#000000"
                            : (unifiedStyle.textColor as string)
                        }
                        onValueChange={(newColor) =>
                          updateSelectedNodesStyle({ textColor: newColor })
                        }
                        displayValue={
                          isMixed(unifiedStyle.textColor)
                            ? "Mixed"
                            : unifiedStyle.textColor
                        }
                        format="hex"
                        size="sm"
                        className="max-w-70"
                      />
                      {isMixed(unifiedStyle.textColor) && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full"
                            onClick={() =>
                              setExpandedColors((prev) => ({
                                ...prev,
                                textColor: !prev.textColor,
                              }))
                            }
                          >
                            {expandedColors.textColor ? (
                              <>
                                <ChevronUp className="h-3.5 w-3.5" />
                                Hide individual colors
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-3.5 w-3.5" />
                                Show individual colors
                              </>
                            )}
                          </Button>
                          {expandedColors.textColor && (
                            <div className="space-y-2 pl-2 border-l-2 border-border">
                              {groupNodesByColor("textColor").map((group) => {
                                return (
                                  <CustomColorPicker
                                    key={`text-color-group-${group.color}`}
                                    pickerKey={`text-color-group-${
                                      group.color
                                    }-${group.ids.join("-")}`}
                                    defaultValue={group.color}
                                    onValueChange={(newColor) => {
                                      group.ids.forEach((nodeId) => {
                                        updateNodeData(
                                          nodeId,
                                          { textColor: newColor },
                                          undefined
                                        );
                                      });
                                    }}
                                    displayValue={group.color}
                                    format="hex"
                                    size="sm"
                                    className="max-w-70"
                                  />
                                );
                              })}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Edge Section - Only show when edges are selected */}
              {selectedEdges.length > 0 && (
                <>
                  {selectedNodes.length > 0 && <Separator />}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold">Edge</h3>

                    {/* Edge Type */}
                    <div className="px-2 space-y-2">
                      <label className="block text-xs text-muted-foreground mb-1.5">
                        Type
                      </label>
                      <Select
                        value={
                          isMixed(unifiedEdgeStyle.type)
                            ? ""
                            : (unifiedEdgeStyle.type as string)
                        }
                        onValueChange={(value) =>
                          updateSelectedEdgesStyle({ type: value })
                        }
                      >
                        <SelectTrigger size="sm" className="w-full text-xs">
                          <SelectValue
                            placeholder={
                              isMixed(unifiedEdgeStyle.type)
                                ? "Mixed"
                                : "Select type"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {[
                            { value: "default", label: "Default" },
                            { value: "straight", label: "Straight" },
                            { value: "step", label: "Step" },
                            { value: "smoothstep", label: "Smoothstep" },
                            { value: "simplebezier", label: "Simple Bezier" },
                          ].map(({ value, label }) => (
                            <SelectItem
                              key={value}
                              value={value}
                              className="text-xs"
                            >
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {isMixed(unifiedEdgeStyle.type) && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full"
                            onClick={() =>
                              setExpandedProperties((prev) => ({
                                ...prev,
                                edgeType: !prev.edgeType,
                              }))
                            }
                          >
                            {expandedProperties.edgeType ? (
                              <>
                                <ChevronUp className="h-3.5 w-3.5" />
                                Hide individual types
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-3.5 w-3.5" />
                                Show individual types
                              </>
                            )}
                          </Button>
                          {expandedProperties.edgeType && (
                            <div className="space-y-2 pl-2 border-l-2 border-border">
                              {groupEdgesByType().map((group) => (
                                <Select
                                  key={`edge-type-group-${group.type}`}
                                  value={group.type}
                                  onValueChange={(newType) => {
                                    group.ids.forEach((edgeId) => {
                                      updateEdgeData(edgeId, { type: newType });
                                    });
                                  }}
                                >
                                  <SelectTrigger
                                    size="sm"
                                    className="w-full text-xs"
                                  >
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {[
                                      { value: "default", label: "Default" },
                                      { value: "straight", label: "Straight" },
                                      { value: "step", label: "Step" },
                                      {
                                        value: "smoothstep",
                                        label: "Smoothstep",
                                      },
                                      {
                                        value: "simplebezier",
                                        label: "Simple Bezier",
                                      },
                                    ].map(({ value, label }) => (
                                      <SelectItem
                                        key={value}
                                        value={value}
                                        className="text-xs"
                                      >
                                        {label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Edge Color */}
                    <div className="px-2 space-y-2">
                      <label className="block text-xs text-muted-foreground mb-1.5">
                        Color
                      </label>
                      <CustomColorPicker
                        pickerKey={`edge-color-picker-${selectedObjectIds.edgeIds.join(
                          ","
                        )}`}
                        defaultValue={
                          isMixed(unifiedEdgeStyle.stroke)
                            ? "#b1b1b7"
                            : (unifiedEdgeStyle.stroke as string)
                        }
                        onValueChange={(newColor) =>
                          updateSelectedEdgesStyle({
                            style: { stroke: newColor },
                          })
                        }
                        displayValue={
                          isMixed(unifiedEdgeStyle.stroke)
                            ? "Mixed"
                            : unifiedEdgeStyle.stroke
                        }
                        format="hex"
                        size="sm"
                        className="max-w-70"
                      />
                      {isMixed(unifiedEdgeStyle.stroke) && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full"
                            onClick={() =>
                              setExpandedColors((prev) => ({
                                ...prev,
                                edgeColor: !prev.edgeColor,
                              }))
                            }
                          >
                            {expandedColors.edgeColor ? (
                              <>
                                <ChevronUp className="h-3.5 w-3.5" />
                                Hide individual colors
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-3.5 w-3.5" />
                                Show individual colors
                              </>
                            )}
                          </Button>
                          {expandedColors.edgeColor && (
                            <div className="space-y-2 pl-2 border-l-2 border-border">
                              {groupEdgesByColor().map((group) => {
                                return (
                                  <CustomColorPicker
                                    key={`edge-color-group-${group.color}`}
                                    pickerKey={`edge-color-group-${
                                      group.color
                                    }-${group.ids.join("-")}`}
                                    defaultValue={group.color}
                                    onValueChange={(newColor) => {
                                      group.ids.forEach((edgeId) => {
                                        const edge = edges.find(
                                          (e) => e.id === edgeId
                                        );
                                        if (!edge) return;
                                        const updatedEdge: Partial<Edge> = {
                                          style: {
                                            ...(edge.style as Record<
                                              string,
                                              string
                                            >),
                                            stroke: newColor,
                                          },
                                        };
                                        updateEdgeData(edgeId, updatedEdge);
                                      });
                                    }}
                                    displayValue={group.color}
                                    format="hex"
                                    size="sm"
                                    className="max-w-70"
                                  />
                                );
                              })}
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Stroke Width */}
                    <div className="px-2 space-y-2">
                      <label className="block text-xs text-muted-foreground mb-1.5">
                        Width
                      </label>
                      <Input
                        type="number"
                        min={1}
                        max={10}
                        step={1}
                        value={
                          isMixed(unifiedEdgeStyle.strokeWidth)
                            ? 1
                            : (unifiedEdgeStyle.strokeWidth as string)
                        }
                        onChange={(e) =>
                          updateSelectedEdgesStyle({
                            style: { strokeWidth: Number(e.target.value) },
                          })
                        }
                        className="w-full h-fit text-xs py-1 px-2 rounded-sm"
                      />
                      {isMixed(unifiedEdgeStyle.strokeWidth) && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full"
                            onClick={() =>
                              setExpandedProperties((prev) => ({
                                ...prev,
                                edgeWidth: !prev.edgeWidth,
                              }))
                            }
                          >
                            {expandedProperties.edgeWidth ? (
                              <>
                                <ChevronUp className="h-3.5 w-3.5" />
                                Hide individual widths
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-3.5 w-3.5" />
                                Show individual widths
                              </>
                            )}
                          </Button>
                          {expandedProperties.edgeWidth && (
                            <div className="space-y-2 pl-2 border-l-2 border-border">
                              {groupEdgesByWidth().map((group) => (
                                <Input
                                  key={`edge-width-group-${group.width}`}
                                  type="number"
                                  min={1}
                                  max={10}
                                  step={1}
                                  value={group.width}
                                  onChange={(e) => {
                                    const newWidth = Number(e.target.value);
                                    group.ids.forEach((edgeId) => {
                                      const edge = edges.find(
                                        (e) => e.id === edgeId
                                      );
                                      if (!edge) return;
                                      const updatedEdge: Partial<Edge> = {
                                        style: {
                                          ...(edge.style as Record<
                                            string,
                                            string
                                          >),
                                          strokeWidth: String(newWidth),
                                        },
                                      };
                                      updateEdgeData(edgeId, updatedEdge);
                                    });
                                  }}
                                  className="w-full h-fit text-xs py-1 px-2 rounded-sm"
                                />
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Animated */}
                    <div className="px-2">
                      <label className="block text-xs text-muted-foreground mb-1.5">
                        Animated
                      </label>
                      <Toggle
                        size="sm"
                        pressed={
                          !isMixed(unifiedEdgeStyle.animated) &&
                          unifiedEdgeStyle.animated === true
                        }
                        onPressedChange={(pressed: boolean) =>
                          updateSelectedEdgesStyle({ animated: pressed })
                        }
                        aria-label="Animated"
                      >
                        <span className="text-xs">
                          {unifiedEdgeStyle.animated === true ? "On" : "Off"}
                        </span>
                      </Toggle>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </ScrollArea>
        )}
      </Card>
    </Panel>
  );
}
