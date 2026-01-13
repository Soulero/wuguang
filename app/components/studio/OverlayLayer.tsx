"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import Moveable from "react-moveable";
import type { OverlayPlacement } from "@/app/hooks/useOverlayTransform";

interface OverlayLayerProps {
  overlayImage: string;
  placement: OverlayPlacement;
  displayScale: number;
  onPlacementChange: (updates: Partial<OverlayPlacement>) => void;
}

export function OverlayLayer({
  overlayImage,
  placement,
  displayScale,
  onPlacementChange,
}: OverlayLayerProps) {
  const targetRef = useRef<HTMLDivElement>(null);
  const [isSelected, setIsSelected] = useState(true);

  const scaledX = placement.x * displayScale;
  const scaledY = placement.y * displayScale;
  const scaledWidth = placement.width * displayScale;
  const scaledHeight = placement.height * displayScale;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isSelected) return;
      
      const step = e.shiftKey ? 10 : 1;
      let dx = 0;
      let dy = 0;

      switch (e.key) {
        case "ArrowUp":
          dy = -step;
          break;
        case "ArrowDown":
          dy = step;
          break;
        case "ArrowLeft":
          dx = -step;
          break;
        case "ArrowRight":
          dx = step;
          break;
        default:
          return;
      }

      e.preventDefault();
      onPlacementChange({
        x: placement.x + dx,
        y: placement.y + dy,
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSelected, placement.x, placement.y, onPlacementChange]);

  const handleClick = useCallback(() => {
    setIsSelected(true);
  }, []);

  return (
    <>
      <div
        ref={targetRef}
        className="absolute cursor-move"
        style={{
          left: scaledX,
          top: scaledY,
          width: scaledWidth,
          height: scaledHeight,
          transform: `rotate(${placement.rotation}deg)`,
          transformOrigin: "center center",
        }}
        onClick={handleClick}
      >
        <img
          src={overlayImage}
          alt="叠加图层"
          className="w-full h-full object-contain pointer-events-none drop-shadow-xl"
          draggable={false}
        />
      </div>

      {isSelected && targetRef.current && (
        <Moveable
          target={targetRef.current}
          draggable={true}
          resizable={true}
          rotatable={true}
          keepRatio={true}
          throttleDrag={0}
          throttleResize={0}
          throttleRotate={0}
          snappable={true}
          snapCenter={true}
          origin={false}
          padding={{ left: 0, top: 0, right: 0, bottom: 0 }}
          onDrag={({ beforeTranslate }) => {
            const [dx, dy] = beforeTranslate;
            onPlacementChange({
              x: (scaledX + dx) / displayScale,
              y: (scaledY + dy) / displayScale,
            });
          }}
          onResize={({ width, height, drag }) => {
            const [dx, dy] = drag.beforeTranslate;
            onPlacementChange({
              width: width / displayScale,
              height: height / displayScale,
              x: (scaledX + dx) / displayScale,
              y: (scaledY + dy) / displayScale,
            });
          }}
          onRotate={({ beforeRotate }) => {
            onPlacementChange({
              rotation: beforeRotate,
            });
          }}
        />
      )}
    </>
  );
}
