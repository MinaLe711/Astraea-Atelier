import React from 'react';
import { StudioTab, Language } from '../types/atelier';

interface TitleOverlayProps {
  language: Language;
  onStart: (initialTab?: StudioTab) => void;
  onToggleLanguage: () => void;
}

export const TitleOverlay: React.FC<TitleOverlayProps> = ({
  language,
  onStart,
  onToggleLanguage,
}) => {
  const isVi = language === 'vi';

  const features = isVi
    ? [
        {
          num: '01.',
          title: 'Trang phục 3D & Bản nháp',
          desc: 'Tự do phối phom váy, chất liệu thiên hà lấp lánh và vẽ họa tiết áp trực tiếp lên vải 3D.',
        },
        {
          num: '02.',
          title: 'Chăm sóc Pet Vũ trụ',
          desc: 'Cho ăn, chải lông, tắm bong bóng và diện phụ kiện cho thú cưng với hiệu ứng sao bùng nổ.',
        },
        {
          num: '03.',
          title: 'Đo Vóc dáng & Tập Săn chắc',
          desc: 'Phân tích số đo hoặc ảnh cơ thể, đồng bộ lên mẫu 3D và tập các bài giảm mỡ chuẩn người mẫu.',
        },
        {
          num: '04.',
          title: 'Học viện, Catwalk & AI Coach',
          desc: 'Học thiết kế từ nhập môn đến chuyên nghiệp, tập sải bước Runway, ứng xử cùng Siêu mẫu AI.',
        },
      ]
    : [
        {
          num: '01.',
          title: '3D Couture & Sketchpad',
          desc: 'Customize silhouettes, shimmering galaxy fabrics, and paint patterns directly onto 3D cloth.',
        },
        {
          num: '02.',
          title: 'Cosmic Pet Care',
          desc: 'Feed, brush, spa-bathe, and style your starlight pet with dazzling 3D particle effects.',
        },
        {
          num: '03.',
          title: 'Body Scan & Sculpting',
          desc: 'Analyze measurements or body photos, sync proportions to 3D, and follow fat-burn workouts.',
        },
        {
          num: '04.',
          title: 'Academy, Catwalk & AI Coach',
          desc: 'Learn fashion from beginner to pro, practice runway timing, and get mentored by AI Supermodel.',
        },
      ];

  return (
    <div className="fixed inset-0 z-30 flex flex-col justify-between p-5 md:p-10 pointer-events-none">
      {/* Top row: subtle editorial studio mark + language toggle */}
      <div className="flex items-center justify-between pointer-events-auto">
        <div className="text-xs tracking-[0.22em] text-violet-200/80 uppercase font-medium">
          Astraea Couture · Paris · Milan · Cosmos
        </div>
        <button
          type="button"
          onClick={onToggleLanguage}
          className="px-3 py-1.5 text-xs font-medium text-violet-100 bg-[#120D2D] border border-violet-300/25 rounded-lg hover:border-fuchsia-400/50 transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          {isVi ? 'TIẾNG VIỆT / EN' : 'ENGLISH / VI'}
        </button>
      </div>

      {/* Center-right calm negative space welcome lockup */}
      <div className="max-w-xl ml-auto mr-0 md:mr-10 my-auto pointer-events-auto bg-[#09071A]/95 border border-violet-300/25 rounded-2xl p-6 md:p-8 shadow-2xl max-h-[80vh] overflow-y-auto atelier-scroll">
        {/* Bespoke inline SVG Title Lockup */}
        <svg
          viewBox="0 0 360 72"
          className="w-full max-w-[320px] h-auto mb-2.5"
          aria-label="Astraea Atelier"
        >
          <defs>
            <linearGradient id="astraeaGold" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FDE68A" />
              <stop offset="50%" stopColor="#F0ABFC" />
              <stop offset="100%" stopColor="#67E8F9" />
            </linearGradient>
          </defs>
          <path
            d="M18 36 L26 22 L34 36 L26 50 Z M10 36 L42 36 M26 14 L26 58"
            stroke="url(#astraeaGold)"
            strokeWidth="1.6"
            fill="none"
          />
          <text
            x="54"
            y="38"
            fill="url(#astraeaGold)"
            fontFamily="Cormorant Garamond, Georgia, serif"
            fontSize="30"
            fontWeight="600"
            letterSpacing="3"
          >
            ASTRAEA ATELIER
          </text>
          <text
            x="55"
            y="58"
            fill="#C4B5FD"
            fontFamily="Plus Jakarta Sans, sans-serif"
            fontSize="10.5"
            letterSpacing="2.4"
          >
            GALAXY COUTURE & SUPERMODEL COACH
          </text>
        </svg>

        <p className="text-xs font-semibold uppercase tracking-wider text-amber-200 mb-1.5">
          {isVi ? 'Chào mừng bạn lần đầu đến với Atelier' : 'Welcome to Your Cosmic Fashion Studio'}
        </p>

        <p className="text-sm text-violet-100/90 leading-relaxed mb-4">
          {isVi
            ? 'Astraea Atelier là studio thời trang thiên hà 3D giúp bạn tự tay thiết kế trang phục & bản vẽ, chăm sóc thú cưng vũ trụ đầy hiệu ứng lấp lánh, đồng thời học thiết kế, cải thiện vóc dáng và tập catwalk chuyên nghiệp cùng AI Coach.'
            : 'Astraea Atelier is a 3D galaxy fashion studio where you design couture outfits and sketches, pamper a sparkling cosmic pet, and train your silhouette, workouts, and runway poise with an AI Supermodel Coach.'}
        </p>

        {/* Main Features List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-5 pt-3 border-t border-violet-300/15">
          {features.map((f) => (
            <div key={f.num} className="text-xs leading-relaxed">
              <div className="font-semibold text-fuchsia-200">
                <span className="font-mono-data text-amber-200 mr-1.5">{f.num}</span>
                {f.title}
              </div>
              <p className="text-violet-200/80 mt-0.5">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Where to start */}
        <div className="p-3 rounded-xl bg-[#120D2E] border border-violet-300/20 mb-5 text-xs text-violet-100/90">
          <span className="font-semibold text-amber-200">
            {isVi ? 'Nên bắt đầu từ đâu? ' : 'Where to start: '}
          </span>
          {isVi
            ? 'Nhấn "Bước vào Atelier" để mở thanh công cụ phía dưới, hoặc chọn nhanh một lộ trình khởi đầu bên dưới:'
            : 'Click "Enter Atelier" to explore the studio dock below, or jump straight into a starting path:'}
          <div className="flex flex-wrap gap-2 mt-2.5">
            <button
              type="button"
              onClick={() => onStart('outfit')}
              className="px-2.5 py-1.5 rounded-lg bg-[#1A1340] border border-violet-300/25 text-xs text-violet-100 hover:border-fuchsia-400 cursor-pointer whitespace-nowrap shrink-0"
            >
              {isVi ? '1. Thiết kế đồ 3D' : '1. Style 3D Outfit'}
            </button>
            <button
              type="button"
              onClick={() => onStart('pet')}
              className="px-2.5 py-1.5 rounded-lg bg-[#1A1340] border border-violet-300/25 text-xs text-violet-100 hover:border-fuchsia-400 cursor-pointer whitespace-nowrap shrink-0"
            >
              {isVi ? '2. Chăm sóc Pet' : '2. Care for Pet'}
            </button>
            <button
              type="button"
              onClick={() => onStart('body')}
              className="px-2.5 py-1.5 rounded-lg bg-[#1A1340] border border-violet-300/25 text-xs text-violet-100 hover:border-fuchsia-400 cursor-pointer whitespace-nowrap shrink-0"
            >
              {isVi ? '3. Đo Dáng & Tập' : '3. Scan Body & Fit'}
            </button>
            <button
              type="button"
              onClick={() => onStart('academy')}
              className="px-2.5 py-1.5 rounded-lg bg-[#1A1340] border border-violet-300/25 text-xs text-violet-100 hover:border-fuchsia-400 cursor-pointer whitespace-nowrap shrink-0"
            >
              {isVi ? '4. Học viện Nhập môn' : '4. Academy Lesson 01'}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={() => onStart()}
            className="px-7 py-3 rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-amber-500 text-white font-semibold text-sm tracking-wide hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer shadow-lg shadow-fuchsia-950/50 whitespace-nowrap shrink-0"
          >
            {isVi ? 'Bước vào Atelier' : 'Enter Atelier'}
          </button>
          <span className="text-xs text-violet-300/75">
            {isVi ? 'Nhấn Enter để bắt đầu' : 'Press Enter to start'}
          </span>
        </div>
      </div>

      {/* Bottom single flat control hint */}
      <div className="flex items-center justify-center">
        <p className="text-xs text-violet-200/70 tracking-wide">
          {isVi
            ? 'Kéo xoay góc nhìn · Cuộn thu phóng · Chạm Pet để cưng nựng · Space tạo dáng · H ẩn giao diện'
            : 'Drag to orbit · Scroll to zoom · Click Pet to pamper · Space strike pose · H hide UI'}
        </p>
      </div>
    </div>
  );
};
