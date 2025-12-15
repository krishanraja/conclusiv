import { useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { Json } from "@/integrations/supabase/types";

type EventType = 
  | "navigation" 
  | "input" 
  | "refinement" 
  | "preview" 
  | "presentation" 
  | "subscription" 
  | "error"
  | "engagement";

interface EventData {
  [key: string]: string | number | boolean | null | undefined;
}

interface DeviceInfo {
  [key: string]: string | number | boolean;
  userAgent: string;
  language: string;
  platform: string;
  screenWidth: number;
  screenHeight: number;
  isMobile: boolean;
}

const getDeviceInfo = (): DeviceInfo => ({
  userAgent: navigator.userAgent,
  language: navigator.language,
  platform: navigator.platform,
  screenWidth: window.screen.width,
  screenHeight: window.screen.height,
  isMobile: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent),
});

const generateSessionId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
};

const SESSION_KEY = "conclusiv_session_id";
const SESSION_START_KEY = "conclusiv_session_start";

export const useAnalytics = () => {
  const { user } = useAuth();
  const eventQueueRef = useRef<Array<{
    event_type: EventType;
    event_name: string;
    event_data: EventData;
    page: string;
    step?: string;
  }>>([]);
  const flushTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get or create session ID
  const getSessionId = useCallback((): string => {
    let sessionId = sessionStorage.getItem(SESSION_KEY);
    if (!sessionId) {
      sessionId = generateSessionId();
      sessionStorage.setItem(SESSION_KEY, sessionId);
      sessionStorage.setItem(SESSION_START_KEY, Date.now().toString());
      
      // Create session in database (pass user?.id directly to avoid stale closure)
      createSession(sessionId, user?.id);
    }
    return sessionId;
  }, [user?.id]);

  const createSession = async (sessionId: string, userId: string | undefined) => {
    const deviceInfo = getDeviceInfo();
    try {
      await supabase.from("analytics_sessions").insert({
        session_id: sessionId,
        user_id: userId || null,
        device: deviceInfo.isMobile ? "mobile" : "desktop",
        browser: getBrowserName(deviceInfo.userAgent),
        referrer: document.referrer || null,
        pages_viewed: 0,
      });
    } catch (error) {
      console.error("Failed to create analytics session:", error);
    }
  };

  const getBrowserName = (userAgent: string): string => {
    if (userAgent.includes("Chrome")) return "Chrome";
    if (userAgent.includes("Firefox")) return "Firefox";
    if (userAgent.includes("Safari")) return "Safari";
    if (userAgent.includes("Edge")) return "Edge";
    return "Other";
  };

  // Flush events to database
  const flushEvents = useCallback(async () => {
    if (eventQueueRef.current.length === 0) return;

    const events = [...eventQueueRef.current];
    eventQueueRef.current = [];

    const sessionId = getSessionId();
    const deviceInfo = getDeviceInfo();

    try {
      const eventsToInsert = events.map((event) => ({
        user_id: user?.id || null,
        session_id: sessionId,
        event_type: event.event_type,
        event_name: event.event_name,
        event_data: event.event_data as Json,
        page: event.page,
        step: event.step || null,
        device_info: deviceInfo as Json,
      }));

      const { error } = await supabase.from("analytics_events").insert(eventsToInsert);
      
      if (error) {
        console.error("Failed to flush analytics events:", error);
        // Re-add events to queue on failure
        eventQueueRef.current = [...events, ...eventQueueRef.current];
      }
    } catch (error) {
      console.error("Failed to flush analytics events (exception):", error);
      // Re-add events to queue on failure
      eventQueueRef.current = [...events, ...eventQueueRef.current];
    }
  }, [user?.id, getSessionId]);

  // Track an event
  const trackEvent = useCallback(
    (
      eventType: EventType,
      eventName: string,
      eventData: EventData = {},
      step?: string
    ) => {
      eventQueueRef.current.push({
        event_type: eventType,
        event_name: eventName,
        event_data: eventData,
        page: window.location.pathname,
        step,
      });

      // Clear existing timeout
      if (flushTimeoutRef.current) {
        clearTimeout(flushTimeoutRef.current);
      }

      // Flush after 3 seconds of inactivity or when queue reaches 10 events
      if (eventQueueRef.current.length >= 10) {
        flushEvents();
      } else {
        flushTimeoutRef.current = setTimeout(flushEvents, 3000);
      }
    },
    [flushEvents]
  );

  // Convenience methods for common events
  const trackPageView = useCallback(
    (page: string) => {
      trackEvent("navigation", "page_view", { page });
    },
    [trackEvent]
  );

  const trackStepChange = useCallback(
    (fromStep: string, toStep: string) => {
      trackEvent("navigation", "step_change", { from: fromStep, to: toStep }, toStep);
    },
    [trackEvent]
  );

  const trackInputAction = useCallback(
    (action: string, data: EventData = {}) => {
      trackEvent("input", action, data, "input");
    },
    [trackEvent]
  );

  const trackRefinementAction = useCallback(
    (action: string, data: EventData = {}) => {
      trackEvent("refinement", action, data, "refine");
    },
    [trackEvent]
  );

  const trackPreviewAction = useCallback(
    (action: string, data: EventData = {}) => {
      trackEvent("preview", action, data, "preview");
    },
    [trackEvent]
  );

  const trackPresentationAction = useCallback(
    (action: string, data: EventData = {}) => {
      trackEvent("presentation", action, data, "present");
    },
    [trackEvent]
  );

  const trackSubscriptionAction = useCallback(
    (action: string, data: EventData = {}) => {
      trackEvent("subscription", action, data);
    },
    [trackEvent]
  );

  const trackError = useCallback(
    (errorType: string, errorMessage: string, context: EventData = {}) => {
      trackEvent("error", errorType, { message: errorMessage, ...context });
    },
    [trackEvent]
  );

  // Flush on unmount and page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      flushEvents();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      if (flushTimeoutRef.current) {
        clearTimeout(flushTimeoutRef.current);
      }
      flushEvents();
    };
  }, [flushEvents]);

  return {
    trackEvent,
    trackPageView,
    trackStepChange,
    trackInputAction,
    trackRefinementAction,
    trackPreviewAction,
    trackPresentationAction,
    trackSubscriptionAction,
    trackError,
    getSessionId,
  };
};
