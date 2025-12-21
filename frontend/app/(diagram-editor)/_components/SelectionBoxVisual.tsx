import { SelectionBoxState } from "./hooks/use-selection-box";

interface SelectionBoxVisualProps {
  selectionBox: SelectionBoxState;
}

/**
 * Visual component for rendering the selection box
 */
export function SelectionBoxVisual({ selectionBox }: SelectionBoxVisualProps) {
  return (
    <div
      className="absolute inset-0 pointer-events-auto z-5"
      style={{
        left: 0,
        top: 0,
        width: "100%",
        height: "100%",
      }}
    >
      <div
        className="border-2 border-primary bg-primary/10 absolute"
        style={{
          left: Math.min(selectionBox.startX, selectionBox.endX),
          top: Math.min(selectionBox.startY, selectionBox.endY),
          width: Math.abs(selectionBox.endX - selectionBox.startX),
          height: Math.abs(selectionBox.endY - selectionBox.startY),
        }}
      />
    </div>
  );
}
