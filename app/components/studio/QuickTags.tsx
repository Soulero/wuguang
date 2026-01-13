"use client";

import { motion } from "framer-motion";

interface QuickTag {
  label: string;
  item: string;
  position: string;
  style: string;
}

const quickTags: QuickTag[] = [
  { label: "🎄 圣诞帽", item: "一顶圣诞帽", position: "头顶", style: "原图风格" },
  { label: "🕶️ 墨镜", item: "一副墨镜", position: "眼睛", style: "原图风格" },
  { label: "👑 皇冠", item: "一顶皇冠", position: "头顶", style: "金色华丽" },
  { label: "🐱 猫耳", item: "猫耳朵", position: "头顶两侧", style: "可爱" },
  { label: "🎩 礼帽", item: "一顶礼帽", position: "头顶", style: "绅士复古" },
  { label: "🌸 花环", item: "花环", position: "头顶", style: "清新自然" },
];

interface QuickTagsProps {
  onSelect: (preset: { item: string; position: string; style: string }) => void;
}

export function QuickTags({ onSelect }: QuickTagsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-thin py-1">
      {quickTags.map((tag, index) => (
        <motion.button
          key={tag.label}
          onClick={() => onSelect(tag)}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 + index * 0.02 }}
          className="tag flex-shrink-0"
        >
          {tag.label}
        </motion.button>
      ))}
    </div>
  );
}
