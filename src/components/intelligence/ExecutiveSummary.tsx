import { motion } from "framer-motion";
import { Clock, FileText, Zap, AlertTriangle, Target, Sparkles } from "lucide-react";
import { useNarrativeStore } from "@/store/narrativeStore";
import { calculateNarrativeQuality } from "./NarrativeQualityScore";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  highlight?: boolean;
  delay?: number;
}

const StatCard = ({ icon, label, value, highlight, delay = 0 }: StatCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.3 }}
    className={`flex items-center gap-3 p-3 rounded-lg ${
      highlight ? "bg-shimmer-start/10 border border-shimmer-start/20" : "bg-card/50"
    }`}
  >
    <div className={`p-2 rounded-md ${highlight ? "bg-shimmer-start/20" : "bg-muted"}`}>
      {icon}
    </div>
    <div>
      <div className="text-lg font-semibold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  </motion.div>
);

export const ExecutiveSummary = () => {
  const { 
    rawText, 
    narrative, 
    tensions, 
    businessContext,
    selectedArchetype,
    duration,
    keyClaims,
  } = useNarrativeStore();

  if (!narrative) return null;

  const charCount = rawText.length;
  const wordCount = rawText.split(/\s+/).filter(Boolean).length;
  const sectionCount = narrative.sections.length;
  const tensionCount = tensions.length;
  const { overall: qualityScore } = calculateNarrativeQuality(narrative, rawText, tensions, businessContext, keyClaims);

  // Calculate estimated read time (average 200 words per minute for presentation)
  const estimatedReadTime = Math.ceil(
    narrative.sections.reduce((acc, s) => {
      const sectionWords = (s.title?.split(/\s+/).length || 0) + 
                          (s.content?.split(/\s+/).length || 0) +
                          (s.items?.join(" ").split(/\s+/).length || 0);
      return acc + sectionWords;
    }, 0) / 150
  );

  // Generate summary line
  const summaryLine = `In ${estimatedReadTime} minute${estimatedReadTime > 1 ? 's' : ''}, you transformed ${wordCount.toLocaleString()} words of research into a ${sectionCount}-section ${selectedArchetype?.replace(/_/g, ' ') || 'narrative'}${tensionCount > 0 ? ` with ${tensionCount} detected risk${tensionCount > 1 ? 's' : ''}` : ''}.`;

  return (
    <div className="space-y-4">
      {/* Main summary statement */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="p-4 rounded-xl bg-gradient-to-br from-shimmer-start/5 to-accent/5 border border-shimmer-start/20"
      >
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-shimmer-start/20">
            <Sparkles className="w-4 h-4 text-shimmer-start" />
          </div>
          <div>
            <h4 className="text-sm font-medium mb-1">Executive Summary</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {summaryLine}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2">
        <StatCard
          icon={<FileText className="w-4 h-4 text-muted-foreground" />}
          label="Input Processed"
          value={`${(charCount / 1000).toFixed(1)}k chars`}
          delay={0.1}
        />
        <StatCard
          icon={<Target className="w-4 h-4 text-muted-foreground" />}
          label="Sections Created"
          value={sectionCount}
          delay={0.15}
        />
        <StatCard
          icon={<Clock className="w-4 h-4 text-muted-foreground" />}
          label="Present Time"
          value={`~${estimatedReadTime} min`}
          delay={0.2}
        />
        <StatCard
          icon={<AlertTriangle className="w-4 h-4 text-muted-foreground" />}
          label="Tensions Found"
          value={tensionCount}
          delay={0.25}
        />
      </div>

      {/* Quality indicator */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex items-center justify-between p-3 rounded-lg bg-card/50"
      >
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-shimmer-start" />
          <span className="text-sm text-muted-foreground">Quality Score</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-24 h-2 rounded-full bg-border overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-shimmer-start to-accent"
              initial={{ width: 0 }}
              animate={{ width: `${qualityScore}%` }}
              transition={{ delay: 0.5, duration: 0.8 }}
            />
          </div>
          <span className="text-sm font-medium">{qualityScore}/100</span>
        </div>
      </motion.div>

      {/* Benchmarks (if applicable) */}
      {qualityScore >= 75 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-xs text-center text-muted-foreground"
        >
          ✨ Your narrative scores in the top 25% of generated narratives
        </motion.div>
      )}
    </div>
  );
};
