import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface TrackingOptions {
  shareId: string;
  narrativeId?: string;
  sectionCount?: number;
}

export const useAnalyticsTracker = (options: TrackingOptions) => {
  const { shareId, narrativeId, sectionCount = 0 } = options;
  const sessionId = useRef<string>(crypto.randomUUID());
  const startTime = useRef<number>(Date.now());
  const currentSection = useRef<number>(0);
  const sectionStartTime = useRef<number>(Date.now());
  const viewTracked = useRef<boolean>(false);

  // Get device info
  const getDeviceInfo = useCallback(() => {
    const ua = navigator.userAgent;
    let device = "Desktop";
    if (/Mobi|Android/i.test(ua)) device = "Mobile";
    else if (/Tablet|iPad/i.test(ua)) device = "Tablet";

    let browser = "Unknown";
    if (ua.includes("Chrome")) browser = "Chrome";
    else if (ua.includes("Safari")) browser = "Safari";
    else if (ua.includes("Firefox")) browser = "Firefox";
    else if (ua.includes("Edge")) browser = "Edge";

    return { device, browser };
  }, []);

  // Track an event
  const trackEvent = useCallback(async (
    eventType: string,
    sectionIndex?: number,
    timeSpentSeconds?: number
  ) => {
    try {
      await supabase
        .from("presentation_analytics")
        .insert({
          narrative_id: narrativeId || null,
          share_id: shareId,
          session_id: sessionId.current,
          event_type: eventType,
          section_index: sectionIndex ?? null,
          time_spent_seconds: timeSpentSeconds ?? null,
          device_info: getDeviceInfo(),
        });
    } catch (err) {
      console.error("[Analytics] Failed to track event:", err);
    }
  }, [shareId, narrativeId, getDeviceInfo]);

  // Track initial view
  useEffect(() => {
    if (!shareId || viewTracked.current) return;
    viewTracked.current = true;
    
    trackEvent("view");
    startTime.current = Date.now();
    sectionStartTime.current = Date.now();
  }, [shareId, trackEvent]);

  // Track section changes
  const trackSectionView = useCallback((sectionIndex: number) => {
    // Track time spent on previous section
    const timeSpent = Math.round((Date.now() - sectionStartTime.current) / 1000);
    if (timeSpent > 2) {
      trackEvent("section_view", currentSection.current, timeSpent);
    }

    currentSection.current = sectionIndex;
    sectionStartTime.current = Date.now();

    // Track completion if reached last section
    if (sectionCount > 0 && sectionIndex === sectionCount - 1) {
      trackEvent("complete");
    }
  }, [trackEvent, sectionCount]);

  // Track total time on unmount
  useEffect(() => {
    return () => {
      const totalTime = Math.round((Date.now() - startTime.current) / 1000);
      if (totalTime > 5) {
        trackEvent("time_spent", undefined, totalTime);
      }
    };
  }, [trackEvent]);

  // Track visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        const timeSpent = Math.round((Date.now() - sectionStartTime.current) / 1000);
        if (timeSpent > 2) {
          trackEvent("section_view", currentSection.current, timeSpent);
        }
      } else {
        sectionStartTime.current = Date.now();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [trackEvent]);

  return {
    sessionId: sessionId.current,
    trackSectionView,
    trackEvent,
  };
};