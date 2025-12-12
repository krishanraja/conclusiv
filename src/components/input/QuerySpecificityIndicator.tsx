import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Circle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface QualificationData {
  companyName: string;
  websiteUrl: string;
  industry: string;
  primaryQuestion: string;
  knownConcerns: string;
  successCriteria: string;
  redFlags: string;
}

interface QuerySpecificityIndicatorProps {
  qualification: QualificationData;
  className?: string;
}

interface FieldScore {
  name: keyof QualificationData;
  label: string;
  weight: number;
  filled: boolean;
  tip: string;
}

export const QuerySpecificityIndicator = ({ 
  qualification, 
  className 
}: QuerySpecificityIndicatorProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const fields: FieldScore[] = [
    {
      name: 'companyName',
      label: 'Company name',
      weight: 15,
      filled: qualification.companyName.trim().length > 0,
      tip: 'Add the company name to identify the target'
    },
    {
      name: 'websiteUrl',
      label: 'Website URL',
      weight: 25,
      filled: qualification.websiteUrl.trim().length > 0 && 
              (qualification.websiteUrl.includes('.') || qualification.websiteUrl.includes('http')),
      tip: 'Adding a URL makes research 25% more specific'
    },
    {
      name: 'industry',
      label: 'Industry',
      weight: 10,
      filled: qualification.industry.trim().length > 0,
      tip: 'Select an industry to narrow context'
    },
    {
      name: 'primaryQuestion',
      label: 'Main question',
      weight: 20,
      filled: qualification.primaryQuestion.trim().length >= 20,
      tip: 'Describe your main question (20+ chars)'
    },
    {
      name: 'knownConcerns',
      label: 'Known concerns',
      weight: 10,
      filled: qualification.knownConcerns.trim().length > 0,
      tip: 'Share any concerns you already have'
    },
    {
      name: 'successCriteria',
      label: 'Success criteria',
      weight: 10,
      filled: qualification.successCriteria.trim().length > 0,
      tip: 'Define what success looks like'
    },
    {
      name: 'redFlags',
      label: 'Red flags',
      weight: 10,
      filled: qualification.redFlags.trim().length > 0,
      tip: 'List potential deal-breakers'
    },
  ];

  const totalScore = fields.reduce((acc, field) => 
    acc + (field.filled ? field.weight : 0), 0
  );

  const getStrokeColor = (score: number) => {
    if (score < 30) return "stroke-destructive";
    if (score < 60) return "stroke-amber-500";
    return "stroke-emerald-500";
  };

  const getLabel = (score: number) => {
    if (score < 30) return "Basic";
    if (score < 60) return "Moderate";
    if (score < 80) return "Good";
    return "Strong";
  };

  const nextTip = fields.find(f => !f.filled)?.tip;
  
  // SVG circle progress
  const size = 48;
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (totalScore / 100) * circumference;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <motion.button
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={cn(
            "relative flex items-center justify-center cursor-pointer",
            "w-12 h-12 rounded-full bg-card border border-border shadow-lg",
            "hover:shadow-xl transition-shadow",
            className
          )}
        >
          {/* SVG Progress Ring */}
          <svg
            width={size}
            height={size}
            className="absolute -rotate-90"
          >
            {/* Background circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              strokeWidth={strokeWidth}
              className="stroke-muted"
            />
            {/* Progress circle */}
            <motion.circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              className={getStrokeColor(totalScore)}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              style={{
                strokeDasharray: circumference,
              }}
            />
          </svg>
          {/* Score text */}
          <span className="text-xs font-semibold text-foreground z-10">
            {totalScore}%
          </span>
          {/* Info indicator */}
          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
            <Info className="w-2.5 h-2.5 text-primary-foreground" />
          </div>
        </motion.button>
      </PopoverTrigger>
      
      <PopoverContent 
        side="left" 
        align="end"
        className="w-72 p-4"
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{getLabel(totalScore)} specificity</span>
            <span className="text-lg font-bold text-primary">{totalScore}%</span>
          </div>
          
          {/* Tip for next improvement */}
          {nextTip && totalScore < 100 && (
            <div className="p-2 rounded-md bg-primary/5 border border-primary/10">
              <p className="text-xs text-muted-foreground">
                💡 {nextTip}
              </p>
            </div>
          )}

          {/* Field checklist */}
          <div className="space-y-1.5">
            {fields.map((field) => (
              <div
                key={field.name}
                className={cn(
                  "flex items-center gap-2 text-xs",
                  field.filled 
                    ? "text-emerald-600 dark:text-emerald-400" 
                    : "text-muted-foreground"
                )}
              >
                {field.filled ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <Circle className="w-3.5 h-3.5" />
                )}
                {field.label}
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
