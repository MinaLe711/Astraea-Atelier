import React from 'react';
import { X } from 'lucide-react';
import { Language, StudioTab } from '../types/atelier';

interface FirstTimeWelcomeBannerProps {
  language: Language;
  onSelectStarterTab: (tab: StudioTab) => void;
  onDismiss: () => void;
}

export const FirstTimeWelcomeBanner: React.FC<FirstTimeWelcomeBannerProps> = ({
  language,
  onSelectStarterTab,
  onDismiss,
}) => {
  const isVi = language === 'vi';

  const steps: Array<{ tab: StudioTab; num: string; title: string; hint: string }> = isVi
    ? [
        {
          tab: 'outfit',
          num: '01.',
          title: 'Tạo Trang phục 3D',
          hint: 'Phối phom váy, chất liệu thiên hà & lưu Lookbook',
        },
        {
          tab: 'sketch',
          num: '02.',
          title: 'Vẽ Bản nháp',
          hint: 'Phác thảo họa tiết kim tuyến & phủ lên vải 3D',
        },
        {
          tab: 'pet',
          num: '03.',
          title: 'Chăm sóc Pet',
          hint: 'Cho ăn, tắm sao & mặc phụ kiện hiệu ứng lấp lánh',
        },
        {
          tab: 'body',
          num: '04.',
          title: 'Đo Dáng & Tập',
          hint: 'Phân tích số đo/ảnh & tập giảm mỡ cùng mẫu 3D',
        },
        {
          tab: 'academy',
          num: '05.',
          title: 'Học viện & Catwalk',
          hint: 'Học từ Nhập môn đến Pro & thi sải bước Runway',
        },
      ]
    : [
        {
          tab: 'outfit',
          num: '01.',
          title: 'Design 3D Couture',
          hint: 'Mix silhouettes, galaxy fabrics & save looks',
        },
        {
          tab: 'sketch',
          num: '02.',
          title: 'Sketch & Print',
          hint: 'Paint glitter patterns directly onto 3D fabric',
        },
        {
          tab: 'pet',
          num: '03.',
          title: 'Pamper Cosmic Pet',
          hint: 'Feed, spa-bathe & dress up with sparkle bursts',
        },
        {
          tab: 'body',
          num: '04.',
          title: 'Body & Workouts',
          hint: 'Scan measurements/photo & train with 3D poses',
        },
        {
          tab: 'academy',
          num: '05.',
          title: 'Academy & Catwalk',
          hint: 'Learn Beginner to Pro & play the Runway game',
        },
      ];

  return (
    <div className="fixed top-16 left-5 z-20 w-[calc(100vw-2.5rem)] max-w-[380px] rounded-2xl bg-[#0B081F]/95 border border-amber-300/30 shadow-2xl p-4 pointer-events-auto">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <h2 className="font-display text-lg font-semibold text-amber-200 leading-tight">
            {isVi ? 'Chào mừng đến Astraea Atelier' : 'Welcome to Astraea Atelier'}
          </h2>
          <p className="text-[11px] text-violet-300/90 mt-0.5">
            {isVi
              ? 'Studio thiết kế thời trang 3D, nuôi Pet vũ trụ & AI Coach Siêu mẫu'
              : 'Your 3D galaxy fashion studio, cosmic pet & AI Supermodel Coach'}
          </p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label={isVi ? 'Đóng hướng dẫn' : 'Dismiss guide'}
          className="p-1 rounded-lg text-violet-300 hover:text-white hover:bg-violet-500/20 cursor-pointer shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <p className="text-xs text-violet-100/90 leading-relaxed mb-3">
        {isVi
          ? 'Bạn có thể xoay và chạm trực tiếp vào người mẫu hoặc thú cưng ở giữa màn hình. Chọn một bước dưới đây để bắt đầu ngay:'
          : 'Orbit the 3D runway or click the model & pet anytime. Pick a starting module below to begin:'}
      </p>

      <div className="space-y-1.5 mb-3">
        {steps.map((s) => (
          <button
            key={s.tab}
            type="button"
            onClick={() => onSelectStarterTab(s.tab)}
            className="w-full flex items-baseline gap-2 px-3 py-2 rounded-xl bg-[#130E2E] border border-violet-300/15 hover:border-fuchsia-400/55 text-left transition-colors cursor-pointer"
          >
            <span className="font-mono-data text-xs font-semibold text-amber-200 shrink-0">
              {s.num}
            </span>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-white truncate">{s.title}</div>
              <div className="text-[11px] text-violet-300/85 truncate">{s.hint}</div>
            </div>
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-violet-300/15 text-[11px]">
        <button
          type="button"
          onClick={() => onSelectStarterTab('coach')}
          className="text-fuchsia-300 hover:text-fuchsia-200 font-semibold cursor-pointer"
        >
          {isVi ? 'Hoặc trò chuyện với AI Coach →' : 'Or chat with AI Coach →'}
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="px-2.5 py-1 rounded-md bg-violet-600/30 text-violet-100 hover:bg-violet-600/50 cursor-pointer whitespace-nowrap shrink-0"
        >
          {isVi ? 'Đã hiểu' : 'Got it'}
        </button>
      </div>
    </div>
  );
};
