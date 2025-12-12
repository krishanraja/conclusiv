import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { BarChart3, Eye, Clock, Users, TrendingUp, ChevronDown, ChevronUp, Calendar, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface AnalyticsData {
  totalViews: number;
  uniqueViewers: number;
  avgTimeSpent: number;
  completionRate: number;
  sectionViews: Record<number, number>;
  recentViews: Array<{
    created_at: string;
    device_info: { device?: string; browser?: string } | null;
    time_spent_seconds: number | null;
  }>;
}

interface PresentationAnalyticsProps {
  shareId: string;
  narrativeId?: string;
  sectionCount?: number;
}

export const PresentationAnalytics = ({ shareId, narrativeId, sectionCount = 6 }: PresentationAnalyticsProps) => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (!shareId || !user) {
      setIsLoading(false);
      return;
    }
    loadAnalytics();
  }, [shareId, user]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("presentation_analytics")
        .select("*")
        .eq("share_id", shareId);

      if (!error && data) {
        // Process analytics data
        const views = data.filter(d => d.event_type === 'view');
        const sectionViewEvents = data.filter(d => d.event_type === 'section_view');
        const completions = data.filter(d => d.event_type === 'complete');
        const timeEvents = data.filter(d => d.event_type === 'time_spent' && d.time_spent_seconds);

        // Calculate section views
        const sectionViews: Record<number, number> = {};
        sectionViewEvents.forEach(event => {
          if (event.section_index !== null) {
            sectionViews[event.section_index] = (sectionViews[event.section_index] || 0) + 1;
          }
        });

        // Calculate average time
        const totalTime = timeEvents.reduce((acc, e) => acc + (e.time_spent_seconds || 0), 0);
        const avgTime = timeEvents.length > 0 ? totalTime / timeEvents.length : 0;

        // Get unique viewers
        const uniqueSessions = new Set(views.map(v => v.session_id));

        // Calculate completion rate
        const completionRate = views.length > 0 
          ? (completions.length / views.length) * 100 
          : 0;

        setAnalytics({
          totalViews: views.length,
          uniqueViewers: uniqueSessions.size,
          avgTimeSpent: Math.round(avgTime),
          completionRate: Math.round(completionRate),
          sectionViews,
          recentViews: views.slice(0, 5).map(v => ({
            created_at: v.created_at,
            device_info: v.device_info as { device?: string; browser?: string } | null,
            time_spent_seconds: timeEvents.find(t => t.session_id === v.session_id)?.time_spent_seconds || null,
          })),
        });
      }
    } catch (err) {
      console.error("Failed to load analytics:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground">Loading analytics...</span>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="p-4 rounded-lg bg-muted/30 border border-border/50 text-center">
        <BarChart3 className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
        <p className="text-sm text-muted-foreground">No analytics data yet</p>
        <p className="text-xs text-muted-foreground mt-1">Share your narrative to start tracking views</p>
      </div>
    );
  }

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  // Find max section views for scaling
  const maxSectionViews = Math.max(...Object.values(analytics.sectionViews), 1);

  return (
    <div className="space-y-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/50 hover:border-primary/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <BarChart3 className="w-4 h-4 text-primary" />
          </div>
          <div className="text-left">
            <span className="text-sm font-medium">Presentation Analytics</span>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {analytics.totalViews} views
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {analytics.uniqueViewers} unique
              </span>
            </div>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="space-y-4 p-4 rounded-lg bg-muted/20 border border-border/30"
        >
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-background/50 border border-border/30">
              <div className="flex items-center gap-2 mb-1">
                <Eye className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-xs text-muted-foreground">Total Views</span>
              </div>
              <span className="text-xl font-bold">{analytics.totalViews}</span>
            </div>
            
            <div className="p-3 rounded-lg bg-background/50 border border-border/30">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-xs text-muted-foreground">Unique Viewers</span>
              </div>
              <span className="text-xl font-bold">{analytics.uniqueViewers}</span>
            </div>
            
            <div className="p-3 rounded-lg bg-background/50 border border-border/30">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-3.5 h-3.5 text-green-400" />
                <span className="text-xs text-muted-foreground">Avg. Time</span>
              </div>
              <span className="text-xl font-bold">{formatDuration(analytics.avgTimeSpent)}</span>
            </div>
            
            <div className="p-3 rounded-lg bg-background/50 border border-border/30">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-orange-400" />
                <span className="text-xs text-muted-foreground">Completion</span>
              </div>
              <span className="text-xl font-bold">{analytics.completionRate}%</span>
            </div>
          </div>

          {/* Section Engagement */}
          {Object.keys(analytics.sectionViews).length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground uppercase">Section Engagement</h4>
              <div className="space-y-1">
                {Array.from({ length: sectionCount }).map((_, index) => {
                  const views = analytics.sectionViews[index] || 0;
                  const percentage = (views / maxSectionViews) * 100;
                  
                  return (
                    <div key={index} className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-16">
                        Slide {index + 1}
                      </span>
                      <div className="flex-1 h-4 rounded-full bg-border/50 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ delay: index * 0.1, duration: 0.5 }}
                          className="h-full bg-gradient-to-r from-primary/50 to-primary"
                        />
                      </div>
                      <span className="text-xs text-foreground w-8 text-right">{views}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recent Views */}
          {analytics.recentViews.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground uppercase">Recent Views</h4>
              <div className="space-y-2">
                {analytics.recentViews.map((view, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 rounded-lg bg-background/30 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3 h-3 text-muted-foreground" />
                      <span>{formatDistanceToNow(new Date(view.created_at), { addSuffix: true })}</span>
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      {view.device_info?.device && (
                        <span>{view.device_info.device}</span>
                      )}
                      {view.time_spent_seconds && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDuration(view.time_spent_seconds)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};