import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const JSON_MODEL = process.env.GEMINI_MODEL || "gemini-3-flash-preview";
const IMAGE_MODEL = process.env.IMAGE_MODEL || "gemini-3-pro-image-preview";
const API_KEY = process.env.GEMINI_API_KEY || "";

type ImageSize = { w: number; h: number };

type Placement = {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
};

type JsonStageResult = {
  overlay_brief?: string;
  overlay_prompt?: string;
  overlayPrompt?: string;

  placement?: Partial<Placement>;

  negative_constraints?: string[];
  negativeConstraints?: string[];

  style_notes?: string;
  styleNotes?: string;

  confidence?: number;
  why?: string;
  assumptions?: string;
};

function safeNumber(value: unknown, fallback: number) {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function normalizeRotation(deg: number) {
  let v = deg;
  while (v > 180) v -= 360;
  while (v < -180) v += 360;
  return v;
}

function clampPlacementToImage(placementRaw: Partial<Placement> | undefined, imageSize: ImageSize): Placement {
  const defaultWidth = Math.max(64, Math.round(Math.min(imageSize.w, imageSize.h) * 0.35));
  const width = clamp(safeNumber(placementRaw?.width, defaultWidth), 8, imageSize.w);
  const height = clamp(safeNumber(placementRaw?.height, Math.round(width * 0.6)), 8, imageSize.h);

  const x = clamp(safeNumber(placementRaw?.x, 0), 0, Math.max(0, imageSize.w - width));
  const y = clamp(safeNumber(placementRaw?.y, 0), 0, Math.max(0, imageSize.h - height));

  const rotation = normalizeRotation(safeNumber(placementRaw?.rotation, 0));

  return { x, y, width, height, rotation };
}

function extractJson(text: string) {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const candidate = fenceMatch?.[1]?.trim() ?? trimmed;

  const jsonMatch = candidate.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;

  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    return null;
  }
}

function getPngSizeFromDataUrl(dataUrl: string): { w: number; h: number } | null {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  const mime = match[1];
  const b64 = match[2];
  if (!mime.includes("png")) return null;

  try {
    const buf = Buffer.from(b64, "base64");
    if (buf.length < 24) return null;

    const pngSignature = "89504e470d0a1a0a";
    const sig = buf.subarray(0, 8).toString("hex");
    if (sig !== pngSignature) return null;

    const width = buf.readUInt32BE(16);
    const height = buf.readUInt32BE(20);
    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return null;
    return { w: width, h: height };
  } catch {
    return null;
  }
}

async function callGeminiAPI(
  model: string,
  parts: any[],
  opts: { responseMimeType?: string; responseModalities?: string[]; temperature?: number },
) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;

  const requestBody: any = {
    contents: [{ parts }],
    generationConfig: {
      temperature: opts.temperature ?? 0.2,
    },
  };

  if (opts.responseMimeType) requestBody.generationConfig.responseMimeType = opts.responseMimeType;
  if (opts.responseModalities) requestBody.generationConfig.responseModalities = opts.responseModalities;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });

  const data = await response.json();

  if (!response.ok) {
    const errMsg = data.error?.message || JSON.stringify(data);
    throw new Error(`API 错误 (${response.status}): ${errMsg}`);
  }

  return data;
}

async function runJsonStage(args: {
  imageBase64: string;
  mimeType: string;
  instruction: string;
  imageSize: ImageSize;
  onLog: (msg: string) => void;
}): Promise<JsonStageResult> {
  const { imageBase64, mimeType, instruction, imageSize, onLog } = args;

  onLog(`定位与规格分析：正在识别主体与关键部位`);

  const prompt = `你是一名专业的图像编辑定位助手。你必须严格输出 JSON（不要输出 Markdown、不要输出解释文字、不要输出多余字段）。

任务：基于用户上传的原图与自然语言指令，生成“透明 PNG 叠加图层”的规格说明与放置位置。

用户指令：${instruction}
原图尺寸：${imageSize.w}x${imageSize.h} px

输出 JSON 结构（必须严格遵循）：
{
  "overlay_brief": "用英文详细描述要生成的新增物体（材质/颜色/风格/边缘/透视），必须强调 transparent PNG, no background, tight crop",
  "placement": {"x":0,"y":0,"width":0,"height":0,"rotation":0},
  "negative_constraints": ["不要背景","不要包含原图内容","不要改变原图尺寸/构图","不要生成多余装饰","不要文字水印"],
  "style_notes": "用英文描述如何匹配原图风格（卡通/写实、线条粗细、光照/阴影方式）",
  "confidence": 0.0
}

规则：
- placement 坐标系：原图左上角 (0,0)，单位 px。
- x/y 是新增物体叠加层放回原图时的左上角。
- width/height 是叠加层在原图中的目标显示尺寸。
- x 必须满足 0 <= x <= (W - width)，y 必须满足 0 <= y <= (H - height)。
- rotation 单位为度，正数顺时针。默认 rotation=0。
- 对称物体（例如墨镜/眼镜/皇冠/帽子）除非你能明确判断头部倾斜，否则 rotation 保持在 -8~8 之间。
- 如果不确定位置，confidence 设为较低（例如 0.2-0.4），并给出一个保守可见的 placement。
- 不要让新增物体遮挡关键主体（比如眼睛/脸部），除非用户明确要求。
- 必须只输出 JSON。`;

  const parts = [{ inline_data: { mime_type: mimeType, data: imageBase64 } }, { text: prompt }];

  const data = await callGeminiAPI(JSON_MODEL, parts, {
    responseMimeType: "application/json",
    temperature: 0.1,
  });

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  const json = extractJson(text);
  if (!json) throw new Error("模型未返回可解析的 JSON");

  return json as JsonStageResult;
}

async function runImageStage(args: {
  overlayBrief: string;
  styleNotes?: string;
  negativeConstraints?: string[];
  targetSize: { w: number; h: number };
  onLog: (msg: string) => void;
}): Promise<{ dataUrl: string; overlaySize?: { w: number; h: number } }> {
  const { overlayBrief, styleNotes, negativeConstraints, targetSize, onLog } = args;

  onLog(`透明图层生成：正在合成叠加物（无背景）`);

  const neg = (negativeConstraints ?? [])
    .filter(Boolean)
    .slice(0, 10)
    .map((s) => `- ${s}`)
    .join("\n");

  const prompt = `Generate a single object as a transparent PNG overlay.

OBJECT BRIEF:
${overlayBrief}

STYLE MATCH NOTES:
${styleNotes || "Match the original image style."}

NEGATIVE CONSTRAINTS:
${neg || "- No background\n- No original image content\n- No watermark\n- No extra decoration"}

HARD REQUIREMENTS:
1) Output must be a PNG with TRUE transparent background (alpha). No solid background, no texture, no checkerboard/transparency grid, no dithering pattern, no matte.
2) Only the object itself. Do not include any part of the original image.
3) Tight crop: minimal empty padding.
4) Clean edges, no halo.
5) The object must be complete, not cut off.
6) Approximate output size suggestion: ${Math.round(targetSize.w)}x${Math.round(targetSize.h)} px.

Return only the image.`;

  const data = await callGeminiAPI(IMAGE_MODEL, [{ text: prompt }], {
    responseModalities: ["IMAGE"],
    temperature: 0.2,
  });

  const responseParts = data.candidates?.[0]?.content?.parts || [];

  for (const part of responseParts) {
    if (part.inlineData?.data) {
      const mimeType = part.inlineData.mimeType || "image/png";
      const dataUrl = `data:${mimeType};base64,${part.inlineData.data}`;
      const overlaySize = getPngSizeFromDataUrl(dataUrl) ?? undefined;
      return { dataUrl, overlaySize };
    }
  }

  throw new Error("模型未返回图像数据");
}

export async function POST(req: NextRequest) {
  if (!API_KEY) {
    return NextResponse.json({ error: "服务端未配置 GEMINI_API_KEY" }, { status: 500 });
  }

  const body = (await req.json()) as {
    image?: string;
    prompt?: string;
    imageSize?: ImageSize;
  };

  const image = body.image;
  const prompt = body.prompt;
  const imageSize = body.imageSize;

  if (!image) return NextResponse.json({ error: "请先上传图片" }, { status: 400 });
  if (!prompt || prompt.trim() === "") {
    return NextResponse.json({ error: "请输入编辑指令" }, { status: 400 });
  }

  let base64Data = image;
  let mimeType = "image/png";

  if (image.startsWith("data:")) {
    const match = image.match(/^data:([^;]+);base64,(.+)$/);
    if (match) {
      mimeType = match[1];
      base64Data = match[2];
    }
  }

  const imgSize = imageSize && imageSize.w > 0 && imageSize.h > 0 ? imageSize : { w: 512, h: 512 };

  const encoder = new TextEncoder();
  const logs: string[] = [];

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (obj: unknown) => {
        controller.enqueue(encoder.encode(`${JSON.stringify(obj)}\n`));
      };

      const addLog = (msg: string) => {
        const line = `[${new Date().toLocaleTimeString("zh-CN")}] ${msg}`;
        logs.push(line);
        send({ type: "log", message: line });
      };

      (async () => {
        try {
          addLog("收到请求：正在启动流程");
          addLog(`原图尺寸：${imgSize.w}x${imgSize.h}`);
          addLog("阶段 1/2：定位与规格分析");

          const stage1 = await runJsonStage({
            imageBase64: base64Data,
            mimeType,
            instruction: prompt,
            imageSize: imgSize,
            onLog: addLog,
          });

          const overlayBrief =
            stage1.overlay_brief?.trim() ||
            stage1.overlay_prompt?.trim() ||
            stage1.overlayPrompt?.trim() ||
            "";

          if (!overlayBrief) throw new Error("模型未能给出 overlay_brief（或 overlay_prompt）");

          const placement = clampPlacementToImage(stage1.placement, imgSize);
          const confidence = clamp(safeNumber(stage1.confidence, 0.5), 0, 1);

          addLog(
            `建议位置：x=${Math.round(placement.x)}, y=${Math.round(placement.y)}, ${Math.round(
              placement.width
            )}x${Math.round(placement.height)}, r=${Math.round(placement.rotation)}°`
          );
          addLog("阶段 2/2：生成透明叠加图层");

          const stage2 = await runImageStage({
            overlayBrief,
            styleNotes: stage1.style_notes ?? stage1.styleNotes,
            negativeConstraints: stage1.negative_constraints ?? stage1.negativeConstraints,
            targetSize: { w: placement.width, h: placement.height },
            onLog: addLog,
          });

          const warnings: string[] = [];
          if (confidence < 0.4) {
            warnings.push("定位置信度较低，建议手动调整位置或更具体描述。" );
          }

          send({
            type: "result",
            data: {
              overlay_png_base64: stage2.dataUrl,
              overlay_size: stage2.overlaySize ?? null,
              placement,
              confidence,
              warnings,
              logs,
            },
          });

          controller.close();
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          send({ type: "error", error: message, logs });
          controller.close();
        }
      })();
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
