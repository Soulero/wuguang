"use client";

import { motion } from "framer-motion";
import {
  Crosshair,
  Lock,
  RotateCcw,
  Ruler,
  Unlock,
  RefreshCcw,
} from "lucide-react";
import type { OverlayPlacement } from "@/app/hooks";
import { Tooltip } from "@/app/components";

interface LayerControlsProps {
  placement: OverlayPlacement;
  hasOverlay: boolean;
  aspectLocked: boolean;
  onToggleAspectLocked: () => void;
  onPlacementChange: (updates: Partial<OverlayPlacement>) => void;
  onCenter: () => void;
  onResetRotation: () => void;
  onResetAll: () => void;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function LayerControls({
  placement,
  hasOverlay,
  aspectLocked,
  onToggleAspectLocked,
  onPlacementChange,
  onCenter,
  onResetRotation,
  onResetAll,
}: LayerControlsProps) {
  const rotation = clamp(placement.rotation, -180, 180);

  const ratio = placement.width > 0 ? placement.height / placement.width : 0.6;

  const setNumber = (key: keyof OverlayPlacement, raw: number) => {
    if (!Number.isFinite(raw)) return;

    if (aspectLocked && (key === "width" || key === "height")) {
      if (key === "width") {
        onPlacementChange({ width: raw, height: Math.max(8, raw * ratio) });
      } else {
        const w = Math.max(8, raw / Math.max(0.001, ratio));
        onPlacementChange({ width: w, height: raw });
      }
      return;
    }

    onPlacementChange({ [key]: raw } as Partial<OverlayPlacement>);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="glass-panel p-4 space-y-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-accent font-semibold text-xs uppercase tracking-wider">
          <Ruler className="w-3.5 h-3.5" />
          <span>图层调整</span>
        </div>

        <div className="flex items-center gap-1">
          <Tooltip content="自动对齐（居中）">
            <button
              onClick={onCenter}
              disabled={!hasOverlay}
              className="btn-ghost p-1.5 disabled:opacity-40"
              type="button"
            >
              <Crosshair className="w-4 h-4" />
            </button>
          </Tooltip>

          <Tooltip content={aspectLocked ? "已锁定比例（点击解锁）" : "已解锁比例（点击锁定）"}>
            <button
              onClick={onToggleAspectLocked}
              disabled={!hasOverlay}
              className={`btn-ghost p-1.5 disabled:opacity-40 ${aspectLocked ? "text-accent" : ""}`}
              type="button"
            >
              {aspectLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
            </button>
          </Tooltip>

          <Tooltip content="重置旋转">
            <button
              onClick={onResetRotation}
              disabled={!hasOverlay}
              className="btn-ghost p-1.5 disabled:opacity-40"
              type="button"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </Tooltip>

          <Tooltip content="全部重置">
            <button
              onClick={onResetAll}
              disabled={!hasOverlay}
              className="btn-ghost p-1.5 disabled:opacity-40"
              type="button"
            >
              <RefreshCcw className="w-4 h-4" />
            </button>
          </Tooltip>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] text-foreground/45">
            <span>X</span>
            <span className="font-mono text-foreground/70">{Math.round(placement.x)}</span>
          </div>
          <input
            type="number"
            value={Math.round(placement.x)}
            onChange={(e) => setNumber("x", Number(e.target.value))}
            disabled={!hasOverlay}
            className="input-field h-9 text-sm"
          />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-[11px] text-foreground/45">
            <span>Y</span>
            <span className="font-mono text-foreground/70">{Math.round(placement.y)}</span>
          </div>
          <input
            type="number"
            value={Math.round(placement.y)}
            onChange={(e) => setNumber("y", Number(e.target.value))}
            disabled={!hasOverlay}
            className="input-field h-9 text-sm"
          />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-[11px] text-foreground/45">
            <span>宽度</span>
            <span className="font-mono text-foreground/70">{Math.round(placement.width)}px</span>
          </div>
          <input
            type="range"
            min={20}
            max={1200}
            value={placement.width}
            onChange={(e) => setNumber("width", Number(e.target.value))}
            disabled={!hasOverlay}
            className="w-full h-1.5 bg-border rounded-full appearance-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-[11px] text-foreground/45">
            <span>高度</span>
            <span className="font-mono text-foreground/70">{Math.round(placement.height)}px</span>
          </div>
          <input
            type="range"
            min={20}
            max={1200}
            value={placement.height}
            onChange={(e) => setNumber("height", Number(e.target.value))}
            disabled={!hasOverlay}
            className="w-full h-1.5 bg-border rounded-full appearance-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-[11px] text-foreground/45">
          <span>旋转</span>
          <span className="font-mono text-foreground/70">{Math.round(rotation)}°</span>
        </div>
        <input
          type="range"
          min={-180}
          max={180}
          value={rotation}
          onChange={(e) => setNumber("rotation", Number(e.target.value))}
          disabled={!hasOverlay}
          className="w-full h-1.5 bg-border rounded-full appearance-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        />
      </div>

      <div className="text-[11px] text-foreground/45">
        拖拽图层可调整位置；方向键微调（Shift 加速）
      </div>
    </motion.div>
  );
}
