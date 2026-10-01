import { useEffect, useState } from "react";
import { getQuality, subscribeQuality } from "@/lib/quality";

/**
 * Subscribes to the quality budget.
 *
 * `getQuality()` alone is a module singleton and will never re-render. That is
 * correct for the WebGL layer, which reads it per frame, but the DOM needs to
 * react when `PerformanceMonitor` downgrades a tier — otherwise the telemetry
 * panel would report a budget the renderer is no longer using, which is exactly
 * the kind of unverified claim this page exists to avoid.
 */
export function useQuality() {
  const [budget, setBudget] = useState(getQuality);

  useEffect(() => {
    const sync = () => setBudget(getQuality());
    const unsubscribe = subscribeQuality(sync);
    sync();
    return unsubscribe;
  }, []);

  return budget;
}
