import { motion } from "framer-motion";
import { TemplateName } from "@/lib/types";
import { getTemplate } from "@/lib/templates";

interface TemplatePreviewProps {
  templateName: TemplateName;
  mini?: boolean;
}

export const TemplatePreview = ({ templateName, mini = false }: TemplatePreviewProps) => {
  const template = getTemplate(templateName);
  
  const nodeSize = mini ? 4 : 8;
  const lineWidth = mini ? 1 : 1.5;
  
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
    <div className="w-full h-full relative bg-background overflow-hidden">
      {/* Ambient glow */}
      <div 
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at 50% 50%, hsl(var(--shimmer-start) / 0.05) 0%, transparent 60%)`,
        }}
      />

      {/* Connection lines */}
      <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }}>
        <defs>
          <linearGradient id={`grad-${templateName}`} x1="0%" y1="0%" x2="100%" y2="100%">
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
              animate={{ pathLength: 1, opacity: 0.5 }}
              transition={{ delay: i * 0.1, duration: 0.3 }}
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
          transition={{ delay: i * 0.08, type: "spring", stiffness: 400, damping: 15 }}
          className="absolute transform -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `${section.normalizedPos.x}%`,
            top: `${section.normalizedPos.y}%`,
            zIndex: 1,
          }}
        >
          <div
            className="rounded-full bg-primary"
            style={{
              width: nodeSize,
              height: nodeSize,
              boxShadow: `0 0 ${nodeSize * 1.5}px hsl(var(--shimmer-start) / 0.4)`,
            }}
          />
        </motion.div>
      ))}
    </div>
  );
};