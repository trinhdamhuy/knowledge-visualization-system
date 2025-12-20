import { Button } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";

// CustomColorPicker component
interface CustomColorPickerProps {
  pickerKey: string;
  defaultValue: string;
  onValueChange: (color: string) => void;
  displayValue: string;
  format?: "hex" | "rgb" | "hsl";
  size?: "sm" | "default";
  className?: string;
}

export function CustomColorPicker({
  pickerKey,
  defaultValue,
  onValueChange,
  displayValue,
  format = "hex",
  size = "default",
  className,
}: CustomColorPickerProps) {
  const triggerClassName = cn(
    "flex items-center justify-between gap-2 w-full h-fit p-1 pr-2 text-xs rounded-sm",
    size === "sm" ? "text-xs" : "text-sm"
  );
  const swatchClassName = cn(
    "size-4 rounded-sm",
    size === "sm" ? "size-4" : "size-6"
  );

  return (
    <ColorPicker
      key={pickerKey}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      format={format}
    >
      <ColorPickerTrigger asChild>
        <Button variant="outline" className={triggerClassName}>
          <ColorPickerSwatch className={swatchClassName} />
          <span className="text-xs">{displayValue}</span>
        </Button>
      </ColorPickerTrigger>
      <ColorPickerContent className={className}>
        <ColorPickerArea />
        <div className="flex items-center gap-2">
          <ColorPickerEyeDropper size="icon" />
          <div className="flex flex-1 flex-col gap-1.5">
            <ColorPickerHueSlider />
            <ColorPickerAlphaSlider />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ColorPickerFormatSelect size={size} />
          <ColorPickerInput className="text-xs" />
        </div>
      </ColorPickerContent>
    </ColorPicker>
  );
}
