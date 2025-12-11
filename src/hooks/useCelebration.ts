import { useState, useCallback } from "react";

export type CelebrationType = "confetti" | "mini" | "achievement";

interface CelebrationState {
  confetti: boolean;
  mini: boolean;
  achievement: { show: boolean; message: string; icon?: string };
}

export const useCelebration = () => {
  const [state, setState] = useState<CelebrationState>({
    confetti: false,
    mini: false,
    achievement: { show: false, message: "" },
  });

  const triggerConfetti = useCallback(() => {
    setState((prev) => ({ ...prev, confetti: true }));
    setTimeout(() => {
      setState((prev) => ({ ...prev, confetti: false }));
    }, 3500);
  }, []);

  const triggerMini = useCallback(() => {
    setState((prev) => ({ ...prev, mini: true }));
    setTimeout(() => {
      setState((prev) => ({ ...prev, mini: false }));
    }, 1500);
  }, []);

  const triggerAchievement = useCallback((message: string, icon?: string) => {
    setState((prev) => ({
      ...prev,
      achievement: { show: true, message, icon },
    }));
    setTimeout(() => {
      setState((prev) => ({
        ...prev,
        achievement: { show: false, message: "", icon: undefined },
      }));
    }, 4000);
  }, []);

  const celebrate = useCallback((type: CelebrationType, options?: { message?: string; icon?: string }) => {
    switch (type) {
      case "confetti":
        triggerConfetti();
        break;
      case "mini":
        triggerMini();
        break;
      case "achievement":
        if (options?.message) {
          triggerAchievement(options.message, options.icon);
        }
        break;
    }
  }, [triggerConfetti, triggerMini, triggerAchievement]);

  return {
    ...state,
    celebrate,
    triggerConfetti,
    triggerMini,
    triggerAchievement,
  };
};
