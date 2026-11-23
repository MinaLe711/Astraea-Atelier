import React, { useEffect, useRef, useState } from 'react';
import { DEFAULT_WORKOUTS } from '../data/fashionCurriculum';
import {
  BodyAnalysisResult,
  BodyMeasurements,
  BodyProportions,
  Language,
  ModelPose,
  WorkoutItem,
} from '../types/atelier';

interface BodyWorkoutPanelProps {
  language: Language;
  measurements: BodyMeasurements;
  analysis: BodyAnalysisResult | null;
  onChangeMeasurements: (next: BodyMeasurements) => void;
  onSyncBodyTo3D: (scale: BodyProportions) => void;
  onAnalysisComplete: (result: BodyAnalysisResult) => void;
  onTriggerWorkoutPose: (pose: ModelPose) => void;
}

interface PhotoMeta {
  width: number;
  height: number;
  sizeKb: number;
}

const MAX_IMAGE_DIM = 1024;
const MAX_RAW_UPLOAD_BYTES = 25 * 1024 * 1024;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Could not read file contents.'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  });
}

function estimateBase64Kb(dataUrl: string): number {
  const b64 = dataUrl.split(',')[1] ?? '';
  return Math.max(1, Math.round((b64.length * 3) / 4 / 1024));
}

async function normalizeImageFile(file: File): Promise<{
  dataUrl: string;
  mimeType: string;
  meta: PhotoMeta;
}> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('BROWSER_DECODE_FAILED'));
      el.src = objectUrl;
    });

    const naturalW = img.naturalWidth || img.width;
    const naturalH = img.naturalHeight || img.height;
    if (!naturalW || !naturalH) {
      throw new Error('BROWSER_DECODE_FAILED');
    }

    const scale = Math.min(1, MAX_IMAGE_DIM / Math.max(naturalW, naturalH));
    const targetW = Math.max(1, Math.round(naturalW * scale));
    const targetH = Math.max(1, Math.round(naturalH * scale));

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('CANVAS_UNAVAILABLE');
    }

    // Fill dark backdrop first in case PNG/WebP contains alpha transparency
    ctx.fillStyle = '#09061A';
    ctx.fillRect(0, 0, targetW, targetH);
    ctx.drawImage(img, 0, 0, targetW, targetH);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.86);
    return {
      dataUrl,
      mimeType: 'image/jpeg',
      meta: {
        width: targetW,
        height: targetH,
        sizeKb: estimateBase64Kb(dataUrl),
      },
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export const BodyWorkoutPanel: React.FC<BodyWorkoutPanelProps> = ({
  language,
  measurements,
  analysis,
  onChangeMeasurements,
  onSyncBodyTo3D,
  onAnalysisComplete,
  onTriggerWorkoutPose,
}) => {
  const isVi = language === 'vi';
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoMime, setPhotoMime] = useState<string>('image/jpeg');
  const [photoMeta, setPhotoMeta] = useState<PhotoMeta | null>(null);
  const [processingUpload, setProcessingUpload] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  const [activeTimerSec, setActiveTimerSec] = useState<number>(0);
  const [activeWorkoutName, setActiveWorkoutName] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (activeTimerSec <= 0) return;
    const id = window.setInterval(() => {
      setActiveTimerSec((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [activeTimerSec]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!cameraOpen || !video || !streamRef.current) return;

    video.srcObject = streamRef.current;
    const handleReady = () => {
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        setCameraReady(true);
      }
    };
    video.addEventListener('loadedmetadata', handleReady);
    video.addEventListener('canplay', handleReady);
    void video.play().catch(() => {
      // Some browsers wait for user interaction or loadedmetadata
    });

    return () => {
      video.removeEventListener('loadedmetadata', handleReady);
      video.removeEventListener('canplay', handleReady);
    };
  }, [cameraOpen]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraReady(false);
    setCameraOpen(false);
  };

  const startCamera = async () => {
    setCameraError(null);
    setUploadError(null);
    setCameraReady(false);
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError(
        isVi
          ? 'Trình duyệt không hỗ trợ webcam trực tiếp. Hãy tải ảnh lên bên cạnh.'
          : 'Camera unavailable in this browser. Please upload a photo instead.'
      );
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 960 }, height: { ideal: 1280 } },
      });
      streamRef.current = stream;
      setCameraOpen(true);
    } catch {
      setCameraError(
        isVi
          ? 'Không thể truy cập camera (bạn có thể chọn Chọn ảnh để tải ảnh body lên phân tích).'
          : 'Camera access denied. You can upload a full-body photo for analysis.'
      );
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
      setCameraError(
        isVi
          ? 'Camera đang khởi động khung hình, vui lòng chờ 1 giây rồi chụp lại.'
          : 'Camera frame is still warming up. Please try again in a moment.'
      );
      return;
    }

    const scale = Math.min(1, MAX_IMAGE_DIM / Math.max(video.videoWidth, video.videoHeight));
    const targetW = Math.max(1, Math.round(video.videoWidth * scale));
    const targetH = Math.max(1, Math.round(video.videoHeight * scale));

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, targetW, targetH);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.86);
    setPhotoPreview(dataUrl);
    setPhotoMime('image/jpeg');
    setPhotoMeta({
      width: targetW,
      height: targetH,
      sizeKb: estimateBase64Kb(dataUrl),
    });
    setUploadError(null);
    setAnalyzeError(null);
    stopCamera();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    setUploadError(null);
    setAnalyzeError(null);
    setCameraError(null);

    const lowerName = file.name.toLowerCase();
    const isHeic =
      file.type === 'image/heic' ||
      file.type === 'image/heif' ||
      lowerName.endsWith('.heic') ||
      lowerName.endsWith('.heif');
    const looksLikeImage =
      file.type.startsWith('image/') ||
      /\.(jpe?g|png|webp|gif|bmp|heic|heif|avif)$/i.test(lowerName);

    if (!looksLikeImage) {
      setUploadError(
        isVi
          ? 'Tệp vừa chọn không phải là ảnh hợp lệ. Vui lòng chọn ảnh JPG, PNG hoặc WebP.'
          : 'Selected file is not a supported image. Please choose a JPG, PNG, or WebP photo.'
      );
      return;
    }

    if (file.size > MAX_RAW_UPLOAD_BYTES) {
      setUploadError(
        isVi
          ? 'Ảnh quá lớn (vượt quá 25 MB). Vui lòng chọn ảnh nhẹ hơn.'
          : 'Image exceeds 25 MB limit. Please choose a smaller photo.'
      );
      return;
    }

    setProcessingUpload(true);
    try {
      const normalized = await normalizeImageFile(file);
      setPhotoPreview(normalized.dataUrl);
      setPhotoMime(normalized.mimeType);
      setPhotoMeta(normalized.meta);
      if (cameraOpen) stopCamera();
    } catch {
      if (isHeic && file.size <= 8 * 1024 * 1024) {
        try {
          const dataUrl = await readFileAsDataUrl(file);
          setPhotoPreview(dataUrl);
          setPhotoMime(file.type || 'image/heic');
          setPhotoMeta({
            width: 0,
            height: 0,
            sizeKb: estimateBase64Kb(dataUrl),
          });
          if (cameraOpen) stopCamera();
          return;
        } catch {
          // Fall through to unified error message
        }
      }
      setUploadError(
        isVi
          ? 'Không thể đọc định dạng ảnh này trên trình duyệt. Hãy thử lưu hoặc chụp lại dưới dạng JPG / PNG.'
          : 'Could not decode this image format in your browser. Please try a JPG or PNG photo.'
      );
    } finally {
      setProcessingUpload(false);
    }
  };

  const handleSync3D = () => {
    const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
    onSyncBodyTo3D({
      bust: clamp(measurements.bustCm / 88, 0.85, 1.22),
      waist: clamp(measurements.waistCm / 66, 0.72, 1.25),
      hip: clamp(measurements.hipCm / 92, 0.85, 1.25),
      shoulder: clamp(measurements.shoulderCm / 40, 0.85, 1.22),
      height: clamp(measurements.heightCm / 168, 0.9, 1.12),
    });
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setAnalyzeError(null);
    handleSync3D();
    try {
      const base64 = photoPreview ? photoPreview.replace(/^data:[^;]+;base64,/, '') : undefined;
      const res = await fetch('/api/coach/analyze-body', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          measurements,
          imageBase64: base64,
          imageMimeType: base64 ? photoMime : undefined,
          language,
        }),
      });

      const rawText = await res.text();
      let data: { analysis?: BodyAnalysisResult; error?: string } = {};
      if (rawText) {
        try {
          data = JSON.parse(rawText) as { analysis?: BodyAnalysisResult; error?: string };
        } catch {
          if (res.status === 413) {
            throw new Error(
              isVi
                ? 'Dung lượng ảnh gửi lên quá lớn. Hãy chọn lại ảnh khác hoặc chụp lại.'
                : 'Uploaded photo payload is too large. Please try another photo.'
            );
          }
          throw new Error(
            isVi
              ? `Máy chủ phản hồi lỗi (${res.status}). Vui lòng thử lại sau vài giây.`
              : `Server returned an unexpected response (${res.status}). Please retry.`
          );
        }
      }

      if (!res.ok) {
        if (res.status === 503 || res.status === 429) {
          throw new Error(
            isVi
              ? 'Hệ thống AI phân tích đang quá tải tạm thời. Vui lòng bấm "Thử lại" sau vài giây.'
              : 'AI vision service is temporarily busy. Please click Retry in a moment.'
          );
        }
        throw new Error(data.error || `Analysis failed (${res.status})`);
      }

      if (!data.analysis) {
        throw new Error(
          isVi ? 'Không nhận được kết quả phân tích hợp lệ từ AI.' : 'Missing analysis payload.'
        );
      }

      onAnalysisComplete(data.analysis);
    } catch (err) {
      setAnalyzeError(
        err instanceof Error
          ? err.message
          : isVi
            ? 'Không thể phân tích vóc dáng lúc này.'
            : 'Unable to analyze body right now.'
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const whr = measurements.hipCm > 0 ? (measurements.waistCm / measurements.hipCm).toFixed(2) : '0.00';
  const bmi =
    measurements.heightCm > 0
      ? (measurements.weightKg / Math.pow(measurements.heightCm / 100, 2)).toFixed(1)
      : '0.0';

  const workouts: WorkoutItem[] = analysis?.sculptingWorkouts?.length
    ? analysis.sculptingWorkouts
    : DEFAULT_WORKOUTS;

  return (
    <div className="space-y-4 text-sm">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-200">
          {isVi ? 'Đo Chỉ số Cơ thể & Chụp ảnh Dáng' : 'Body Scan & Proportions Studio'}
        </h3>
        <p className="text-xs text-violet-300/80 mt-0.5">
          {isVi
            ? 'Xác định dáng người chuẩn xác, đồng bộ lên mẫu 3D và nhận giáo án giảm mỡ săn chắc từ Siêu mẫu.'
            : 'Analyze your silhouette via measurements or photo, sync to the 3D model, and get a sculpting plan.'}
        </p>
      </div>

      {/* Numeric measurements */}
      <div className="grid grid-cols-3 gap-2">
        {(
          [
            { key: 'heightCm', label: isVi ? 'Cao (cm)' : 'Height', min: 135, max: 205 },
            { key: 'weightKg', label: isVi ? 'Nặng (kg)' : 'Weight', min: 35, max: 140 },
            { key: 'shoulderCm', label: isVi ? 'Vai (cm)' : 'Shoulder', min: 30, max: 58 },
            { key: 'bustCm', label: isVi ? 'Ngực V1' : 'Bust', min: 65, max: 130 },
            { key: 'waistCm', label: isVi ? 'Eo V2' : 'Waist', min: 50, max: 120 },
            { key: 'hipCm', label: isVi ? 'Hông V3' : 'Hip', min: 70, max: 135 },
          ] as const
        ).map((f) => (
          <label key={f.key} className="block bg-[#120D2A] border border-violet-300/15 rounded-lg p-2">
            <span className="block text-[11px] text-violet-300 mb-1">{f.label}</span>
            <input
              type="number"
              min={f.min}
              max={f.max}
              value={measurements[f.key]}
              onChange={(e) =>
                onChangeMeasurements({ ...measurements, [f.key]: Number(e.target.value) || f.min })
              }
              className="w-full bg-transparent text-white font-mono-data text-sm font-semibold focus:outline-none"
            />
          </label>
        ))}
      </div>

      <div className="flex items-center justify-between text-xs px-3 py-2 rounded-lg bg-[#130E2E] border border-violet-300/15">
        <span className="text-violet-200">
          BMI: <strong className="font-mono-data text-amber-200">{bmi}</strong> · WHR:{' '}
          <strong className="font-mono-data text-cyan-200">{whr}</strong>
        </span>
        <button
          type="button"
          onClick={handleSync3D}
          className="text-fuchsia-300 hover:text-fuchsia-200 font-semibold cursor-pointer"
        >
          {isVi ? 'Đồng bộ Mẫu 3D' : 'Sync to 3D'}
        </button>
      </div>

      {/* Goal */}
      <label className="block">
        <span className="block text-xs text-violet-300 mb-1">
          {isVi ? 'Mục tiêu vóc dáng của bạn' : 'Your Physique & Styling Goal'}
        </span>
        <input
          type="text"
          value={measurements.goal}
          onChange={(e) => onChangeMeasurements({ ...measurements, goal: e.target.value })}
          className="w-full px-3 py-2 rounded-lg bg-[#120D2A] border border-violet-300/20 text-xs text-white focus:outline-none focus:border-fuchsia-400"
        />
      </label>

      {/* Camera / Body Photo Upload */}
      <div className="p-3 rounded-xl bg-[#120D2A] border border-violet-300/15 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-violet-200">
            {isVi ? 'Ảnh Body (Camera hoặc Tải lên)' : 'Body Photo (Camera or Upload)'}
          </span>
          <div className="flex items-center gap-2">
            {!cameraOpen ? (
              <button
                type="button"
                onClick={startCamera}
                className="px-2.5 py-1 rounded-md bg-violet-600/40 border border-violet-400/40 text-xs text-white hover:bg-violet-600/60 cursor-pointer"
              >
                {isVi ? 'Mở Camera' : 'Camera'}
              </button>
            ) : (
              <button
                type="button"
                onClick={stopCamera}
                className="px-2.5 py-1 rounded-md bg-rose-600/40 text-xs text-white cursor-pointer"
              >
                {isVi ? 'Đóng' : 'Close'}
              </button>
            )}
            <label className="px-2.5 py-1 rounded-md bg-[#1D1542] border border-violet-300/25 text-xs text-violet-100 hover:border-fuchsia-400 cursor-pointer">
              {processingUpload ? (isVi ? 'Đang xử lý...' : 'Loading...') : isVi ? 'Chọn ảnh' : 'Upload'}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic,image/heif,image/*"
                onChange={handleFileUpload}
                disabled={processingUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {cameraError && <p className="text-xs text-amber-200/90">{cameraError}</p>}
        {uploadError && <p className="text-xs text-rose-300">{uploadError}</p>}

        {cameraOpen && (
          <div className="space-y-2">
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className="w-full h-44 object-cover rounded-lg bg-black"
            />
            <button
              type="button"
              onClick={capturePhoto}
              disabled={!cameraReady}
              className="w-full py-2 rounded-lg bg-fuchsia-600 text-xs font-semibold text-white disabled:opacity-50 cursor-pointer"
            >
              {cameraReady
                ? isVi
                  ? 'Chụp ảnh Dáng người'
                  : 'Capture Body Photo'
                : isVi
                  ? 'Đang bật camera...'
                  : 'Warming up camera...'}
            </button>
          </div>
        )}

        {photoPreview && !cameraOpen && (
          <div className="flex items-center gap-3">
            <img
              src={photoPreview}
              alt="Body preview"
              referrerPolicy="no-referrer"
              className="w-16 h-20 object-cover rounded-lg border border-violet-300/30 bg-[#09061A]"
            />
            <div className="flex-1 text-xs text-violet-200">
              <p className="font-medium text-emerald-300">
                {isVi ? 'Đã sẵn sàng ảnh phân tích AI' : 'Photo ready for AI analysis'}
              </p>
              {photoMeta && (
                <p className="font-mono-data text-[11px] text-violet-300/80 mt-0.5">
                  {photoMeta.width > 0 ? `${photoMeta.width}×${photoMeta.height} px · ` : ''}
                  {photoMeta.sizeKb} KB
                </p>
              )}
              <button
                type="button"
                onClick={() => {
                  setPhotoPreview(null);
                  setPhotoMeta(null);
                  setUploadError(null);
                }}
                className="text-rose-300 underline mt-1 cursor-pointer"
              >
                {isVi ? 'Xóa ảnh' : 'Remove'}
              </button>
            </div>
          </div>
        )}
      </div>

      <button
        type="button"
        disabled={analyzing || processingUpload}
        onClick={handleAnalyze}
        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-amber-500 text-white text-xs font-semibold hover:brightness-110 disabled:opacity-50 cursor-pointer"
      >
        {analyzing
          ? isVi
            ? 'AI Siêu mẫu đang phân tích vóc dáng...'
            : 'Analyzing silhouette & proportions...'
          : isVi
            ? 'Phân tích Dáng & Lập Giáo án Giảm mỡ Săn chắc'
            : 'Analyze Body Shape & Create Sculpting Plan'}
      </button>

      {analyzeError && (
        <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-400/35 text-xs text-rose-200 flex items-start justify-between gap-3">
          <span className="leading-relaxed">{analyzeError}</span>
          <button
            type="button"
            disabled={analyzing}
            onClick={handleAnalyze}
            className="shrink-0 px-2.5 py-1 rounded-md bg-rose-500/30 border border-rose-300/40 text-rose-100 font-semibold hover:bg-rose-500/45 cursor-pointer"
          >
            {isVi ? 'Thử lại' : 'Retry'}
          </button>
        </div>
      )}

      {analysis && (
        <div className="p-4 rounded-xl bg-[#130E2E] border border-amber-300/25 space-y-2.5 text-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-violet-300">{isVi ? 'Dáng cơ thể:' : 'Body Type:'}</span>
            <span className="font-display text-lg font-semibold text-amber-200 text-right">
              {analysis.bodyShape}
            </span>
          </div>
          <p className="text-violet-100/90 leading-relaxed">{analysis.proportionSummary}</p>

          {analysis.flatteringSilhouettes?.length > 0 && (
            <div>
              <p className="font-semibold text-emerald-300 mb-1">
                {isVi ? 'Phom trang phục tôn dáng nhất:' : 'Most Flattering Cuts:'}
              </p>
              <ul className="list-disc pl-4 space-y-0.5 text-violet-100">
                {analysis.flatteringSilhouettes.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}

          {analysis.avoidCuts?.length > 0 && (
            <div>
              <p className="font-semibold text-rose-300 mb-1">
                {isVi ? 'Nên hạn chế:' : 'Cuts to Avoid:'}
              </p>
              <ul className="list-disc pl-4 space-y-0.5 text-violet-200/90">
                {analysis.avoidCuts.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}

          {analysis.catwalkAndEtiquetteTips?.length > 0 && (
            <div>
              <p className="font-semibold text-fuchsia-300 mb-1">
                {isVi ? 'Bí quyết Catwalk & Thần thái theo dáng:' : 'Catwalk & Posture Cues:'}
              </p>
              <ul className="list-disc pl-4 space-y-0.5 text-violet-100/95">
                {analysis.catwalkAndEtiquetteTips.map((tip, i) => (
                  <li key={i}>{tip}</li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-cyan-200 pt-1 border-t border-violet-300/15">
            {analysis.galaxyColorAdvice}
          </p>
          <p className="italic text-amber-200/95">“{analysis.supermodelMantra}”</p>
        </div>
      )}

      {/* Sculpting Workouts with 3D Demo */}
      <div className="space-y-2 pt-2 border-t border-violet-300/15">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-200">
            {isVi ? 'Bài tập Giảm mỡ & Siết Form Siêu mẫu' : 'Supermodel Sculpting Workouts'}
          </h4>
          {activeTimerSec > 0 && (
            <span className="font-mono-data text-xs font-bold text-cyan-300">
              {activeWorkoutName} · {activeTimerSec}s
            </span>
          )}
        </div>

        <div className="space-y-2">
          {workouts.map((w, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-[#120D2A] border border-violet-300/15 space-y-1.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-xs text-white">{w.name}</span>
                <span className="font-mono-data text-[11px] text-amber-200 shrink-0">
                  {w.durationOrReps}
                </span>
              </div>
              <p className="text-[11px] text-fuchsia-300">{w.focusArea}</p>
              <p className="text-xs text-violet-200/85">{w.formCue}</p>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    onTriggerWorkoutPose(idx % 2 === 0 ? 'workout-sculpt' : 'workout-posture');
                    setActiveWorkoutName(w.name);
                    setActiveTimerSec(45);
                  }}
                  className="px-2.5 py-1 rounded-md bg-violet-600/35 border border-violet-400/35 text-[11px] font-medium text-white hover:bg-violet-600/55 cursor-pointer"
                >
                  {isVi ? 'Tập 45s cùng Mẫu 3D' : '45s 3D Guided Set'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
