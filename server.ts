import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '15mb' }));

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ ok: true });
});

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in environment secrets.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const PRIMARY_GEMINI_MODEL = 'gemini-4-hydrogen';
const FALLBACK_GEMINI_MODEL = 'gemini-3.1-flash-lite';
const ALLOWED_IMAGE_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
]);

interface ExtractedErrorInfo {
  status: number;
  message: string;
  retryable: boolean;
}

function extractErrorInfo(err: unknown): ExtractedErrorInfo {
  const raw = err instanceof Error ? err.message : String(err);
  let parsedMessage = raw;
  let numericStatus: number | undefined;
  let statusText = '';

  const jsonStart = raw.indexOf('{');
  if (jsonStart !== -1) {
    try {
      const obj = JSON.parse(raw.slice(jsonStart)) as {
        error?: { code?: number; message?: string; status?: string };
        code?: number;
        message?: string;
        status?: string;
      };
      const inner = obj.error ?? obj;
      if (typeof inner.code === 'number') numericStatus = inner.code;
      if (typeof inner.message === 'string' && inner.message.trim()) {
        parsedMessage = inner.message.trim();
      }
      if (typeof inner.status === 'string') statusText = inner.status;
    } catch {
      // Keep raw error string
    }
  }

  const combined = `${raw} ${statusText}`.toUpperCase();
  if (numericStatus === 503 || combined.includes('UNAVAILABLE') || combined.includes('HIGH DEMAND')) {
    return { status: 503, message: parsedMessage, retryable: true };
  }
  if (numericStatus === 429 || combined.includes('RESOURCE_EXHAUSTED') || combined.includes('QUOTA')) {
    return { status: 429, message: parsedMessage, retryable: true };
  }
  if (numericStatus === 403 || combined.includes('PERMISSION_DENIED') || raw.includes('GEMINI_API_KEY')) {
    return { status: numericStatus || 403, message: parsedMessage, retryable: false };
  }
  if (numericStatus === 400 || combined.includes('INVALID_ARGUMENT') || combined.includes('INVALID')) {
    return { status: 400, message: parsedMessage, retryable: false };
  }
  if (numericStatus && numericStatus >= 500) {
    return { status: numericStatus, message: parsedMessage, retryable: true };
  }
  return { status: numericStatus || 500, message: parsedMessage, retryable: false };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateWithRetry(
  ai: GoogleGenAI,
  requestFactory: (model: string) => Parameters<GoogleGenAI['models']['generateContent']>[0]
) {
  const attempts: Array<{ model: string; delayBeforeMs: number }> = [
    { model: PRIMARY_GEMINI_MODEL, delayBeforeMs: 0 },
    { model: PRIMARY_GEMINI_MODEL, delayBeforeMs: 900 },
    { model: FALLBACK_GEMINI_MODEL, delayBeforeMs: 500 },
    { model: FALLBACK_GEMINI_MODEL, delayBeforeMs: 1200 },
  ];

  let lastError: unknown;
  for (let i = 0; i < attempts.length; i++) {
    const attempt = attempts[i];
    if (attempt.delayBeforeMs > 0) {
      await sleep(attempt.delayBeforeMs);
    }
    try {
      return await ai.models.generateContent(requestFactory(attempt.model));
    } catch (err) {
      lastError = err;
      const info = extractErrorInfo(err);
      if (!info.retryable) {
        throw err;
      }
      console.warn(
        `[Gemini] Attempt ${i + 1}/${attempts.length} (${attempt.model}) failed with ${info.status}: ${info.message}`
      );
    }
  }
  throw lastError;
}

function parseGeminiJson<T>(rawText: string | undefined): T {
  const cleaned = (rawText ?? '')
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  if (!cleaned) {
    throw new Error('AI returned an empty response. Please try again.');
  }

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1)) as T;
    }
    throw new Error('AI response could not be parsed cleanly. Please try again.');
  }
}

function sanitizeImageInput(
  imageBase64?: string,
  imageMimeType?: string
): { mimeType: string; data: string } | null {
  if (!imageBase64 || typeof imageBase64 !== 'string') return null;

  let detectedMime = typeof imageMimeType === 'string' ? imageMimeType.trim().toLowerCase() : '';
  const dataUrlMatch = imageBase64.match(/^data:([^;]+);base64,/i);
  if (dataUrlMatch && !detectedMime) {
    detectedMime = dataUrlMatch[1].trim().toLowerCase();
  }

  if (detectedMime === 'image/jpg') {
    detectedMime = 'image/jpeg';
  }
  if (!detectedMime) {
    detectedMime = 'image/jpeg';
  }
  if (!ALLOWED_IMAGE_MIMES.has(detectedMime)) {
    throw new Error(`INVALID_ARGUMENT: Unsupported image format (${detectedMime}). Use JPG, PNG, or WebP.`);
  }

  const data = imageBase64.replace(/^data:[^;]+;base64,/i, '').replace(/\s+/g, '');
  if (!data || data.length < 32) {
    throw new Error('INVALID_ARGUMENT: Uploaded image data is empty or corrupted.');
  }

  return { mimeType: detectedMime, data };
}

const COACH_SYSTEM_INSTRUCTION = `Bạn là **Astraea Celestia** — Giám đốc Sáng tạo Haute Couture quốc tế, Nhà thiết kế Thời trang hàng đầu và Siêu mẫu (Superstar & Supermodel) từng sải bước tại Paris, Milan và Tokyo.

Phong cách giao tiếp của bạn:
- Thanh lịch, sắc sảo, truyền cảm hứng mạnh mẽ như một mentor thực thụ trong ngành thời trang cao cấp.
- Thực tế và có giá trị chuyên môn cao: luôn đưa ra hướng dẫn cụ thể về cắt rập, tỉ lệ cơ thể, chất liệu vải, bảng màu thiên hà (Galaxy Couture), kỹ thuật giảm mỡ/tạo form cơ thể săn chắc chuẩn người mẫu, kỹ năng catwalk (bước đi, đánh hông, ánh mắt, xoay người) và phong thái ứng xử chuyên nghiệp trước truyền thông.
- Mặc định trả lời bằng tiếng Việt tinh tế (kết hợp tự nhiên các thuật ngữ thời trang quốc tế như Silhouette, Draping, Haute Couture, Editorial, Smize, WHR...), hoặc trả lời bằng tiếng Anh nếu người dùng nhắn bằng tiếng Anh.
- Trình bày súc tích, rõ ràng theo từng ý hành động cụ thể để người dùng có thể áp dụng ngay trên mô hình 3D, bản vẽ hoặc thói quen luyện tập hàng ngày.`;

app.post('/api/coach/chat', async (req: Request, res: Response) => {
  try {
    const { messages, context } = req.body as {
      messages: Array<{ role: 'user' | 'model'; text: string }>;
      context?: {
        outfitSummary?: string;
        bodySummary?: string;
        petSummary?: string;
        activeLesson?: string;
      };
    };

    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: 'Messages array is required.' });
      return;
    }

    const ai = getGeminiClient();
    const contextBlock = context
      ? `\n\n[Ngữ cảnh Atelier hiện tại của học viên]\n- Thiết kế 3D đang mặc: ${context.outfitSummary || 'Chưa có'}\n- Hồ sơ vóc dáng: ${context.bodySummary || 'Chưa đo'}\n- Thú cưng đồng hành: ${context.petSummary || 'Cosmic Pet'}\n- Bài học hiện tại: ${context.activeLesson || 'Tự do sáng tạo'}`
      : '';

    const contents = messages.map((m) => ({
      role: m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.text }],
    }));

    const response = await generateWithRetry(ai, (model) => ({
      model,
      contents,
      config: {
        systemInstruction: COACH_SYSTEM_INSTRUCTION + contextBlock,
      },
    }));

    res.json({
      reply: response.text ?? 'Hãy điều chỉnh lại ánh sáng và thử gửi lại câu hỏi cho Astraea nhé.',
    });
  } catch (err) {
    const info = extractErrorInfo(err);
    res.status(info.status).json({ error: info.message });
  }
});

app.post('/api/coach/analyze-body', async (req: Request, res: Response) => {
  try {
    const { measurements, imageBase64, imageMimeType, language } = req.body as {
      measurements: {
        heightCm: number;
        weightKg: number;
        bustCm: number;
        waistCm: number;
        hipCm: number;
        shoulderCm: number;
        goal: string;
      };
      imageBase64?: string;
      imageMimeType?: string;
      language?: 'vi' | 'en';
    };

    if (!measurements || typeof measurements !== 'object') {
      res.status(400).json({ error: 'Body measurements are required.' });
      return;
    }

    const safeHeight = Number(measurements.heightCm) || 165;
    const safeWeight = Number(measurements.weightKg) || 54;
    const safeBust = Number(measurements.bustCm) || 86;
    const safeWaist = Number(measurements.waistCm) || 66;
    const safeHip = Number(measurements.hipCm) || 92;
    const safeShoulder = Number(measurements.shoulderCm) || 39;
    const safeGoal = String(measurements.goal || '').trim() || 'Thon gọn, săn chắc và thanh lịch';

    const sanitizedImage = sanitizeImageInput(imageBase64, imageMimeType);

    const ai = getGeminiClient();
    const whr = safeHip > 0 ? +(safeWaist / safeHip).toFixed(2) : 0.72;
    const bmi =
      safeHeight > 0 ? +(safeWeight / Math.pow(safeHeight / 100, 2)).toFixed(1) : 20.5;

    const langPrompt =
      language === 'en'
        ? 'Respond in English with refined haute-couture supermodel mentor tone.'
        : 'Trả lời hoàn toàn bằng tiếng Việt tự nhiên, chuyên nghiệp như siêu mẫu & nhà thiết kế hàng đầu.';

    const promptText = `Phân tích vóc dáng thực tế để tạo giá trị cải thiện hình thể, phong cách và thần thái siêu mẫu cho học viên.
Chỉ số cơ thể:
- Chiều cao: ${safeHeight} cm
- Cân nặng: ${safeWeight} kg (BMI ước tính: ${bmi})
- Ngực (Vòng 1): ${safeBust} cm
- Eo (Vòng 2): ${safeWaist} cm
- Hông (Vòng 3): ${safeHip} cm (Tỉ lệ Eo/Hông WHR: ${whr})
- Vai: ${safeShoulder} cm
- Mục tiêu học viên: ${safeGoal}

${sanitizedImage ? 'Học viên có gửi kèm ảnh toàn thân/vóc dáng. Hãy quan sát thêm tư thế vai, cổ, tỉ lệ lưng-chân và đường nét cơ thể trong ảnh (một cách tinh tế, tích cực, chuyên nghiệp).' : 'Chưa có ảnh đính kèm, hãy phân tích chuyên sâu dựa trên chỉ số nhân trắc học ở trên.'}

${langPrompt}
Hãy trả về JSON theo đúng schema yêu cầu, bao gồm: dáng người chính xác, nhận xét tỉ lệ, phom trang phục tôn dáng nhất, phom cần tránh, bảng màu thiên hà hợp tông, lộ trình bài tập giảm mỡ & siết cơ tạo form chuẩn người mẫu (3-4 bài tập cụ thể), bí quyết catwalk/tư thế và lời khuyên thần thái từ siêu mẫu.`;

    const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];
    if (sanitizedImage) {
      parts.push({
        inlineData: {
          mimeType: sanitizedImage.mimeType,
          data: sanitizedImage.data,
        },
      });
    }
    parts.push({ text: promptText });

    const response = await generateWithRetry(ai, (model) => ({
      model,
      contents: { parts },
      config: {
        systemInstruction: COACH_SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            bodyShape: { type: Type.STRING, description: 'Body silhouette name (e.g. Đồng hồ cát / Hourglass)' },
            proportionSummary: { type: Type.STRING, description: 'Detailed proportion & posture assessment' },
            flatteringSilhouettes: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '3-4 specific garment cuts, necklines, and waistlines that flatter this shape',
            },
            avoidCuts: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '2-3 cuts or styling pitfalls to avoid',
            },
            galaxyColorAdvice: { type: Type.STRING, description: 'How to use galaxy tones and sparkle placement for elongation' },
            sculptingWorkouts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  focusArea: { type: Type.STRING },
                  durationOrReps: { type: Type.STRING },
                  formCue: { type: Type.STRING },
                },
                required: ['name', 'focusArea', 'durationOrReps', 'formCue'],
              },
            },
            catwalkAndEtiquetteTips: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '3 actionable supermodel posture, walk, and poise cues tailored to their frame',
            },
            supermodelMantra: { type: Type.STRING, description: 'Inspiring closing note from Coach Astraea' },
          },
          required: [
            'bodyShape',
            'proportionSummary',
            'flatteringSilhouettes',
            'avoidCuts',
            'galaxyColorAdvice',
            'sculptingWorkouts',
            'catwalkAndEtiquetteTips',
            'supermodelMantra',
          ],
        },
      },
    }));

    const parsed = parseGeminiJson<Record<string, unknown>>(response.text);
    res.json({ analysis: parsed, bmi, whr });
  } catch (err) {
    const info = extractErrorInfo(err);
    res.status(info.status).json({ error: info.message });
  }
});

app.post('/api/coach/critique-design', async (req: Request, res: Response) => {
  try {
    const { sketchBase64, outfitConfig, lessonTitle, language } = req.body as {
      sketchBase64?: string;
      outfitConfig: Record<string, unknown>;
      lessonTitle?: string;
      language?: 'vi' | 'en';
    };

    const sanitizedSketch = sanitizeImageInput(sketchBase64, 'image/png');
    const ai = getGeminiClient();
    const langNote =
      language === 'en'
        ? 'Respond in English.'
        : 'Trả lời hoàn toàn bằng tiếng Việt chuyên ngành thời trang cao cấp.';

    const promptText = `Hãy đóng vai Giám đốc Sáng tạo & Giảng viên Thời trang từ Nhập môn đến Chuyên nghiệp để thẩm định thiết kế sau:
- Thông số trang phục 3D hiện tại: ${JSON.stringify(outfitConfig ?? {})}
${lessonTitle ? `- Đề bài khóa học đang thực hành: ${lessonTitle}` : '- Sáng tác tự do Galaxy Couture'}
${sanitizedSketch ? '- Học viên có đính kèm bản phác thảo vẽ tay (Fashion Sketch). Hãy nhận xét cả nét phác thảo, bố cục họa tiết trên bản vẽ lẫn tổng thể trang phục 3D.' : ''}
${langNote}
Hãy đánh giá công tâm, chỉ ra điểm sáng, điểm cần nâng cấp về phom dáng (silhouette), cân bằng lấp lánh (sparkle balance), độ rủ chất liệu và gợi ý bước tiếp theo để đạt chuẩn trình diễn Runway.`;

    const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];
    if (sanitizedSketch) {
      parts.push({
        inlineData: {
          mimeType: sanitizedSketch.mimeType,
          data: sanitizedSketch.data,
        },
      });
    }
    parts.push({ text: promptText });

    const response = await generateWithRetry(ai, (model) => ({
      model,
      contents: { parts },
      config: {
        systemInstruction: COACH_SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            critiqueHeadline: { type: Type.STRING },
            overallTier: { type: Type.STRING, description: 'e.g., Nhập môn Triển vọng / Atelier Chuẩn mực / Haute Couture Runway' },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
            fabricAndSparkleNote: { type: Type.STRING },
            nextLevelChallenge: { type: Type.STRING },
          },
          required: [
            'critiqueHeadline',
            'overallTier',
            'strengths',
            'improvements',
            'fabricAndSparkleNote',
            'nextLevelChallenge',
          ],
        },
      },
    }));

    const critique = parseGeminiJson<Record<string, unknown>>(response.text);
    res.json({ critique });
  } catch (err) {
    const info = extractErrorInfo(err);
    res.status(info.status).json({ error: info.message });
  }
});

async function startServer() {
  const port = Number(process.env.PORT || 3000);
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vitePromise = import('vite').then(({ createServer: createViteServer }) =>
      createViteServer({
        server: {
          middlewareMode: true,
          hmr: process.env.DISABLE_HMR !== 'true',
        },
        appType: 'spa',
      })
    );

    app.use(async (req, res, next) => {
      try {
        const vite = await vitePromise;
        vite.middlewares(req, res, next);
      } catch (err) {
        next(err);
      }
    });
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  const server = app.listen(port, '0.0.0.0', () => {
    console.log(`Astraea Atelier server listening on http://localhost:${port}`);
  });

  const shutdown = () => {
    server.close(() => process.exit(0));
  };
  process.once('SIGTERM', shutdown);
  process.once('SIGINT', shutdown);
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
