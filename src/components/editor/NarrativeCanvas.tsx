import { motion } from "framer-motion";
import { NarrativeSchema } from "@/lib/types";
import { cn } from "@/lib/utils";
import { getIcon } from "@/lib/icons";

interface NarrativeCanvasProps {
  narrative: NarrativeSchema;
  selectedSectionId: string | null;
  onSelectSection: (id: string) => void;
}

export const NarrativeCanvas = ({ 
  narrative, 
  selectedSectionId, 
  onSelectSection 
}: NarrativeCanvasProps) => {
  const positions = narrative.sections.map(s => s.position);
  const minX = Math.min(...positions.map(p => p.x));
  const maxX = Math.max(...positions.map(p => p.x));
  const minY = Math.min(...positions.map(p => p.y));
  const maxY = Math.max(...positions.map(p => p.y));
  
  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;

  const normalizedSections = narrative.sections.map((s, index) => ({
    ...s,
    index,
    normalizedPos: {
      x: ((s.position.x - minX) / rangeX) * 60 + 20,
      y: ((s.position.y - minY) / rangeY) * 50 + 25,
    }
  }));

  return (
    <div className="w-full h-full relative overflow-hidden">
      {/* Background grid */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--muted-foreground) / 0.3) 1px, transparent 0)`,
          backgroundSize: '32px 32px',
        }}
      />

      {/* Connection lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--shimmer-start))" stopOpacity="0.4" />
            <stop offset="100%" stopColor="hsl(var(--shimmer-end))" stopOpacity="0.4" />
          </linearGradient>
        </defs>
        {normalizedSections.slice(0, -1).map((section, i) => {
          const next = normalizedSections[i + 1];
          return (
            <motion.line
              key={`line-${i}`}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ delay: i * 0.1 + 0.3, duration: 0.5 }}
              x1={`${section.normalizedPos.x}%`}
              y1={`${section.normalizedPos.y}%`}
              x2={`${next.normalizedPos.x}%`}
              y2={`${next.normalizedPos.y}%`}
              stroke="url(#lineGradient)"
              strokeWidth={1.5}
              strokeDasharray="6 3"
            />
          );
        })}
      </svg>

      {/* Section nodes */}
      {normalizedSections.map((section) => {
        const Icon = getIcon(section.icon);
        const isSelected = selectedSectionId === section.id;
        
        return (
          <motion.button
            key={section.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ 
              delay: section.index * 0.08, 
              type: "spring", 
              stiffness: 300,
              damping: 20
            }}
            onClick={() => onSelectSection(section.id)}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
            style={{
              left: `${section.normalizedPos.x}%`,
              top: `${section.normalizedPos.y}%`,
              zIndex: isSelected ? 10 : 1,
            }}
          >
            <motion.div
              animate={{
                scale: isSelected ? 1.05 : 1,
              }}
              transition={{ duration: 0.2 }}
              className={cn(
                "relative p-3 rounded-lg border transition-all duration-200",
                isSelected 
                  ? "border-primary/50 bg-card/80 shimmer-border-subtle" 
                  : "border-border/40 bg-card/50 hover:border-border/60"
              )}
            >
              {/* Index badge */}
              <div className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-medium flex items-center justify-center">
                {section.index + 1}
              </div>
              
              {/* Icon */}
              <div className={cn(
                "w-10 h-10 rounded-md flex items-center justify-center mb-2 transition-all",
                isSelected 
                  ? "bg-primary/20" 
                  : "bg-secondary/50"
              )}>
                <Icon className={cn(
                  "w-5 h-5",
                  isSelected ? "text-primary" : "text-muted-foreground"
                )} />
              </div>
              
              {/* Title */}
              <h3 className="font-medium text-foreground text-xs text-center max-w-[120px] truncate">
                {section.title}
              </h3>
            </motion.div>
          </motion.button>
        );
      })}
    </div>
  );
};