"use client";

import { Keyboard } from "lucide-react";

interface HotKeyHintProps {
  showAnchorHint?: boolean;
}

export function HotKeyHint({ showAnchorHint }: HotKeyHintProps) {
  return (
    <div className="glass-panel px-3 py-2 rounded-lg text-xs text-foreground/60 flex items-center gap-2">
      <Keyboard className="w-4 h-4 text-foreground/40" />
      <span className="font-mono">Space</span>
      <span>拖拽平移</span>
      <span className="text-foreground/20">·</span>
      <span className="font-mono">滚轮</span>
      <span>缩放</span>
      {showAnchorHint ? (
        <>
          <span className="text-foreground/20">·</span>
          <span>点击图像设置锚点</span>
        </>
      ) : null}
    </div>
  );
}
