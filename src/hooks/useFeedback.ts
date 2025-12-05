import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";
import type { Json } from "@/integrations/supabase/types";

type FeedbackType = "quick_rating" | "nps" | "detailed" | "bug_report" | "feature_request";
type Sentiment = "positive" | "neutral" | "negative";

interface FeedbackContext {
  step?: string;
  featuresUsed?: string[];
  timeSpent?: number;
  errorsEncountered?: string[];
  browser?: string;
  device?: string;
  [key: string]: unknown;
}

interface FeedbackSubmission {
  type: FeedbackType;
  rating?: number;
  message?: string;
  context?: FeedbackContext;
}

const SESSION_KEY = "conclusiv_session_id";
const NPS_SHOWN_KEY = "conclusiv_nps_shown";
const FEEDBACK_COUNT_KEY = "conclusiv_feedback_count";

export const useFeedback = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const calculateSentiment = (rating?: number, message?: string): Sentiment => {
    if (rating !== undefined) {
      // Handle both 5-point (1-5) and 10-point (0-10) scales
      if (rating <= 5) {
        // 5-point scale
        if (rating >= 4) return "positive";
        if (rating >= 3) return "neutral";
        return "negative";
      } else {
        // 10-point scale (NPS style)
        if (rating >= 9) return "positive";
        if (rating >= 7) return "neutral";
        return "negative";
      }
    }
    
    if (message) {
      const positiveWords = ["great", "love", "awesome", "amazing", "excellent", "good", "helpful"];
      const negativeWords = ["bad", "terrible", "awful", "hate", "broken", "bug", "issue", "problem"];
      
      const lowerMessage = message.toLowerCase();
      const hasPositive = positiveWords.some(word => lowerMessage.includes(word));
      const hasNegative = negativeWords.some(word => lowerMessage.includes(word));
      
      if (hasPositive && !hasNegative) return "positive";
      if (hasNegative && !hasPositive) return "negative";
    }
    
    return "neutral";
  };

  const submitFeedback = useCallback(
    async ({ type, rating, message, context = {} }: FeedbackSubmission) => {
      setIsSubmitting(true);
      
      const sessionId = sessionStorage.getItem(SESSION_KEY);
      const sentiment = calculateSentiment(rating, message);
      
      // Enrich context with device info
      const enrichedContext: FeedbackContext = {
        ...context,
        browser: navigator.userAgent,
        device: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ? "mobile" : "desktop",
        url: window.location.pathname,
        timestamp: new Date().toISOString(),
      };

      try {
        const { error } = await supabase.from("feedback").insert({
          user_id: user?.id || null,
          session_id: sessionId,
          feedback_type: type,
          rating,
          message,
          context: enrichedContext as Json,
          sentiment,
          page: window.location.pathname,
        } as any);

        if (error) throw error;

        // Track feedback count
        const count = parseInt(localStorage.getItem(FEEDBACK_COUNT_KEY) || "0", 10);
        localStorage.setItem(FEEDBACK_COUNT_KEY, (count + 1).toString());

        toast({
          title: "Thank you for your feedback!",
          description: "Your input helps us improve Conclusiv.",
        });

        return true;
      } catch (error) {
        console.error("Failed to submit feedback:", error);
        toast({
          title: "Failed to submit feedback",
          description: "Please try again later.",
          variant: "destructive",
        });
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [user?.id, toast]
  );

  const submitQuickRating = useCallback(
    async (rating: number, context?: FeedbackContext) => {
      return submitFeedback({
        type: "quick_rating",
        rating,
        context,
      });
    },
    [submitFeedback]
  );

  const submitNPS = useCallback(
    async (score: number, feedback?: string) => {
      localStorage.setItem(NPS_SHOWN_KEY, Date.now().toString());
      return submitFeedback({
        type: "nps",
        rating: score,
        message: feedback,
      });
    },
    [submitFeedback]
  );

  const submitDetailedFeedback = useCallback(
    async (message: string, rating?: number, context?: FeedbackContext) => {
      return submitFeedback({
        type: "detailed",
        rating,
        message,
        context,
      });
    },
    [submitFeedback]
  );

  const submitBugReport = useCallback(
    async (description: string, context?: FeedbackContext) => {
      return submitFeedback({
        type: "bug_report",
        message: description,
        context: {
          ...context,
          errorLogs: context?.errorsEncountered,
        },
      });
    },
    [submitFeedback]
  );

  const submitFeatureRequest = useCallback(
    async (description: string, context?: FeedbackContext) => {
      return submitFeedback({
        type: "feature_request",
        message: description,
        context,
      });
    },
    [submitFeedback]
  );

  // Check if NPS should be shown (after 3 uses, not shown in last 30 days)
  const shouldShowNPS = useCallback(() => {
    const usageCount = parseInt(localStorage.getItem("conclusiv_usage_count") || "0", 10);
    const lastNPSShown = localStorage.getItem(NPS_SHOWN_KEY);
    
    if (usageCount < 3) return false;
    
    if (lastNPSShown) {
      const daysSinceShown = (Date.now() - parseInt(lastNPSShown, 10)) / (1000 * 60 * 60 * 24);
      if (daysSinceShown < 30) return false;
    }
    
    return true;
  }, []);

  // Increment usage count
  const incrementUsageCount = useCallback(() => {
    const count = parseInt(localStorage.getItem("conclusiv_usage_count") || "0", 10);
    localStorage.setItem("conclusiv_usage_count", (count + 1).toString());
  }, []);

  return {
    isSubmitting,
    submitFeedback,
    submitQuickRating,
    submitNPS,
    submitDetailedFeedback,
    submitBugReport,
    submitFeatureRequest,
    shouldShowNPS,
    incrementUsageCount,
  };
};
