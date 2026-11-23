import React, { useState } from 'react';
import {
  COUTURE_PRESETS,
  GALAXY_SWATCHES,
  NIKKI_EYE_SWATCHES,
  NIKKI_HAIR_SWATCHES,
} from '../data/fashionCurriculum';
import {
  AccessoryStyle,
  BodiceStyle,
  FabricFinish,
  HairStyle,
  HosieryStyle,
  Language,
  LookbookEntry,
  MakeupStyle,
  OutfitConfig,
  ShoeStyle,
  SkirtStyle,
  SleeveStyle,
  WardrobeCategory,
} from '../types/atelier';

interface OutfitStudioPanelProps {
  language: Language;
  outfit: OutfitConfig;
  lookbook: LookbookEntry[];
  selectedCategory?: WardrobeCategory | null;
  onClearCategoryFilter?: () => void;
  onChangeOutfit: (next: OutfitConfig, triggerBurst?: boolean) => void;
  onSaveLook: (name: string) => void;
  onLoadLook: (entry: LookbookEntry) => void;
}

export const OutfitStudioPanel: React.FC<OutfitStudioPanelProps> = ({
  language,
  outfit,
  lookbook,
  selectedCategory,
  onClearCategoryFilter,
  onChangeOutfit,
  onSaveLook,
  onLoadLook,
}) => {
  const isVi = language === 'vi';
  const [lookName, setLookName] = useState('');

  const update = (patch: Partial<OutfitConfig>, burst = true) => {
    onChangeOutfit({ ...outfit, ...patch }, burst);
  };

  const showSection = (cats: WardrobeCategory[]) =>
    !selectedCategory || cats.includes(selectedCategory);

  const hairstyles: Array<{ id: HairStyle; label: string }> = [
    { id: 'nikki-long-pink', label: isVi ? 'Tóc Dài Mái Bằng Nikki' : 'Nikki Long Fringe' },
    { id: 'nikki-twintails', label: isVi ? 'Nikki Twin-Tails' : 'Nikki Twin-Tails' },
    { id: 'starlight-waves', label: isVi ? 'Sóng Dài Thiên hà' : 'Starlight Waves' },
    { id: 'celestial-updo', label: isVi ? 'Búi Nữ hoàng' : 'Empress Updo' },
    { id: 'idol-bob', label: isVi ? 'Tóc Bob Idol' : 'Idol Bob' },
  ];

  const bodices: Array<{ id: BodiceStyle; label: string }> = [
    { id: 'nikki-tee', label: isVi ? 'Áo Thun Vương Miện' : 'Miracle Crown Tee' },
    { id: 'corset', label: isVi ? 'Corset Hoàng gia' : 'Royal Corset' },
    { id: 'blazer', label: isVi ? 'Blazer Quyền lực' : 'Power Blazer' },
    { id: 'halter', label: isVi ? 'Cổ Yếm Halter' : 'Halter Neck' },
    { id: 'asym-drape', label: isVi ? 'Lệch vai Draping' : 'Asym Drape' },
  ];

  const skirts: Array<{ id: SkirtStyle; label: string }> = [
    { id: 'none', label: isVi ? 'Không váy (Áo giấu quần)' : 'None (Tunic Tee)' },
    { id: 'ballgown', label: isVi ? 'Đầm Xòe Thiên hà' : 'Nebula Ballgown' },
    { id: 'mermaid', label: isVi ? 'Đuôi Cá Couture' : 'Mermaid Gown' },
    { id: 'mini-pleat', label: isVi ? 'Chân váy Xếp ly' : 'Pleated Mini' },
    { id: 'tailored-pants', label: isVi ? 'Quần Ống suông' : 'Palazzo Trousers' },
  ];

  const sleeves: Array<{ id: SleeveStyle; label: string }> = [
    { id: 'none', label: isVi ? 'Không áo choàng' : 'None' },
    { id: 'celestial-cape', label: isVi ? 'Áo choàng Sao' : 'Celestial Cape' },
    { id: 'puff-sleeves', label: isVi ? 'Tay Bồng' : 'Puff Sleeves' },
    { id: 'wing-drape', label: isVi ? 'Cánh Tiên Vũ trụ' : 'Wing Drape' },
  ];

  const hosieryOptions: Array<{ id: HosieryStyle; label: string }> = [
    { id: 'bare', label: isVi ? 'Chân trần tự nhiên' : 'Bare Legs' },
    { id: 'sheer-white', label: isVi ? 'Tất cao cổ trắng' : 'Sheer White Socks' },
    { id: 'galaxy-stockings', label: isVi ? 'Quần tất Ngân hà' : 'Galaxy Tights' },
    { id: 'lace-thighhigh', label: isVi ? 'Tất ren đùi' : 'Lace Thigh-High' },
  ];

  const shoeOptions: Array<{ id: ShoeStyle; label: string }> = [
    { id: 'barefoot', label: isVi ? 'Chân trần (Barefoot)' : 'Barefoot' },
    { id: 'pink-pumps', label: isVi ? 'Cao gót Nơ hồng' : 'Pink Bow Pumps' },
    { id: 'galaxy-heels', label: isVi ? 'Cao gót Pha lê' : 'Galaxy Heels' },
    { id: 'star-boots', label: isVi ? 'Bốt Cao cổ Sao' : 'Starlight Boots' },
  ];

  const makeupOptions: Array<{ id: MakeupStyle; label: string }> = [
    { id: 'nikki-sweet', label: isVi ? 'Nikki Trong veo' : 'Nikki Sweet' },
    { id: 'sakura-blush', label: isVi ? 'Má hồng Anh đào' : 'Sakura Blush' },
    { id: 'galaxy-glam', label: isVi ? 'Sân khấu Ngân hà' : 'Galaxy Glam' },
    { id: 'editorial-rose', label: isVi ? 'Hồng Editorial' : 'Editorial Rose' },
  ];

  const accessories: Array<{ id: AccessoryStyle; label: string }> = [
    { id: 'none', label: isVi ? 'Tối giản' : 'Minimal' },
    { id: 'tiara', label: isVi ? 'Vương miện' : 'Tiara' },
    { id: 'choker', label: isVi ? 'Vòng cổ Sao' : 'Star Choker' },
    { id: 'belt', label: isVi ? 'Đai Eo Vàng' : 'Gold Belt' },
    { id: 'full-regalia', label: isVi ? 'Full Regalia' : 'Full Regalia' },
  ];

  const fabrics: Array<{ id: FabricFinish; label: string }> = [
    { id: 'galaxy-silk', label: isVi ? 'Lụa Thiên hà' : 'Galaxy Silk' },
    { id: 'holographic-sequin', label: isVi ? 'Kim sa Sequin' : 'Holo Sequin' },
    { id: 'midnight-velvet', label: isVi ? 'Nhung Đêm sao' : 'Midnight Velvet' },
    { id: 'iridescent-organza', label: isVi ? 'Organza Ánh xà cừ' : 'Iridescent Organza' },
    { id: 'liquid-metal', label: isVi ? 'Kim loại Lỏng' : 'Liquid Metal' },
  ];

  const currentHairStyle = outfit.hairStyle || 'nikki-long-pink';
  const currentHairColor = outfit.hairColor || '#FF91AA';
  const currentEyeColor = outfit.eyeColor || '#7C4A3A';
  const currentHosiery = outfit.hosiery || 'bare';
  const currentShoes = outfit.shoes || 'pink-pumps';
  const currentMakeup = outfit.makeup || 'nikki-sweet';

  return (
    <div className="space-y-5 text-sm">
      {selectedCategory && onClearCategoryFilter && (
        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-fuchsia-500/15 border border-fuchsia-300/35">
          <span className="text-xs font-medium text-fuchsia-100">
            {isVi ? `Đang lọc mục: ${selectedCategory.toUpperCase()}` : `Filtered: ${selectedCategory.toUpperCase()}`}
          </span>
          <button
            type="button"
            onClick={onClearCategoryFilter}
            className="text-xs font-semibold text-amber-200 hover:text-white underline cursor-pointer"
          >
            {isVi ? 'Xem tất cả' : 'See all'}
          </button>
        </div>
      )}

      {/* Presets */}
      {showSection(['dress', 'spirit']) && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-200">
              {isVi ? 'Bộ sưu tập Set Trang phục Nikki' : 'Curated Nikki Couture Sets'}
            </h3>
            {outfit.sketchTextureDataUrl && (
              <button
                type="button"
                onClick={() => update({ sketchTextureDataUrl: null })}
                className="text-xs text-fuchsia-300 hover:text-fuchsia-200 underline cursor-pointer"
              >
                {isVi ? 'Gỡ họa tiết vẽ tay' : 'Clear Sketch Print'}
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {COUTURE_PRESETS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => onChangeOutfit({ ...preset, bodyScale: outfit.bodyScale }, true)}
                className={`px-3 py-2 text-left rounded-lg border text-xs font-medium transition-colors cursor-pointer truncate ${
                  outfit.name === preset.name
                    ? 'bg-violet-600/35 border-fuchsia-400 text-white'
                    : 'bg-[#130E2E] border-violet-300/15 text-violet-200 hover:border-violet-300/40'
                }`}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Hair */}
      {showSection(['hair']) && (
        <div className="space-y-3 pt-2 border-t border-violet-300/15">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-200">
            {isVi ? 'Kiểu Tóc & Màu Nhuộm' : 'Hairstyle & Color'}
          </h3>

          <div className="grid grid-cols-2 gap-1.5">
            {hairstyles.map((hs) => (
              <button
                key={hs.id}
                type="button"
                onClick={() => update({ hairStyle: hs.id })}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap truncate ${
                  currentHairStyle === hs.id
                    ? 'bg-pink-500/30 border-pink-300 text-white'
                    : 'bg-[#120D2A] border-violet-300/15 text-violet-200 hover:border-violet-300/35'
                }`}
              >
                {hs.label}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-violet-300 shrink-0">
              {isVi ? 'Màu tóc:' : 'Hair:'}
            </span>
            <div className="flex items-center gap-1.5 flex-wrap justify-end">
              {NIKKI_HAIR_SWATCHES.map((sw) => (
                <button
                  key={sw.hex}
                  type="button"
                  title={sw.name}
                  onClick={() => update({ hairColor: sw.hex })}
                  className={`w-5 h-5 rounded-full border cursor-pointer transition-transform ${
                    currentHairColor.toLowerCase() === sw.hex.toLowerCase()
                      ? 'border-white scale-115'
                      : 'border-white/25 hover:scale-110'
                  }`}
                  style={{ backgroundColor: sw.hex }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Makeup & Eyes */}
      {showSection(['makeup', 'hair']) && (
        <div className="space-y-3 pt-2 border-t border-violet-300/15">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-200">
            {isVi ? 'Trang điểm & Đôi mắt Sao' : 'Makeup & Starry Eyes'}
          </h3>

          <div className="grid grid-cols-2 gap-1.5">
            {makeupOptions.map((mk) => (
              <button
                key={mk.id}
                type="button"
                onClick={() => update({ makeup: mk.id }, false)}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap truncate ${
                  currentMakeup === mk.id
                    ? 'bg-rose-500/30 border-rose-300 text-white'
                    : 'bg-[#120D2A] border-violet-300/15 text-violet-200 hover:border-violet-300/35'
                }`}
              >
                {mk.label}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-violet-300 shrink-0">
              {isVi ? 'Màu mắt:' : 'Eyes:'}
            </span>
            <div className="flex items-center gap-1.5 flex-wrap justify-end">
              {NIKKI_EYE_SWATCHES.map((sw) => (
                <button
                  key={sw.hex}
                  type="button"
                  title={sw.name}
                  onClick={() => update({ eyeColor: sw.hex }, false)}
                  className={`w-5 h-5 rounded-full border cursor-pointer transition-transform ${
                    currentEyeColor.toLowerCase() === sw.hex.toLowerCase()
                      ? 'border-white scale-115'
                      : 'border-white/25 hover:scale-110'
                  }`}
                  style={{ backgroundColor: sw.hex }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tops / Bodice */}
      {showSection(['tops', 'dress']) && (
        <div className="space-y-2 pt-2 border-t border-violet-300/15">
          <label className="block text-xs font-semibold uppercase tracking-wider text-amber-200">
            {isVi ? 'Thân áo & Áo trên (Tops)' : 'Tops & Bodice'}
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {bodices.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => update({ bodice: b.id, name: 'Custom Couture' })}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap truncate ${
                  outfit.bodice === b.id
                    ? 'bg-fuchsia-600/35 border-fuchsia-300 text-white'
                    : 'bg-[#120D2A] border-violet-300/15 text-violet-200 hover:border-violet-300/35'
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bottoms / Skirt */}
      {showSection(['bottoms', 'dress']) && (
        <div className="space-y-2 pt-2 border-t border-violet-300/15">
          <label className="block text-xs font-semibold uppercase tracking-wider text-amber-200">
            {isVi ? 'Váy & Quần (Bottoms)' : 'Skirts & Bottoms'}
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {skirts.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => update({ skirt: s.id, name: 'Custom Couture' })}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap truncate ${
                  outfit.skirt === s.id
                    ? 'bg-fuchsia-600/35 border-fuchsia-300 text-white'
                    : 'bg-[#120D2A] border-violet-300/15 text-violet-200 hover:border-violet-300/35'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Coat & Sleeves */}
      {showSection(['coat', 'dress']) && (
        <div className="space-y-2 pt-2 border-t border-violet-300/15">
          <label className="block text-xs font-semibold uppercase tracking-wider text-amber-200">
            {isVi ? 'Áo khoác & Tay áo (Coat)' : 'Coat, Cape & Sleeves'}
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {sleeves.map((sl) => (
              <button
                key={sl.id}
                type="button"
                onClick={() => update({ sleeves: sl.id })}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap truncate ${
                  outfit.sleeves === sl.id
                    ? 'bg-fuchsia-600/35 border-fuchsia-300 text-white'
                    : 'bg-[#120D2A] border-violet-300/15 text-violet-200 hover:border-violet-300/35'
                }`}
              >
                {sl.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Hosiery */}
      {showSection(['hosiery']) && (
        <div className="space-y-2 pt-2 border-t border-violet-300/15">
          <label className="block text-xs font-semibold uppercase tracking-wider text-amber-200">
            {isVi ? 'Tất & Quần tất (Hosiery)' : 'Hosiery & Stockings'}
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {hosieryOptions.map((hs) => (
              <button
                key={hs.id}
                type="button"
                onClick={() => update({ hosiery: hs.id })}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap truncate ${
                  currentHosiery === hs.id
                    ? 'bg-fuchsia-600/35 border-fuchsia-300 text-white'
                    : 'bg-[#120D2A] border-violet-300/15 text-violet-200 hover:border-violet-300/35'
                }`}
              >
                {hs.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Shoes */}
      {showSection(['shoes']) && (
        <div className="space-y-2 pt-2 border-t border-violet-300/15">
          <label className="block text-xs font-semibold uppercase tracking-wider text-amber-200">
            {isVi ? 'Giày & Chân trần (Shoes)' : 'Shoes & Barefoot'}
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {shoeOptions.map((sh) => (
              <button
                key={sh.id}
                type="button"
                onClick={() => update({ shoes: sh.id })}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap truncate ${
                  currentShoes === sh.id
                    ? 'bg-fuchsia-600/35 border-fuchsia-300 text-white'
                    : 'bg-[#120D2A] border-violet-300/15 text-violet-200 hover:border-violet-300/35'
                }`}
              >
                {sh.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Accessory */}
      {showSection(['accessory', 'spirit']) && (
        <div className="space-y-2 pt-2 border-t border-violet-300/15">
          <label className="block text-xs font-semibold uppercase tracking-wider text-amber-200">
            {isVi ? 'Phụ kiện Hoàng gia (Accessory)' : 'Couture Regalia & Accessories'}
          </label>
          <div className="flex flex-wrap gap-1.5">
            {accessories.map((ac) => (
              <button
                key={ac.id}
                type="button"
                onClick={() => update({ accessory: ac.id })}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap ${
                  outfit.accessory === ac.id
                    ? 'bg-amber-500/25 border-amber-300 text-amber-100'
                    : 'bg-[#120D2A] border-violet-300/15 text-violet-200 hover:border-violet-300/35'
                }`}
              >
                {ac.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Fabric & Sparkle */}
      {showSection(['dress', 'tops', 'bottoms', 'coat', 'spirit']) && (
        <div className="space-y-3 pt-2 border-t border-violet-300/15">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-200">
            {isVi ? 'Chất liệu & Hiệu ứng Lấp lánh' : 'Galaxy Fabrics & Shimmer'}
          </h3>

          <div className="flex flex-wrap gap-1.5">
            {fabrics.map((fb) => (
              <button
                key={fb.id}
                type="button"
                onClick={() => update({ fabric: fb.id })}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap ${
                  outfit.fabric === fb.id
                    ? 'bg-cyan-500/25 border-cyan-300 text-cyan-100'
                    : 'bg-[#120D2A] border-violet-300/15 text-violet-200 hover:border-violet-300/35'
                }`}
              >
                {fb.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2">
            <label className="flex flex-col gap-1 text-xs text-violet-300">
              <span>{isVi ? 'Màu chính' : 'Primary'}</span>
              <input
                type="color"
                value={outfit.primaryColor}
                onChange={(e) => update({ primaryColor: e.target.value }, false)}
                className="w-full h-8 rounded cursor-pointer bg-transparent border border-violet-300/25"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-violet-300">
              <span>{isVi ? 'Màu chuyển' : 'Nebula'}</span>
              <input
                type="color"
                value={outfit.secondaryColor}
                onChange={(e) => update({ secondaryColor: e.target.value }, false)}
                className="w-full h-8 rounded cursor-pointer bg-transparent border border-violet-300/25"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-violet-300">
              <span>{isVi ? 'Ánh kim' : 'Accent'}</span>
              <input
                type="color"
                value={outfit.accentColor}
                onChange={(e) => update({ accentColor: e.target.value }, false)}
                className="w-full h-8 rounded cursor-pointer bg-transparent border border-violet-300/25"
              />
            </label>
          </div>

          {/* Quick Swatches */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {GALAXY_SWATCHES.map((sw) => (
              <button
                key={sw.hex}
                type="button"
                title={sw.name}
                onClick={() => update({ primaryColor: sw.hex })}
                className="w-6 h-6 rounded-full border border-white/25 hover:scale-110 transition-transform cursor-pointer"
                style={{ backgroundColor: sw.hex }}
              />
            ))}
          </div>

          <div>
            <div className="flex items-center justify-between text-xs text-violet-200 mb-1">
              <span>{isVi ? 'Cường độ Lấp lánh Thiên hà' : 'Galaxy Sparkle Intensity'}</span>
              <span className="font-mono-data text-amber-200">
                {Math.round(outfit.sparkleIntensity * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={outfit.sparkleIntensity}
              onChange={(e) => update({ sparkleIntensity: parseFloat(e.target.value) }, false)}
              className="w-full cosmic-slider"
            />
          </div>
        </div>
      )}

      {/* Save to Lookbook */}
      <div className="space-y-2.5 pt-2 border-t border-violet-300/15">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-200">
          {isVi ? 'Lưu vào Lookbook Cá nhân' : 'Personal Lookbook'}
        </h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={lookName}
            onChange={(e) => setLookName(e.target.value)}
            placeholder={isVi ? 'Tên thiết kế của bạn...' : 'Name your couture look...'}
            className="flex-1 px-3 py-1.5 rounded-lg bg-[#140F30] border border-violet-300/20 text-xs text-white placeholder:text-violet-400/60 focus:outline-none focus:border-fuchsia-400"
          />
          <button
            type="button"
            onClick={() => {
              onSaveLook(lookName.trim() || `Galaxy Look #${lookbook.length + 1}`);
              setLookName('');
            }}
            className="px-3.5 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-xs font-semibold text-white cursor-pointer whitespace-nowrap"
          >
            {isVi ? 'Lưu mẫu' : 'Save'}
          </button>
        </div>

        {lookbook.length > 0 && (
          <div className="space-y-1.5 max-h-32 overflow-y-auto atelier-scroll pr-1">
            {lookbook.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => onLoadLook(entry)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-[#120D2A] border border-violet-300/15 hover:border-fuchsia-400/50 text-xs text-left cursor-pointer"
              >
                <span className="font-medium text-violet-100 truncate">{entry.name}</span>
                <span className="text-violet-400 shrink-0 ml-2">{entry.createdAt}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
