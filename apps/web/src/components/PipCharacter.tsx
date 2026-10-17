import React from 'react';

export type CharacterMood = 'happy' | 'thinking' | 'cheering' | 'comforting' | 'celebrating';

interface PipCharacterProps {
  mood?: CharacterMood;
  size?: 'sm' | 'md' | 'lg';
  speechBubble?: string;
  onTap?: () => void;
}

export const PipCharacter: React.FC<PipCharacterProps> = ({
  mood = 'happy',
  size = 'md',
  speechBubble,
  onTap
}) => {
  const sizeClasses = {
    sm: 'w-16 h-16 text-3xl',
    md: 'w-24 h-24 text-5xl',
    lg: 'w-36 h-36 text-7xl'
  }[size];

  const moodEmojis: Record<CharacterMood, string> = {
    happy: '🦉',
    thinking: '🧐',
    cheering: '🎉',
    comforting: '🤗',
    celebrating: '👑'
  };

  const moodBadges: Record<CharacterMood, string> = {
    happy: 'Sparkly & Ready!',
    thinking: 'Hmm, let me think...',
    cheering: 'Super Star!',
    comforting: "I'm right here with you",
    celebrating: 'Hooray!'
  };

  return (
    <div className="flex flex-col items-center select-none" onClick={onTap}>
      {speechBubble && (
        <div className="mb-2 max-w-xs bg-white/95 border-2 border-brand-amber/40 text-slate-800 rounded-2xl px-4 py-2 text-sm md:text-base font-semibold shadow-md animate-bounce-slow text-center relative">
          {speechBubble}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-white" />
        </div>
      )}

      <div className="relative group cursor-pointer">
        <div className="absolute -inset-2 bg-gradient-to-r from-amber-300 via-rose-300 to-sky-300 rounded-full blur-md opacity-60 group-hover:opacity-100 transition duration-300 animate-pulse-gentle" />
        <div
          className={`${sizeClasses} relative rounded-full bg-gradient-to-b from-amber-100 to-amber-200 border-4 border-amber-300 flex items-center justify-center shadow-lg transform transition-transform duration-200 active:scale-95 hover:scale-105`}
        >
          <span className="transform transition-transform group-hover:rotate-6">
            {moodEmojis[mood]}
          </span>
        </div>
      </div>

      <div className="mt-1.5 px-2.5 py-0.5 bg-amber-100/90 border border-amber-300 text-amber-900 rounded-full text-xs font-bold shadow-sm">
        Pip • {moodBadges[mood]}
      </div>
    </div>
  );
};
