"use client";

import { forwardRef } from "react";
import { motion } from "framer-motion";
import { ImageIcon, Upload } from "lucide-react";

interface CanvasStageProps {
  baseImage: string | null;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onOpenFilePicker: () => void;
  onImageLoad?: () => void;
  children?: React.ReactNode;
}

export const CanvasStage = forwardRef<HTMLImageElement, CanvasStageProps>(
  function CanvasStage(
    { baseImage, onDragOver, onDrop, onOpenFilePicker, onImageLoad, children },
    ref
  ) {
    return (
      <div
        className={`canvas-container flex-1 min-h-[500px] flex items-center justify-center transition-all duration-300 ${
          !baseImage ? "bg-gradient-to-br from-surface/50 to-background" : ""
        }`}
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        {!baseImage ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center p-8"
          >
            <motion.div
              className="w-24 h-24 rounded-3xl bg-gradient-to-br from-accent/10 to-accent/5 
                         flex items-center justify-center mx-auto mb-6 shadow-lg"
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <ImageIcon className="w-12 h-12 text-accent" />
            </motion.div>
            <h3 className="text-xl font-bold text-foreground mb-2">
              拖入图片开始创作
            </h3>
            <p className="text-foreground/40 mb-6 text-sm">
              支持 JPG、PNG 格式
            </p>
            <button onClick={onOpenFilePicker} className="btn-secondary px-6 py-3">
              <Upload className="w-4 h-4" />
              <span>选择本地文件</span>
            </button>
          </motion.div>
        ) : (
          <div className="relative inline-block">
            <img
              ref={ref}
              src={baseImage}
              alt="原图"
              className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-lg"
              style={{ pointerEvents: "none" }}
              onLoad={onImageLoad}
            />
            {children}
          </div>
        )}
      </div>
    );
  }
);
