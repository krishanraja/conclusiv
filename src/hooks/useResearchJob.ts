import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface ResearchJob {
  id: string;
  user_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  query: string;
  depth: string;
  subject: string | null;
  decision_type: string | null;
  audience: string | null;
  results: {
    summary: string;
    keyFindings: string[];
    citations: { url: string; title: string }[];
    rawContent: string;
  } | null;
  error: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

interface UseResearchJobOptions {
  onComplete?: (job: ResearchJob) => void;
  onError?: (error: string) => void;
}

export function useResearchJob(options: UseResearchJobOptions = {}) {
  const { user } = useAuth();
  const [currentJob, setCurrentJob] = useState<ResearchJob | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup intervals
  const cleanup = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  // Poll for job status
  const pollJobStatus = useCallback(async (jobId: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('research_jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (error) {
        console.error('[useResearchJob] Poll error:', error);
        return;
      }

      // Cast the data to our ResearchJob type
      const job = data as unknown as ResearchJob;
      setCurrentJob(job);

      if (job.status === 'completed') {
        cleanup();
        options.onComplete?.(job);
      } else if (job.status === 'failed') {
        cleanup();
        options.onError?.(job.error || 'Research failed');
      }
    } catch (err) {
      console.error('[useResearchJob] Poll error:', err);
    }
  }, [user, cleanup, options]);

  // Start polling for a job
  const startPolling = useCallback((jobId: string) => {
    cleanup();
    setIsPolling(true);
    setElapsedTime(0);

    // Immediate first poll
    pollJobStatus(jobId);

    // Poll every 3 seconds
    pollIntervalRef.current = setInterval(() => {
      pollJobStatus(jobId);
    }, 3000);

    // Update elapsed time every second
    timerIntervalRef.current = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
  }, [cleanup, pollJobStatus]);

  // Create a new research job
  const createJob = useCallback(async (params: {
    query: string;
    depth: 'quick' | 'deep';
    subject?: string;
    decisionType?: string;
    audience?: string;
  }): Promise<ResearchJob | null> => {
    if (!user) {
      options.onError?.('You must be logged in to start research');
      return null;
    }

    try {
      // Insert the job
      const { data, error } = await supabase
        .from('research_jobs')
        .insert({
          user_id: user.id,
          query: params.query,
          depth: params.depth,
          subject: params.subject || null,
          decision_type: params.decisionType || null,
          audience: params.audience || null,
          status: 'pending',
        })
        .select()
        .single();

      if (error) {
        console.error('[useResearchJob] Create error:', error);
        options.onError?.(error.message);
        return null;
      }

      const job = data as unknown as ResearchJob;
      setCurrentJob(job);

      // Start background processing
      triggerJobProcessing(job.id);

      // Start polling
      startPolling(job.id);

      return job;
    } catch (err) {
      console.error('[useResearchJob] Create error:', err);
      options.onError?.(err instanceof Error ? err.message : 'Failed to create job');
      return null;
    }
  }, [user, options, startPolling]);

  // Trigger the edge function to process the job
  const triggerJobProcessing = async (jobId: string) => {
    try {
      const { error } = await supabase.functions.invoke('guided-research', {
        body: { phase: 'process-job', jobId }
      });
      
      if (error) {
        console.error('[useResearchJob] Trigger error:', error);
        options.onError?.(error.message || 'Failed to trigger research job');
        // Job will be picked up by retry logic or show as failed
      }
    } catch (err) {
      console.error('[useResearchJob] Trigger exception:', err);
      options.onError?.(err instanceof Error ? err.message : 'Failed to trigger research job');
      // Job will be picked up by retry logic or show as failed
    }
  };

  // Check for existing pending/processing jobs on mount
  const checkExistingJobs = useCallback(async () => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('research_jobs')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['pending', 'processing'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) return null;

      const job = data as unknown as ResearchJob;
      setCurrentJob(job);
      startPolling(job.id);
      return job;
    } catch (err) {
      return null;
    }
  }, [user, startPolling]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // Format elapsed time
  const formatElapsedTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  return {
    currentJob,
    isPolling,
    elapsedTime,
    formattedElapsedTime: formatElapsedTime(elapsedTime),
    createJob,
    checkExistingJobs,
    cancelPolling: cleanup,
  };
}