import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pipette, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ColorPickerInputProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
  presetColors?: string[];
}

const DEFAULT_PRESETS = [
  "#8B5CF6", // Purple
  "#3B82F6", // Blue
  "#06B6D4", // Cyan
  "#10B981", // Emerald
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#EC4899", // Pink
  "#6366F1", // Indigo
  "#0D0D0D", // Near black
  "#FFFFFF", // White
  "#F5F5F4", // Stone
  "#1F2937", // Gray
];

export const ColorPickerInput = ({
  value,
  onChange,
  label,
  presetColors = DEFAULT_PRESETS,
}: ColorPickerInputProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localColor, setLocalColor] = useState(value || "#8B5CF6");
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      setLocalColor(value);
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleColorChange = (color: string) => {
    setLocalColor(color);
    onChange(color);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 p-2 rounded-md transition-colors w-full",
          "border border-border/50 hover:border-primary/50",
          isOpen && "border-primary bg-primary/5"
        )}
      >
        <div
          className="w-6 h-6 rounded-md border border-border/50 shadow-sm"
          style={{ backgroundColor: localColor }}
        />
        <div className="flex-1 text-left">
          {label && <span className="text-xs text-muted-foreground">{label}</span>}
          <p className="text-xs font-mono uppercase">{localColor}</p>
        </div>
        <Pipette className="w-3.5 h-3.5 text-muted-foreground" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 top-full left-0 mt-2 p-3 bg-card border border-border rounded-lg shadow-xl w-full min-w-[200px]"
          >
            {/* Native color picker */}
            <div className="mb-3">
              <label className="text-xs text-muted-foreground mb-1.5 block">
                Custom color
              </label>
              <div className="relative">
                <input
                  ref={inputRef}
                  type="color"
                  value={localColor}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="w-full h-10 rounded-md cursor-pointer border-0 p-0"
                  style={{ backgroundColor: localColor }}
                />
              </div>
            </div>

            {/* Hex input */}
            <div className="mb-3">
              <label className="text-xs text-muted-foreground mb-1.5 block">
                Hex code
              </label>
              <input
                type="text"
                value={localColor}
                onChange={(e) => {
                  const hex = e.target.value;
                  if (/^#[0-9A-Fa-f]{0,6}$/.test(hex)) {
                    setLocalColor(hex);
                    if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
                      onChange(hex);
                    }
                  }
                }}
                placeholder="#000000"
                className="w-full px-2 py-1.5 text-xs font-mono bg-background border border-border/50 rounded-md focus:outline-none focus:border-primary"
              />
            </div>

            {/* Preset colors */}
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">
                Presets
              </label>
              <div className="grid grid-cols-6 gap-1.5">
                {presetColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => handleColorChange(color)}
                    className={cn(
                      "w-6 h-6 rounded-md border-2 transition-all relative",
                      localColor === color
                        ? "border-primary scale-110"
                        : "border-transparent hover:scale-105"
                    )}
                    style={{ backgroundColor: color }}
                  >
                    {localColor === color && (
                      <Check
                        className={cn(
                          "absolute inset-0 m-auto w-3 h-3",
                          isLightColor(color) ? "text-gray-800" : "text-white"
                        )}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Helper to determine if a color is light (for contrast)
function isLightColor(hex: string): boolean {
  const c = hex.substring(1);
  const rgb = parseInt(c, 16);
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >> 8) & 0xff;
  const b = (rgb >> 0) & 0xff;
  const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luma > 180;
}

