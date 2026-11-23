import React from 'react';
import {
  Camera,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  Heart,
  MessageSquare,
  Palette,
  PenTool,
  Ruler,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { CameraPreset, Language, ModelPose, StudioTab } from '../types/atelier';

interface BottomDockProps {
  language: Language;
  activeTab: StudioTab | null;
  pose: ModelPose;
  cameraPreset: CameraPreset;
  muted: boolean;
  hudCollapsed: boolean;
  onSelectTab: (tab: StudioTab) => void;
  onCyclePose: () => void;
  onSelectCamera: (preset: CameraPreset) => void;
  onSparkleShow: () => void;
  onToggleMute: () => void;
  onToggleHud: () => void;
}

export const BottomDock: React.FC<BottomDockProps> = ({
  language,
  activeTab,
  pose,
  cameraPreset,
  muted,
  hudCollapsed,
  onSelectTab,
  onCyclePose,
  onSelectCamera,
  onSparkleShow,
  onToggleMute,
  onToggleHud,
}) => {
  const isVi = language === 'vi';

  const tabs: Array<{ id: StudioTab; label: string; icon: React.ReactNode }> = [
    { id: 'outfit', label: isVi ? 'Trang phục 3D' : 'Couture 3D', icon: <Palette className="w-3.5 h-3.5" /> },
    { id: 'sketch', label: isVi ? 'Bản nháp' : 'Sketchpad', icon: <PenTool className="w-3.5 h-3.5" /> },
    { id: 'pet', label: isVi ? 'Thú cưng' : 'Cosmic Pet', icon: <Heart className="w-3.5 h-3.5" /> },
    { id: 'body', label: isVi ? 'Vóc dáng & Tập' : 'Body & Fit', icon: <Ruler className="w-3.5 h-3.5" /> },
    { id: 'academy', label: isVi ? 'Học viện & Catwalk' : 'Academy', icon: <GraduationCap className="w-3.5 h-3.5" /> },
    { id: 'coach', label: isVi ? 'AI Coach' : 'AI Coach', icon: <MessageSquare className="w-3.5 h-3.5" /> },
  ];

  const cycleCamera = () => {
    const order: CameraPreset[] = [
      'studio-center',
      'closeup-face',
      'closeup-garment',
      'closeup-pet',
      'runway-low',
    ];
    const idx = order.indexOf(cameraPreset);
    onSelectCamera(order[(idx + 1) % order.length]);
  };

  return (
    <div
      className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center transition-transform duration-300 max-w-[96vw] ${
        hudCollapsed ? 'translate-y-[calc(100%-34px)]' : 'translate-y-0'
      }`}
    >
      {/* Collapse / Expand tab */}
      <button
        type="button"
        onClick={onToggleHud}
        className="flex items-center gap-1.5 px-3.5 py-1 rounded-t-xl bg-[#0D0A22] border border-b-0 border-violet-300/25 text-[11px] font-medium text-violet-200 hover:text-white cursor-pointer"
      >
        {hudCollapsed ? (
          <>
            <ChevronUp className="w-3.5 h-3.5" />
            <span>{isVi ? 'Mở Bảng điều khiển (H)' : 'Show Studio Controls (H)'}</span>
          </>
        ) : (
          <>
            <ChevronDown className="w-3.5 h-3.5" />
            <span>{isVi ? 'Thu gọn để ngắm 3D (H)' : 'Hide Controls (H)'}</span>
          </>
        )}
      </button>

      {/* Main Dock Bar (zero backdrop-filter over WebGL) */}
      <div className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-[#0B081F]/95 border border-violet-300/25 shadow-2xl overflow-x-auto max-w-full">
        {tabs.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                active
                  ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white'
                  : 'text-violet-200 hover:bg-violet-500/20 hover:text-white'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}

        <div className="w-px h-6 bg-violet-300/20 mx-1 shrink-0" />

        <button
          type="button"
          onClick={onCyclePose}
          title={isVi ? 'Đổi dáng tạo hình (Space)' : 'Cycle Pose (Space)'}
          className="px-2.5 py-2 rounded-xl bg-[#161036] border border-violet-300/20 text-xs font-medium text-amber-200 hover:border-amber-300/50 whitespace-nowrap shrink-0 cursor-pointer"
        >
          {pose === 'runway-walk'
            ? isVi
              ? 'Đang Catwalk'
              : 'Walking'
            : pose === 'nikki-grace'
              ? isVi
                ? 'Dáng Nikki'
                : 'Nikki Pose'
              : isVi
                ? 'Tạo dáng'
                : 'Pose'}
        </button>

        <button
          type="button"
          onClick={cycleCamera}
          title={isVi ? 'Đổi góc máy' : 'Switch Camera'}
          className="p-2 rounded-xl bg-[#161036] border border-violet-300/20 text-violet-200 hover:text-white shrink-0 cursor-pointer"
        >
          <Camera className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onSparkleShow}
          title={isVi ? 'Bùng nổ lấp lánh Thiên hà' : 'Galaxy Sparkle Burst'}
          className="p-2 rounded-xl bg-[#161036] border border-violet-300/20 text-fuchsia-300 hover:text-amber-200 shrink-0 cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onToggleMute}
          title={muted ? 'Unmute Audio' : 'Mute Audio'}
          className="p-2 rounded-xl bg-[#161036] border border-violet-300/20 text-violet-200 hover:text-white shrink-0 cursor-pointer"
        >
          {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};
