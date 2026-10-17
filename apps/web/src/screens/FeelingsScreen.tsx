import React, { useState } from 'react';
import { PipCharacter, type CharacterMood } from '../components/PipCharacter.js';
import { speechService } from '../utils/audio.js';
import { apiClient } from '../api/client.js';
import {
  ArrowLeft,
  Volume2,
  Heart,
  Wind,
  Smile,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { SEL_EMOTIONS, type Learner } from '@chatbot/shared';

interface FeelingsScreenProps {
  learner: Learner;
  onBack: () => void;
  onNavigateToChat: () => void;
}

export const FeelingsScreen: React.FC<FeelingsScreenProps> = ({
  onBack,
  onNavigateToChat
}) => {
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const [responseMessage, setResponseMessage] = useState<string>('');
  const [isBreathing, setIsBreathing] = useState(false);
  const [pipMood, setPipMood] = useState<CharacterMood>('happy');

  const handleSelectEmotion = async (emotionId: string, label: string) => {
    setSelectedEmotion(emotionId);

    // Adjust Pip mood
    if (emotionId === 'sad' || emotionId === 'angry' || emotionId === 'scared') {
      setPipMood('comforting');
    } else if (emotionId === 'excited' || emotionId === 'happy') {
      setPipMood('cheering');
    } else {
      setPipMood('thinking');
    }

    try {
      const res = await apiClient.submitSelCheckin(emotionId);
      setResponseMessage(res.response);
      speechService.speak(res.response);
    } catch {
      const fallback = `Thank you for sharing that you are feeling ${label}. I'm right here with you!`;
      setResponseMessage(fallback);
      speechService.speak(fallback);
    }
  };

  const handleStartBreathing = () => {
    setIsBreathing(true);
    speechService.speak("Let's take a calm breath together. Breathe in slowly... and gently breathe out.");
  };

  return (
    <div className="max-w-2xl mx-auto py-5 px-4">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={onBack}
          className="kid-button inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/80 hover:bg-white text-slate-700 text-xs sm:text-sm font-bold border border-slate-200 shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Dashboard</span>
        </button>

        <div className="flex items-center gap-1.5 text-xs font-bold text-pink-700 bg-pink-100 px-3 py-1 rounded-full border border-pink-200">
          <Heart className="w-3.5 h-3.5 fill-pink-500 text-pink-600" />
          <span>Feelings & Heart Care</span>
        </div>
      </div>

      {/* Main SEL Card */}
      <div className="card-pastel p-6 sm:p-8 border-4 border-pink-200/90 shadow-2xl relative">
        <div className="text-center mb-6">
          <PipCharacter mood={pipMood} size="md" speechBubble="How is your heart feeling today, friend?" />
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight mt-3">
            How are you feeling right now?
          </h2>
          <p className="text-slate-600 text-sm font-medium mt-1">
            Every feeling is okay to feel. Tap your emotion to talk to Pip.
          </p>
        </div>

        {/* Emotion Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {SEL_EMOTIONS.map(em => {
            const isSelected = selectedEmotion === em.id;
            return (
              <button
                key={em.id}
                type="button"
                onClick={() => handleSelectEmotion(em.id, em.label)}
                style={{ backgroundColor: isSelected ? em.color : undefined }}
                className={`kid-button p-4 rounded-2xl flex flex-col items-center justify-center transition-all duration-200 border-2 ${
                  isSelected
                    ? 'border-slate-800 shadow-lg scale-105 ring-3 ring-pink-300'
                    : 'border-slate-200 bg-white/80 hover:bg-slate-50'
                }`}
              >
                <span className="text-4xl mb-1">{em.emoji}</span>
                <span className="text-sm font-black text-slate-800">{em.label}</span>
              </button>
            );
          })}
        </div>

        {/* Response Box */}
        {responseMessage && (
          <div className="p-5 rounded-2xl bg-white/95 border-2 border-pink-200 shadow-md mb-6 animate-pulse-gentle">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <Smile className="w-5 h-5 text-pink-500" />
                <span className="text-xs font-black text-pink-900 uppercase tracking-wider">Pip says:</span>
              </div>
              <button
                type="button"
                onClick={() => speechService.speak(responseMessage)}
                className="p-1 rounded-full hover:bg-pink-50 text-pink-700 transition"
                title="Listen to Pip"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>
            <p className="text-slate-800 text-base sm:text-lg leading-relaxed font-semibold">
              {responseMessage}
            </p>

            {/* Quick action buttons */}
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleStartBreathing}
                className="kid-button inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-100 hover:bg-sky-200 text-sky-900 text-xs sm:text-sm font-bold transition"
              >
                <Wind className="w-4 h-4 text-sky-600" />
                <span>Calming Breath Exercise</span>
              </button>

              <button
                type="button"
                onClick={onNavigateToChat}
                className="kid-button inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-pink-100 hover:bg-pink-200 text-pink-900 text-xs sm:text-sm font-bold transition"
              >
                <Sparkles className="w-4 h-4 text-pink-600" />
                <span>Chat with Pip</span>
              </button>
            </div>
          </div>
        )}

        {/* Breathing Animation Modal / Overlay */}
        {isBreathing && (
          <div className="p-6 rounded-2xl bg-gradient-to-b from-sky-50 to-blue-100 border-2 border-sky-300 text-center mb-6 shadow-inner">
            <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-sky-400 to-indigo-400 text-white flex items-center justify-center text-3xl shadow-lg animate-pulse-gentle mb-3">
              🎈
            </div>
            <h4 className="text-lg font-black text-sky-950 mb-1">Breathe In... and Breathe Out...</h4>
            <p className="text-xs font-semibold text-sky-800 mb-3">
              Watch the gentle balloon expand and contract. You are safe and doing great!
            </p>
            <button
              type="button"
              onClick={() => setIsBreathing(false)}
              className="px-4 py-1.5 rounded-full bg-white text-sky-900 text-xs font-bold shadow-xs hover:bg-sky-50"
            >
              I feel better now!
            </button>
          </div>
        )}

        <div className="text-center">
          <button
            type="button"
            onClick={onBack}
            className="kid-button inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition"
          >
            <span>Back to Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
