"use client";

import type { ReactNode } from "react";

export function Tooltip({ content, children }: { content: string; children: ReactNode }) {
  return (
    <div className="group relative inline-flex items-center justify-center">
      {children}
      <div className="absolute bottom-full mb-2 hidden whitespace-nowrap rounded-lg bg-foreground/90 px-2 py-1 text-[10px] font-medium text-background opacity-0 backdrop-blur transition-all group-hover:flex group-hover:opacity-100 z-50 pointer-events-none">
        {content}
        <div className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-foreground/90" />
      </div>
    </div>
  );
}
