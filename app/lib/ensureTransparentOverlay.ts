"use client";

type Rgb = { r: number; g: number; b: number };

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function luminance(c: Rgb) {
  return 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
}

function rgbDistance(a: Rgb, b: Rgb) {
  const dr = a.r - b.r;
  const dg = a.g - b.g;
  const db = a.b - b.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function isVeryWhite(c: Rgb) {
  return c.r > 245 && c.g > 245 && c.b > 245;
}

function isLightGray(c: Rgb) {
  return c.r > 210 && c.g > 210 && c.b > 210 && Math.abs(c.r - c.g) < 18 && Math.abs(c.g - c.b) < 18;
}

function isLightBackgroundColor(c: Rgb) {
  return luminance(c) > 220;
}

function isNeutralish(c: Rgb) {
  const max = Math.max(c.r, c.g, c.b);
  const min = Math.min(c.r, c.g, c.b);
  return max - min < 42;
}

async function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("overlay 图片加载失败"));
    img.src = dataUrl;
  });
}

function hasAlphaChannel(imageData: ImageData) {
  const data = imageData.data;
  let transparentCount = 0;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 250) transparentCount++;
  }
  return transparentCount / (data.length / 4) > 0.01;
}

function collectEdgeSamples(imageData: ImageData) {
  const { width, height, data } = imageData;
  const samples: Rgb[] = [];
  const step = Math.max(1, Math.floor(Math.min(width, height) / 40));

  const push = (x: number, y: number) => {
    const idx = (y * width + x) * 4;
    samples.push({ r: data[idx], g: data[idx + 1], b: data[idx + 2] });
  };

  for (let x = 0; x < width; x += step) {
    push(x, 0);
    push(x, height - 1);
  }
  for (let y = 0; y < height; y += step) {
    push(0, y);
    push(width - 1, y);
  }

  return samples;
}

function bucketizeColor(s: Rgb) {
  const q = (v: number) => Math.round(v / 16) * 16;
  return `${q(s.r)}-${q(s.g)}-${q(s.b)}`;
}

function estimateBackgroundPalette(imageData: ImageData, maxColors: number) {
  const samples = collectEdgeSamples(imageData);
  const bucket = new Map<string, { r: number; g: number; b: number; count: number }>();

  for (const s of samples) {
    const key = bucketizeColor(s);
    const existing = bucket.get(key);
    if (existing) {
      existing.r = (existing.r * existing.count + s.r) / (existing.count + 1);
      existing.g = (existing.g * existing.count + s.g) / (existing.count + 1);
      existing.b = (existing.b * existing.count + s.b) / (existing.count + 1);
      existing.count++;
    } else {
      bucket.set(key, { r: s.r, g: s.g, b: s.b, count: 1 });
    }
  }

  const sorted = Array.from(bucket.values()).sort((a, b) => b.count - a.count);
  const top = sorted.slice(0, maxColors).map((c) => ({
    r: Math.round(c.r),
    g: Math.round(c.g),
    b: Math.round(c.b),
    count: c.count,
  }));

  return { colors: top, sampleCount: samples.length };
}

function isLikelyCheckerboard(palette: { colors: Array<Rgb & { count: number }>; sampleCount: number }) {
  const [c1, c2] = palette.colors;
  if (!c1 || !c2) return false;
  if (palette.sampleCount <= 0) return false;

  const f1 = c1.count / palette.sampleCount;
  const f2 = c2.count / palette.sampleCount;

  if (f1 < 0.32 || f2 < 0.18) return false;
  if (f1 + f2 < 0.72) return false;

  const dist = rgbDistance(c1, c2);
  if (dist < 14) return false;

  const bgLike = (c: Rgb) => isNeutralish(c) && luminance(c) > 170;
  if (!bgLike(c1) || !bgLike(c2)) return false;

  return true;
}

function removeBackgroundByPalette(imageData: ImageData, colors: Rgb[], opts: { threshold: number; feather: number }) {
  const data = imageData.data;
  const { width, height } = imageData;

  let changed = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    if (a === 0) continue;

    const px = { r, g, b };
    const minDist = colors.reduce((best, bg) => Math.min(best, rgbDistance(px, bg)), Infinity);

    if (minDist <= opts.threshold || isVeryWhite(px) || isLightGray(px)) {
      data[i + 3] = 0;
      changed++;
      continue;
    }

    if (minDist <= opts.threshold + opts.feather) {
      const t = clamp((minDist - opts.threshold) / opts.feather, 0, 1);
      const nextA = Math.round(a * t);
      if (nextA !== a) {
        data[i + 3] = nextA;
        changed++;
      }
    }
  }

  const pixelCount = width * height;
  const applied = pixelCount > 0 ? changed / pixelCount > 0.02 : false;
  return { imageData, applied };
}

function removeSolidBackground(imageData: ImageData) {
  const palette = estimateBackgroundPalette(imageData, 1);
  const bg = palette.colors[0] ?? { r: 255, g: 255, b: 255, count: 0 };

  if (!isLightBackgroundColor(bg)) {
    return { imageData, applied: false };
  }

  return removeBackgroundByPalette(imageData, [bg], { threshold: 38, feather: 28 });
}

function removeCheckerboardBackground(imageData: ImageData) {
  const palette = estimateBackgroundPalette(imageData, 2);
  if (!isLikelyCheckerboard(palette)) {
    return { imageData, applied: false };
  }

  const colors = palette.colors.slice(0, 2).map((c) => ({ r: c.r, g: c.g, b: c.b }));
  return removeBackgroundByPalette(imageData, colors, { threshold: 34, feather: 28 });
}

export async function ensureTransparentPngOverlay(dataUrl: string) {
  const img = await loadImage(dataUrl);

  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return { dataUrl, applied: false };

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  if (hasAlphaChannel(imageData)) {
    return { dataUrl, applied: false };
  }

  const checkerboard = removeCheckerboardBackground(imageData);
  if (checkerboard.applied) {
    ctx.putImageData(checkerboard.imageData, 0, 0);
    const cleaned = canvas.toDataURL("image/png");
    return { dataUrl: cleaned, applied: true };
  }

  const solid = removeSolidBackground(imageData);
  if (!solid.applied) {
    return { dataUrl, applied: false };
  }

  ctx.putImageData(solid.imageData, 0, 0);
  const cleaned = canvas.toDataURL("image/png");
  return { dataUrl: cleaned, applied: true };
}
