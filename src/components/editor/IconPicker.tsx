import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { getIcon, availableIcons } from "@/lib/icons";

interface IconPickerProps {
  selectedIcon: string;
  onSelect: (icon: string) => void;
  icons?: string[];
}

export const IconPicker = ({ selectedIcon, onSelect, icons = availableIcons }: IconPickerProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-2 p-2 rounded-lg bg-background border border-border"
    >
      <div className="grid grid-cols-6 gap-1">
        {icons.map((iconName) => {
          const Icon = getIcon(iconName);
          const isSelected = selectedIcon === iconName;
          
          return (
            <button
              key={iconName}
              onClick={() => onSelect(iconName)}
              className={cn(
                "p-2 rounded-md transition-all",
                isSelected 
                  ? "bg-primary text-primary-foreground" 
                  : "hover:bg-secondary text-muted-foreground hover:text-foreground"
              )}
              title={iconName}
            >
              <Icon className="w-4 h-4" />
            </button>
          );
        })}
      </div>
    </motion.div>
  );
};
