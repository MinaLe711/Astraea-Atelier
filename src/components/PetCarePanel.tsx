import React from 'react';
import { Language, PetAccessory, PetReaction, PetSpecies, PetState } from '../types/atelier';

interface PetCarePanelProps {
  language: Language;
  pet: PetState;
  onUpdatePet: (next: PetState) => void;
  onCareAction: (reaction: PetReaction, label: string, colorHex: string) => void;
}

export const PetCarePanel: React.FC<PetCarePanelProps> = ({
  language,
  pet,
  onUpdatePet,
  onCareAction,
}) => {
  const isVi = language === 'vi';

  const speciesList: Array<{ id: PetSpecies; label: string }> = [
    { id: 'nebula-cat', label: isVi ? 'Mèo Tinh Vân' : 'Nebula Cat' },
    { id: 'astral-fox', label: isVi ? 'Cáo Ánh Sao' : 'Astral Fox' },
    { id: 'starlight-bunny', label: isVi ? 'Thỏ Ngân Hà' : 'Starlight Bunny' },
  ];

  const accessories: Array<{ id: PetAccessory; label: string }> = [
    { id: 'none', label: isVi ? 'Tự nhiên' : 'Natural' },
    { id: 'star-collar', label: isVi ? 'Vòng Cổ Sao' : 'Star Collar' },
    { id: 'galaxy-bow', label: isVi ? 'Nơ Thiên Hà' : 'Galaxy Bow' },
    { id: 'celestial-halo', label: isVi ? 'Vòng Hào Quang' : 'Celestial Halo' },
    { id: 'angel-wings', label: isVi ? 'Cánh Thiên Thần' : 'Angel Wings' },
  ];

  const coatColors = ['#A78BFA', '#F472B6', '#38BDF8', '#FDE68A', '#E2E8F0', '#312E81'];

  const careButtons: Array<{
    reaction: PetReaction;
    label: string;
    desc: string;
    color: string;
  }> = [
    {
      reaction: 'feed',
      label: isVi ? 'Cho ăn Macaron Sao' : 'Feed Star Macaron',
      desc: '+18 Energy · +8 XP',
      color: '#FDE68A',
    },
    {
      reaction: 'groom',
      label: isVi ? 'Chải lông Bụi Sao' : 'Brush Stardust',
      desc: '+16 Glamour · +10 XP',
      color: '#F0ABFC',
    },
    {
      reaction: 'bath',
      label: isVi ? 'Tắm Bong bóng Ngân hà' : 'Cosmic Bubble Spa',
      desc: '+20 Glamour · +12 XP',
      color: '#67E8F9',
    },
    {
      reaction: 'play',
      label: isVi ? 'Nhảy Xoay Lấp lánh' : 'Sparkle Flip Play',
      desc: '+18 Affection · +15 XP',
      color: '#C084FC',
    },
    {
      reaction: 'love',
      label: isVi ? 'Ôm & Truyền Yêu thương' : 'Cosmic Cuddle',
      desc: '+22 Affection · +12 XP',
      color: '#F472B6',
    },
  ];

  return (
    <div className="space-y-4 text-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-200">
            {isVi ? 'Chăm sóc Thú cưng Thiên hà' : 'Cosmic Fashion Pet Care'}
          </h3>
          <p className="text-xs text-violet-300/80 mt-0.5">
            {pet.name} · Lv.{pet.level} · {pet.lastActionLabel}
          </p>
        </div>
      </div>

      {/* Live Pet Status Bars (tabular-nums) */}
      <div className="p-3.5 rounded-xl bg-[#130E2E] border border-violet-300/15 space-y-2.5">
        {[
          { label: isVi ? 'Thân mật' : 'Affection', val: pet.affection, color: 'bg-fuchsia-400' },
          { label: isVi ? 'Năng lượng' : 'Energy', val: pet.energy, color: 'bg-amber-300' },
          { label: isVi ? 'Độ Lộng lẫy' : 'Glamour', val: pet.glamour, color: 'bg-cyan-300' },
        ].map((stat) => (
          <div key={stat.label}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-violet-200">{stat.label}</span>
              <span className="font-mono-data text-violet-100">{stat.val}/100</span>
            </div>
            <div className="h-1.5 rounded-full bg-violet-950 overflow-hidden">
              <div
                className={`h-full ${stat.color} transition-all duration-300`}
                style={{ width: `${stat.val}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Care Actions with Burst Effects */}
      <div className="space-y-1.5">
        <span className="block text-xs text-violet-300">
          {isVi ? 'Tương tác & Hiệu ứng 3D' : 'Interactive Care Effects'}
        </span>
        <div className="grid grid-cols-1 gap-1.5">
          {careButtons.map((btn) => (
            <button
              key={btn.reaction}
              type="button"
              onClick={() => onCareAction(btn.reaction, btn.label, btn.color)}
              className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#161036] border border-violet-300/20 hover:border-fuchsia-400/60 text-left transition-colors cursor-pointer"
            >
              <span className="text-xs font-semibold text-white">{btn.label}</span>
              <span className="text-[11px] font-mono-data text-amber-200/90">{btn.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Species & Fashion Customization */}
      <div className="space-y-3 pt-2 border-t border-violet-300/15">
        <div>
          <label className="block text-xs text-violet-300 mb-1.5">
            {isVi ? 'Chọn Loài Thú cưng Vũ trụ' : 'Cosmic Species'}
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {speciesList.map((sp) => (
              <button
                key={sp.id}
                type="button"
                onClick={() => onUpdatePet({ ...pet, species: sp.id })}
                className={`px-2 py-1.5 rounded-md text-xs font-medium border cursor-pointer truncate ${
                  pet.species === sp.id
                    ? 'bg-fuchsia-600/35 border-fuchsia-300 text-white'
                    : 'bg-[#120D2A] border-violet-300/15 text-violet-200'
                }`}
              >
                {sp.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs text-violet-300 mb-1.5">
            {isVi ? 'Phụ kiện Thời trang cho Pet' : 'Pet Couture Accessories'}
          </label>
          <div className="flex flex-wrap gap-1.5">
            {accessories.map((ac) => (
              <button
                key={ac.id}
                type="button"
                onClick={() => {
                  onUpdatePet({ ...pet, accessory: ac.id });
                  onCareAction('groom', ac.label, '#FDE68A');
                }}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium border cursor-pointer ${
                  pet.accessory === ac.id
                    ? 'bg-amber-500/25 border-amber-300 text-amber-100'
                    : 'bg-[#120D2A] border-violet-300/15 text-violet-200'
                }`}
              >
                {ac.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs text-violet-300 mb-1.5">
            {isVi ? 'Màu lông Tinh vân' : 'Nebula Coat Tone'}
          </label>
          <div className="flex items-center gap-2">
            {coatColors.map((hex) => (
              <button
                key={hex}
                type="button"
                onClick={() => onUpdatePet({ ...pet, coatColor: hex })}
                className={`w-6 h-6 rounded-full border cursor-pointer ${
                  pet.coatColor === hex ? 'border-white scale-110' : 'border-white/25'
                }`}
                style={{ backgroundColor: hex }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
