"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface Placement {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

interface ImageCanvasProps {
  baseImage: string | null;
  overlayImage: string | null;
  placement: Placement;
  onPlacementChange: (p: Placement) => void;
  isProcessing: boolean;
}

export const ImageCanvas = ({
  baseImage,
  overlayImage,
  placement,
  onPlacementChange,
  isProcessing,
}: ImageCanvasProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [dragTarget, setDragTarget] = useState<"canvas" | "overlay" | null>(
    null
  );

  // 初始化 Canvas 尺寸
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !baseImage) return;

    const img = new Image();
    img.src = baseImage;
    img.onload = () => {
      // 设置 canvas 实际像素尺寸 = 图片尺寸
      canvas.width = img.width;
      canvas.height = img.height;
      
      // 初始自适应缩放
      if (containerRef.current) {
        const container = containerRef.current;
        const scaleX = (container.clientWidth - 40) / img.width;
        const scaleY = (container.clientHeight - 40) / img.height;
        setScale(Math.min(scaleX, scaleY, 1));
      }
      draw();
    };
  }, [baseImage]);

  // 绘制循环
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !baseImage) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. 绘制原图
    const baseImg = new Image();
    baseImg.src = baseImage;
    // 这里应该是同步绘制，但在 React effect 中可能导致闪烁，实际生产中应缓存 Image 对象
    // 简化处理：假设已缓存或浏览器缓存
    if (baseImg.complete) {
        ctx.drawImage(baseImg, 0, 0);
    } else {
        baseImg.onload = () => ctx.drawImage(baseImg, 0, 0);
    }

    // 2. 绘制 overlay
    if (overlayImage) {
      const overlay = new Image();
      overlay.src = overlayImage;
      
      const drawOverlay = () => {
          ctx.save();
          
          // 确保正确处理透明度
          ctx.globalCompositeOperation = 'source-over';
          
          // 移动到 placement 中心点进行旋转
          const cx = placement.x + placement.width / 2;
          const cy = placement.y + placement.height / 2;
          
          ctx.translate(cx, cy);
          ctx.rotate((placement.rotation * Math.PI) / 180);
          ctx.translate(-cx, -cy);
          
          ctx.drawImage(
            overlay,
            placement.x,
            placement.y,
            placement.width,
            placement.height
          );
          
          ctx.restore();
      }

      if (overlay.complete) {
          drawOverlay();
      } else {
          overlay.onload = drawOverlay;
      }
    }
  }, [baseImage, overlayImage, placement]);

  // 监听重绘
  useEffect(() => {
    draw();
  }, [draw]);

  // 滚轮缩放画布
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        setScale((s) => Math.min(Math.max(s * delta, 0.1), 5));
    }
  };

  // 鼠标交互
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!baseImage) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) / scale;
    const mouseY = (e.clientY - rect.top) / scale;

    // 检查是否点击在 overlay 上
    if (overlayImage) {
        // 简单矩形碰撞检测 (忽略旋转带来的复杂性，简化处理)
        if (
            mouseX >= placement.x &&
            mouseX <= placement.x + placement.width &&
            mouseY >= placement.y &&
            mouseY <= placement.y + placement.height
        ) {
            setDragTarget("overlay");
            setIsDragging(true);
            setLastMousePos({ x: e.clientX, y: e.clientY });
            return;
        }
    }

    // 否则拖拽画布 (空格键按下时，或者默认)
    // 这里为了简单，默认拖拽 overlay，如果按住 Space 则拖拽画布
    // 或者始终拖拽画布 (如果没点中 overlay)
    setDragTarget("canvas");
    setIsDragging(true);
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;

    const dx = e.clientX - lastMousePos.x;
    const dy = e.clientY - lastMousePos.y;

    if (dragTarget === "overlay") {
        onPlacementChange({
            ...placement,
            x: placement.x + dx / scale,
            y: placement.y + dy / scale,
        });
    } else if (dragTarget === "canvas") {
        setOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
    }

    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragTarget(null);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-[#0a0a0a] flex items-center justify-center checkerboard"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {!baseImage && (
        <div className="text-zinc-500 pointer-events-none select-none">
          请上传图片开始
        </div>
      )}
      
      <motion.div
        style={{
            scale,
            x: offset.x,
            y: offset.y,
            cursor: dragTarget === "overlay" ? "move" : isDragging ? "grabbing" : "grab"
        }}
        className="relative shadow-2xl"
      >
        <canvas
            ref={canvasRef}
            className="block max-w-none" // 允许 canvas 超出容器
        />
        
        {/* Overlay 选中框 UI (可选，HTML 层叠加在 Canvas 上，避免画在图里) */}
        {overlayImage && (
            <div 
                className="absolute border-2 border-primary/50 pointer-events-none"
                style={{
                    left: placement.x,
                    top: placement.y,
                    width: placement.width,
                    height: placement.height,
                    transform: `rotate(${placement.rotation}deg)`,
                    transformOrigin: 'center'
                }}
            >
                {/* 可以在这里加 resize handles */}
            </div>
        )}
      </motion.div>

      {/* Loading Overlay */}
      <AnimatePresence>
        {isProcessing && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            >
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-primary font-mono text-sm animate-pulse">AI 正在合成...</p>
                </div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
