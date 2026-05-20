import { useEffect, useMemo, useState } from "react";
import {
  featureEventMatches,
  isFeatureBlockedLocally,
  type FeatureKey,
} from "@/config/featureKeys";

export function useFeatureGate(featureKey: FeatureKey) {
  const [isDisabled, setIsDisabled] = useState(() => isFeatureBlockedLocally(featureKey));

  useEffect(() => {
    setIsDisabled(isFeatureBlockedLocally(featureKey));

    const handleFeatureBlocked = (event: Event) => {
      const detail = (event as CustomEvent<any>).detail || {};
      if (featureEventMatches(featureKey, detail)) {
        setIsDisabled(true);
      }
    };

    const handleStorage = () => {
      setIsDisabled(isFeatureBlockedLocally(featureKey));
    };

    window.addEventListener("feature-blocked", handleFeatureBlocked as EventListener);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("feature-blocked", handleFeatureBlocked as EventListener);
      window.removeEventListener("storage", handleStorage);
    };
  }, [featureKey]);

  return useMemo(
    () => ({
      isDisabled,
    }),
    [isDisabled],
  );
}
