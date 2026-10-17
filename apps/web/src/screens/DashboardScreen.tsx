import React, { useState } from 'react';
import { PipCharacter } from '../components/PipCharacter.js';
import { speechService } from '../utils/audio.js';
import {
  BookOpen,
  Gamepad2,
  MessageCircle,
  Heart,
  Star,
  Flame,
  Award,
  Volume2,
  VolumeX,
  Lock,
  Settings
} from 'lucide-react';
import type { Learner, LearningProgress } from '@chatbot/shared';

interface DashboardScreenProps {
  learner: Learner;
  progress: LearningProgress;
  onNavigate: (screen: 'learn' | 'play' | 'talk' | 'feelings' | 'parent' | 'settings') => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  learner,
  progress,
  onNavigate
}) => {
  const [muted, setMuted] = useState(speechService.getMuted());
  const [showParentModal, setShowParentModal] = useState(false);
  const [parentAnswer, setParentAnswer] = useState('');
  const [parentError, setParentError] = useState(false);

  const toggleSound = () => {
    const isNowMuted = speechService.toggleMute();
    setMuted(isNowMuted);
    if (!isNowMuted) {
      speechService.speak('Sound is on!');
    }
  };

  const handleParentGateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parentAnswer.trim() === '7' || parentAnswer.trim().toLowerCase() === 'seven') {
      setShowParentModal(false);
      setParentAnswer('');
      setParentError(false);
      onNavigate('parent');
    } else {
      setParentError(true);
    }
  };

  const levelDescriptions = {
    1: 'Level 1: Foundations (Colors, Numbers 1-10, Greetings)',
    2: 'Level 2: Growing Skills (Animals, Food, Weather, Actions)',
    3: 'Level 3: Confident Conversations (Stories, Sequencing, Dialogue)'
  };

  const accuracy =
    progress.totalAttempts > 0
      ? Math.round((progress.totalCorrect / progress.totalAttempts) * 100)
      : 100;

  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      {/* Top Header Navigation Bar */}
      <div className="flex items-center justify-between mb-6 bg-white/70 backdrop-blur-md p-3.5 px-5 rounded-3xl border border-white/80 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-200 to-amber-300 border-2 border-amber-400 flex items-center justify-center text-2xl shadow-sm">
            {learner.avatar === 'owl' ? '🦉' : learner.avatar === 'lion' ? '🦁' : learner.avatar === 'bunny' ? '🐰' : learner.avatar === 'bear' ? '🐻' : '🧑‍🚀'}
          </div>
          <div>
            <h2 className="font-extrabold text-slate-800 text-lg sm:text-xl flex items-center gap-1.5">
              <span>{learner.nickname}</span>
              <span className="text-xs bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full font-bold">
                Level {progress.level}
              </span>
            </h2>
            <div className="text-xs font-semibold text-slate-500">
              {levelDescriptions[progress.level]}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleSound}
            className="p-2.5 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition shadow-sm"
            title={muted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {muted ? <VolumeX className="w-5 h-5 text-rose-500" /> : <Volume2 className="w-5 h-5 text-emerald-600" />}
          </button>

          <button
            type="button"
            onClick={() => onNavigate('settings')}
            className="p-2.5 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition shadow-sm"
            title="Settings & Privacy"
          >
            <Settings className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() => setShowParentModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-800 text-xs sm:text-sm font-bold transition shadow-sm"
          >
            <Lock className="w-4 h-4 text-indigo-600" />
            <span className="hidden sm:inline">Parent Area</span>
          </button>
        </div>
      </div>

      {/* Progress & Stats Bar */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="card-pastel p-4 text-center border border-amber-200 flex flex-col items-center justify-center">
          <div className="flex items-center gap-1 text-amber-500 text-2xl font-black mb-1">
            <Star className="w-6 h-6 fill-amber-400 text-amber-500 animate-wiggle" />
            <span>{progress.totalStars}</span>
          </div>
          <div className="text-xs font-extrabold text-slate-600 uppercase tracking-wide">
            Stars Earned
          </div>
        </div>

        <div className="card-pastel p-4 text-center border border-rose-200 flex flex-col items-center justify-center">
          <div className="flex items-center gap-1 text-rose-500 text-2xl font-black mb-1">
            <Flame className="w-6 h-6 fill-rose-400 text-rose-500" />
            <span>{progress.streakDays} Day</span>
          </div>
          <div className="text-xs font-extrabold text-slate-600 uppercase tracking-wide">
            Streak
          </div>
        </div>

        <div className="card-pastel p-4 text-center border border-emerald-200 flex flex-col items-center justify-center">
          <div className="flex items-center gap-1 text-emerald-600 text-2xl font-black mb-1">
            <Award className="w-6 h-6 text-emerald-500" />
            <span>{accuracy}%</span>
          </div>
          <div className="text-xs font-extrabold text-slate-600 uppercase tracking-wide">
            Accuracy
          </div>
        </div>
      </div>

      {/* Center Character Greeting */}
      <div className="mb-8 text-center">
        <PipCharacter
          mood="happy"
          size="lg"
          speechBubble={`What fun activity shall we do today, ${learner.nickname}?`}
          onTap={() => speechService.speak(`Hi ${learner.nickname}! Tap any card to begin!`)}
        />
      </div>

      {/* 4 Big Child-Friendly Mode Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {/* 1. LEARN CARD */}
        <button
          type="button"
          onClick={() => {
            speechService.speak("Let's Learn English!");
            onNavigate('learn');
          }}
          className="kid-button card-pastel p-6 sm:p-7 text-left border-3 border-amber-300 hover:border-amber-400 bg-gradient-to-br from-amber-50 to-orange-50 relative overflow-hidden group"
        >
          <div className="absolute top-4 right-4 text-4xl transform group-hover:scale-125 transition-transform">
            🎓
          </div>
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-400 text-slate-900 mb-3 shadow-md">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-2xl font-black text-slate-800 mb-1">Learn</h3>
          <p className="text-slate-600 text-sm font-semibold">
            Interactive vocabulary quizzes with picture clues and shiny stars!
          </p>
          <div className="mt-4 text-xs font-extrabold text-amber-700 bg-amber-200/80 px-3 py-1 rounded-full inline-block">
            Level {progress.level} Practice
          </div>
        </button>

        {/* 2. PLAY CARD */}
        <button
          type="button"
          onClick={() => {
            speechService.speak("Let's Play sentence puzzles!");
            onNavigate('play');
          }}
          className="kid-button card-pastel p-6 sm:p-7 text-left border-3 border-sky-300 hover:border-sky-400 bg-gradient-to-br from-sky-50 to-blue-50 relative overflow-hidden group"
        >
          <div className="absolute top-4 right-4 text-4xl transform group-hover:scale-125 transition-transform">
            🎮
          </div>
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-sky-400 text-slate-900 mb-3 shadow-md">
            <Gamepad2 className="w-6 h-6" />
          </div>
          <h3 className="text-2xl font-black text-slate-800 mb-1">Play</h3>
          <p className="text-slate-600 text-sm font-semibold">
            Fill-in-the-blank fun and mini reading stories with Pip!
          </p>
          <div className="mt-4 text-xs font-extrabold text-sky-700 bg-sky-200/80 px-3 py-1 rounded-full inline-block">
            Sentence Games
          </div>
        </button>

        {/* 3. TALK CARD */}
        <button
          type="button"
          onClick={() => {
            speechService.speak("Let's Talk! Tell me anything!");
            onNavigate('talk');
          }}
          className="kid-button card-pastel p-6 sm:p-7 text-left border-3 border-emerald-300 hover:border-emerald-400 bg-gradient-to-br from-emerald-50 to-teal-50 relative overflow-hidden group"
        >
          <div className="absolute top-4 right-4 text-4xl transform group-hover:scale-125 transition-transform">
            💬
          </div>
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-400 text-slate-900 mb-3 shadow-md">
            <MessageCircle className="w-6 h-6" />
          </div>
          <h3 className="text-2xl font-black text-slate-800 mb-1">Talk</h3>
          <p className="text-slate-600 text-sm font-semibold">
            Have friendly conversations with Pip. Ask questions and speak aloud!
          </p>
          <div className="mt-4 text-xs font-extrabold text-emerald-700 bg-emerald-200/80 px-3 py-1 rounded-full inline-block">
            Voice & Chat Companion
          </div>
        </button>

        {/* 4. FEELINGS CARD (SEL) */}
        <button
          type="button"
          onClick={() => {
            speechService.speak("How are you feeling today?");
            onNavigate('feelings');
          }}
          className="kid-button card-pastel p-6 sm:p-7 text-left border-3 border-pink-300 hover:border-pink-400 bg-gradient-to-br from-pink-50 to-rose-50 relative overflow-hidden group"
        >
          <div className="absolute top-4 right-4 text-4xl transform group-hover:scale-125 transition-transform">
            💖
          </div>
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-pink-400 text-slate-900 mb-3 shadow-md">
            <Heart className="w-6 h-6" />
          </div>
          <h3 className="text-2xl font-black text-slate-800 mb-1">Feelings</h3>
          <p className="text-slate-600 text-sm font-semibold">
            Check in with your emotions, take calming breaths, and get gentle support.
          </p>
          <div className="mt-4 text-xs font-extrabold text-pink-700 bg-pink-200/80 px-3 py-1 rounded-full inline-block">
            Emotional Awareness
          </div>
        </button>
      </div>

      {/* Adult Gatekeeper Modal */}
      {showParentModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border-4 border-indigo-200">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center mx-auto mb-3">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-center text-slate-800 mb-1">Grown-Ups Gatekeeper</h3>
            <p className="text-sm text-slate-600 text-center mb-4">
              To verify an adult is accessing the dashboard, please solve:
            </p>
            <div className="bg-indigo-50 border-2 border-indigo-200 rounded-2xl p-4 text-center text-2xl font-black text-indigo-900 mb-4">
              What is 4 + 3 ?
            </div>

            <form onSubmit={handleParentGateSubmit} className="space-y-4">
              <input
                type="text"
                value={parentAnswer}
                onChange={e => setParentAnswer(e.target.value)}
                placeholder="Enter answer (e.g. 7)"
                className="w-full text-center text-lg font-bold py-2.5 px-4 rounded-xl border-2 border-slate-300 focus:border-indigo-500 focus:outline-none"
                autoFocus
              />
              {parentError && (
                <div className="text-rose-500 text-xs font-bold text-center">
                  Incorrect answer. Please try again.
                </div>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowParentModal(false);
                    setParentAnswer('');
                    setParentError(false);
                  }}
                  className="w-1/2 py-2.5 rounded-xl border-2 border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition shadow-md"
                >
                  Verify & Enter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
