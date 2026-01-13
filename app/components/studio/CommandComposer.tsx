"use client";

import { useRef } from "react";
import { Edit3, Wand2 } from "lucide-react";

interface TemplateField {
  id: string;
  label: string;
  placeholder: string;
  value: string;
}

interface CommandComposerProps {
  mode: "template" | "custom";
  fields: TemplateField[];
  updateField: (id: string, value: string) => void;
  customPrompt: string;
  onCustomPromptChange: (value: string) => void;
  onGenerate: () => void;
  isProcessing: boolean;
  isValid: boolean;
}

export function CommandComposer({
  mode,
  fields,
  updateField,
  customPrompt,
  onCustomPromptChange,
  onGenerate,
  isProcessing,
  isValid,
}: CommandComposerProps) {
  const isComposingRef = useRef(false);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === "Enter" && !isComposingRef.current && !isProcessing && isValid) {
      e.preventDefault();
      onGenerate();
    }
  };

  const getFieldValue = (id: string) => fields.find((f) => f.id === id)?.value ?? "";

  return (
    <div className={`glass-panel-interactive relative overflow-hidden group ${mode === "custom" ? "p-4" : "p-5"}`}>
      <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none">
        {mode === "custom" ? (
          <Edit3 className="w-12 h-12 text-accent" />
        ) : (
          <Wand2 className="w-12 h-12 text-accent" />
        )}
      </div>

      <div className="mb-3">
        <p className="text-xs font-semibold text-foreground/40 uppercase tracking-widest">
          {mode === "custom" ? "自定义 Prompt" : "创意指令"}
        </p>
      </div>

      {mode === "custom" ? (
        <div>
          <textarea
            value={customPrompt}
            onChange={(e) => onCustomPromptChange(e.target.value)}
            placeholder="例如：在角色眼睛位置添加一副黑色墨镜，保持原图风格一致，物体边缘干净，透明PNG叠加层，无背景。"
            className="w-full h-28 bg-transparent border-none resize-none focus:ring-0 text-sm text-foreground/90 placeholder:text-foreground/30 leading-relaxed"
          />
          <div className="mt-2 text-[11px] text-foreground/45">
            提示：可直接粘贴完整描述。按 Enter 不会换行，建议用按钮生成。
          </div>
        </div>
      ) : (
        <div className="text-[15px] leading-relaxed text-foreground/80 font-medium">
          <span>我想在图片的</span>
          <input
            type="text"
            value={getFieldValue("position")}
            onChange={(e) => updateField("position", e.target.value)}
            placeholder="眼睛"
            className="input-inline mx-1.5 w-20"
            onKeyDown={handleKeyDown}
            onCompositionStart={() => {
              isComposingRef.current = true;
            }}
            onCompositionEnd={() => {
              isComposingRef.current = false;
            }}
          />
          <span>添加</span>
          <input
            type="text"
            value={getFieldValue("item")}
            onChange={(e) => updateField("item", e.target.value)}
            placeholder="一副墨镜"
            className="input-inline mx-1.5 w-24"
            onKeyDown={handleKeyDown}
            onCompositionStart={() => {
              isComposingRef.current = true;
            }}
            onCompositionEnd={() => {
              isComposingRef.current = false;
            }}
          />
          <span>，风格是</span>
          <input
            type="text"
            value={getFieldValue("style")}
            onChange={(e) => updateField("style", e.target.value)}
            placeholder="原图风格"
            className="input-inline mx-1.5 w-24"
            onKeyDown={handleKeyDown}
            onCompositionStart={() => {
              isComposingRef.current = true;
            }}
            onCompositionEnd={() => {
              isComposingRef.current = false;
            }}
          />
          <span>。</span>
        </div>
      )}
    </div>
  );
}
