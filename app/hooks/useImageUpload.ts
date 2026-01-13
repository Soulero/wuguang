"use client";

import { useState, useRef, useCallback } from "react";

interface UploadState {
  baseImage: string | null;
  baseImageSize: { w: number; h: number };
  isLoading: boolean;
  error: string | null;
}

export function useImageUpload() {
  const [state, setState] = useState<UploadState>({
    baseImage: null,
    baseImageSize: { w: 0, h: 0 },
    isLoading: false,
    error: null,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      setState((prev) => ({ ...prev, error: "请上传图片文件" }));
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      const img = new Image();
      img.onload = () => {
        setState({
          baseImage: dataUrl,
          baseImageSize: { w: img.width, h: img.height },
          isLoading: false,
          error: null,
        });
      };
      img.onerror = () => {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: "图片加载失败",
        }));
      };
      img.src = dataUrl;
    };
    reader.onerror = () => {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: "文件读取失败",
      }));
    };
    reader.readAsDataURL(file);
  }, []);

  const handleUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const reset = useCallback(() => {
    setState({
      baseImage: null,
      baseImageSize: { w: 0, h: 0 },
      isLoading: false,
      error: null,
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  return {
    ...state,
    fileInputRef,
    handleUpload,
    handleDrop,
    handleDragOver,
    openFilePicker,
    reset,
  };
}
