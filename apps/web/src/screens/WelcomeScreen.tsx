import React, { useState } from 'react';
import { PipCharacter } from '../components/PipCharacter.js';
import { speechService } from '../utils/audio.js';
import { Sparkles, ArrowRight, Volume2, ShieldCheck } from 'lucide-react';
import type { LearningLevel } from '@chatbot/shared';

interface WelcomeScreenProps {
  onStart: (nickname: string, avatar: string, level: LearningLevel) => void;
}

const AVATARS = [
  { id: 'owl', emoji: '🦉', label: 'Pip the Owl' },
  { id: 'lion', emoji: '🦁', label: 'Leo the Lion' },
  { id: 'bunny', emoji: '🐰', label: 'Bella Bunny' },
  { id: 'bear', emoji: '🐻', label: 'Barnaby Bear' },
  { id: 'astronaut', emoji: '🧑‍🚀', label: 'Cosmo Explorer' }
];

const PRESET_NAMES = ['Leo', 'Mia', 'Sam', 'Emma', 'Toby', 'Lily'];

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart }) => {
  const [nickname, setNickname] = useState('Leo');
  const [selectedAvatar, setSelectedAvatar] = useState('owl');
  const [level, setLevel] = useState<LearningLevel>(1);

  const handlePlayGreeting = () => {
    speechService.speak(`Hello little learner! I am Pip! Welcome to English Learning Adventure! Let's play and learn together!`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = nickname.trim() || 'Explorer';
    speechService.speak(`Welcome, ${finalName}! Let's go!`);
    onStart(finalName, selectedAvatar, level);
  };

  return (
    <div className="max-w-xl mx-auto py-6 px-4">
      <div className="card-pastel p-6 sm:p-8 text-center border-4 border-amber-200 shadow-2xl relative overflow-hidden">
        {/* Playful background decoration */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-200/50 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-sky-200/50 rounded-full blur-2xl pointer-events-none" />

        <div className="mb-4">
          <PipCharacter mood="happy" size="lg" speechBubble="Hello little friend! Are you ready to speak English?" />
          <button
            type="button"
            onClick={handlePlayGreeting}
            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold transition shadow-sm"
          >
            <Volume2 className="w-4 h-4 text-amber-700" />
            Listen to Pip
          </button>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-800 tracking-tight mb-2">
          English Learning <span className="text-amber-500">Adventure</span>
        </h1>
        <p className="text-slate-600 text-sm sm:text-base mb-6 font-medium">
          A gentle, playful companion for children under 7 to speak, laugh, and grow!
        </p>

        <form onSubmit={handleSubmit} className="space-y-6 text-left">
          {/* 1. Choose Avatar */}
          <div>
            <label className="block text-slate-700 font-bold text-sm mb-2 text-center">
              Choose your Learning Buddy Avatar:
            </label>
            <div className="flex justify-center gap-2 sm:gap-3 flex-wrap">
              {AVATARS.map(av => (
                <button
                  key={av.id}
                  type="button"
                  onClick={() => setSelectedAvatar(av.id)}
                  className={`flex flex-col items-center p-3 rounded-2xl border-2 transition-all duration-200 ${
                    selectedAvatar === av.id
                      ? 'border-amber-400 bg-amber-100 shadow-md scale-105 ring-2 ring-amber-300'
                      : 'border-slate-200 bg-white/70 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-3xl mb-1">{av.emoji}</span>
                  <span className="text-xs font-bold text-slate-700">{av.label.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Nickname */}
          <div>
            <label className="block text-slate-700 font-bold text-sm mb-2 text-center">
              What should Pip call you?
            </label>
            <div className="flex justify-center gap-1.5 mb-2 flex-wrap">
              {PRESET_NAMES.map(name => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setNickname(name)}
                  className={`px-3 py-1 rounded-full text-xs font-bold border transition ${
                    nickname === name
                      ? 'bg-amber-400 text-slate-900 border-amber-500 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-amber-50'
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              placeholder="Type your name..."
              maxLength={15}
              className="w-full text-center text-lg font-bold py-2.5 px-4 rounded-2xl border-2 border-slate-300 focus:border-amber-400 focus:outline-none bg-white shadow-inner"
            />
          </div>

          {/* 3. Learning Level */}
          <div>
            <label className="block text-slate-700 font-bold text-sm mb-2 text-center">
              Choose Starting Learning Level:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setLevel(1)}
                className={`p-3 rounded-2xl border-2 text-center transition ${
                  level === 1
                    ? 'border-emerald-400 bg-emerald-50 text-emerald-900 font-extrabold shadow-md ring-2 ring-emerald-300'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="text-lg">🌱 Level 1</div>
                <div className="text-xs font-semibold text-slate-500">Ages 3–4</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Colors, Numbers 1-10, Greetings</div>
              </button>

              <button
                type="button"
                onClick={() => setLevel(2)}
                className={`p-3 rounded-2xl border-2 text-center transition ${
                  level === 2
                    ? 'border-sky-400 bg-sky-50 text-sky-900 font-extrabold shadow-md ring-2 ring-sky-300'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="text-lg">🌿 Level 2</div>
                <div className="text-xs font-semibold text-slate-500">Ages 4–5</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Animals, Food, Actions, Fill blanks</div>
              </button>

              <button
                type="button"
                onClick={() => setLevel(3)}
                className={`p-3 rounded-2xl border-2 text-center transition ${
                  level === 3
                    ? 'border-purple-400 bg-purple-50 text-purple-900 font-extrabold shadow-md ring-2 ring-purple-300'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="text-lg">🌳 Level 3</div>
                <div className="text-xs font-semibold text-slate-500">Ages 5–6</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Short Stories, Sequencing, Open Chat</div>
              </button>
            </div>
          </div>

          {/* Big Start Button */}
          <button
            type="submit"
            className="kid-button w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-900 text-lg sm:text-xl font-black shadow-lg flex items-center justify-center gap-2 group"
          >
            <Sparkles className="w-6 h-6 text-slate-900 animate-spin" />
            <span>Start My Learning Adventure!</span>
            <ArrowRight className="w-6 h-6 transition-transform group-hover:translate-x-1" />
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-200/80 flex items-center justify-center gap-2 text-xs text-slate-500 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Child-Safe • No Personal Data Collected • Zero Ads</span>
        </div>
      </div>
    </div>
  );
};
