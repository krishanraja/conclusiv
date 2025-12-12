import { motion } from "framer-motion";
import { CheckCircle2, AlertCircle, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

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
  field: string;
  label: string;
  weight: number;
  filled: boolean;
  tip: string;
}

export const QuerySpecificityIndicator = ({ 
  qualification, 
  className 
}: QuerySpecificityIndicatorProps) => {
  const fields: FieldScore[] = [
    {
      field: 'companyName',
      label: 'Company name',
      weight: 15,
      filled: qualification.companyName.trim().length > 0,
      tip: 'Add the company name to identify the target'
    },
    {
      field: 'websiteUrl',
      label: 'Website URL',
      weight: 25,
      filled: qualification.websiteUrl.trim().length > 0 && 
              (qualification.websiteUrl.includes('.') || qualification.websiteUrl.includes('http')),
      tip: 'Adding a URL makes research 25% more specific'
    },
    {
      field: 'industry',
      label: 'Industry',
      weight: 10,
      filled: qualification.industry.trim().length > 0,
      tip: 'Select an industry to narrow context'
    },
    {
      field: 'primaryQuestion',
      label: 'Main question',
      weight: 20,
      filled: qualification.primaryQuestion.trim().length >= 20,
      tip: 'Describe your main question (20+ chars)'
    },
    {
      field: 'knownConcerns',
      label: 'Known concerns',
      weight: 10,
      filled: qualification.knownConcerns.trim().length > 0,
      tip: 'Share any concerns you already have'
    },
    {
      field: 'successCriteria',
      label: 'Success criteria',
      weight: 10,
      filled: qualification.successCriteria.trim().length > 0,
      tip: 'Define what success looks like'
    },
    {
      field: 'redFlags',
      label: 'Red flags',
      weight: 10,
      filled: qualification.redFlags.trim().length > 0,
      tip: 'List potential deal-breakers'
    },
  ];

  const totalScore = fields.reduce((acc, field) => 
    acc + (field.filled ? field.weight : 0), 0
  );

  const filledCount = fields.filter(f => f.filled).length;
  const nextTip = fields.find(f => !f.filled);

  const getScoreColor = () => {
    if (totalScore < 30) return 'bg-destructive';
    if (totalScore < 60) return 'bg-warning';
    return 'bg-success';
  };

  const getScoreTextColor = () => {
    if (totalScore < 30) return 'text-destructive';
    if (totalScore < 60) return 'text-warning';
    return 'text-success';
  };

  const getScoreLabel = () => {
    if (totalScore < 30) return 'Low specificity';
    if (totalScore < 60) return 'Moderate specificity';
    if (totalScore < 85) return 'Good specificity';
    return 'Excellent specificity';
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Query specificity</span>
          <span className={cn("font-medium", getScoreTextColor())}>
            {totalScore}%
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className={cn("h-full rounded-full", getScoreColor())}
            initial={{ width: 0 }}
            animate={{ width: `${totalScore}%` }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className={cn("font-medium", getScoreTextColor())}>
            {getScoreLabel()}
          </span>
          <span className="text-muted-foreground">
            {filledCount}/{fields.length} fields
          </span>
        </div>
      </div>

      {/* Tip for next improvement */}
      {nextTip && totalScore < 100 && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-2 p-2 rounded-md bg-muted/50 text-xs"
        >
          <Lightbulb className="h-3.5 w-3.5 text-warning mt-0.5 shrink-0" />
          <span className="text-muted-foreground">
            <span className="font-medium text-foreground">Tip:</span> {nextTip.tip}
          </span>
        </motion.div>
      )}

      {/* Field checklist (compact) */}
      <div className="flex flex-wrap gap-1.5">
        {fields.map((field) => (
          <div
            key={field.field}
            className={cn(
              "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-colors",
              field.filled 
                ? "bg-success/10 text-success" 
                : "bg-muted text-muted-foreground"
            )}
          >
            {field.filled ? (
              <CheckCircle2 className="h-3 w-3" />
            ) : (
              <AlertCircle className="h-3 w-3" />
            )}
            <span>{field.label}</span>
            <span className="opacity-60">+{field.weight}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};
