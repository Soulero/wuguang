import { Metadata } from "next";
import Link from "next/link";
import { Sparkles, ArrowRight, Layers, Wand2, Zap } from "lucide-react";

export const metadata: Metadata = {
  title: "雾光AI工作室 | 智能图像增强",
  description: "AI驱动的图像增强与创意叠加工具，让每一张照片都充满惊喜与魔法",
};

export default function MarketingPage() {
  return (
    <div className="min-h-screen bg-mist">
      <div className="fixed inset-0 z-0 bg-grid pointer-events-none" />
      <div className="bg-grain" />

      <header className="relative z-10 flex items-center justify-between p-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center shadow-glow">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-foreground">雾光AI</span>
        </div>
        <Link href="/studio" className="btn-primary px-5 py-2.5 text-sm">
          进入工作台
          <ArrowRight className="w-4 h-4" />
        </Link>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32">
        <section className="text-center mb-24">
          <h1 className="text-5xl md:text-6xl font-black text-foreground mb-6 leading-tight">
            让AI为你的图片
            <br />
            <span className="bg-gradient-to-r from-accent to-accent-dark bg-clip-text text-transparent">
              添加魔法
            </span>
          </h1>
          <p className="text-xl text-foreground/60 max-w-2xl mx-auto mb-10">
            上传一张图片，用自然语言描述你想要的效果，AI会自动生成透明叠加层，让创意变为现实
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/studio" className="btn-primary-lg">
              <Sparkles className="w-5 h-5" />
              立即体验
            </Link>
            <button className="btn-secondary px-6 py-3">了解更多</button>
          </div>
        </section>

        <section className="grid md:grid-cols-3 gap-6 mb-24">
          {[
            {
              icon: Wand2,
              title: "自然语言驱动",
              desc: "用中文描述你想要的效果，AI自动理解并生成",
            },
            {
              icon: Layers,
              title: "透明叠加层",
              desc: "生成的元素为透明PNG，可自由调整位置和大小",
            },
            {
              icon: Zap,
              title: "实时预览",
              desc: "所见即所得，拖拽调整，满意后一键导出",
            },
          ].map((feature) => (
            <div key={feature.title} className="glass-panel p-8 text-center">
              <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-5">
                <feature.icon className="w-7 h-7 text-accent" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">{feature.title}</h3>
              <p className="text-foreground/60 text-sm">{feature.desc}</p>
            </div>
          ))}
        </section>

        <section className="glass-panel-elevated p-12 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">准备好开始了吗？</h2>
          <p className="text-foreground/60 mb-8">无需注册，立即上传图片开始创作</p>
          <Link href="/studio" className="btn-primary-lg inline-flex">
            <Sparkles className="w-5 h-5" />
            进入工作台
          </Link>
        </section>
      </main>

      <footer className="relative z-10 border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-foreground/40">
          © 2024 雾光AI工作室 · FogGlow AI Studio
        </div>
      </footer>
    </div>
  );
}
