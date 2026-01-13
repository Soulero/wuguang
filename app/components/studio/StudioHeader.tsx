"use client";

import { motion } from "framer-motion";
import { Sparkles, RotateCcw, HelpCircle } from "lucide-react";

interface StudioHeaderProps {
  hasImage: boolean;
  hasOverlay: boolean;
  isProcessing: boolean;
  onReset: () => void;
}

export function StudioHeader({
  hasImage,
  hasOverlay,
  isProcessing,
  onReset,
}: StudioHeaderProps) {
  const statusText = isProcessing
    ? "生成中..."
    : hasOverlay
      ? "可调整图层"
      : hasImage
        ? "已上传图片"
        : "等待上传";

  const statusDot = isProcessing
    ? "bg-warning"
    : hasOverlay
      ? "bg-success"
      : hasImage
        ? "bg-accent"
        : "bg-foreground/20";

  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-panel px-4 py-2 rounded-full flex items-center justify-between gap-4"
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center shadow-glow">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div className="flex items-center gap-2">
          <span className="font-bold text-foreground">雾光AI工作室</span>
          <span className="text-foreground/20">·</span>
          <div className={`w-1.5 h-1.5 rounded-full ${statusDot}`} />
          <span className="text-xs text-foreground/55">{statusText}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {hasImage ? (
          <motion.button
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={onReset}
            className="btn-ghost text-sm"
          >
            <RotateCcw className="w-4 h-4" />
            <span>重置</span>
          </motion.button>
        ) : null}
        <button className="btn-ghost text-sm">
          <HelpCircle className="w-4 h-4" />
          <span>帮助</span>
        </button>
      </div>
    </motion.header>
  );
}
