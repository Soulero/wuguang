"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ImageIcon, Sparkles } from "lucide-react";

import {
  Backdrop,
  StudioHeader,
  ControlHeader,
  CanvasToolbar,
  HotKeyHint,
  WorkspaceCanvas,
  CommandComposer,
  QuickTags,
  GenerateButton,
  LayerControls,
  LogsPanel,
  ExportActions,
} from "@/app/components";

import {
  useExportComposite,
  useImageUpload,
  useOverlayTransform,
  usePromptTemplate,
} from "@/app/hooks";

import type { OverlayPlacement } from "@/app/hooks";

import type { WorkspaceCanvasHandle } from "@/app/components/studio/WorkspaceCanvas";
import { ensureTransparentPngOverlay } from "@/app/lib/ensureTransparentOverlay";

type OverlaySize = { w: number; h: number } | null;

type GenerateResponse = {
  overlay_png_base64: string;
  overlay_size: OverlaySize;
  placement: { x: number; y: number; width: number; height: number; rotation: number };
  confidence: number;
  warnings?: string[];
  logs?: string[];
};

function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
}

function downloadJson(obj: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function StudioPage() {
  const {
    baseImage,
    baseImageSize,
    fileInputRef,
    handleUpload,
    handleDrop,
    handleDragOver,
    openFilePicker,
    reset: resetUpload,
    error: uploadError,
  } = useImageUpload();

  const {
    fields: templateFields,
    updateField,
    prompt: templatePrompt,
    fillTemplate,
    reset: resetPrompt,
  } = usePromptTemplate();

  const {
    placement,
    setPlacement,
    updatePlacement,
    resetRotation,
    resetAll,
    centerOverlay,
  } = useOverlayTransform(baseImageSize);

  const { exportImage } = useExportComposite();

  const workspaceRef = useRef<WorkspaceCanvasHandle>(null);

  const [overlayImage, setOverlayImage] = useState<string | null>(null);
  const [overlaySize, setOverlaySize] = useState<OverlaySize>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [generatedPlacement, setGeneratedPlacement] = useState<OverlayPlacement | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const [panMode, setPanMode] = useState(false);
  const [aspectLocked, setAspectLocked] = useState(true);

  const [customPromptMode, setCustomPromptMode] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");

  const [viewport, setViewport] = useState({ zoom: 1, pan: { x: 0, y: 0 } });

  const hasOverlay = !!overlayImage;

  const zoomPercent = useMemo(() => {
    const v = viewport.zoom;
    if (!Number.isFinite(v) || v <= 0) return 100;
    return Math.round(v * 100);
  }, [viewport.zoom]);

  const effectivePrompt = useMemo(() => {
    if (!customPromptMode) return templatePrompt;
    const v = customPrompt.trim();
    return v !== "" ? v : templatePrompt;
  }, [customPromptMode, customPrompt, templatePrompt]);

  const addLog = useCallback((msg: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!baseImage) {
      setLogs([]);
      addLog("请先上传一张图片");
      return;
    }

    if (!effectivePrompt || isProcessing) return;

    setIsProcessing(true);
    setWarnings([]);
    setLogs([]);

    try {
      const response = await fetch("/api/generate/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: baseImage,
          prompt: effectivePrompt,
          imageSize: baseImageSize.w > 0 ? baseImageSize : { w: 512, h: 512 },
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "生成失败");
      }

      const contentType = response.headers.get("content-type") || "";

      if (contentType.includes("application/x-ndjson") && response.body) {
        const decoder = new TextDecoder();
        const reader = response.body.getReader();
        let buffer = "";
        let result: GenerateResponse | null = null;

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            const evt = JSON.parse(trimmed) as
              | { type: "log"; message: string }
              | { type: "result"; data: GenerateResponse }
              | { type: "error"; error: string };

            if (evt.type === "log") {
              setLogs((prev) => [...prev, evt.message]);
              continue;
            }

            if (evt.type === "error") {
              throw new Error(evt.error);
            }

            if (evt.type === "result") {
              result = evt.data;
            }
          }
        }

        if (!result) throw new Error("流式响应未返回结果");

        const cleaned = await ensureTransparentPngOverlay(result.overlay_png_base64);

        setOverlayImage(cleaned.dataUrl);
        setOverlaySize(result.overlay_size ?? null);
        setWarnings([
          ...(result.warnings ?? []),
          ...(cleaned.applied ? ["已自动去除叠加层背景色，以避免遮挡原图。"] : []),
        ]);

        const nextPlacement: OverlayPlacement = {
          x: result.placement.x,
          y: result.placement.y,
          width: result.placement.width,
          height: result.placement.height,
          rotation: result.placement.rotation ?? 0,
        };

        setPlacement(nextPlacement);
        setGeneratedPlacement(nextPlacement);

        if (cleaned.applied) {
          setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] 已自动去除叠加层背景色`]);
        }

        if (customPromptMode && customPrompt.trim() === "") {
          setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] 已使用默认模板指令（自定义 Prompt 为空）`]);
        }
      } else {
        const data = (await response.json()) as GenerateResponse;
        const cleaned = await ensureTransparentPngOverlay(data.overlay_png_base64);

        setOverlayImage(cleaned.dataUrl);
        setOverlaySize(data.overlay_size ?? null);
        setWarnings([
          ...(data.warnings ?? []),
          ...(cleaned.applied ? ["已自动去除叠加层背景色，以避免遮挡原图。"] : []),
        ]);

        const nextPlacement: OverlayPlacement = {
          x: data.placement.x,
          y: data.placement.y,
          width: data.placement.width,
          height: data.placement.height,
          rotation: data.placement.rotation ?? 0,
        };

        setPlacement(nextPlacement);
        setGeneratedPlacement(nextPlacement);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "未知错误";
      setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] 错误: ${message}`]);
    } finally {
      setIsProcessing(false);
    }
  }, [addLog, baseImage, baseImageSize, customPrompt, customPromptMode, effectivePrompt, isProcessing, setPlacement]);

  const handleExportComposite = useCallback(async () => {
    if (!baseImage || !overlayImage) return;
    try {
      await exportImage({
        baseImage,
        overlayImage,
        baseImageSize,
        placement,
      });
      addLog("已导出 PNG");
    } catch {
      addLog("导出失败");
    }
  }, [addLog, baseImage, baseImageSize, exportImage, overlayImage, placement]);

  const handleDownloadOverlay = useCallback(() => {
    if (!overlayImage) return;
    downloadDataUrl(overlayImage, `雾光AI-overlay-${Date.now()}.png`);
  }, [overlayImage]);

  const handleDownloadPlacement = useCallback(() => {
    if (!baseImage) return;

    const payload = {
      prompt: effectivePrompt,
      base_image_size: baseImageSize,
      overlay_size: overlaySize,
      placement,
      warnings,
    };

    downloadJson(payload, `雾光AI-placement-${Date.now()}.json`);
  }, [baseImage, baseImageSize, effectivePrompt, overlaySize, placement, warnings]);

  const handleResetOverlayToGenerated = useCallback(() => {
    if (generatedPlacement) {
      setPlacement(generatedPlacement);
      return;
    }

    resetAll();
  }, [generatedPlacement, resetAll, setPlacement]);

  const handleFullReset = useCallback(() => {
    resetUpload();
    resetPrompt();
    resetAll();
    setOverlayImage(null);
    setOverlaySize(null);
    setWarnings([]);
    setLogs([]);
    setCustomPrompt("");
    setGeneratedPlacement(null);
  }, [resetAll, resetPrompt, resetUpload]);

  return (
    <main className="relative h-screen w-full overflow-hidden bg-mist flex">
      <Backdrop />

      <section
        className="relative flex-1 h-full overflow-hidden"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="absolute top-6 left-6 z-50">
          <StudioHeader
            hasImage={!!baseImage}
            hasOverlay={!!overlayImage}
            isProcessing={isProcessing}
            onReset={handleFullReset}
          />
        </div>

        <div className="absolute top-6 right-6 z-50">
          <Link href="/" className="tag">
            <Sparkles className="w-4 h-4" />
            <span>产品介绍</span>
          </Link>
        </div>

        <div className="w-full h-full flex items-center justify-center p-10 lg:p-14">
          {baseImage ? (
            <WorkspaceCanvas
              ref={workspaceRef}
              baseImage={baseImage}
              baseImageSize={baseImageSize}
              overlayImage={overlayImage}
              placement={placement}
              onPlacementChange={updatePlacement}
              panMode={panMode}
              aspectLocked={aspectLocked}
              onViewportChange={setViewport}
            />
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="glass-panel-elevated p-10 text-center max-w-lg w-full"
            >
              <div className="w-20 h-20 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-5">
                <ImageIcon className="w-10 h-10 text-accent" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">上传一张图片开始</h2>
              <p className="text-foreground/50 mb-6">拖入图片到画布区域，或点击按钮选择本地文件</p>
              <button className="btn-primary-lg mx-auto" onClick={openFilePicker}>
                <Sparkles className="w-5 h-5" />
                选择图片
              </button>
              {uploadError ? <div className="mt-4 text-sm text-error">{uploadError}</div> : null}
            </motion.div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleUpload}
            className="hidden"
          />
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40">
          <CanvasToolbar
            zoomPercent={zoomPercent}
            onZoomIn={() => workspaceRef.current?.zoomIn()}
            onZoomOut={() => workspaceRef.current?.zoomOut()}
            onResetView={() => workspaceRef.current?.resetView()}
            onFit={() => workspaceRef.current?.fit()}
            panMode={panMode}
            onTogglePanMode={() => setPanMode((v) => !v)}
          />
        </div>

        <div className="absolute bottom-6 left-6 z-30 pointer-events-none">
          <HotKeyHint />
        </div>
      </section>

      <aside className="w-[380px] h-full p-4 pl-0 flex flex-col z-50">
        <div className="h-full glass-panel-elevated flex flex-col shadow-2xl overflow-hidden relative border-l border-white/20">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-accent to-transparent opacity-50" />

          <div className="p-4 space-y-3 flex-shrink-0">
            <ControlHeader
              customPromptMode={customPromptMode}
              onToggleCustomPromptMode={() => setCustomPromptMode((v) => !v)}
            />

            <CommandComposer
              mode={customPromptMode ? "custom" : "template"}
              fields={templateFields}
              updateField={updateField}
              customPrompt={customPrompt}
              onCustomPromptChange={setCustomPrompt}
              onGenerate={handleGenerate}
              isProcessing={isProcessing}
              isValid={true}
            />

            <div className="overflow-x-auto scrollbar-thin">
              <div className="min-w-max">
                <QuickTags
                  onSelect={(preset) => {
                    fillTemplate(preset);
                    setCustomPromptMode(false);
                  }}
                />
              </div>
            </div>

            <GenerateButton
              onClick={handleGenerate}
              isProcessing={isProcessing}
              disabled={!baseImage || isProcessing}
            />

            {warnings.length > 0 ? (
              <div className="glass-panel p-3 text-xs text-foreground/70">
                <div className="font-semibold text-foreground mb-1">提示</div>
                <ul className="list-disc pl-5 space-y-1">
                  {warnings.map((w, idx) => (
                    <li key={idx}>{w}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          <div className="px-4 pb-4 flex-shrink-0">
            <LayerControls
              placement={placement}
              hasOverlay={hasOverlay}
              aspectLocked={aspectLocked}
              onToggleAspectLocked={() => setAspectLocked((v) => !v)}
              onPlacementChange={updatePlacement}
              onCenter={centerOverlay}
              onResetRotation={resetRotation}
              onResetAll={handleResetOverlayToGenerated}
            />
          </div>

          <div className="mt-auto p-4 bg-white/5 border-t border-white/10 backdrop-blur-md space-y-3">
            <LogsPanel logs={logs} />
            <ExportActions
              disabled={!baseImage || !overlayImage}
              onExportComposite={handleExportComposite}
              onDownloadOverlay={handleDownloadOverlay}
              onDownloadPlacement={handleDownloadPlacement}
            />
          </div>
        </div>
      </aside>
    </main>
  );
}
