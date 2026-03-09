import { useState, useEffect } from 'react';
import {
  calculateTrustLevel,
  isFeatureUnlocked,
  type TrustLevel,
} from '@/lib/trust/progressiveTrustEngine';

export function useTrust() {
  const [trustLevel, setTrustLevel] = useState<TrustLevel>('seed');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    calculateTrustLevel().then(level => {
      setTrustLevel(level);
      setLoading(false);
    });
  }, []);

  const checkFeature = (feature: string): boolean => {
    return isFeatureUnlocked(feature, trustLevel);
  };

  return {
    trustLevel,
    loading,
    checkFeature,
  };
}
