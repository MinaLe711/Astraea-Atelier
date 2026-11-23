import React, { useCallback, useEffect, useRef, useState } from 'react';
import { HelpCircle, LayoutDashboard, X } from 'lucide-react';
import { AcademyCatwalkPanel } from './components/AcademyCatwalkPanel';
import { AiCoachPanel } from './components/AiCoachPanel';
import { BodyWorkoutPanel } from './components/BodyWorkoutPanel';
import { BottomDock } from './components/BottomDock';
import { ExecutiveDashboard } from './components/ExecutiveDashboard';
import { FirstTimeWelcomeBanner } from './components/FirstTimeWelcomeBanner';
import { GalaxyViewport } from './components/GalaxyViewport';
import { OutfitStudioPanel } from './components/OutfitStudioPanel';
import { PetCarePanel } from './components/PetCarePanel';
import { SketchpadPanel } from './components/SketchpadPanel';
import { TitleOverlay } from './components/TitleOverlay';
import { WardrobeCategoryRail } from './components/WardrobeCategoryRail';
import { ACADEMY_LESSONS, DEFAULT_OUTFIT, NIKKI_BASE_CASUAL_OUTFIT } from './data/fashionCurriculum';
import {
  AcademyLesson,
  AppViewMode,
  BodyAnalysisResult,
  BodyMeasurements,
  BodyProportions,
  CameraPreset,
  CoachMessage,
  Language,
  LookbookEntry,
  ModelPose,
  OutfitConfig,
  PetReaction,
  PetState,
  SparkleBurstEvent,
  StudioTab,
  WardrobeCategory,
} from './types/atelier';
import { cosmicAudio } from './utils/audioSynth';

const INITIAL_PET: PetState = {
  name: 'Lumi Nebula',
  species: 'nebula-cat',
  affection: 82,
  energy: 78,
  glamour: 86,
  level: 3,
  xp: 40,
  accessory: 'star-collar',
  coatColor: '#A78BFA',
  auraColor: '#67E8F9',
  lastActionLabel: 'Sẵn sàng tỏa sáng',
};

const INITIAL_MEASUREMENTS: BodyMeasurements = {
  heightCm: 166,
  weightKg: 54,
  bustCm: 86,
  waistCm: 64,
  hipCm: 91,
  shoulderCm: 39,
  goal: 'Thon gọn vòng eo, săn chắc cơ thể và sải bước catwalk chuẩn siêu mẫu',
};

const POSE_CYCLE: ModelPose[] = [
  'nikki-grace',
  'editorial-idle',
  'hip-pop',
  'runway-walk',
  'supermodel-turn',
];

export default function App() {
  const [viewMode, setViewMode] = useState<AppViewMode>('dashboard');
  const [entered, setEntered] = useState(true);
  const [language, setLanguage] = useState<Language>('vi');
  const [hudCollapsed, setHudCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<StudioTab | null>(null);
  const [wardrobeCategory, setWardrobeCategory] = useState<WardrobeCategory | null>(null);
  const [muted, setMuted] = useState(false);
  const [showWelcomeGuide, setShowWelcomeGuide] = useState<boolean>(() => {
    try {
      return localStorage.getItem('astraea_welcome_seen') !== '1';
    } catch {
      return true;
    }
  });

  const [outfit, setOutfit] = useState<OutfitConfig>(DEFAULT_OUTFIT);
  const [undoStack, setUndoStack] = useState<OutfitConfig[]>([]);
  const [redoStack, setRedoStack] = useState<OutfitConfig[]>([]);
  const [pet, setPet] = useState<PetState>(INITIAL_PET);
  const [pose, setPose] = useState<ModelPose>('nikki-grace');
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('studio-center');
  const [runwayProgress, setRunwayProgress] = useState(0);
  const snapshotCaptureRef = useRef<(() => string | null) | null>(null);

  const [petReactionSignal, setPetReactionSignal] = useState<{
    id: number;
    reaction: PetReaction;
  } | null>(null);
  const [sparkleBurstSignal, setSparkleBurstSignal] = useState<SparkleBurstEvent | null>(null);

  const [measurements, setMeasurements] = useState<BodyMeasurements>(INITIAL_MEASUREMENTS);
  const [bodyAnalysis, setBodyAnalysis] = useState<BodyAnalysisResult | null>(null);

  const [activeLessonId, setActiveLessonId] = useState<string>(ACADEMY_LESSONS[0].id);
  const [completedLessons, setCompletedLessons] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('astraea_completed_lessons');
      return saved ? (JSON.parse(saved) as string[]) : [];
    } catch {
      return [];
    }
  });

  const [lookbook, setLookbook] = useState<LookbookEntry[]>(() => {
    try {
      const saved = localStorage.getItem('astraea_lookbook');
      return saved ? (JSON.parse(saved) as LookbookEntry[]) : [];
    } catch {
      return [];
    }
  });

  const [coachMessages, setCoachMessages] = useState<CoachMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: 'Chào mừng em đến với Astraea Atelier! Chị là Astraea Celestia — Nhà thiết kế & Siêu mẫu hướng dẫn của em. Hôm nay chúng ta có thể cùng phác thảo trang phục thiên hà 3D, chăm sóc bé Pet vũ trụ, phân tích vóc dáng & tập luyện săn chắc, hoặc luyện sải bước Catwalk chuẩn quốc tế. Em muốn bắt đầu từ đâu nào?',
      timestamp: '09:00',
    },
  ]);
  const [coachLoading, setCoachLoading] = useState(false);
  const [coachError, setCoachError] = useState<string | null>(null);

  const triggerBurst = useCallback(
    (
      target: SparkleBurstEvent['target'],
      colorHex = '#F0ABFC',
      count = 55,
      style: SparkleBurstEvent['style'] = 'sparkle'
    ) => {
      setSparkleBurstSignal({
        id: Date.now() + Math.random(),
        target,
        colorHex,
        count,
        style,
      });
    },
    []
  );

  // Runway walk progress loop
  useEffect(() => {
    if (pose !== 'runway-walk') {
      setRunwayProgress(0);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const step = (now: number) => {
      const t = ((now - start) / 4200) % 1;
      setRunwayProgress(t);
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [pose]);

  // Smooth camera offset when panel drawer opens/closes
  useEffect(() => {
    if (!entered) {
      setCameraPreset('studio-center');
      return;
    }
    if (activeTab === 'pet') {
      setCameraPreset('closeup-pet');
    } else if (activeTab !== null && !hudCollapsed) {
      setCameraPreset('studio-offset');
    } else {
      setCameraPreset('studio-center');
    }
  }, [activeTab, hudCollapsed, entered]);

  // Global keyboard shortcuts (Enter to start, Space to cycle pose, H to toggle Zen/HUD)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (!entered && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        setEntered(true);
        cosmicAudio.playSparkleChime(659);
        triggerBurst('model', '#FDE68A', 80, 'sparkle');
        return;
      }

      if (e.key.toLowerCase() === 'h' && entered) {
        setHudCollapsed((c) => !c);
      } else if (e.key === ' ' && entered) {
        e.preventDefault();
        setPose((cur) => POSE_CYCLE[(POSE_CYCLE.indexOf(cur) + 1) % POSE_CYCLE.length]);
        cosmicAudio.playCameraFlash();
        triggerBurst('model', '#F0ABFC', 45, 'flash');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [entered, triggerBurst]);

  const dismissWelcomeGuide = useCallback(() => {
    setShowWelcomeGuide(false);
    try {
      localStorage.setItem('astraea_welcome_seen', '1');
    } catch {
      // ignore storage errors
    }
  }, []);

  const handleSelectTab = (tab: StudioTab) => {
    setActiveTab((cur) => (cur === tab ? null : tab));
    if (tab !== 'outfit') {
      setWardrobeCategory(null);
    }
    setHudCollapsed(false);
    dismissWelcomeGuide();
  };

  const handleChangeOutfit = (next: OutfitConfig, burst = true) => {
    setUndoStack((prev) => [...prev.slice(-19), outfit]);
    setRedoStack([]);
    setOutfit(next);
    if (burst) {
      cosmicAudio.playFabricSwish();
      triggerBurst('model', next.secondaryColor, 48, 'sparkle');
    }
  };

  const handleUndoOutfit = () => {
    if (undoStack.length === 0) return;
    const prevOutfit = undoStack[undoStack.length - 1];
    setUndoStack((s) => s.slice(0, -1));
    setRedoStack((r) => [...r, outfit]);
    setOutfit(prevOutfit);
    cosmicAudio.playFabricSwish();
  };

  const handleRedoOutfit = () => {
    if (redoStack.length === 0) return;
    const nextOutfit = redoStack[redoStack.length - 1];
    setRedoStack((r) => r.slice(0, -1));
    setUndoStack((u) => [...u, outfit]);
    setOutfit(nextOutfit);
    cosmicAudio.playFabricSwish();
  };

  const handleResetToBaseCasual = () => {
    handleChangeOutfit({ ...NIKKI_BASE_CASUAL_OUTFIT, bodyScale: outfit.bodyScale }, true);
    setPose('nikki-grace');
    cosmicAudio.playSparkleChime(659);
  };

  const handleCapturePhoto = () => {
    const dataUrl = snapshotCaptureRef.current?.();
    cosmicAudio.playCameraFlash();
    triggerBurst('model', '#FDE68A', 75, 'flash');
    if (dataUrl) {
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `astraea-nikki-${Date.now()}.png`;
      a.click();
    }
  };

  const handleSelectWardrobeCategory = (cat: WardrobeCategory) => {
    dismissWelcomeGuide();
    if (cat === 'spirit') {
      setPose((cur) => POSE_CYCLE[(POSE_CYCLE.indexOf(cur) + 1) % POSE_CYCLE.length]);
      cosmicAudio.playCameraFlash();
      triggerBurst('model', '#F0ABFC', 50, 'flash');
    }
    setWardrobeCategory((cur) => (cur === cat && activeTab === 'outfit' ? null : cat));
    setActiveTab('outfit');
    setHudCollapsed(false);
  };

  const handleCareAction = (reaction: PetReaction, label: string, colorHex: string) => {
    cosmicAudio.playPetAffection();
    setPetReactionSignal({ id: Date.now() + Math.random(), reaction });
    triggerBurst('pet', colorHex, 65, reaction === 'love' ? 'hearts' : 'sparkle');

    setPet((prev) => {
      const xpGain = reaction === 'play' ? 15 : 10;
      const totalXp = prev.xp + xpGain;
      const leveledUp = totalXp >= 100;
      return {
        ...prev,
        affection: Math.min(100, prev.affection + (reaction === 'love' || reaction === 'play' ? 18 : 8)),
        energy: Math.min(100, prev.energy + (reaction === 'feed' ? 20 : -3)),
        glamour: Math.min(100, prev.glamour + (reaction === 'groom' || reaction === 'bath' ? 18 : 5)),
        xp: leveledUp ? totalXp - 100 : totalXp,
        level: leveledUp ? prev.level + 1 : prev.level,
        lastActionLabel: label,
      };
    });
  };

  const handleCyclePose = () => {
    const next = POSE_CYCLE[(POSE_CYCLE.indexOf(pose) + 1) % POSE_CYCLE.length];
    setPose(next);
    cosmicAudio.playCameraFlash();
    triggerBurst('model', '#FDE68A', 50, 'flash');
  };

  const handleSaveLook = (name: string) => {
    const entry: LookbookEntry = {
      id: String(Date.now()),
      name,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      outfit,
    };
    const updated = [entry, ...lookbook].slice(0, 12);
    setLookbook(updated);
    try {
      localStorage.setItem('astraea_lookbook', JSON.stringify(updated));
    } catch {
      // ignore storage quota errors
    }
    cosmicAudio.playSparkleChime(880);
    triggerBurst('model', '#FDE68A', 70, 'sparkle');
  };

  const handleToggleCompleteLesson = (id: string) => {
    const next = completedLessons.includes(id)
      ? completedLessons.filter((x) => x !== id)
      : [...completedLessons, id];
    setCompletedLessons(next);
    try {
      localStorage.setItem('astraea_completed_lessons', JSON.stringify(next));
    } catch {
      // ignore
    }
    cosmicAudio.playSparkleChime(784);
    triggerBurst('model', '#67E8F9', 60, 'sparkle');
  };

  const handleSendCoachMessage = async (text: string) => {
    const nowLabel = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: CoachMessage = {
      id: String(Date.now()),
      role: 'user',
      text,
      timestamp: nowLabel,
    };
    const nextHistory = [...coachMessages, userMsg];
    setCoachMessages(nextHistory);
    setCoachLoading(true);
    setCoachError(null);

    try {
      const activeLesson = ACADEMY_LESSONS.find((l) => l.id === activeLessonId);
      const res = await fetch('/api/coach/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextHistory.map((m) => ({ role: m.role, text: m.text })),
          context: {
            outfitSummary: `${outfit.name} (Bodice: ${outfit.bodice}, Skirt: ${outfit.skirt}, Sleeves: ${outfit.sleeves}, Fabric: ${outfit.fabric}, Sparkle: ${Math.round(outfit.sparkleIntensity * 100)}%)`,
            bodySummary: `Cao ${measurements.heightCm}cm, Nặng ${measurements.weightKg}kg, V1/V2/V3: ${measurements.bustCm}/${measurements.waistCm}/${measurements.hipCm}cm${bodyAnalysis ? `, Dáng: ${bodyAnalysis.bodyShape}` : ''}`,
            petSummary: `${pet.name} (${pet.species}, Lv.${pet.level}, Phụ kiện: ${pet.accessory})`,
            activeLesson: activeLesson
              ? `${activeLesson.number}. ${language === 'vi' ? activeLesson.titleVi : activeLesson.titleEn}`
              : undefined,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Coach request failed');
      }
      const replyMsg: CoachMessage = {
        id: String(Date.now() + 1),
        role: 'model',
        text: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setCoachMessages((prev) => [...prev, replyMsg]);
      cosmicAudio.playSparkleChime(587);
    } catch (err) {
      setCoachError(err instanceof Error ? err.message : 'Unable to reach Coach Astraea');
    } finally {
      setCoachLoading(false);
    }
  };

  const handleToggleMute = () => {
    const next = !muted;
    cosmicAudio.muted = next;
    setMuted(next);
  };

  const handleSyncBodyTo3D = (scale: BodyProportions) => {
    setOutfit((prev) => ({ ...prev, bodyScale: scale }));
    cosmicAudio.playSparkleChime(740);
    triggerBurst('model', '#67E8F9', 55, 'sparkle');
  };

  const handleEnterStudio = useCallback(
    (tab?: StudioTab) => {
      setViewMode('studio');
      setEntered(true);
      setHudCollapsed(false);
      if (tab) {
        setActiveTab(tab);
        dismissWelcomeGuide();
      }
      cosmicAudio.playSparkleChime(659);
      triggerBurst('model', '#FDE68A', 75, 'sparkle');
    },
    [dismissWelcomeGuide, triggerBurst]
  );

  if (viewMode === 'dashboard') {
    return (
      <div className="relative w-screen h-screen overflow-hidden bg-[#060512]">
        <ExecutiveDashboard
          language={language}
          outfit={outfit}
          pet={pet}
          measurements={measurements}
          bodyAnalysis={bodyAnalysis}
          completedLessons={completedLessons}
          activeLessonId={activeLessonId}
          lookbook={lookbook}
          coachMessages={coachMessages}
          showWelcomeGuide={showWelcomeGuide}
          onDismissWelcomeGuide={dismissWelcomeGuide}
          onToggleWelcomeGuide={() => setShowWelcomeGuide((v) => !v)}
          onToggleLanguage={() => setLanguage((l) => (l === 'vi' ? 'en' : 'vi'))}
          onEnterStudio={handleEnterStudio}
          onLoadOutfitInStudio={(nextOutfit) => {
            setOutfit(nextOutfit);
            handleEnterStudio('outfit');
          }}
        />
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#060512] select-none">
      {/* Isolated 3D WebGL Canvas Mount */}
      <div className="absolute inset-0 z-0">
        <GalaxyViewport
          outfit={outfit}
          pet={pet}
          pose={pose}
          cameraPreset={cameraPreset}
          runwayProgress={runwayProgress}
          petReactionSignal={petReactionSignal}
          sparkleBurstSignal={sparkleBurstSignal}
          onRegisterSnapshot={(fn) => {
            snapshotCaptureRef.current = fn;
          }}
          onModelClick={handleCyclePose}
          onPetClick={() =>
            handleCareAction(
              'love',
              language === 'vi' ? 'Chạm yêu thương' : 'Cosmic Boop',
              '#F472B6'
            )
          }
        />
      </div>

      {/* Atmospheric Title Screen */}
      {!entered && (
        <TitleOverlay
          language={language}
          onStart={(initialTab) => handleEnterStudio(initialTab)}
          onToggleLanguage={() => setLanguage((l) => (l === 'vi' ? 'en' : 'vi'))}
        />
      )}

      {/* Minimal In-Atelier HUD */}
      {entered && !hudCollapsed && (
        <>
          {/* Minimal Top Header Perimeter */}
          <div className="fixed top-4 left-5 right-5 z-20 flex items-center justify-between pointer-events-none">
            <div className="pointer-events-auto flex items-center gap-3 px-3.5 py-2 rounded-xl bg-[#0B081F]/90 border border-violet-300/20">
              <span className="font-display text-lg font-semibold tracking-wider text-amber-200">
                ASTRAEA
              </span>
              <span className="text-xs text-violet-300/80 hidden sm:inline">
                {outfit.name} · {pet.name} Lv.{pet.level}
              </span>
            </div>

            <div className="pointer-events-auto flex items-center gap-2">
              <button
                type="button"
                onClick={() => setViewMode('dashboard')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0B081F]/90 border border-violet-300/25 text-xs font-semibold text-white hover:border-fuchsia-400 cursor-pointer whitespace-nowrap shrink-0"
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-fuchsia-300" />
                <span>{language === 'vi' ? 'Tổng quan' : 'Summary'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab(null);
                  setShowWelcomeGuide((v) => !v);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0B081F]/90 border border-violet-300/20 text-xs font-medium text-amber-200 hover:border-amber-300/50 cursor-pointer whitespace-nowrap shrink-0"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>{language === 'vi' ? 'Hướng dẫn' : 'Guide'}</span>
              </button>
              <button
                type="button"
                onClick={() => setLanguage((l) => (l === 'vi' ? 'en' : 'vi'))}
                className="px-3 py-1.5 rounded-lg bg-[#0B081F]/90 border border-violet-300/20 text-xs font-medium text-violet-200 hover:text-white cursor-pointer"
              >
                {language === 'vi' ? 'VI' : 'EN'}
              </button>
            </div>
          </div>

          {/* First-Time User Quick-Start Welcome Banner */}
          {showWelcomeGuide && !activeTab && (
            <FirstTimeWelcomeBanner
              language={language}
              onSelectStarterTab={(tab) => {
                setActiveTab(tab);
                dismissWelcomeGuide();
              }}
              onDismiss={dismissWelcomeGuide}
            />
          )}

          {/* Right-Edge Nikki Wardrobe Category Rail (hidden only on <sm when drawer covers screen) */}
          <div className={activeTab ? 'hidden sm:block' : 'block'}>
            <WardrobeCategoryRail
              language={language}
              selectedCategory={activeTab === 'outfit' ? wardrobeCategory : null}
              canUndo={undoStack.length > 0}
              canRedo={redoStack.length > 0}
              onSelectCategory={handleSelectWardrobeCategory}
              onUndo={handleUndoOutfit}
              onRedo={handleRedoOutfit}
              onResetToBase={handleResetToBaseCasual}
              onCycleViewMode={() => {
                const order: CameraPreset[] = ['studio-center', 'closeup-face', 'closeup-garment'];
                setCameraPreset((cur) => order[(order.indexOf(cur) + 1) % order.length]);
              }}
              onCapturePhoto={handleCapturePhoto}
            />
          </div>

          {/* Right-Docked Studio Panel Drawer (3D subject shifts smoothly left) */}
          {activeTab && (
            <aside className="fixed top-16 right-4 sm:right-[134px] md:right-[192px] bottom-24 z-20 w-[calc(100vw-2rem)] sm:w-[356px] rounded-2xl bg-[#0B081F]/95 border border-violet-300/25 shadow-2xl flex flex-col overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-violet-300/15 bg-[#100C2B]">
                <span className="font-display text-lg font-semibold text-amber-200">
                  {activeTab === 'outfit' && (language === 'vi' ? 'Xưởng Trang phục 3D' : '3D Couture Studio')}
                  {activeTab === 'sketch' && (language === 'vi' ? 'Bản nháp Thiết kế' : 'Design Sketchpad')}
                  {activeTab === 'pet' && (language === 'vi' ? 'Chăm sóc Pet Thiên hà' : 'Cosmic Pet Care')}
                  {activeTab === 'body' && (language === 'vi' ? 'Vóc dáng & Tập luyện' : 'Body & Sculpting')}
                  {activeTab === 'academy' && (language === 'vi' ? 'Học viện & Catwalk' : 'Academy & Catwalk')}
                  {activeTab === 'coach' && 'AI Coach Astraea'}
                </span>
                <button
                  type="button"
                  onClick={() => setActiveTab(null)}
                  className="p-1.5 rounded-lg text-violet-300 hover:text-white hover:bg-violet-500/20 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto atelier-scroll p-4 select-text">
                {activeTab === 'outfit' && (
                  <OutfitStudioPanel
                    language={language}
                    outfit={outfit}
                    lookbook={lookbook}
                    selectedCategory={wardrobeCategory}
                    onClearCategoryFilter={() => setWardrobeCategory(null)}
                    onChangeOutfit={handleChangeOutfit}
                    onSaveLook={handleSaveLook}
                    onLoadLook={(entry) => handleChangeOutfit(entry.outfit, true)}
                  />
                )}

                {activeTab === 'sketch' && (
                  <SketchpadPanel
                    language={language}
                    outfit={outfit}
                    onApplySketchTexture={(dataUrl) =>
                      handleChangeOutfit({ ...outfit, sketchTextureDataUrl: dataUrl }, true)
                    }
                    onSparkleBurst={() => triggerBurst('model', '#FDE68A', 75, 'sparkle')}
                  />
                )}

                {activeTab === 'pet' && (
                  <PetCarePanel
                    language={language}
                    pet={pet}
                    onUpdatePet={setPet}
                    onCareAction={handleCareAction}
                  />
                )}

                {activeTab === 'body' && (
                  <BodyWorkoutPanel
                    language={language}
                    measurements={measurements}
                    analysis={bodyAnalysis}
                    onChangeMeasurements={setMeasurements}
                    onSyncBodyTo3D={handleSyncBodyTo3D}
                    onAnalysisComplete={(res) => {
                      setBodyAnalysis(res);
                      cosmicAudio.playSparkleChime(880);
                      triggerBurst('model', '#67E8F9', 70, 'sparkle');
                    }}
                    onTriggerWorkoutPose={(workoutPose) => {
                      setPose(workoutPose);
                      cosmicAudio.playSparkleChime(659);
                      triggerBurst('model', '#C084FC', 40, 'sparkle');
                    }}
                  />
                )}

                {activeTab === 'academy' && (
                  <AcademyCatwalkPanel
                    language={language}
                    completedLessons={completedLessons}
                    activeLessonId={activeLessonId}
                    onSelectLesson={(lesson) => setActiveLessonId(lesson.id)}
                    onToggleCompleteLesson={handleToggleCompleteLesson}
                    onApplySuggestedOutfit={(patch) =>
                      handleChangeOutfit({ ...outfit, ...patch, name: 'Academy Practice Look' }, true)
                    }
                    onStartCatwalkChallenge={() => {
                      setCameraPreset('runway-low');
                      triggerBurst('runway', '#FDE68A', 80, 'flash');
                    }}
                    onPoseChange={(p) => {
                      setPose(p);
                      triggerBurst('model', '#F0ABFC', 55, 'flash');
                    }}
                    onAskCoachLesson={(lesson: AcademyLesson) => {
                      setActiveTab('coach');
                      void handleSendCoachMessage(
                        language === 'vi'
                          ? `Cô Astraea ơi, hãy hướng dẫn em thực hành sâu hơn bài "${lesson.titleVi}" dựa trên bộ đồ 3D em đang thiết kế nhé!`
                          : `Coach Astraea, please guide me further on "${lesson.titleEn}" based on my current 3D outfit!`
                      );
                    }}
                  />
                )}

                {activeTab === 'coach' && (
                  <AiCoachPanel
                    language={language}
                    messages={coachMessages}
                    loading={coachLoading}
                    error={coachError}
                    onSendMessage={handleSendCoachMessage}
                  />
                )}
              </div>
            </aside>
          )}
        </>
      )}

      {/* Unified Collapsible Bottom Dock */}
      {entered && (
        <BottomDock
          language={language}
          activeTab={activeTab}
          pose={pose}
          cameraPreset={cameraPreset}
          muted={muted}
          hudCollapsed={hudCollapsed}
          onSelectTab={handleSelectTab}
          onCyclePose={handleCyclePose}
          onSelectCamera={(preset) => setCameraPreset(preset)}
          onSparkleShow={() => {
            cosmicAudio.playSparkleChime(880);
            triggerBurst('model', '#F0ABFC', 85, 'sparkle');
            triggerBurst('pet', '#FDE68A', 55, 'sparkle');
          }}
          onToggleMute={handleToggleMute}
          onToggleHud={() => setHudCollapsed((c) => !c)}
        />
      )}
    </div>
  );
}
