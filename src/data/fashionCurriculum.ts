import { AcademyLesson, CatwalkDrill, OutfitConfig, WorkoutItem } from '../types/atelier';

export const DEFAULT_OUTFIT: OutfitConfig = {
  name: 'Nikki Starlight Empress',
  bodice: 'corset',
  skirt: 'ballgown',
  sleeves: 'celestial-cape',
  accessory: 'full-regalia',
  fabric: 'galaxy-silk',
  hairStyle: 'nikki-long-pink',
  hairColor: '#FF91AA',
  eyeColor: '#7C4A3A',
  hosiery: 'sheer-white',
  shoes: 'pink-pumps',
  makeup: 'nikki-sweet',
  primaryColor: '#3B1D8E',
  secondaryColor: '#C026D3',
  accentColor: '#FDE68A',
  sparkleIntensity: 0.88,
  sketchTextureDataUrl: null,
  bodyScale: {
    bust: 0.98,
    waist: 0.84,
    hip: 1.0,
    shoulder: 0.95,
    height: 1.02,
  },
};

export const NIKKI_BASE_CASUAL_OUTFIT: OutfitConfig = {
  name: 'Miracle Star Tee',
  bodice: 'nikki-tee',
  skirt: 'none',
  sleeves: 'none',
  accessory: 'none',
  fabric: 'galaxy-silk',
  hairStyle: 'nikki-long-pink',
  hairColor: '#FF91AA',
  eyeColor: '#7C4A3A',
  hosiery: 'bare',
  shoes: 'barefoot',
  makeup: 'nikki-sweet',
  primaryColor: '#FFFFFF',
  secondaryColor: '#F9A8D4',
  accentColor: '#475569',
  sparkleIntensity: 0.8,
  sketchTextureDataUrl: null,
  bodyScale: {
    bust: 0.96,
    waist: 0.86,
    hip: 0.98,
    shoulder: 0.95,
    height: 1.02,
  },
};

export const COUTURE_PRESETS: OutfitConfig[] = [
  DEFAULT_OUTFIT,
  NIKKI_BASE_CASUAL_OUTFIT,
  {
    name: 'Supernova Mermaid',
    bodice: 'halter',
    skirt: 'mermaid',
    sleeves: 'none',
    accessory: 'tiara',
    fabric: 'holographic-sequin',
    hairStyle: 'starlight-waves',
    hairColor: '#E9D5FF',
    eyeColor: '#38BDF8',
    hosiery: 'bare',
    shoes: 'galaxy-heels',
    makeup: 'galaxy-glam',
    primaryColor: '#1E1B4B',
    secondaryColor: '#38BDF8',
    accentColor: '#FDE047',
    sparkleIntensity: 0.95,
    sketchTextureDataUrl: null,
    bodyScale: { bust: 1.0, waist: 0.85, hip: 1.04, shoulder: 0.96, height: 1.04 },
  },
  {
    name: 'Stardust Idol Mini',
    bodice: 'asym-drape',
    skirt: 'mini-pleat',
    sleeves: 'wing-drape',
    accessory: 'choker',
    fabric: 'iridescent-organza',
    hairStyle: 'nikki-twintails',
    hairColor: '#FF91AA',
    eyeColor: '#EC4899',
    hosiery: 'lace-thighhigh',
    shoes: 'pink-pumps',
    makeup: 'sakura-blush',
    primaryColor: '#6D28D9',
    secondaryColor: '#F472B6',
    accentColor: '#67E8F9',
    sparkleIntensity: 1.0,
    sketchTextureDataUrl: null,
    bodyScale: { bust: 0.95, waist: 0.84, hip: 0.98, shoulder: 0.94, height: 1.0 },
  },
  {
    name: 'Astral Power Blazer',
    bodice: 'blazer',
    skirt: 'tailored-pants',
    sleeves: 'puff-sleeves',
    accessory: 'belt',
    fabric: 'midnight-velvet',
    hairStyle: 'celestial-updo',
    hairColor: '#2E1A47',
    eyeColor: '#F59E0B',
    hosiery: 'galaxy-stockings',
    shoes: 'star-boots',
    makeup: 'editorial-rose',
    primaryColor: '#17153B',
    secondaryColor: '#A855F7',
    accentColor: '#FBBF24',
    sparkleIntensity: 0.65,
    sketchTextureDataUrl: null,
    bodyScale: { bust: 0.96, waist: 0.86, hip: 0.96, shoulder: 1.02, height: 1.04 },
  },
];

export const NIKKI_HAIR_SWATCHES = [
  { name: 'Nikki Coral Pink', hex: '#FF91AA' },
  { name: 'Sakura Pastel', hex: '#FBCFE8' },
  { name: 'Starlight Silver', hex: '#EDE9FE' },
  { name: 'Lavender Mist', hex: '#C4B5FD' },
  { name: 'Champagne Gold', hex: '#FDE68A' },
  { name: 'Midnight Violet', hex: '#2E1A47' },
];

export const NIKKI_EYE_SWATCHES = [
  { name: 'Warm Chestnut (Nikki)', hex: '#7C4A3A' },
  { name: 'Amethyst Galaxy', hex: '#8B5CF6' },
  { name: 'Rose Quartz', hex: '#EC4899' },
  { name: 'Celestial Aqua', hex: '#38BDF8' },
  { name: 'Amber Star', hex: '#F59E0B' },
];

export const GALAXY_SWATCHES = [
  { name: 'Deep Nebula', hex: '#2E1065' },
  { name: 'Cosmic Indigo', hex: '#1E1B4B' },
  { name: 'Ultraviolet', hex: '#6D28D9' },
  { name: 'Supernova Magenta', hex: '#C026D3' },
  { name: 'Aurora Cyan', hex: '#0EA5E9' },
  { name: 'Celestial Rose', hex: '#EC4899' },
  { name: 'Obsidian Void', hex: '#0F172A' },
  { name: 'Starlight Gold', hex: '#FDE68A' },
  { name: 'Moonlight Silver', hex: '#E2E8F0' },
  { name: 'Nebula Mint', hex: '#2DD4BF' },
];

export const ACADEMY_LESSONS: AcademyLesson[] = [
  {
    id: 'beg-1',
    level: 'beginner',
    number: '01',
    titleVi: 'Tỉ lệ 9 Đầu & Phom dáng Nền tảng',
    titleEn: '9-Head Croquis & Core Silhouettes',
    subtitleVi: 'Nhập môn · Giải phẫu thời trang',
    subtitleEn: 'Beginner · Fashion Proportions',
    theoryVi:
      'Trong thiết kế thời trang chuyên nghiệp, dáng người mẫu chuẩn (Croquis) dài gấp 9 lần chiều cao đầu để tạo độ thanh thoát khi lên phom. Điểm thắt eo tự nhiên (Natural Waist) là trục cân bằng quyết định toàn bộ tỉ lệ chân và thân trên.',
    theoryEn:
      'Professional fashion croquis elongates the figure to 9 head-lengths. Placing the natural waistline correctly controls the visual leg-to-torso balance.',
    practiceTaskVi:
      'Chọn phom Corset kết hợp Thắt lưng (Belt) và thử điều chỉnh vòng eo trên mô hình 3D để quan sát hiệu ứng kéo dài đôi chân.',
    practiceTaskEn:
      'Pair a Corset bodice with a Constellation Belt and adjust the waist slider to observe leg elongation.',
    suggestedPreset: { bodice: 'corset', skirt: 'mini-pleat', accessory: 'belt' },
  },
  {
    id: 'beg-2',
    level: 'beginner',
    number: '02',
    titleVi: 'Bánh xe Màu Thiên Hà & Quy tắc 60-30-10',
    titleEn: 'Galaxy Color Theory & 60-30-10 Rule',
    subtitleVi: 'Nhập môn · Phối màu Couture',
    subtitleEn: 'Beginner · Color Harmony',
    theoryVi:
      'Màu Galaxy dễ bị rối nếu pha trộn quá nhiều sắc neon. Bí quyết Haute Couture là: 60% nền vũ trụ trầm (Indigo/Obsidian), 30% chuyển sắc tinh vân (Violet/Cyan) và 10% ánh kim Starlight Gold làm điểm nhấn thị giác.',
    theoryEn:
      'Galaxy palettes thrive on contrast: 60% deep cosmic navy/obsidian, 30% nebula violet or aurora cyan, and 10% starlight gold accents.',
    practiceTaskVi:
      'Thiết lập màu chính tông tối (#1E1B4B), màu phụ tím/xanh và màu nhấn vàng kim (#FDE68A) trên trang phục 3D.',
    practiceTaskEn:
      'Apply a deep midnight primary color, vibrant nebula secondary, and starlight gold accent on your 3D garment.',
    suggestedPreset: { primaryColor: '#1E1B4B', secondaryColor: '#6D28D9', accentColor: '#FDE68A' },
  },
  {
    id: 'beg-3',
    level: 'beginner',
    number: '03',
    titleVi: 'Phác thảo Ý tưởng & Họa tiết Độc bản',
    titleEn: 'Concept Sketching & Custom Prints',
    subtitleVi: 'Nhập môn · Bản vẽ sáng tạo',
    subtitleEn: 'Beginner · Sketching Foundations',
    theoryVi:
      'Mỗi bộ sưu tập bắt đầu từ một nét phác thảo phóng khoáng (Gesture Line). Đừng vẽ chi tiết vụn vặt ngay — hãy xác định đường chuyển động của tà áo và mảng sáng tối trước khi tô họa tiết thiên hà.',
    theoryEn:
      'Every collection begins with a confident gesture line and silhouette rhythm before rendering surface textures.',
    practiceTaskVi:
      'Mở bảng Bản nháp (Sketchpad), vẽ họa tiết chòm sao bằng bút kim tuyến rồi nhấn "Áp dụng lên vải 3D".',
    practiceTaskEn:
      'Open the Sketchpad, draw a constellation motif, and apply it directly onto your 3D fabric.',
  },
  {
    id: 'int-1',
    level: 'intermediate',
    number: '04',
    titleVi: 'Chất liệu, Độ rủ & Hiệu ứng Bắt sáng',
    titleEn: 'Textiles, Drape & Light Specularity',
    subtitleVi: 'Trung cấp · Kỹ thuật Vải',
    subtitleEn: 'Intermediate · Material Science',
    theoryVi:
      'Lụa Galaxy Silk có độ rủ mềm và độ bóng mượt (sheen); Sequin bắt sáng đa chiều dưới đèn sân khấu; còn Velvet hút sáng tạo chiều sâu quý tộc. Kết hợp đúng chất liệu giúp bộ đồ đắt giá gấp nhiều lần.',
    theoryEn:
      'Galaxy Silk flows softly, Holographic Sequins scatter runway spotlights, and Midnight Velvet absorbs light for sculpted depth.',
    practiceTaskVi:
      'Chuyển đổi giữa Galaxy Silk, Holographic Sequin và Midnight Velvet, quan sát sự thay đổi độ bóng dưới ánh đèn Studio.',
    practiceTaskEn:
      'Compare Galaxy Silk, Holographic Sequin, and Midnight Velvet under the 3D studio lights.',
    suggestedPreset: { fabric: 'holographic-sequin', sparkleIntensity: 0.9 },
  },
  {
    id: 'int-2',
    level: 'intermediate',
    number: '05',
    titleVi: 'May đo theo Tỉ lệ Cơ thể Thực tế',
    titleEn: 'Tailoring for Real Body Proportions',
    subtitleVi: 'Trung cấp · Nhân trắc học Thời trang',
    subtitleEn: 'Intermediate · Fit & Proportion',
    theoryVi:
      'Nhà thiết kế giỏi biết cách dùng đường cắt để cân bằng vóc dáng: dáng Quả lê cần nhấn vai (Puff Sleeves / Blazer); dáng Tam giác ngược cần tùng xòe (Ballgown / Pleat); dáng Chữ nhật cần chiết eo tạo đường cong.',
    theoryEn:
      'Great designers sculpt illusions: puff sleeves balance pear frames, A-line volume softens broad shoulders, and cinched corsets carve curves.',
    practiceTaskVi:
      'Vào mục Vóc dáng & Tập để nhập số đo của bạn, sau đó áp dụng gợi ý phom dáng từ AI Coach lên mô hình 3D.',
    practiceTaskEn:
      'Enter your body measurements in the Body Studio and apply Coach Astraea’s silhouette recommendations.',
  },
  {
    id: 'pro-1',
    level: 'pro',
    number: '06',
    titleVi: 'Kịch bản Bộ sưu tập Haute Couture & Runway',
    titleEn: 'Haute Couture Storytelling & Showpiece',
    subtitleVi: 'Chuyên nghiệp · Giám đốc Sáng tạo',
    subtitleEn: 'Pro · Creative Direction',
    theoryVi:
      'Một thiết kế trình diễn (Showpiece) đỉnh cao phải kể được câu chuyện từ xa 20 mét trên sàn diễn: cấu trúc vai/áo choàng ấn tượng, độ lấp lánh có chủ đích tại tâm điểm và sự ăn nhập tuyệt đối với bước đi Catwalk.',
    theoryEn:
      'A runway showpiece must read clearly from 20 meters away: architectural shoulders or capes, intentional sparkle focal points, and kinetic flow in motion.',
    practiceTaskVi:
      'Hoàn thiện một bộ Haute Couture với Áo choàng Celestial Cape + Full Regalia, chạy chế độ Sàn diễn Runway và gửi AI Coach thẩm định.',
    practiceTaskEn:
      'Assemble a showpiece with Celestial Cape + Full Regalia, launch Runway Walk mode, and request an AI Coach critique.',
    suggestedPreset: { bodice: 'asym-drape', skirt: 'mermaid', sleeves: 'celestial-cape', accessory: 'full-regalia' },
  },
];

export const CATWALK_DRILLS: CatwalkDrill[] = [
  {
    id: 'posture',
    titleVi: 'Tư thế Đứng & Trục Cột sống Siêu mẫu',
    titleEn: 'Supermodel Alignment & Clavicle Poise',
    category: 'posture',
    summaryVi: 'Kéo dài cổ, mở xương quai xanh và khóa cơ trọng tâm để toát lên khí chất sang trọng ngay khi đứng yên.',
    summaryEn: 'Elongate the spine, open the collarbones, and engage the core for instant luxury presence.',
    stepsVi: [
      'Tưởng tượng có sợi chỉ vô hình kéo đỉnh đầu thẳng lên trần nhà, cằm song song mặt sàn.',
      'Xoay nhẹ hai vai ra sau và hạ xuống thấp để lộ đường xương quai xanh thanh mảnh.',
      'Siết nhẹ cơ bụng dưới, dồn 60% trọng lực vào một chân, chân còn lại bước nhẹ về trước tạo góc chữ V thanh thoát.',
    ],
    stepsEn: [
      'Imagine a thread lifting the crown of your head while keeping your chin parallel to the floor.',
      'Roll shoulders back and drop them down to showcase an open collarbone line.',
      'Engage your lower core and shift 60% weight onto your back leg with the front foot angled cleanly.',
    ],
  },
  {
    id: 'walk',
    titleVi: 'Kỹ thuật Bước đi Catwalk & Xoay người Cuối sàn',
    titleEn: 'Heel-to-Toe Runway Glide & Pivot Turn',
    category: 'walk',
    summaryVi: 'Bước chân thẳng hàng trên một đường thẳng tưởng tượng, giữ phần thân trên vững và uyển chuyển phần hông.',
    summaryEn: 'Step along a single imaginary line, keeping the upper torso poised while letting the hips glide naturally.',
    stepsVi: [
      'Đặt gót chân chạm sàn trước rồi lăn mượt sang mũi chân, đầu gối duỗi thẳng khi tiếp đất.',
      'Mỗi bước chân đặt chéo nhẹ trước mũi chân kia (Tightrope walk) nhưng giữ hai vai không lắc ngang.',
      'Đến điểm cuối sàn: dừng đúng nhịp nhạc 2 giây, khóa ánh mắt vào ống kính (Smize), xoay trục trên mũi chân trước khi quay về.',
    ],
    stepsEn: [
      'Strike heel-first and roll smoothly through the ball of the foot with an extended knee.',
      'Step along a single center line while keeping shoulders steady and arms swinging lightly from the shoulders.',
      'Pause 2 full beats at the end of the runway, lock eyes with the lens, and execute a crisp pivot turn.',
    ],
  },
  {
    id: 'etiquette',
    titleVi: 'Ứng xử Thảm đỏ, Phỏng vấn & Giao tiếp Ngành Thời trang',
    titleEn: 'Red Carpet Etiquette & Industry Presence',
    category: 'etiquette',
    summaryVi: 'Cách tạo dáng trước 100 ống kính, trả lời phỏng vấn thông minh và xây dựng phong thái ngôi sao chuyên nghiệp.',
    summaryEn: 'Command camera flashes, deliver poised press answers, and network with quiet authority.',
    stepsVi: [
      'Tạo dáng góc 45° thay vì đứng trực diện 100% để tôn đường cong eo và đường viền hàm (jawline).',
      'Khi trả lời phỏng vấn: giữ tốc độ nói chậm hơn bình thường 15%, mỉm cười bằng mắt, luôn nhắc đến cảm hứng thiết kế và đội ngũ sáng tạo.',
      'Trong phòng thử đồ & hậu trường: tôn trọng giờ giấc tuyệt đối, lắng nghe ý đồ của Giám đốc Sáng tạo và bảo quản trang phục Couture cẩn trọng.',
    ],
    stepsEn: [
      'Angle your torso 45 degrees toward cameras to accentuate your waistline and jawline.',
      'Speak 15% slower during press interviews, maintain warm eye contact, and credit the craftsmanship.',
      'Backstage professionalism: arrive early, respect fittings, and embody the designer’s story.',
    ],
  },
];

export const DEFAULT_WORKOUTS: WorkoutItem[] = [
  {
    name: 'Corset Waist Vacuum & Side Plank',
    focusArea: 'Siết vòng eo & Cơ bụng sâu (Transverse Abdominis)',
    durationOrReps: '3 hiệp × 45 giây',
    formCue: 'Thở hết hơi, hóp sâu rốn hướng về cột sống trong khi giữ hông nâng cao thẳng hàng.',
  },
  {
    name: 'Swan Neck & Posture Wall Angels',
    focusArea: 'Thon gọn bả vai, mở ngực & chống gù lưng',
    durationOrReps: '3 hiệp × 15 lần chậm',
    formCue: 'Áp sát gáy, lưng trên và mu bàn tay vào tường; trượt tay lên xuống giữ vai hạ thấp.',
  },
  {
    name: 'Runway Leg Elongation Lunges',
    focusArea: 'Săn chắc đùi sau, nâng mông & bắp chân thon dài',
    durationOrReps: '3 hiệp × 12 lần mỗi chân',
    formCue: 'Giữ thân trên thẳng đứng như đang đội vương miện, hạ gối sau vuông góc 90°.',
  },
  {
    name: 'Stardust Cardio Sculpt Bursts',
    focusArea: 'Đốt mỡ toàn thân & tăng sức bền trình diễn',
    durationOrReps: '4 hiệp × 40s tập / 20s nghỉ',
    formCue: 'Tiếp đất bằng mũi chân nhẹ nhàng, giữ nhịp thở đều để bảo vệ khớp gối.',
  },
];
