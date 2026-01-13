"use client";

import { useState, useCallback, useMemo } from "react";

interface TemplateField {
  id: string;
  label: string;
  placeholder: string;
  value: string;
}

const defaultFields: TemplateField[] = [
  { id: "position", label: "位置", placeholder: "眼睛", value: "" },
  { id: "item", label: "物品", placeholder: "一副墨镜", value: "" },
  { id: "style", label: "风格", placeholder: "原图风格", value: "" },
];

export function usePromptTemplate() {
  const [fields, setFields] = useState<TemplateField[]>(defaultFields);

  const updateField = useCallback((id: string, value: string) => {
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, value } : f)));
  }, []);

  const prompt = useMemo(() => {
    const itemField = fields.find((f) => f.id === "item");
    const positionField = fields.find((f) => f.id === "position");
    const styleField = fields.find((f) => f.id === "style");

    const item = itemField?.value.trim() || itemField?.placeholder || "";
    const position = positionField?.value.trim() || positionField?.placeholder || "合适位置";
    const style = styleField?.value.trim() || styleField?.placeholder || "原图风格";

    if (!item) return "";
    return `添加${item}，放置在${position}，${style}`;
  }, [fields]);

  const fillTemplate = useCallback(
    (preset: { item: string; position: string; style: string }) => {
      setFields([
        { id: "position", label: "位置", placeholder: "眼睛", value: preset.position },
        { id: "item", label: "物品", placeholder: "一副墨镜", value: preset.item },
        { id: "style", label: "风格", placeholder: "原图风格", value: preset.style },
      ]);
    },
    []
  );

  const reset = useCallback(() => {
    setFields(defaultFields);
  }, []);

  const isValid = useMemo(() => {
    const itemField = fields.find((f) => f.id === "item");
    const item = itemField?.value.trim() || itemField?.placeholder || "";
    return item.trim() !== "";
  }, [fields]);

  return {
    fields,
    updateField,
    prompt,
    fillTemplate,
    reset,
    isValid,
  };
}
