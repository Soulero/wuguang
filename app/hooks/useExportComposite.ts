"use client";

import { useCallback } from "react";
import type { OverlayPlacement } from "./useOverlayTransform";

interface ExportOptions {
  baseImage: string;
  overlayImage: string;
  baseImageSize: { w: number; h: number };
  placement: OverlayPlacement;
}

export function useExportComposite() {
  const exportImage = useCallback(
    ({ baseImage, overlayImage, baseImageSize, placement }: ExportOptions) => {
      return new Promise<void>((resolve, reject) => {
        const baseImg = new Image();
        baseImg.crossOrigin = "anonymous";
        
        baseImg.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = baseImageSize.w;
          canvas.height = baseImageSize.h;
          const ctx = canvas.getContext("2d");
          
          if (!ctx) {
            reject(new Error("无法创建画布"));
            return;
          }

          ctx.drawImage(baseImg, 0, 0);

          const overlayImg = new Image();
          overlayImg.crossOrigin = "anonymous";
          
          overlayImg.onload = () => {
            ctx.save();
            ctx.translate(
              placement.x + placement.width / 2,
              placement.y + placement.height / 2
            );
            ctx.rotate((placement.rotation * Math.PI) / 180);
            ctx.drawImage(
              overlayImg,
              -placement.width / 2,
              -placement.height / 2,
              placement.width,
              placement.height
            );
            ctx.restore();

            const link = document.createElement("a");
            link.download = `雾光AI-${Date.now()}.png`;
            link.href = canvas.toDataURL("image/png");
            link.click();
            resolve();
          };
          
          overlayImg.onerror = () => reject(new Error("叠加图层加载失败"));
          overlayImg.src = overlayImage;
        };
        
        baseImg.onerror = () => reject(new Error("基础图片加载失败"));
        baseImg.src = baseImage;
      });
    },
    []
  );

  return { exportImage };
}
