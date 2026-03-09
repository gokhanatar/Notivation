import { useState, useEffect } from 'react';
import { calculateOpenLoops, type OpenLoopsResult } from '@/lib/openLoops/openLoopsEngine';

export function useOpenLoops() {
  const [data, setData] = useState<OpenLoopsResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    calculateOpenLoops().then(result => {
      setData(result);
      setLoading(false);
    });
  }, []);

  const refresh = () => {
    setLoading(true);
    calculateOpenLoops().then(result => {
      setData(result);
      setLoading(false);
    });
  };

  return { data, loading, refresh };
}
