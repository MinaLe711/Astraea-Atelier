import React, { useEffect, useRef, useState } from 'react';
import { DesignCritiqueResult, Language, OutfitConfig } from '../types/atelier';

interface SketchpadPanelProps {
  language: Language;
  outfit: OutfitConfig;
  onApplySketchTexture: (dataUrl: string) => void;
  onSparkleBurst: () => void;
}

type BrushMode = 'pen' | 'glitter' | 'neon' | 'eraser';

export const SketchpadPanel: React.FC<SketchpadPanelProps> = ({
  language,
  outfit,
  onApplySketchTexture,
  onSparkleBurst,
}) => {
  const isVi = language === 'vi';
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);

  const [brushMode, setBrushMode] = useState<BrushMode>('glitter');
  const [brushColor, setBrushColor] = useState('#F0ABFC');
  const [brushSize, setBrushSize] = useState(5);
  const [showCroquis, setShowCroquis] = useState(true);

  const [critiqueLoading, setCritiqueLoading] = useState(false);
  const [critique, setCritique] = useState<DesignCritiqueResult | null>(null);
  const [critiqueError, setCritiqueError] = useState<string | null>(null);

  const initCanvasBackground = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, outfit.primaryColor || '#1E1B4B');
    grad.addColorStop(1, '#09061A');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  useEffect(() => {
    initCanvasBackground();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getPointerCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const drawStroke = (from: { x: number; y: number }, to: { x: number; y: number }) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (brushMode === 'eraser') {
      ctx.strokeStyle = outfit.primaryColor || '#1E1B4B';
      ctx.lineWidth = brushSize * 2.4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
      return;
    }

    if (brushMode === 'glitter') {
      // Main luminous ink line + scattered starlight sparkles
      ctx.strokeStyle = brushColor;
      ctx.lineWidth = brushSize * 0.8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();

      for (let i = 0; i < 8; i++) {
        const ox = to.x + (Math.random() - 0.5) * brushSize * 5;
        const oy = to.y + (Math.random() - 0.5) * brushSize * 5;
        const r = Math.random() * 2.2 + 0.6;
        ctx.fillStyle = i % 2 === 0 ? '#FDE68A' : '#FFFFFF';
        ctx.beginPath();
        ctx.arc(ox, oy, r, 0, Math.PI * 2);
        ctx.fill();
      }
      return;
    }

    if (brushMode === 'neon') {
      ctx.save();
      ctx.shadowColor = brushColor;
      ctx.shadowBlur = 12;
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
      ctx.restore();
      return;
    }

    // Standard fashion pen
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    const pt = getPointerCoords(e);
    lastPosRef.current = pt;
    drawStroke(pt, pt);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current || !lastPosRef.current) return;
    const pt = getPointerCoords(e);
    drawStroke(lastPosRef.current, pt);
    lastPosRef.current = pt;
  };

  const handlePointerUp = () => {
    drawingRef.current = false;
    lastPosRef.current = null;
  };

  const handleApplyTo3D = () => {
    if (!canvasRef.current) return;
    const url = canvasRef.current.toDataURL('image/png');
    onApplySketchTexture(url);
    onSparkleBurst();
  };

  const handleCritiqueSketch = async () => {
    if (!canvasRef.current) return;
    setCritiqueLoading(true);
    setCritiqueError(null);
    try {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      const res = await fetch('/api/coach/critique-design', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sketchBase64: dataUrl,
          outfitConfig: {
            bodice: outfit.bodice,
            skirt: outfit.skirt,
            sleeves: outfit.sleeves,
            accessory: outfit.accessory,
            fabric: outfit.fabric,
            primaryColor: outfit.primaryColor,
            secondaryColor: outfit.secondaryColor,
            accentColor: outfit.accentColor,
            sparkleIntensity: outfit.sparkleIntensity,
          },
          language,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Critique failed');
      }
      setCritique(data.critique);
      onSparkleBurst();
    } catch (err) {
      setCritiqueError(err instanceof Error ? err.message : 'Unable to critique sketch');
    } finally {
      setCritiqueLoading(false);
    }
  };

  const sketchColors = ['#F0ABFC', '#FDE68A', '#67E8F9', '#FFFFFF', '#C084FC', '#F472B6', '#1E1B4B'];

  return (
    <div className="space-y-4 text-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-200">
            {isVi ? 'Bảng Phác thảo Bản nháp Thời trang' : 'Fashion Design Sketchpad'}
          </h3>
          <p className="text-xs text-violet-300/80 mt-0.5">
            {isVi
              ? 'Vẽ họa tiết hoặc bản nháp phom váy, sau đó áp trực tiếp lên vải 3D.'
              : 'Sketch motifs or garment patterns and drape them onto your 3D couture look.'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCroquis((v) => !v)}
          className="px-2.5 py-1 rounded-md text-xs border border-violet-300/20 bg-[#140F30] text-violet-200 hover:border-violet-300/40 cursor-pointer shrink-0"
        >
          {showCroquis
            ? isVi
              ? 'Ẩn khung Croquis'
              : 'Hide Croquis'
            : isVi
              ? 'Hiện Croquis'
              : 'Show Croquis'}
        </button>
      </div>

      {/* Canvas with optional non-destructive SVG croquis guide overlay */}
      <div className="relative rounded-xl overflow-hidden border border-violet-300/25 bg-[#080616]">
        <canvas
          ref={canvasRef}
          width={360}
          height={320}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          className="w-full h-[230px] block touch-none cursor-crosshair"
        />
        {showCroquis && (
          <svg
            viewBox="0 0 360 320"
            className="absolute inset-0 w-full h-full pointer-events-none opacity-30"
          >
            <g stroke="#FDE68A" strokeWidth="1" strokeDasharray="4 4" fill="none">
              <ellipse cx="180" cy="40" rx="16" ry="22" />
              <path d="M145 78 L215 78 L200 140 L160 140 Z" />
              <path d="M160 140 L200 140 L238 270 L122 270 Z" />
              <line x1="180" y1="62" x2="180" y2="290" />
            </g>
          </svg>
        )}
      </div>

      {/* Brush tools */}
      <div className="flex flex-wrap items-center gap-1.5">
        {(
          [
            { id: 'glitter', label: isVi ? 'Bút Kim tuyến' : 'Glitter' },
            { id: 'neon', label: isVi ? 'Ánh Sao Neon' : 'Star Neon' },
            { id: 'pen', label: isVi ? 'Nét Chì Couture' : 'Couture Pen' },
            { id: 'eraser', label: isVi ? 'Tẩy' : 'Eraser' },
          ] as const
        ).map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setBrushMode(m.id)}
            className={`px-2.5 py-1.5 rounded-md text-xs font-medium border cursor-pointer ${
              brushMode === m.id
                ? 'bg-fuchsia-600/35 border-fuchsia-300 text-white'
                : 'bg-[#120D2A] border-violet-300/15 text-violet-200'
            }`}
          >
            {m.label}
          </button>
        ))}

        <button
          type="button"
          onClick={initCanvasBackground}
          className="ml-auto px-2.5 py-1.5 rounded-md text-xs border border-rose-400/30 text-rose-200 hover:bg-rose-500/15 cursor-pointer"
        >
          {isVi ? 'Làm mới' : 'Clear'}
        </button>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          {sketchColors.map((hex) => (
            <button
              key={hex}
              type="button"
              onClick={() => setBrushColor(hex)}
              className={`w-6 h-6 rounded-full border cursor-pointer transition-transform ${
                brushColor === hex ? 'border-white scale-110' : 'border-white/20'
              }`}
              style={{ backgroundColor: hex }}
            />
          ))}
        </div>
        <div className="flex items-center gap-2 w-28">
          <span className="text-xs text-violet-300">{brushSize}px</span>
          <input
            type="range"
            min={2}
            max={16}
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="w-full cosmic-slider"
          />
        </div>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={handleApplyTo3D}
          className="px-3 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-xs font-semibold hover:brightness-110 cursor-pointer"
        >
          {isVi ? 'Áp dụng lên Vải 3D' : 'Apply to 3D Fabric'}
        </button>
        <button
          type="button"
          disabled={critiqueLoading}
          onClick={handleCritiqueSketch}
          className="px-3 py-2.5 rounded-xl bg-[#1A133D] border border-amber-300/40 text-amber-100 text-xs font-semibold hover:bg-amber-500/15 disabled:opacity-50 cursor-pointer"
        >
          {critiqueLoading
            ? isVi
              ? 'AI đang thẩm định...'
              : 'Analyzing...'
            : isVi
              ? 'Gửi AI Coach Chấm bài'
              : 'AI Coach Critique'}
        </button>
      </div>

      {critiqueError && (
        <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-400/35 text-xs text-rose-200">
          {critiqueError}
        </div>
      )}

      {critique && (
        <div className="p-4 rounded-xl bg-[#130E2E] border border-amber-300/25 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="font-display text-lg font-semibold text-amber-200">
              {critique.critiqueHeadline}
            </span>
            <span className="text-xs text-fuchsia-300 font-medium shrink-0">
              {critique.overallTier}
            </span>
          </div>
          <div className="text-xs text-violet-100/90 space-y-1">
            <p className="font-semibold text-emerald-300">{isVi ? 'Điểm sáng:' : 'Strengths:'}</p>
            <ul className="list-disc pl-4 space-y-0.5">
              {critique.strengths.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
          <div className="text-xs text-violet-100/90 space-y-1">
            <p className="font-semibold text-amber-200">{isVi ? 'Cần nâng cấp:' : 'Refinements:'}</p>
            <ul className="list-disc pl-4 space-y-0.5">
              {critique.improvements.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
          <p className="text-xs text-cyan-200/90 pt-1 border-t border-violet-300/15">
            {critique.fabricAndSparkleNote}
          </p>
          <p className="text-xs text-fuchsia-200 font-medium">
            {isVi ? 'Thử thách tiếp theo: ' : 'Next Challenge: '}
            {critique.nextLevelChallenge}
          </p>
        </div>
      )}
    </div>
  );
};
