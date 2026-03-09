import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { useTrust } from '@/hooks/useTrust';
import { trustLevelMap } from '@/lib/trust/progressiveTrustEngine';
import { featureGates } from '@/lib/trust/progressiveTrustEngine';
import { Lock } from 'lucide-react';

interface FeatureGateProps {
  feature: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export function FeatureGate({ feature, children, fallback }: FeatureGateProps) {
  const { checkFeature, trustLevel } = useTrust();

  if (checkFeature(feature)) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  const requiredLevel = featureGates[feature];
  const config = requiredLevel ? trustLevelMap[requiredLevel] : null;

  return (
    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border/50">
      <Lock className="w-4 h-4 text-muted-foreground" />
      <div className="text-xs text-muted-foreground">
        {config ? `${config.emoji} Unlocks at ${config.labelKey} level` : 'Feature locked'}
      </div>
    </div>
  );
}
