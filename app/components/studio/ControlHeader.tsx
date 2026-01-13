"use client";

import { motion } from "framer-motion";

interface ControlHeaderProps {
  customPromptMode: boolean;
  onToggleCustomPromptMode: () => void;
}

export function ControlHeader({
  customPromptMode,
  onToggleCustomPromptMode,
}: ControlHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex items-center justify-between"
    >
      <div>
        <h2 className="text-base font-bold text-foreground">控制台</h2>
        <p className="text-xs text-foreground/50">生成透明叠加图层，原图像素保持不变</p>
      </div>

      <button
        onClick={onToggleCustomPromptMode}
        className={`tag px-3 py-1.5 text-[11px] ${customPromptMode ? "bg-accent/10 border-accent/30 text-accent-dark" : ""}`}
      >
        {customPromptMode ? "自定义 Prompt" : "切换自定义"}
      </button>
    </motion.div>
  );
}
