import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const ONBOARDING_STORAGE_KEY = "conclusiv_onboarding";
const TOTAL_STEPS = 5;

interface OnboardingState {
  isFirstTime: boolean;
  isActive: boolean;
  currentStep: number;
  totalSteps: number;
  startOnboarding: () => void;
  completeStep: () => void;
  goToStep: (step: number) => void;
  skipOnboarding: () => void;
  resetOnboarding: () => void;
}

export const useOnboarding = (): OnboardingState => {
  const { user } = useAuth();
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  // Check onboarding status on mount
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (user) {
        // Check database for authenticated users
        const { data } = await supabase
          .from('profiles')
          .select('onboarding_completed, onboarding_step')
          .eq('id', user.id)
          .single();

        if (data) {
          setIsFirstTime(!data.onboarding_completed);
          setCurrentStep(data.onboarding_step || 0);
        } else {
          setIsFirstTime(true);
        }
      } else {
        // Check localStorage for anonymous users
        const stored = localStorage.getItem(ONBOARDING_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setIsFirstTime(!parsed.completed);
          setCurrentStep(parsed.step || 0);
        } else {
          setIsFirstTime(true);
        }
      }
      setIsLoaded(true);
    };

    checkOnboardingStatus();
  }, [user]);

  // Auto-start onboarding for first-time users (after loading)
  useEffect(() => {
    if (isLoaded && isFirstTime && !isActive) {
      // Small delay for smoother UX
      const timer = setTimeout(() => setIsActive(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [isLoaded, isFirstTime, isActive]);

  const saveProgress = useCallback(async (step: number, completed: boolean) => {
    if (user) {
      await supabase
        .from('profiles')
        .update({
          onboarding_step: step,
          onboarding_completed: completed,
        })
        .eq('id', user.id);
    } else {
      localStorage.setItem(
        ONBOARDING_STORAGE_KEY,
        JSON.stringify({ step, completed })
      );
    }
  }, [user]);

  const startOnboarding = useCallback(() => {
    setIsActive(true);
    setCurrentStep(0);
  }, []);

  const completeStep = useCallback(() => {
    const nextStep = currentStep + 1;
    if (nextStep >= TOTAL_STEPS) {
      // Onboarding complete
      setIsActive(false);
      setIsFirstTime(false);
      saveProgress(TOTAL_STEPS, true);
    } else {
      setCurrentStep(nextStep);
      saveProgress(nextStep, false);
    }
  }, [currentStep, saveProgress]);

  const goToStep = useCallback((step: number) => {
    if (step >= 0 && step < TOTAL_STEPS) {
      setCurrentStep(step);
      saveProgress(step, false);
    }
  }, [saveProgress]);

  const skipOnboarding = useCallback(() => {
    setIsActive(false);
    setIsFirstTime(false);
    saveProgress(TOTAL_STEPS, true);
  }, [saveProgress]);

  const resetOnboarding = useCallback(() => {
    setIsFirstTime(true);
    setCurrentStep(0);
    setIsActive(true);
    saveProgress(0, false);
  }, [saveProgress]);

  return {
    isFirstTime,
    isActive,
    currentStep,
    totalSteps: TOTAL_STEPS,
    startOnboarding,
    completeStep,
    goToStep,
    skipOnboarding,
    resetOnboarding,
  };
};