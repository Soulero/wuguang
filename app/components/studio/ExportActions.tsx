"use client";

import { Download, FileJson, Layers } from "lucide-react";

interface ExportActionsProps {
  disabled: boolean;
  onExportComposite: () => void;
  onDownloadOverlay: () => void;
  onDownloadPlacement: () => void;
}

export function ExportActions({
  disabled,
  onExportComposite,
  onDownloadOverlay,
  onDownloadPlacement,
}: ExportActionsProps) {
  return (
    <div className="grid grid-cols-1 gap-2">
      <button className="btn-secondary w-full py-3" onClick={onExportComposite} disabled={disabled}>
        <Download className="w-4 h-4" />
        <span>导出 PNG</span>
      </button>
      <div className="grid grid-cols-2 gap-2">
        <button className="btn-secondary w-full py-3" onClick={onDownloadOverlay} disabled={disabled}>
          <Layers className="w-4 h-4" />
          <span>下载图层</span>
        </button>
        <button className="btn-secondary w-full py-3" onClick={onDownloadPlacement} disabled={disabled}>
          <FileJson className="w-4 h-4" />
          <span>下载 JSON</span>
        </button>
      </div>
    </div>
  );
}
