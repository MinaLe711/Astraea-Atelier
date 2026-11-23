export type Language = 'vi' | 'en';

export type BodiceStyle = 'corset' | 'blazer' | 'halter' | 'asym-drape' | 'nikki-tee';
export type SkirtStyle = 'ballgown' | 'mermaid' | 'mini-pleat' | 'tailored-pants' | 'none';
export type SleeveStyle = 'none' | 'celestial-cape' | 'puff-sleeves' | 'wing-drape';
export type AccessoryStyle = 'none' | 'tiara' | 'choker' | 'belt' | 'full-regalia';
export type FabricFinish =
  | 'galaxy-silk'
  | 'holographic-sequin'
  | 'midnight-velvet'
  | 'iridescent-organza'
  | 'liquid-metal';

export type HairStyle =
  | 'nikki-long-pink'
  | 'nikki-twintails'
  | 'starlight-waves'
  | 'celestial-updo'
  | 'idol-bob';

export type HosieryStyle = 'bare' | 'sheer-white' | 'galaxy-stockings' | 'lace-thighhigh';
export type ShoeStyle = 'barefoot' | 'pink-pumps' | 'galaxy-heels' | 'star-boots';
export type MakeupStyle = 'nikki-sweet' | 'sakura-blush' | 'galaxy-glam' | 'editorial-rose';

export type WardrobeCategory =
  | 'hair'
  | 'dress'
  | 'coat'
  | 'tops'
  | 'bottoms'
  | 'hosiery'
  | 'shoes'
  | 'accessory'
  | 'makeup'
  | 'spirit';

export type ModelPose =
  | 'nikki-grace'
  | 'editorial-idle'
  | 'runway-walk'
  | 'hip-pop'
  | 'supermodel-turn'
  | 'workout-sculpt'
  | 'workout-posture';

export type CameraPreset =
  | 'studio-center'
  | 'studio-offset'
  | 'closeup-face'
  | 'closeup-garment'
  | 'closeup-pet'
  | 'runway-low';

export interface BodyProportions {
  bust: number; // 0.85 - 1.2
  waist: number; // 0.72 - 1.2
  hip: number; // 0.85 - 1.25
  shoulder: number; // 0.85 - 1.2
  height: number; // 0.9 - 1.12
}

export interface OutfitConfig {
  name: string;
  bodice: BodiceStyle;
  skirt: SkirtStyle;
  sleeves: SleeveStyle;
  accessory: AccessoryStyle;
  fabric: FabricFinish;
  hairStyle?: HairStyle;
  hairColor?: string;
  eyeColor?: string;
  hosiery?: HosieryStyle;
  shoes?: ShoeStyle;
  makeup?: MakeupStyle;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  sparkleIntensity: number; // 0 - 1
  sketchTextureDataUrl: string | null;
  bodyScale: BodyProportions;
}

export type PetSpecies = 'nebula-cat' | 'astral-fox' | 'starlight-bunny';
export type PetAccessory = 'none' | 'star-collar' | 'galaxy-bow' | 'celestial-halo' | 'angel-wings';
export type PetReaction = 'idle' | 'feed' | 'groom' | 'bath' | 'play' | 'love';

export interface PetState {
  name: string;
  species: PetSpecies;
  affection: number; // 0-100
  energy: number; // 0-100
  glamour: number; // 0-100
  level: number;
  xp: number;
  accessory: PetAccessory;
  coatColor: string;
  auraColor: string;
  lastActionLabel: string;
}

export interface BodyMeasurements {
  heightCm: number;
  weightKg: number;
  bustCm: number;
  waistCm: number;
  hipCm: number;
  shoulderCm: number;
  goal: string;
}

export interface WorkoutItem {
  name: string;
  focusArea: string;
  durationOrReps: string;
  formCue: string;
}

export interface BodyAnalysisResult {
  bodyShape: string;
  proportionSummary: string;
  flatteringSilhouettes: string[];
  avoidCuts: string[];
  galaxyColorAdvice: string;
  sculptingWorkouts: WorkoutItem[];
  catwalkAndEtiquetteTips: string[];
  supermodelMantra: string;
}

export interface DesignCritiqueResult {
  critiqueHeadline: string;
  overallTier: string;
  strengths: string[];
  improvements: string[];
  fabricAndSparkleNote: string;
  nextLevelChallenge: string;
}

export interface AcademyLesson {
  id: string;
  level: 'beginner' | 'intermediate' | 'pro';
  number: string;
  titleVi: string;
  titleEn: string;
  subtitleVi: string;
  subtitleEn: string;
  theoryVi: string;
  theoryEn: string;
  practiceTaskVi: string;
  practiceTaskEn: string;
  suggestedPreset?: Partial<OutfitConfig>;
}

export interface CatwalkDrill {
  id: string;
  titleVi: string;
  titleEn: string;
  category: 'posture' | 'walk' | 'expression' | 'etiquette';
  summaryVi: string;
  summaryEn: string;
  stepsVi: string[];
  stepsEn: string[];
}

export interface LookbookEntry {
  id: string;
  name: string;
  createdAt: string;
  outfit: OutfitConfig;
}

export interface CoachMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

export type StudioTab =
  | 'outfit'
  | 'sketch'
  | 'pet'
  | 'body'
  | 'academy'
  | 'coach';

export type AppViewMode = 'dashboard' | 'studio';

export interface SparkleBurstEvent {
  id: number;
  target: 'model' | 'pet' | 'stage' | 'runway';
  colorHex: string;
  count: number;
  style: 'sparkle' | 'hearts' | 'nebula' | 'flash';
}
