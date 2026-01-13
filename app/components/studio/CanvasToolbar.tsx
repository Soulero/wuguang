"use client";

import { ZoomIn, ZoomOut, Maximize2, Hand } from "lucide-react";

interface CanvasToolbarProps {
  zoomPercent: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  onFit: () => void;
  panMode: boolean;
  onTogglePanMode: () => void;
}

export function CanvasToolbar({
  zoomPercent,
  onZoomIn,
  onZoomOut,
  onResetView,
  onFit,
  panMode,
  onTogglePanMode,
}: CanvasToolbarProps) {
  return (
    <div className="glass-panel px-3 py-2 rounded-full flex items-center gap-2 shadow-lg">
      <button className="btn-ghost px-2" onClick={onZoomOut} title="缩小">
        <ZoomOut className="w-4 h-4" />
      </button>
      <button className="btn-ghost px-2 font-mono text-xs" onClick={onResetView} title="重置视图">
        {zoomPercent}%
      </button>
      <button className="btn-ghost px-2" onClick={onZoomIn} title="放大">
        <ZoomIn className="w-4 h-4" />
      </button>

      <div className="w-px h-6 bg-foreground/10 mx-1" />

      <button className="btn-ghost px-2" onClick={onFit} title="适配屏幕">
        <Maximize2 className="w-4 h-4" />
      </button>

      <button
        className={`btn-ghost px-2 ${panMode ? "text-accent" : ""}`}
        onClick={onTogglePanMode}
        title="平移模式"
      >
        <Hand className="w-4 h-4" />
      </button>
    </div>
  );
}
