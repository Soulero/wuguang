"use client";

import { useCallback, useMemo, useState } from "react";

export interface OverlayPlacement {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

const defaultPlacement: OverlayPlacement = {
  x: 100,
  y: 100,
  width: 200,
  height: 200,
  rotation: 0,
};

export function useOverlayTransform(baseImageSize: { w: number; h: number }) {
  const [placement, setPlacement] = useState<OverlayPlacement>(defaultPlacement);

  const updatePlacement = useCallback((updates: Partial<OverlayPlacement>) => {
    setPlacement((prev) => ({ ...prev, ...updates }));
  }, []);

  const resetRotation = useCallback(() => {
    setPlacement((prev) => ({ ...prev, rotation: 0 }));
  }, []);

  const resetAll = useCallback(() => {
    setPlacement(defaultPlacement);
  }, []);

  const centerOverlay = useCallback(() => {
    if (baseImageSize.w > 0 && baseImageSize.h > 0) {
      setPlacement((prev) => ({
        ...prev,
        x: (baseImageSize.w - prev.width) / 2,
        y: (baseImageSize.h - prev.height) / 2,
      }));
    }
  }, [baseImageSize.h, baseImageSize.w]);

  const isValid = useMemo(() => {
    return (
      Number.isFinite(placement.x) &&
      Number.isFinite(placement.y) &&
      placement.width > 0 &&
      placement.height > 0
    );
  }, [placement.height, placement.width, placement.x, placement.y]);

  return {
    placement,
    setPlacement,
    updatePlacement,
    resetRotation,
    resetAll,
    centerOverlay,
    isValid,
  };
}
