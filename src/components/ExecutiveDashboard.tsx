import React, { useMemo, useState } from 'react';
import {
  ArrowUpRight,
  Box,
  HelpCircle,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import { ACADEMY_LESSONS, COUTURE_PRESETS, DEFAULT_WORKOUTS } from '../data/fashionCurriculum';
import {
  BodyAnalysisResult,
  BodyMeasurements,
  CoachMessage,
  Language,
  LookbookEntry,
  OutfitConfig,
  PetState,
  StudioTab,
} from '../types/atelier';

interface ExecutiveDashboardProps {
  language: Language;
  outfit: OutfitConfig;
  pet: PetState;
  measurements: BodyMeasurements;
  bodyAnalysis: BodyAnalysisResult | null;
  completedLessons: string[];
  activeLessonId: string;
  lookbook: LookbookEntry[];
  coachMessages: CoachMessage[];
  showWelcomeGuide: boolean;
  onDismissWelcomeGuide: () => void;
  onToggleWelcomeGuide: () => void;
  onToggleLanguage: () => void;
  onEnterStudio: (tab?: StudioTab) => void;
  onLoadOutfitInStudio: (outfit: OutfitConfig) => void;
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({
  language,
  outfit,
  pet,
  measurements,
  bodyAnalysis,
  completedLessons,
  activeLessonId,
  lookbook,
  coachMessages,
  showWelcomeGuide,
  onDismissWelcomeGuide,
  onToggleWelcomeGuide,
  onToggleLanguage,
  onEnterStudio,
  onLoadOutfitInStudio,
}) => {
  const isVi = language === 'vi';
  const [searchQuery, setSearchQuery] = useState('');
  const [collectionFilter, setCollectionFilter] = useState<'all' | 'personal' | 'presets'>('all');

  const bmi =
    measurements.heightCm > 0
      ? (measurements.weightKg / Math.pow(measurements.heightCm / 100, 2)).toFixed(1)
      : '0.0';
  const whr =
    measurements.hipCm > 0 ? (measurements.waistCm / measurements.hipCm).toFixed(2) : '0.00';

  const academyPct = Math.round((completedLessons.length / ACADEMY_LESSONS.length) * 100);
  const currentLesson =
    ACADEMY_LESSONS.find((l) => l.id === activeLessonId) ?? ACADEMY_LESSONS[0];

  const latestCoachReply =
    [...coachMessages].reverse().find((m) => m.role === 'model')?.text ?? '';

  const workouts = bodyAnalysis?.sculptingWorkouts?.length
    ? bodyAnalysis.sculptingWorkouts
    : DEFAULT_WORKOUTS;

  const combinedRows = useMemo(() => {
    const personalRows = lookbook.map((item) => ({
      id: item.id,
      name: item.name,
      source: 'personal' as const,
      sourceLabel: isVi ? 'Lookbook Cá nhân' : 'Personal Lookbook',
      silhouette: `${item.outfit.bodice} / ${item.outfit.skirt}`,
      fabric: item.outfit.fabric,
      sparkle: Math.round(item.outfit.sparkleIntensity * 100),
      updated: item.createdAt,
      outfit: item.outfit,
    }));

    const presetRows = COUTURE_PRESETS.map((preset, idx) => ({
      id: `preset-${idx}`,
      name: preset.name,
      source: 'presets' as const,
      sourceLabel: isVi ? 'Bộ sưu tập Mẫu' : 'House Couture',
      silhouette: `${preset.bodice} / ${preset.skirt}`,
      fabric: preset.fabric,
      sparkle: Math.round(preset.sparkleIntensity * 100),
      updated: 'Maison',
      outfit: preset,
    }));

    return [...personalRows, ...presetRows].filter((row) => {
      if (collectionFilter === 'personal' && row.source !== 'personal') return false;
      if (collectionFilter === 'presets' && row.source !== 'presets') return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        row.name.toLowerCase().includes(q) ||
        row.silhouette.toLowerCase().includes(q) ||
        row.fabric.toLowerCase().includes(q)
      );
    });
  }, [lookbook, collectionFilter, searchQuery, isVi]);

  return (
    <div className="w-full h-full overflow-y-auto atelier-scroll bg-[#060512] text-[#F5F3FF]">
      {/* Clean 3-Zone Top Bar */}
      <header className="sticky top-0 z-20 bg-[#08061A]/95 border-b border-violet-300/15 px-6 lg:px-10 py-3.5 flex items-center justify-between gap-6">
        {/* Zone 1: Single-line Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <span className="font-display text-xl font-semibold tracking-wider text-amber-200 whitespace-nowrap shrink-0">
            ASTRAEA ATELIER
          </span>
          <span className="hidden md:inline text-xs text-violet-300/75 whitespace-nowrap">
            / {isVi ? 'Tổng quan Điều hành' : 'Executive Summary'}
          </span>
        </div>

        {/* Zone 2: Mode Switcher + Quick Section Links */}
        <nav className="flex items-center gap-1 p-1 rounded-xl bg-[#110D29] border border-violet-300/15 shrink-0">
          <button
            type="button"
            className="px-3.5 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-semibold whitespace-nowrap shrink-0 cursor-default"
          >
            {isVi ? 'Tổng quan (Mặc định)' : 'Summary (Default)'}
          </button>
          <button
            type="button"
            onClick={() => onEnterStudio()}
            className="px-3.5 py-1.5 rounded-lg text-violet-200 hover:text-white hover:bg-violet-500/20 text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors"
          >
            {isVi ? 'Không gian 3D' : '3D Atelier'}
          </button>
        </nav>

        {/* Zone 3: Guide, Language & Primary Action */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onToggleWelcomeGuide}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#110D29] border border-violet-300/20 text-xs font-medium text-amber-200 hover:border-amber-300/45 cursor-pointer whitespace-nowrap shrink-0"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{isVi ? 'Hướng dẫn' : 'Guide'}</span>
          </button>
          <button
            type="button"
            onClick={onToggleLanguage}
            className="px-3 py-1.5 rounded-lg bg-[#110D29] border border-violet-300/20 text-xs font-medium text-violet-200 hover:text-white cursor-pointer whitespace-nowrap shrink-0"
          >
            {isVi ? 'VI / EN' : 'EN / VI'}
          </button>
          <button
            type="button"
            onClick={() => onEnterStudio('outfit')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-amber-500 text-white text-xs font-semibold hover:brightness-110 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Box className="w-3.5 h-3.5" />
            <span>{isVi ? 'Mở Sàn diễn 3D' : 'Launch 3D Studio'}</span>
          </button>
        </div>
      </header>

      <main className="max-w-[1320px] mx-auto px-6 lg:px-10 py-7 space-y-7">
        {/* First-Time User Welcome Banner */}
        {showWelcomeGuide && (
          <section className="rounded-2xl bg-[#0C0922] border border-amber-300/30 p-6">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-200">
                  {isVi ? 'Chào mừng người dùng mới' : 'Welcome to Astraea Atelier'}
                </p>
                <h1 className="font-display text-2xl md:text-3xl font-semibold text-white mt-1 text-balance">
                  {isVi
                    ? 'Studio Thời trang Thiên hà 3D, Thú cưng Vũ trụ & AI Coach Siêu mẫu'
                    : '3D Galaxy Couture Studio, Cosmic Pet & AI Supermodel Coach'}
                </h1>
              </div>
              <button
                type="button"
                onClick={onDismissWelcomeGuide}
                aria-label={isVi ? 'Ẩn lời chào' : 'Dismiss welcome'}
                className="p-1.5 rounded-lg text-violet-300 hover:text-white hover:bg-violet-500/20 cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-sm text-violet-100/90 leading-relaxed max-w-4xl mb-4">
              {isVi
                ? 'Bảng điều khiển Tổng quan (Executive Summary) này giúp bạn nắm bắt nhanh tiến độ bộ sưu tập thời trang, chỉ số vóc dáng, bài học thiết kế từ nhập môn đến chuyên nghiệp và trạng thái thú cưng thiên hà. Để bắt đầu thiết kế hoặc tương tác 3D trực tiếp, hãy chọn một trong các lối vào nhanh dưới đây:'
                : 'This Executive Summary Dashboard keeps your couture portfolio, body silhouette metrics, fashion academy progress, and cosmic pet status in one clear view. Choose a starting path below to jump straight into the live 3D studio:'}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                {
                  tab: 'outfit' as StudioTab,
                  num: '01.',
                  title: isVi ? 'Thiết kế Trang phục 3D & Bản nháp' : '3D Couture & Sketchpad',
                  desc: isVi
                    ? 'Tự do phối phom dáng, chất liệu lấp lánh thiên hà và vẽ họa tiết lên vải.'
                    : 'Customize silhouettes, galaxy shimmer, and paint textures onto 3D cloth.',
                },
                {
                  tab: 'pet' as StudioTab,
                  num: '02.',
                  title: isVi ? 'Chăm sóc Pet Vũ trụ' : 'Cosmic Pet Care',
                  desc: isVi
                    ? 'Cho ăn, chải lông, tắm sao và diện phụ kiện kèm hiệu ứng hạt bùng nổ.'
                    : 'Feed, brush, spa-bathe, and accessorize with 3D sparkle particle bursts.',
                },
                {
                  tab: 'body' as StudioTab,
                  num: '03.',
                  title: isVi ? 'Đo Dáng & Tập Săn chắc' : 'Body Scan & Sculpting',
                  desc: isVi
                    ? 'Phân tích số đo/ảnh body, đồng bộ lên mẫu 3D và tập giảm mỡ chuẩn mẫu.'
                    : 'Analyze body photos or metrics, sync to 3D, and follow sculpting sets.',
                },
                {
                  tab: 'academy' as StudioTab,
                  num: '04.',
                  title: isVi ? 'Học viện, Catwalk & AI Coach' : 'Academy, Catwalk & Coach',
                  desc: isVi
                    ? 'Học thiết kế từ nhập môn đến Pro, tập sải bước Runway và hỏi đáp AI.'
                    : 'Learn beginner-to-pro design, play the catwalk game, and chat with AI.',
                },
              ].map((item) => (
                <button
                  key={item.tab}
                  type="button"
                  onClick={() => onEnterStudio(item.tab)}
                  className="p-3.5 rounded-xl bg-[#130E2E] border border-violet-300/20 hover:border-fuchsia-400/60 text-left transition-colors cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-amber-200 mb-1">
                    <span>
                      <span className="font-mono-data mr-1.5">{item.num}</span>
                      {item.title}
                    </span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-violet-300 group-hover:text-white shrink-0" />
                  </div>
                  <p className="text-xs text-violet-200/80 leading-relaxed">{item.desc}</p>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Executive Heading */}
        <section className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs text-violet-300/80 uppercase tracking-wider">
              {isVi ? 'Báo cáo Hoạt động Atelier' : 'Executive Portfolio Overview'}
            </p>
            <h2 className="font-display text-3xl font-semibold text-white mt-0.5">
              {isVi ? 'Bảng Tổng quan Sáng tạo & Huấn luyện' : 'Creative & Supermodel Readiness Summary'}
            </h2>
          </div>
          <div className="flex items-center gap-3 text-xs text-violet-300">
            <span>{isVi ? 'Mẫu đang chọn:' : 'Active Look:'}</span>
            <span className="font-semibold text-amber-200">{outfit.name}</span>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => onEnterStudio('coach')}
              className="text-fuchsia-300 hover:text-fuchsia-200 font-semibold cursor-pointer"
            >
              {isVi ? 'Hỏi Coach Astraea' : 'Consult Coach Astraea'}
            </button>
          </div>
        </section>

        {/* 4-Column Executive KPI Strip (Single-Elevation, tabular-nums, zero nested card clutter) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-[#0C0922] border border-violet-300/15">
            <div className="text-xs text-violet-300 mb-2">
              {isVi ? 'Bộ sưu tập & Lookbook' : 'Couture Portfolio'}
            </div>
            <div className="font-mono-data text-2xl font-semibold text-white">
              {lookbook.length} <span className="text-sm font-normal text-violet-300">/ {COUTURE_PRESETS.length} mẫu House</span>
            </div>
            <div className="mt-2 text-xs text-violet-300/85">
              {outfit.fabric} · {Math.round(outfit.sparkleIntensity * 100)}% {isVi ? 'lấp lánh' : 'sparkle'}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#0C0922] border border-violet-300/15">
            <div className="text-xs text-violet-300 mb-2">
              {isVi ? 'Tiến độ Học viện Thiết kế' : 'Academy Progression'}
            </div>
            <div className="font-mono-data text-2xl font-semibold text-amber-200">
              {academyPct}%{' '}
              <span className="text-sm font-normal text-violet-300">
                ({completedLessons.length}/{ACADEMY_LESSONS.length} {isVi ? 'bài' : 'lessons'})
              </span>
            </div>
            <div className="mt-2 text-xs text-violet-300/85 truncate">
              {isVi ? 'Tiếp theo:' : 'Current:'} {currentLesson.number}.{' '}
              {isVi ? currentLesson.titleVi : currentLesson.titleEn}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#0C0922] border border-violet-300/15">
            <div className="text-xs text-violet-300 mb-2">
              {isVi ? 'Chỉ số Hình thể & Vóc dáng' : 'Body & Silhouette Profile'}
            </div>
            <div className="font-mono-data text-2xl font-semibold text-cyan-200">
              WHR {whr} <span className="text-sm font-normal text-violet-300">· BMI {bmi}</span>
            </div>
            <div className="mt-2 text-xs text-violet-300/85 truncate">
              {bodyAnalysis
                ? bodyAnalysis.bodyShape
                : isVi
                  ? `${measurements.bustCm}/${measurements.waistCm}/${measurements.hipCm} cm · Chưa quét ảnh`
                  : `${measurements.bustCm}/${measurements.waistCm}/${measurements.hipCm} cm · Ready to scan`}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#0C0922] border border-violet-300/15">
            <div className="text-xs text-violet-300 mb-2">
              {isVi ? 'Thú cưng Đồng hành' : 'Cosmic Pet Companion'}
            </div>
            <div className="font-mono-data text-2xl font-semibold text-fuchsia-200">
              Lv.{pet.level}{' '}
              <span className="text-sm font-normal text-violet-300">· {pet.name}</span>
            </div>
            <div className="mt-2 text-xs text-violet-300/85 tabular-nums">
              {isVi ? 'Thân mật' : 'Affection'} {pet.affection} · {isVi ? 'Lộng lẫy' : 'Glamour'} {pet.glamour}
            </div>
          </div>
        </section>

        {/* Main 2-Column Executive Content Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left 2 Columns: Collection & Lookbook Table + Academy/Workout Matrix */}
          <div className="lg:col-span-2 space-y-6">
            {/* High-Density Collection Table with Search & Filter */}
            <div className="rounded-2xl bg-[#0C0922] border border-violet-300/15 overflow-hidden">
              <div className="p-5 border-b border-violet-300/15 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    {isVi ? 'Danh mục Thiết kế & Lookbook' : 'Couture Portfolio & Lookbook'}
                  </h3>
                  <p className="text-xs text-violet-300/80 mt-0.5">
                    {isVi
                      ? 'Chọn một thiết kế để mở ngay trên sân khấu Runway 3D.'
                      : 'Select any couture look to inspect or customize on the 3D Runway.'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-violet-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={isVi ? 'Tìm mẫu hoặc chất liệu...' : 'Search look or fabric...'}
                      className="pl-8 pr-3 py-1.5 rounded-lg bg-[#130E2E] border border-violet-300/20 text-xs text-white placeholder:text-violet-400/60 focus:outline-none focus:border-fuchsia-400 w-44"
                    />
                  </div>

                  <div className="flex items-center gap-1 p-1 rounded-lg bg-[#130E2E] border border-violet-300/15">
                    {(
                      [
                        { id: 'all', label: isVi ? 'Tất cả' : 'All' },
                        { id: 'personal', label: isVi ? 'Cá nhân' : 'Saved' },
                        { id: 'presets', label: isVi ? 'Mẫu House' : 'House' },
                      ] as const
                    ).map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setCollectionFilter(f.id)}
                        className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer whitespace-nowrap ${
                          collectionFilter === f.id
                            ? 'bg-violet-600 text-white'
                            : 'text-violet-300 hover:text-white'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {combinedRows.length === 0 ? (
                <div className="p-8 text-center space-y-3">
                  <p className="text-sm text-violet-200">
                    {collectionFilter === 'personal'
                      ? isVi
                        ? 'Bạn chưa lưu mẫu thiết kế cá nhân nào vào Lookbook.'
                        : 'No personal looks saved to your Lookbook yet.'
                      : isVi
                        ? 'Không tìm thấy thiết kế phù hợp với bộ lọc.'
                        : 'No designs match your current filter.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => onEnterStudio('outfit')}
                    className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-semibold text-white cursor-pointer"
                  >
                    {isVi ? 'Tạo Thiết kế Đầu tiên trong 3D' : 'Create First 3D Look'}
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-violet-300/15 text-violet-300/80">
                        <th className="py-2.5 px-5 font-medium">{isVi ? 'Tên Thiết kế' : 'Design Name'}</th>
                        <th className="py-2.5 px-3 font-medium">{isVi ? 'Phom dáng' : 'Silhouette'}</th>
                        <th className="py-2.5 px-3 font-medium">{isVi ? 'Chất liệu' : 'Fabric'}</th>
                        <th className="py-2.5 px-3 font-medium text-right">{isVi ? 'Lấp lánh' : 'Sparkle'}</th>
                        <th className="py-2.5 px-5 font-medium text-right">{isVi ? 'Thao tác' : 'Action'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {combinedRows.map((row) => (
                        <tr
                          key={row.id}
                          className="border-b border-violet-300/10 last:border-b-0 hover:bg-violet-500/10 transition-colors"
                        >
                          <td className="py-3 px-5">
                            <div className="font-semibold text-white">{row.name}</div>
                            <div className="text-[11px] text-violet-300/75">{row.sourceLabel} · {row.updated}</div>
                          </td>
                          <td className="py-3 px-3 text-violet-200">{row.silhouette}</td>
                          <td className="py-3 px-3 text-violet-200">{row.fabric}</td>
                          <td className="py-3 px-3 text-right font-mono-data text-amber-200">
                            {row.sparkle}%
                          </td>
                          <td className="py-3 px-5 text-right">
                            <button
                              type="button"
                              onClick={() => onLoadOutfitInStudio(row.outfit)}
                              className="px-3 py-1.5 rounded-lg bg-[#18123B] border border-violet-300/25 hover:border-fuchsia-400 text-xs font-medium text-violet-100 cursor-pointer whitespace-nowrap"
                            >
                              {isVi ? 'Mở trên 3D' : 'Open in 3D'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Daily Sculpting & Academy Roadmap */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-[#0C0922] border border-violet-300/15 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white">
                    {isVi ? 'Giáo trình Học viện Thời trang' : 'Fashion Design Academy'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => onEnterStudio('academy')}
                    className="text-xs font-semibold text-fuchsia-300 hover:text-fuchsia-200 cursor-pointer"
                  >
                    {isVi ? 'Học ngay →' : 'Open →'}
                  </button>
                </div>
                <div className="space-y-2">
                  {ACADEMY_LESSONS.slice(0, 4).map((lesson) => {
                    const done = completedLessons.includes(lesson.id);
                    return (
                      <div
                        key={lesson.id}
                        className="flex items-center justify-between gap-2 py-1.5 border-b border-violet-300/10 last:border-b-0 text-xs"
                      >
                        <span className="text-violet-100 truncate">
                          <span className="font-mono-data text-amber-200 mr-1.5">{lesson.number}.</span>
                          {isVi ? lesson.titleVi : lesson.titleEn}
                        </span>
                        <span
                          className={`font-mono-data text-[11px] shrink-0 ${
                            done ? 'text-emerald-400' : 'text-violet-400'
                          }`}
                        >
                          {done ? (isVi ? 'Hoàn thành' : 'Done') : lesson.level}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-[#0C0922] border border-violet-300/15 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white">
                    {isVi ? 'Bài tập Siết Form & Catwalk' : 'Sculpting & Runway Plan'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => onEnterStudio('body')}
                    className="text-xs font-semibold text-cyan-300 hover:text-cyan-200 cursor-pointer"
                  >
                    {isVi ? 'Tập 3D →' : 'Train →'}
                  </button>
                </div>
                <div className="space-y-2">
                  {workouts.slice(0, 4).map((w, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between gap-2 py-1.5 border-b border-violet-300/10 last:border-b-0 text-xs"
                    >
                      <span className="text-violet-100 truncate">{w.name}</span>
                      <span className="font-mono-data text-[11px] text-amber-200 shrink-0">
                        {w.durationOrReps}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Executive Briefs (Active Look + Body/Pet + AI Coach Summary) */}
          <div className="space-y-4">
            {/* Active Couture & Palette Brief */}
            <div className="p-5 rounded-2xl bg-[#0C0922] border border-violet-300/15 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">
                  {isVi ? 'Thiết kế Đang Trình diễn' : 'Active 3D Garment'}
                </h3>
                <button
                  type="button"
                  onClick={() => onEnterStudio('sketch')}
                  className="text-xs font-semibold text-amber-200 hover:text-amber-100 cursor-pointer"
                >
                  {isVi ? 'Vẽ bản nháp' : 'Sketchpad'}
                </button>
              </div>
              <div className="text-xs space-y-1.5 text-violet-200">
                <div className="flex justify-between">
                  <span className="text-violet-400">{isVi ? 'Tên mẫu' : 'Look'}</span>
                  <span className="font-semibold text-white">{outfit.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-violet-400">{isVi ? 'Cấu trúc' : 'Cut'}</span>
                  <span>
                    {outfit.bodice} · {outfit.skirt}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-violet-400">{isVi ? 'Phụ kiện' : 'Regalia'}</span>
                  <span>{outfit.accessory}</span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-violet-400">{isVi ? 'Bảng màu' : 'Palette'}</span>
                  <div className="flex items-center gap-1.5">
                    {[outfit.primaryColor, outfit.secondaryColor, outfit.accentColor].map(
                      (hex, idx) => (
                        <span
                          key={idx}
                          className="w-4 h-4 rounded-full border border-white/25 inline-block"
                          style={{ backgroundColor: hex }}
                        />
                      )
                    )}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onEnterStudio('outfit')}
                className="w-full py-2 rounded-xl bg-[#161036] border border-violet-300/25 hover:border-fuchsia-400 text-xs font-semibold text-white cursor-pointer"
              >
                {isVi ? 'Chỉnh sửa Trang phục trên 3D' : 'Customize in 3D Studio'}
              </button>
            </div>

            {/* Body & Pet Quick Status */}
            <div className="p-5 rounded-2xl bg-[#0C0922] border border-violet-300/15 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">
                  {isVi ? 'Hồ sơ Cá nhân & Thú cưng' : 'Physique & Cosmic Pet'}
                </h3>
                <button
                  type="button"
                  onClick={() => onEnterStudio('pet')}
                  className="text-xs font-semibold text-fuchsia-300 hover:text-fuchsia-200 cursor-pointer"
                >
                  {isVi ? 'Chăm sóc Pet' : 'Care Pet'}
                </button>
              </div>
              <div className="text-xs text-violet-200 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-violet-400">{isVi ? 'Số đo 3 vòng' : 'Measurements'}</span>
                  <span className="font-mono-data text-white">
                    {measurements.bustCm} - {measurements.waistCm} - {measurements.hipCm} cm
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-violet-400">{isVi ? 'Mục tiêu' : 'Goal'}</span>
                  <span className="text-right max-w-[200px] truncate text-cyan-200">
                    {measurements.goal}
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-violet-300/10">
                  <span className="text-violet-400">Pet ({pet.species})</span>
                  <span className="text-amber-200 font-medium">
                    {pet.name} · {pet.lastActionLabel}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onEnterStudio('body')}
                className="w-full py-2 rounded-xl bg-[#161036] border border-violet-300/25 hover:border-cyan-400 text-xs font-semibold text-white cursor-pointer"
              >
                {isVi ? 'Quét ảnh Body & Phân tích AI' : 'Scan Body Photo with AI'}
              </button>
            </div>

            {/* AI Coach Executive Note */}
            <div className="p-5 rounded-2xl bg-[#0C0922] border border-amber-300/25 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-200" />
                <h3 className="text-sm font-semibold text-amber-200">
                  {isVi ? 'Lời khuyên từ Coach Astraea' : 'Note from Coach Astraea'}
                </h3>
              </div>
              <p className="text-xs text-violet-100/90 leading-relaxed line-clamp-5">
                {bodyAnalysis?.supermodelMantra || latestCoachReply}
              </p>
              <button
                type="button"
                onClick={() => onEnterStudio('coach')}
                className="w-full py-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-xs font-semibold text-white hover:brightness-110 cursor-pointer"
              >
                {isVi ? 'Trao đổi trực tiếp với AI Coach' : 'Open AI Coach Mentoring'}
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};
