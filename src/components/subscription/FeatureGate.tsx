import { useState, ReactNode } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { UpgradePrompt, UpgradeTrigger } from './UpgradePrompt';
import { Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeatureGateProps {
  feature: UpgradeTrigger;
  children: ReactNode;
  fallback?: ReactNode;
  showLock?: boolean;
  className?: string;
}

export const FeatureGate = ({ 
  feature, 
  children, 
  fallback,
  showLock = true,
  className 
}: FeatureGateProps) => {
  const { isPro, limits, canBuild } = useSubscription();
  const [showUpgrade, setShowUpgrade] = useState(false);

  // Determine if feature is accessible
  const hasAccess = (() => {
    switch (feature) {
      case 'build_limit':
        return canBuild;
      case 'template':
        return isPro;
      case 'export':
        return limits.canExport;
      case 'icons':
        return limits.canChangeIcons;
      case 'themes':
        return limits.canChangeThemes;
      case 'reorder':
        return limits.canReorderSections;
      case 'presentation':
        return limits.fullPresentation;
      case 'sections':
        return isPro;
      default:
        return isPro;
    }
  })();

  if (hasAccess) {
    return <>{children}</>;
  }

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowUpgrade(true);
  };

  return (
    <>
      <div 
        className={cn('relative cursor-pointer', className)}
        onClick={handleClick}
      >
        {fallback || (
          <div className="opacity-50 pointer-events-none">
            {children}
          </div>
        )}
        {showLock && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-6 h-6 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center border border-border/50">
              <Lock className="w-3 h-3 text-muted-foreground" />
            </div>
          </div>
        )}
      </div>
      <UpgradePrompt
        trigger={feature}
        isOpen={showUpgrade}
        onClose={() => setShowUpgrade(false)}
      />
    </>
  );
};

// Hook for programmatic upgrade prompts
export const useFeatureGate = () => {
  const { isPro, limits, canBuild } = useSubscription();
  const [upgradePrompt, setUpgradePrompt] = useState<UpgradeTrigger | null>(null);

  const checkFeature = (feature: UpgradeTrigger): boolean => {
    switch (feature) {
      case 'build_limit':
        return canBuild;
      case 'template':
        return isPro;
      case 'export':
        return limits.canExport;
      case 'icons':
        return limits.canChangeIcons;
      case 'themes':
        return limits.canChangeThemes;
      case 'reorder':
        return limits.canReorderSections;
      case 'presentation':
        return limits.fullPresentation;
      case 'sections':
        return isPro;
      default:
        return isPro;
    }
  };

  const requireFeature = (feature: UpgradeTrigger): boolean => {
    if (checkFeature(feature)) return true;
    setUpgradePrompt(feature);
    return false;
  };

  const UpgradePromptComponent = upgradePrompt ? (
    <UpgradePrompt
      trigger={upgradePrompt}
      isOpen={true}
      onClose={() => setUpgradePrompt(null)}
    />
  ) : null;

  return {
    checkFeature,
    requireFeature,
    UpgradePromptComponent,
    isPro,
    canBuild,
    limits,
  };
};
