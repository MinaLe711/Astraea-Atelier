import React, { useEffect, useState } from 'react';
import { ACADEMY_LESSONS, CATWALK_DRILLS } from '../data/fashionCurriculum';
import { AcademyLesson, Language, ModelPose, OutfitConfig } from '../types/atelier';
import { cosmicAudio } from '../utils/audioSynth';

interface AcademyCatwalkPanelProps {
  language: Language;
  completedLessons: string[];
  activeLessonId: string;
  onSelectLesson: (lesson: AcademyLesson) => void;
  onToggleCompleteLesson: (id: string) => void;
  onApplySuggestedOutfit: (patch: Partial<OutfitConfig>) => void;
  onStartCatwalkChallenge: () => void;
  onPoseChange: (pose: ModelPose) => void;
  onAskCoachLesson: (lesson: AcademyLesson) => void;
}

export const AcademyCatwalkPanel: React.FC<AcademyCatwalkPanelProps> = ({
  language,
  completedLessons,
  activeLessonId,
  onSelectLesson,
  onToggleCompleteLesson,
  onApplySuggestedOutfit,
  onStartCatwalkChallenge,
  onPoseChange,
  onAskCoachLesson,
}) => {
  const isVi = language === 'vi';
  const [subMode, setSubMode] = useState<'academy' | 'catwalk'>('academy');
  const [levelFilter, setLevelFilter] = useState<'all' | 'beginner' | 'intermediate' | 'pro'>('all');

  // Interactive Catwalk Rhythm Game state inside panel
  const [runwayActive, setRunwayActive] = useState(false);
  const [beatCursor, setBeatCursor] = useState(0); // 0 to 100
  const [runwayScore, setRunwayScore] = useState(0);
  const [runwayFeedback, setRunwayFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!runwayActive) return;
    const id = window.setInterval(() => {
      setBeatCursor((c) => {
        const next = (c + 3.5) % 100;
        if (next < 4) cosmicAudio.playRunwayBeat(false);
        return next;
      });
    }, 35);
    return () => clearInterval(id);
  }, [runwayActive]);

  const handleHitPose = () => {
    const distFromSweetSpot = Math.abs(beatCursor - 80);
    if (distFromSweetSpot <= 10) {
      cosmicAudio.playCameraFlash();
      setRunwayScore((s) => s + 150);
      setRunwayFeedback(isVi ? 'PERFECT SMIZE! +150 điểm' : 'PERFECT SMIZE! +150 pts');
      onPoseChange('hip-pop');
    } else if (distFromSweetSpot <= 20) {
      cosmicAudio.playSparkleChime(660);
      setRunwayScore((s) => s + 80);
      setRunwayFeedback(isVi ? 'Tạo dáng Tốt! +80 điểm' : 'Great Poise! +80 pts');
      onPoseChange('supermodel-turn');
    } else {
      setRunwayFeedback(isVi ? 'Canh vào vùng Vàng cuối sàn!' : 'Aim for the Gold Zone!');
    }
  };

  const filteredLessons = ACADEMY_LESSONS.filter(
    (l) => levelFilter === 'all' || l.level === levelFilter
  );

  return (
    <div className="space-y-4 text-sm">
      {/* Segmented switcher: Fashion Academy vs Catwalk & Etiquette */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-[#120D2A] border border-violet-300/15">
        <button
          type="button"
          onClick={() => setSubMode('academy')}
          className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            subMode === 'academy'
              ? 'bg-violet-600 text-white'
              : 'text-violet-300 hover:text-white'
          }`}
        >
          {isVi ? 'Học viện Thiết kế' : 'Design Academy'}
        </button>
        <button
          type="button"
          onClick={() => setSubMode('catwalk')}
          className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            subMode === 'catwalk'
              ? 'bg-fuchsia-600 text-white'
              : 'text-violet-300 hover:text-white'
          }`}
        >
          {isVi ? 'Catwalk & Ứng xử' : 'Catwalk & Etiquette'}
        </button>
      </div>

      {subMode === 'academy' ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-violet-300">
              {isVi ? 'Tiến độ:' : 'Progress:'}{' '}
              <strong className="font-mono-data text-amber-200">
                {completedLessons.length}/{ACADEMY_LESSONS.length}
              </strong>
            </span>
            <div className="flex gap-1">
              {(
                [
                  { id: 'all', label: isVi ? 'Tất cả' : 'All' },
                  { id: 'beginner', label: isVi ? 'Nhập môn' : 'Beginner' },
                  { id: 'intermediate', label: isVi ? 'Trung cấp' : 'Interm.' },
                  { id: 'pro', label: isVi ? 'Pro' : 'Pro' },
                ] as const
              ).map((lv) => (
                <button
                  key={lv.id}
                  type="button"
                  onClick={() => setLevelFilter(lv.id)}
                  className={`px-2 py-1 rounded text-[11px] font-medium cursor-pointer ${
                    levelFilter === lv.id
                      ? 'bg-amber-400/25 text-amber-100'
                      : 'text-violet-300 hover:text-white'
                  }`}
                >
                  {lv.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2.5">
            {filteredLessons.map((lesson) => {
              const isSelected = activeLessonId === lesson.id;
              const isDone = completedLessons.includes(lesson.id);
              return (
                <div
                  key={lesson.id}
                  className={`p-3.5 rounded-xl border transition-colors ${
                    isSelected
                      ? 'bg-[#17113A] border-fuchsia-400/60'
                      : 'bg-[#120D2A] border-violet-300/15'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onSelectLesson(lesson)}
                    className="w-full text-left cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-amber-200">
                        {lesson.number}. {isVi ? lesson.titleVi : lesson.titleEn}
                      </span>
                      <span className="text-[11px] font-mono-data text-emerald-300 shrink-0">
                        {isDone ? (isVi ? 'Đã xong' : 'Done') : ''}
                      </span>
                    </div>
                    <p className="text-[11px] text-violet-300 mt-0.5">
                      {isVi ? lesson.subtitleVi : lesson.subtitleEn}
                    </p>
                  </button>

                  {isSelected && (
                    <div className="mt-3 pt-3 border-t border-violet-300/15 space-y-2.5 text-xs">
                      <p className="text-violet-100/90 leading-relaxed">
                        {isVi ? lesson.theoryVi : lesson.theoryEn}
                      </p>
                      <div className="p-2.5 rounded-lg bg-[#0B081C] border border-violet-300/15 text-cyan-200">
                        <span className="font-semibold text-amber-200">
                          {isVi ? 'Bài thực hành: ' : 'Studio Task: '}
                        </span>
                        {isVi ? lesson.practiceTaskVi : lesson.practiceTaskEn}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {lesson.suggestedPreset && (
                          <button
                            type="button"
                            onClick={() => onApplySuggestedOutfit(lesson.suggestedPreset!)}
                            className="px-2.5 py-1.5 rounded-lg bg-violet-600/40 border border-violet-300/30 text-white font-medium cursor-pointer"
                          >
                            {isVi ? 'Thử phom mẫu trên 3D' : 'Load 3D Example'}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onAskCoachLesson(lesson)}
                          className="px-2.5 py-1.5 rounded-lg bg-fuchsia-600/35 border border-fuchsia-300/35 text-white font-medium cursor-pointer"
                        >
                          {isVi ? 'Hỏi AI Coach về bài này' : 'Ask AI Coach'}
                        </button>
                        <button
                          type="button"
                          onClick={() => onToggleCompleteLesson(lesson.id)}
                          className="ml-auto px-2.5 py-1.5 rounded-lg bg-emerald-600/30 border border-emerald-400/40 text-emerald-100 font-medium cursor-pointer"
                        >
                          {isDone
                            ? isVi
                              ? 'Hoàn thành ✓'
                              : 'Completed ✓'
                            : isVi
                              ? 'Đánh dấu hoàn thành'
                              : 'Mark Complete'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Interactive Catwalk Rhythm Timing Game */}
          <div className="p-4 rounded-xl bg-[#150F35] border border-amber-300/30 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-200">
                  {isVi ? 'Sàn diễn Catwalk Trực tiếp' : 'Live Runway Timing Challenge'}
                </h4>
                <p className="text-[11px] text-violet-300 mt-0.5">
                  {isVi
                    ? 'Nhấn Chốt Pose khi con chạy chạm vùng Vàng để bắt trọn flash ống kính!'
                    : 'Hit Strike Pose when the marker enters the Gold Zone for camera flashes!'}
                </p>
              </div>
              <span className="font-mono-data text-sm font-bold text-amber-200">
                {runwayScore} pts
              </span>
            </div>

            {/* Timing Bar */}
            <div className="relative h-5 rounded-full bg-[#09061A] border border-violet-300/20 overflow-hidden">
              <div
                className="absolute top-0 bottom-0 bg-amber-400/35 border-x border-amber-300"
                style={{ left: '70%', width: '20%' }}
              />
              <div
                className="absolute top-0 bottom-0 w-2 bg-fuchsia-400"
                style={{ left: `${beatCursor}%` }}
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const next = !runwayActive;
                  setRunwayActive(next);
                  if (next) {
                    onStartCatwalkChallenge();
                    onPoseChange('runway-walk');
                  } else {
                    onPoseChange('editorial-idle');
                  }
                }}
                className="px-3.5 py-2 rounded-lg bg-violet-600 text-xs font-semibold text-white cursor-pointer"
              >
                {runwayActive
                  ? isVi
                    ? 'Dừng Sàn diễn'
                    : 'Stop Runway'
                  : isVi
                    ? 'Bắt đầu Sải bước'
                    : 'Start Runway Walk'}
              </button>
              {runwayActive && (
                <button
                  type="button"
                  onClick={handleHitPose}
                  className="flex-1 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-fuchsia-600 text-xs font-bold text-white cursor-pointer"
                >
                  {isVi ? 'CHỐT POSE CUỐI SÀN!' : 'STRIKE POSE!'}
                </button>
              )}
            </div>

            {runwayFeedback && (
              <p className="text-xs font-semibold text-cyan-200">{runwayFeedback}</p>
            )}
          </div>

          {/* Supermodel Catwalk & Etiquette Drills */}
          <div className="space-y-2.5">
            {CATWALK_DRILLS.map((drill) => (
              <div
                key={drill.id}
                className="p-3.5 rounded-xl bg-[#120D2A] border border-violet-300/15 space-y-2"
              >
                <h4 className="text-xs font-semibold text-amber-200">
                  {isVi ? drill.titleVi : drill.titleEn}
                </h4>
                <p className="text-xs text-violet-200/85">
                  {isVi ? drill.summaryVi : drill.summaryEn}
                </p>
                <ul className="list-disc pl-4 space-y-1 text-xs text-violet-100/90">
                  {(isVi ? drill.stepsVi : drill.stepsEn).map((st, idx) => (
                    <li key={idx}>{st}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
