"use client";

import React, { useState, useRef } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Sparkles, RefreshCcw, Image as ImageIcon } from "lucide-react";
import { motion } from "framer-motion";

interface ControlPanelProps {
  prompt: string;
  setPrompt: (s: string) => void;
  onGenerate: () => void;
  isProcessing: boolean;
  placement: { x: number; y: number; width: number; height: number; rotation: number };
  onPlacementChange: (p: any) => void;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDownload: () => void;
  hasOverlay: boolean;
}

export const ControlPanel = ({
  prompt,
  setPrompt,
  onGenerate,
  isProcessing,
  placement,
  onPlacementChange,
  onUpload,
  onDownload,
  hasOverlay,
}: ControlPanelProps) => {
  // 用于追踪输入法是否正在组合输入
  const isComposingRef = useRef(false);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // 允许所有带修饰键的快捷键（如 Cmd+A, Ctrl+A, Cmd+C 等）
    if (e.metaKey || e.ctrlKey || e.altKey) {
      return; // 不拦截，让浏览器处理
    }
    // 只有在非组合输入状态下，按回车才触发生成
    if (e.key === "Enter" && !isComposingRef.current && !isProcessing && prompt) {
      e.preventDefault();
      onGenerate();
    }
  };

  return (
    <div className="w-80 h-full bg-zinc-900 border-l border-white/10 p-6 flex flex-col gap-6 z-10 glass-panel overflow-y-auto">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-6 h-6 text-primary" />
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
          AI 图像增强器
        </h1>
      </div>

      {/* Upload */}
      <div className="space-y-2">
        <Label>1. 上传原图</Label>
        <div className="relative group">
          <Input
            type="file"
            accept="image/*"
            onChange={onUpload}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
          />
          <Button variant="outline" className="w-full justify-start text-zinc-400 group-hover:text-white transition-colors">
            <ImageIcon className="w-4 h-4 mr-2" />
            选择文件...
          </Button>
        </div>
      </div>

      {/* Prompt */}
      <div className="space-y-2">
        <Label>2. 编辑指令</Label>
        <div className="flex gap-2">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="例如：添加一顶圣诞帽"
              className="flex h-10 w-full rounded-md border border-white/10 bg-zinc-800 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
              onKeyDown={handleKeyDown}
              onCompositionStart={() => { isComposingRef.current = true; }}
              onCompositionEnd={() => { isComposingRef.current = false; }}
            />
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
            {[
              { label: "圣诞帽", prompt: "添加一顶圣诞帽" },
              { label: "墨镜", prompt: "添加一副墨镜" },
              { label: "猫耳朵", prompt: "添加猫耳朵" },
            ].map(chip => (
                <button 
                    key={chip.label}
                    onClick={() => setPrompt(chip.prompt)}
                    className="text-xs px-2 py-1 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 transition-colors"
                >
                    {chip.label}
                </button>
            ))}
        </div>
      </div>

      <Button 
        onClick={onGenerate} 
        disabled={isProcessing || !prompt}
        className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-medium py-6"
      >
        {isProcessing ? (
            <RefreshCcw className="w-4 h-4 animate-spin mr-2" />
        ) : (
            <Sparkles className="w-4 h-4 mr-2" />
        )}
        生成叠加图层
      </Button>

      {/* Adjustments */}
      {hasOverlay && (
        <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-6 pt-6 border-t border-white/10"
        >
          <div className="space-y-4">
            <div className="flex justify-between items-center">
                <Label>调整叠加层</Label>
                <button 
                    onClick={() => onPlacementChange({...placement, rotation: 0})}
                    className="text-xs text-zinc-500 hover:text-white"
                >
                    重置
                </button>
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-zinc-400">
                <span>缩放</span>
                <span>{Math.round(placement.width)}px</span>
              </div>
              <Slider
                value={[placement.width]}
                min={10}
                max={1000}
                step={1}
                onValueChange={([val]) => {
                    const ratio = placement.height / placement.width;
                    onPlacementChange({ ...placement, width: val, height: val * ratio });
                }}
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs text-zinc-400">
                <span>旋转</span>
                <span>{Math.round(placement.rotation)}°</span>
              </div>
              <Slider
                value={[placement.rotation]}
                min={-180}
                max={180}
                step={1}
                onValueChange={([val]) => onPlacementChange({ ...placement, rotation: val })}
              />
            </div>
            
             <div className="space-y-1">
              <div className="flex justify-between text-xs text-zinc-400">
                <span>X 位置</span>
                <span>{Math.round(placement.x)}</span>
              </div>
              <Slider
                value={[placement.x]}
                min={-500}
                max={2000}
                step={1}
                onValueChange={([val]) => onPlacementChange({ ...placement, x: val })}
              />
            </div>
             <div className="space-y-1">
              <div className="flex justify-between text-xs text-zinc-400">
                <span>Y 位置</span>
                <span>{Math.round(placement.y)}</span>
              </div>
              <Slider
                value={[placement.y]}
                min={-500}
                max={2000}
                step={1}
                onValueChange={([val]) => onPlacementChange({ ...placement, y: val })}
              />
            </div>
          </div>

          <Button 
            onClick={onDownload} 
            variant="secondary" 
            className="w-full"
          >
            <Download className="w-4 h-4 mr-2" />
            下载结果
          </Button>
        </motion.div>
      )}
    </div>
  );
};
