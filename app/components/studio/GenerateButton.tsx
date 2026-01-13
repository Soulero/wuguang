"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

interface GenerateButtonProps {
  onClick: () => void;
  isProcessing: boolean;
  disabled: boolean;
}

export function GenerateButton({ onClick, isProcessing, disabled }: GenerateButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled || isProcessing}
      className="btn-primary-lg w-full h-16 text-lg font-bold"
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
    >
      {isProcessing ? (
        <>
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin-slow" />
          <span>生成中...</span>
        </>
      ) : (
        <>
          <Sparkles className="w-5 h-5" />
          <span>立即生成</span>
        </>
      )}
    </motion.button>
  );
}
