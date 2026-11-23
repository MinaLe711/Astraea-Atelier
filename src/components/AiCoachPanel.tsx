import React, { useEffect, useRef, useState } from 'react';
import { CoachMessage, Language } from '../types/atelier';

interface AiCoachPanelProps {
  language: Language;
  messages: CoachMessage[];
  loading: boolean;
  error: string | null;
  onSendMessage: (text: string) => void;
}

export const AiCoachPanel: React.FC<AiCoachPanelProps> = ({
  language,
  messages,
  loading,
  error,
  onSendMessage,
}) => {
  const isVi = language === 'vi';
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const quickPrompts = isVi
    ? [
        'Nhận xét bộ đồ 3D mình đang thiết kế để lên Runway',
        'Cách đi catwalk thẳng lưng và đánh hông sang trọng?',
        'Thực đơn & bài tập siết eo thon gọn trong 14 ngày',
        'Cách ứng xử tự tin khi phỏng vấn thảm đỏ?',
      ]
    : [
        'Critique my current 3D outfit for Runway readiness',
        'How to master the heel-to-toe supermodel catwalk?',
        'Give me a 14-day waist-cinching & posture plan',
        'How should I answer red-carpet press interviews?',
      ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || loading) return;
    setInput('');
    onSendMessage(trimmed);
  };

  return (
    <div className="flex flex-col h-[500px] max-h-[68vh] text-sm">
      <div className="pb-3 border-b border-violet-300/15">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-200">
          Astraea Celestia · {isVi ? 'Nhà Thiết kế & Siêu mẫu Mentor' : 'Supermodel & Couture Coach'}
        </h3>
        <p className="text-xs text-violet-300/80 mt-0.5">
          {isVi
            ? 'Hướng dẫn từ nhập môn tới chuyên nghiệp: thiết kế, vóc dáng, catwalk & thần thái.'
            : 'Personal mentorship from beginner to pro: couture craft, body sculpting, catwalk & poise.'}
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto atelier-scroll py-3 space-y-3 pr-1">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`p-3 rounded-xl text-xs leading-relaxed whitespace-pre-wrap ${
              msg.role === 'user'
                ? 'ml-6 bg-violet-600/35 border border-violet-300/25 text-white'
                : 'mr-4 bg-[#140F32] border border-amber-300/20 text-violet-100'
            }`}
          >
            <div className="text-[11px] font-semibold mb-1 text-amber-200/90">
              {msg.role === 'user' ? (isVi ? 'Bạn' : 'You') : 'Coach Astraea'} · {msg.timestamp}
            </div>
            {msg.text}
          </div>
        ))}

        {loading && (
          <div className="mr-4 p-3 rounded-xl bg-[#140F32] border border-violet-300/15 text-xs text-violet-300">
            {isVi ? 'Coach Astraea đang phân tích và soạn lời khuyên...' : 'Coach Astraea is composing guidance...'}
          </div>
        )}

        {error && (
          <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-400/35 text-xs text-rose-200">
            {error}
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Quick Prompts */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 atelier-scroll">
        {quickPrompts.map((qp) => (
          <button
            key={qp}
            type="button"
            disabled={loading}
            onClick={() => onSendMessage(qp)}
            className="px-2.5 py-1.5 rounded-lg bg-[#151033] border border-violet-300/20 hover:border-fuchsia-400/50 text-[11px] text-violet-200 whitespace-nowrap shrink-0 cursor-pointer"
          >
            {qp}
          </button>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2 pt-2 border-t border-violet-300/15">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            isVi
              ? 'Hỏi Astraea về thiết kế, giảm mỡ, catwalk, ứng xử...'
              : 'Ask Astraea about design, workouts, catwalk, etiquette...'
          }
          className="flex-1 px-3 py-2 rounded-xl bg-[#120D2A] border border-violet-300/25 text-xs text-white placeholder:text-violet-400/60 focus:outline-none focus:border-fuchsia-400"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-xs font-semibold text-white disabled:opacity-45 cursor-pointer shrink-0"
        >
          {isVi ? 'Gửi' : 'Send'}
        </button>
      </form>
    </div>
  );
};
