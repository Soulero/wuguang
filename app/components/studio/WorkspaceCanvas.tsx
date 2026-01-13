"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import Moveable, {
  type OnDrag,
  type OnDragEnd,
  type OnDragStart,
  type OnResize,
  type OnResizeEnd,
  type OnResizeStart,
  type OnRotate,
  type OnRotateEnd,
  type OnRotateStart,
} from "react-moveable";
import type { OverlayPlacement } from "@/app/hooks";

export interface WorkspaceCanvasHandle {
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;
  fit: () => void;
}

interface WorkspaceCanvasProps {
  baseImage: string;
  baseImageSize: { w: number; h: number };
  overlayImage: string | null;
  placement: OverlayPlacement;
  onPlacementChange: (updates: Partial<OverlayPlacement>) => void;
  panMode: boolean;
  aspectLocked: boolean;
  onViewportChange?: (viewport: { zoom: number; pan: { x: number; y: number } }) => void;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export const WorkspaceCanvas = forwardRef<WorkspaceCanvasHandle, WorkspaceCanvasProps>(function WorkspaceCanvas(
  {
    baseImage,
    baseImageSize,
    overlayImage,
    placement,
    onPlacementChange,
    panMode,
    aspectLocked,
    onViewportChange,
  },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [overlayTargetEl, setOverlayTargetEl] = useState<HTMLDivElement | null>(null);
  const overlayTargetRef = useRef<HTMLDivElement | null>(null);

  const baseImgRef = useRef<HTMLImageElement | null>(null);

  const [fitScale, setFitScale] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const [spaceDown, setSpaceDown] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);

  const stageScale = useMemo(() => fitScale * zoom, [fitScale, zoom]);

  useEffect(() => {
    onViewportChange?.({ zoom: stageScale, pan });
  }, [stageScale, pan, onViewportChange]);

  const computeFitScale = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const scale = Math.min(rect.width / baseImageSize.w, rect.height / baseImageSize.h);
    const next = Number.isFinite(scale) && scale > 0 ? Math.min(scale, 1) : 1;
    setFitScale(next);
  }, [baseImageSize.w, baseImageSize.h]);

  useEffect(() => {
    computeFitScale();
    window.addEventListener("resize", computeFitScale);
    return () => window.removeEventListener("resize", computeFitScale);
  }, [computeFitScale]);

  const livePlacementRef = useRef<OverlayPlacement>(placement);

  const applyTargetStyle = useCallback((p: OverlayPlacement) => {
    const el = overlayTargetRef.current;
    if (!el) return;

    el.style.left = "0px";
    el.style.top = "0px";
    el.style.width = `${p.width}px`;
    el.style.height = `${p.height}px`;
    el.style.transform = `translate3d(${p.x}px, ${p.y}px, 0) rotate(${p.rotation}deg)`;
    el.style.transformOrigin = "center center";
  }, []);

  const renderBase = useCallback(() => {
    const canvas = canvasRef.current;
    const baseImg = baseImgRef.current;
    if (!canvas || !baseImg) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = baseImageSize.w;
    const h = baseImageSize.h;

    if (canvas.width !== w) canvas.width = w;
    if (canvas.height !== h) canvas.height = h;

    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(baseImg, 0, 0, w, h);
  }, [baseImageSize.w, baseImageSize.h]);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      baseImgRef.current = img;
      renderBase();
    };
    img.src = baseImage;

    return () => {
      baseImgRef.current = null;
    };
  }, [baseImage, renderBase]);

  useEffect(() => {
    livePlacementRef.current = placement;
    applyTargetStyle(placement);
  }, [placement, applyTargetStyle]);

  useEffect(() => {
    if (!overlayImage) return;
    applyTargetStyle(livePlacementRef.current);
  }, [overlayImage, applyTargetStyle]);

  const isEditableTarget = (target: EventTarget | null) => {
    if (!(target instanceof HTMLElement)) return false;
    const tag = target.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
    if (target.isContentEditable) return true;
    return false;
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      if (isEditableTarget(e.target)) return;

      e.preventDefault();
      setSpaceDown(true);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      if (isEditableTarget(e.target)) return;

      e.preventDefault();
      setSpaceDown(false);
      setIsPanning(false);
      panStartRef.current = null;
    };

    window.addEventListener("keydown", handleKeyDown, { passive: false });
    window.addEventListener("keyup", handleKeyUp, { passive: false });

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  const zoomTo = useCallback(
    (nextZoom: number, about?: { clientX: number; clientY: number }) => {
      const z = clamp(nextZoom, 0.2, 3);
      if (z === zoom) return;

      const scaleDelta = z / zoom;

      if (!about || !containerRef.current) {
        setPan((prev) => ({
          x: prev.x * scaleDelta,
          y: prev.y * scaleDelta,
        }));
        setZoom(z);
        return;
      }

      const rect = containerRef.current.getBoundingClientRect();
      const cx = about.clientX - rect.left - rect.width / 2;
      const cy = about.clientY - rect.top - rect.height / 2;

      setPan((prev) => ({
        x: prev.x * scaleDelta + cx * (1 - scaleDelta),
        y: prev.y * scaleDelta + cy * (1 - scaleDelta),
      }));

      setZoom(z);
    },
    [zoom]
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const delta = -e.deltaY;
      const zoomFactor = delta > 0 ? 1.08 : 0.92;

      zoomTo(zoom * zoomFactor, { clientX: e.clientX, clientY: e.clientY });
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
    };
  }, [zoom, zoomTo]);

  const shouldPan = panMode || spaceDown;
  const interactionEnabled = !shouldPan;

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!shouldPan) return;
      if (e.button !== 0) return;

      setIsPanning(true);
      panStartRef.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
    },
    [shouldPan, pan]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isPanning || !panStartRef.current) return;
      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;
      setPan({ x: panStartRef.current.panX + dx, y: panStartRef.current.panY + dy });
    },
    [isPanning]
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    panStartRef.current = null;
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      zoomIn: () => zoomTo(zoom * 1.2),
      zoomOut: () => zoomTo(zoom / 1.2),
      resetView: () => {
        setZoom(1);
        setPan({ x: 0, y: 0 });
      },
      fit: () => {
        computeFitScale();
        setZoom(1);
        setPan({ x: 0, y: 0 });
      },
    }),
    [zoom, zoomTo, computeFitScale]
  );

  const setOverlayTarget = useCallback((el: HTMLDivElement | null) => {
    overlayTargetRef.current = el;
    setOverlayTargetEl(el);
  }, []);

  const handleDragStart = useCallback(
    (e: OnDragStart) => {
      if (!interactionEnabled) return;
      e.set([livePlacementRef.current.x, livePlacementRef.current.y]);
    },
    [interactionEnabled]
  );

  const handleDrag = useCallback(
    (e: OnDrag) => {
      if (!interactionEnabled) return;

      const [x, y] = e.beforeTranslate;
      const next: OverlayPlacement = { ...livePlacementRef.current, x, y };
      livePlacementRef.current = next;
      applyTargetStyle(next);
    },
    [applyTargetStyle, interactionEnabled]
  );

  const commitPlacement = useCallback(
    (_e: OnDragEnd | OnResizeEnd | OnRotateEnd) => {
      onPlacementChange(livePlacementRef.current);
    },
    [onPlacementChange]
  );

  const handleResizeStart = useCallback(
    (e: OnResizeStart) => {
      if (!interactionEnabled) return;
      e.set([livePlacementRef.current.width, livePlacementRef.current.height]);
      if (e.dragStart) {
        e.dragStart.set([livePlacementRef.current.x, livePlacementRef.current.y]);
      }
    },
    [interactionEnabled]
  );

  const handleResize = useCallback(
    (e: OnResize) => {
      if (!interactionEnabled) return;

      const [x, y] = e.drag.beforeTranslate;
      const next: OverlayPlacement = {
        ...livePlacementRef.current,
        x,
        y,
        width: e.width,
        height: e.height,
      };

      livePlacementRef.current = next;
      applyTargetStyle(next);
    },
    [applyTargetStyle, interactionEnabled]
  );

  const handleRotateStart = useCallback(
    (e: OnRotateStart) => {
      if (!interactionEnabled) return;
      e.set(livePlacementRef.current.rotation);
      if (e.dragStart) {
        e.dragStart.set([livePlacementRef.current.x, livePlacementRef.current.y]);
      }
      if (e.resizeStart) {
        e.resizeStart.set([livePlacementRef.current.width, livePlacementRef.current.height]);
      }
    },
    [interactionEnabled]
  );

  const handleRotate = useCallback(
    (e: OnRotate) => {
      if (!interactionEnabled) return;

      const rotation = Number.isFinite(e.beforeRotation) ? e.beforeRotation : e.beforeRotate;
      const next: OverlayPlacement = { ...livePlacementRef.current, rotation };
      livePlacementRef.current = next;
      applyTargetStyle(next);
    },
    [applyTargetStyle, interactionEnabled]
  );

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden overscroll-none select-none ${shouldPan ? "cursor-grab" : "cursor-default"}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          ref={stageRef}
          className="relative"
          style={{
            width: baseImageSize.w,
            height: baseImageSize.h,
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${stageScale})`,
            transformOrigin: "center center",
          }}
        >
          <canvas
            ref={canvasRef}
            className="block rounded-xl shadow-lg"
            style={{ width: baseImageSize.w, height: baseImageSize.h }}
          />

          {overlayImage ? (
            <div
              ref={setOverlayTarget}
              data-overlay-target
              className="absolute"
              style={{
                left: 0,
                top: 0,
                width: placement.width,
                height: placement.height,
                transform: `translate3d(${placement.x}px, ${placement.y}px, 0) rotate(${placement.rotation}deg)`,
                transformOrigin: "center center",
              }}
            >
              <img
                src={overlayImage}
                alt="叠加图层"
                className="w-full h-full object-contain pointer-events-none drop-shadow-xl"
                draggable={false}
              />
            </div>
          ) : null}

          {overlayImage ? (
            <Moveable
              target={overlayTargetEl}
              zoom={stageScale}
              draggable={interactionEnabled}
              resizable={interactionEnabled}
              rotatable={interactionEnabled}
              keepRatio={aspectLocked}
              snappable={true}
              snapCenter={true}
              origin={false}
              throttleRotate={1}
              onDragStart={handleDragStart}
              onDrag={handleDrag}
              onDragEnd={commitPlacement}
              onResizeStart={handleResizeStart}
              onResize={handleResize}
              onResizeEnd={commitPlacement}
              onRotateStart={handleRotateStart}
              onRotate={handleRotate}
              onRotateEnd={commitPlacement}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
});
