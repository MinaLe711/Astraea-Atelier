import React from 'react';
import {
  Camera,
  Crown,
  Eye,
  Footprints,
  Gem,
  Heart,
  Layers,
  Redo2,
  RotateCcw,
  Scissors,
  Shirt,
  Sparkles,
  Undo2,
  Wind,
} from 'lucide-react';
import { Language, WardrobeCategory } from '../types/atelier';

interface WardrobeCategoryRailProps {
  language: Language;
  selectedCategory: WardrobeCategory | null;
  canUndo: boolean;
  canRedo: boolean;
  onSelectCategory: (cat: WardrobeCategory) => void;
  onUndo: () => void;
  onRedo: () => void;
  onResetToBase: () => void;
  onCycleViewMode: () => void;
  onCapturePhoto: () => void;
}

export const WardrobeCategoryRail: React.FC<WardrobeCategoryRailProps> = ({
  language,
  selectedCategory,
  canUndo,
  canRedo,
  onSelectCategory,
  onUndo,
  onRedo,
  onResetToBase,
  onCycleViewMode,
  onCapturePhoto,
}) => {
  const isVi = language === 'vi';

  const categories: Array<{
    id: WardrobeCategory;
    label: string;
    icon: React.ReactNode;
  }> = [
    { id: 'hair', label: isVi ? 'Tóc' : 'Hair', icon: <Scissors className="w-3.5 h-3.5" /> },
    { id: 'dress', label: isVi ? 'Đầm' : 'Dress', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { id: 'coat', label: isVi ? 'Khoác' : 'Coat', icon: <Wind className="w-3.5 h-3.5" /> },
    { id: 'tops', label: isVi ? 'Áo' : 'Tops', icon: <Shirt className="w-3.5 h-3.5" /> },
    { id: 'bottoms', label: isVi ? 'Váy/Quần' : 'Bottoms', icon: <Layers className="w-3.5 h-3.5" /> },
    { id: 'hosiery', label: isVi ? 'Tất' : 'Hosiery', icon: <Heart className="w-3.5 h-3.5" /> },
    { id: 'shoes', label: isVi ? 'Giày' : 'Shoes', icon: <Footprints className="w-3.5 h-3.5" /> },
    { id: 'accessory', label: isVi ? 'Phụ kiện' : 'Accessory', icon: <Crown className="w-3.5 h-3.5" /> },
    { id: 'makeup', label: isVi ? 'Trang điểm' : 'Makeup', icon: <Gem className="w-3.5 h-3.5" /> },
    { id: 'spirit', label: isVi ? 'Thần thái' : 'Spirit', icon: <Eye className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="fixed top-16 right-3 sm:right-4 bottom-24 z-20 flex items-start gap-2 pointer-events-none">
      {/* Slim Utility Action Strip (Photo, View, Undo, Redo, Base/Remove) */}
      <div className="pointer-events-auto hidden md:flex flex-col gap-1.5 pt-1">
        <button
          type="button"
          onClick={onCapturePhoto}
          title={isVi ? 'Chụp ảnh Lookbook PNG' : 'Save Lookbook Photo PNG'}
          className="flex flex-col items-center justify-center w-12 py-2 rounded-xl bg-[#0B081F]/95 border border-violet-300/20 text-violet-200 hover:border-fuchsia-400/60 hover:text-white transition-colors cursor-pointer"
        >
          <Camera className="w-4 h-4 text-fuchsia-300" />
          <span className="text-[10px] mt-0.5 font-medium">{isVi ? 'Chụp' : 'Photo'}</span>
        </button>

        <button
          type="button"
          onClick={onCycleViewMode}
          title={isVi ? 'Đổi góc nhìn Cận / Toàn thân' : 'Cycle Camera View'}
          className="flex flex-col items-center justify-center w-12 py-2 rounded-xl bg-[#0B081F]/95 border border-violet-300/20 text-violet-200 hover:border-amber-300/60 hover:text-white transition-colors cursor-pointer"
        >
          <Eye className="w-4 h-4 text-amber-200" />
          <span className="text-[10px] mt-0.5 font-medium">{isVi ? 'Góc' : 'View'}</span>
        </button>

        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          title={isVi ? 'Hoàn tác' : 'Undo'}
          className="flex flex-col items-center justify-center w-12 py-2 rounded-xl bg-[#0B081F]/95 border border-violet-300/20 text-violet-200 hover:border-violet-300/50 hover:text-white disabled:opacity-35 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <Undo2 className="w-4 h-4" />
          <span className="text-[10px] mt-0.5 font-medium">{isVi ? 'Lùi' : 'Undo'}</span>
        </button>

        <button
          type="button"
          onClick={onRedo}
          disabled={!canRedo}
          title={isVi ? 'Làm lại' : 'Redo'}
          className="flex flex-col items-center justify-center w-12 py-2 rounded-xl bg-[#0B081F]/95 border border-violet-300/20 text-violet-200 hover:border-violet-300/50 hover:text-white disabled:opacity-35 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <Redo2 className="w-4 h-4" />
          <span className="text-[10px] mt-0.5 font-medium">{isVi ? 'Tiến' : 'Redo'}</span>
        </button>

        <button
          type="button"
          onClick={onResetToBase}
          title={isVi ? 'Mặc áo thun Nikki cơ bản' : 'Reset to Miracle Base Tee'}
          className="flex flex-col items-center justify-center w-12 py-2 rounded-xl bg-[#0B081F]/95 border border-violet-300/20 text-violet-200 hover:border-pink-400/60 hover:text-pink-100 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-4 h-4 text-pink-300" />
          <span className="text-[10px] mt-0.5 font-medium">{isVi ? 'Gỡ đồ' : 'Base'}</span>
        </button>
      </div>

      {/* Main Wardrobe Category Rail */}
      <nav
        aria-label={isVi ? 'Danh mục Tủ đồ Nikki' : 'Nikki Wardrobe Categories'}
        className="pointer-events-auto flex flex-col gap-1.5 max-h-full overflow-y-auto atelier-scroll p-1.5 rounded-2xl bg-[#0B081F]/95 border border-violet-300/25 shadow-2xl"
      >
        <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-amber-200/85 text-center border-b border-violet-300/15">
          {isVi ? 'Tủ đồ' : 'Wardrobe'}
        </div>

        {categories.map((cat) => {
          const active = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.id)}
              className={`flex items-center gap-2 px-2.5 py-2 rounded-xl border text-xs font-medium transition-colors cursor-pointer whitespace-nowrap min-w-[104px] ${
                active
                  ? 'bg-gradient-to-r from-fuchsia-600/40 to-violet-600/40 border-pink-300/75 text-white'
                  : 'bg-[#130E2E]/90 border-violet-300/15 text-violet-200 hover:border-violet-300/40 hover:text-white'
              }`}
            >
              <span
                className={`p-1.5 rounded-lg shrink-0 ${
                  active ? 'bg-pink-400/25 text-pink-200' : 'bg-[#1B1440] text-amber-200/85'
                }`}
              >
                {cat.icon}
              </span>
              <span className="truncate">{cat.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
