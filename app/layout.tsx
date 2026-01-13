import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "雾光AI工作室 | FogGlow AI Studio",
  description: "智能图像增强与创意叠加工具",
  keywords: ["AI", "图像增强", "图片编辑", "创意工具"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="min-h-screen bg-mist antialiased">
        {children}
      </body>
    </html>
  );
}
