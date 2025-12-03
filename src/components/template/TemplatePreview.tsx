import { motion } from "framer-motion";
import { TemplateName } from "@/lib/types";
import { getTemplate } from "@/lib/templates";

interface TemplatePreviewProps {
  templateName: TemplateName;
  mini?: boolean;
}

export const TemplatePreview = ({ templateName, mini = false }: TemplatePreviewProps) => {
  const template = getTemplate(templateName);
  
  const nodeSize = mini ? 6 : 12;
  const lineWidth = mini ? 1 : 2;
  
  // Normalize positions for preview
  const positions = template.sections.map(s => s.position);
  const minX = Math.min(...positions.map(p => p.x));
  const maxX = Math.max(...positions.map(p => p.x));
  const minY = Math.min(...positions.map(p => p.y));
  const maxY = Math.max(...positions.map(p => p.y));
  
  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;
  
  const normalizedSections = template.sections.map(s => ({
    ...s,
    normalizedPos: {
      x: ((s.position.x - minX) / rangeX) * 70 + 15,
      y: ((s.position.y - minY) / rangeY) * 60 + 20,
    }
  }));

  return (
    <div className="w-full h-full relative bg-gradient-to-br from-background via-card to-background overflow-hidden">
      {/* Ambient glow */}
      <div 
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at 50% 50%, hsl(var(--primary) / 0.1) 0%, transparent 60%)`,
        }}
      />

      {/* Connection lines */}
      <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }}>
        <defs>
          <linearGradient id={`grad-${templateName}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.5" />
            <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0.5" />
          </linearGradient>
        </defs>
        {normalizedSections.slice(0, -1).map((section, i) => {
          const next = normalizedSections[i + 1];
          return (
            <motion.line
              key={`line-${i}`}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.5 }}
              transition={{ delay: i * 0.15, duration: 0.4 }}
              x1={`${section.normalizedPos.x}%`}
              y1={`${section.normalizedPos.y}%`}
              x2={`${next.normalizedPos.x}%`}
              y2={`${next.normalizedPos.y}%`}
              stroke={`url(#grad-${templateName})`}
              strokeWidth={lineWidth}
            />
          );
        })}
      </svg>

      {/* Nodes */}
      {normalizedSections.map((section, i) => (
        <motion.div
          key={section.id}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: i * 0.1, type: "spring", stiffness: 400, damping: 15 }}
          className="absolute transform -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `${section.normalizedPos.x}%`,
            top: `${section.normalizedPos.y}%`,
            zIndex: 1,
          }}
        >
          <div
            className="rounded-full bg-gradient-to-br from-primary to-accent"
            style={{
              width: nodeSize,
              height: nodeSize,
              boxShadow: `0 0 ${nodeSize * 1.5}px hsl(var(--primary) / 0.6)`,
            }}
          />
        </motion.div>
      ))}

      {/* Template name badge */}
      {!mini && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="absolute bottom-2 left-2"
        >
          <span className="text-[10px] px-2 py-0.5 rounded bg-primary/20 text-primary font-medium">
            {template.displayName}
          </span>
        </motion.div>
      )}
    </div>
  );
};
