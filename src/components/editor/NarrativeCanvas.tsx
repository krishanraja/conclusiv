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
  // Calculate layout bounds
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
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            radial-gradient(circle at 1px 1px, hsl(var(--muted-foreground) / 0.3) 1px, transparent 0)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Connection lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.6" />
            <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0.6" />
          </linearGradient>
        </defs>
        {normalizedSections.slice(0, -1).map((section, i) => {
          const next = normalizedSections[i + 1];
          return (
            <motion.line
              key={`line-${i}`}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ delay: i * 0.1 + 0.3, duration: 0.6 }}
              x1={`${section.normalizedPos.x}%`}
              y1={`${section.normalizedPos.y}%`}
              x2={`${next.normalizedPos.x}%`}
              y2={`${next.normalizedPos.y}%`}
              stroke="url(#lineGradient)"
              strokeWidth={2}
              strokeDasharray="8 4"
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
              delay: section.index * 0.1, 
              type: "spring", 
              stiffness: 300,
              damping: 20
            }}
            onClick={() => onSelectSection(section.id)}
            className={cn(
              "absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer",
            )}
            style={{
              left: `${section.normalizedPos.x}%`,
              top: `${section.normalizedPos.y}%`,
              zIndex: isSelected ? 10 : 1,
            }}
          >
            <motion.div
              animate={{
                scale: isSelected ? 1.1 : 1,
                boxShadow: isSelected 
                  ? "0 0 40px hsl(var(--primary) / 0.5)" 
                  : "0 0 20px hsl(var(--primary) / 0.2)",
              }}
              transition={{ duration: 0.2 }}
              className={cn(
                "relative p-4 rounded-xl glass border-2 transition-all duration-200",
                isSelected 
                  ? "border-primary bg-card/90" 
                  : "border-border/50 hover:border-primary/50"
              )}
            >
              {/* Index badge */}
              <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                {section.index + 1}
              </div>
              
              {/* Icon */}
              <div className={cn(
                "w-12 h-12 rounded-lg flex items-center justify-center mb-3 transition-all",
                isSelected 
                  ? "bg-gradient-to-br from-primary to-accent" 
                  : "bg-primary/20"
              )}>
                <Icon className={cn(
                  "w-6 h-6",
                  isSelected ? "text-primary-foreground" : "text-primary"
                )} />
              </div>
              
              {/* Title */}
              <h3 className="font-display font-semibold text-foreground text-sm text-center max-w-[140px]">
                {section.title}
              </h3>
              
              {/* Content preview */}
              {section.content && (
                <p className="text-xs text-muted-foreground mt-1 text-center max-w-[140px] line-clamp-2">
                  {section.content}
                </p>
              )}
            </motion.div>
          </motion.button>
        );
      })}
    </div>
  );
};
