"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

interface LogsPanelProps {
  logs: string[];
}

function stripExistingTimestamp(log: string) {
  return log.replace(/^\[[^\]]+\]\s*/, "");
}

export function LogsPanel({ logs }: LogsPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [logs]);

  return (
    <div className="glass-panel p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-semibold text-foreground/50">进度日志</div>
        <div className="text-[10px] font-mono text-foreground/30">LIVE</div>
      </div>

      <div
        ref={scrollRef}
        className="h-28 overflow-y-auto scrollbar-thin rounded-lg bg-black/5 border border-white/10 p-2 font-mono text-[11px] leading-relaxed"
      >
        {logs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-foreground/30">
            <span className="animate-pulse">_ READY</span>
          </div>
        ) : (
          <div className="space-y-1">
            {logs.map((log, i) => {
              const msg = stripExistingTimestamp(log);
              const isError = msg.includes("错误") || msg.toLowerCase().includes("error");

              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(i * 0.01, 0.25) }}
                  className="flex gap-2"
                >
                  <span className="text-foreground/30 select-none">{String(i + 1).padStart(2, "0")}</span>
                  <span className={isError ? "text-error" : "text-accent-dark"}>{msg}</span>
                </motion.div>
              );
            })}
            <div className="w-2 h-4 bg-accent/50 animate-pulse ml-6" />
          </div>
        )}
      </div>
    </div>
  );
}
