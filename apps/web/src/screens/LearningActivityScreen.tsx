import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { PipCharacter, type CharacterMood } from '../components/PipCharacter.js';
import { speechService } from '../utils/audio.js';
import { apiClient } from '../api/client.js';
import {
  ArrowLeft,
  Volume2,
  Lightbulb,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  ArrowRight
} from 'lucide-react';
import type { Learner, Activity } from '@chatbot/shared';

interface LearningActivityScreenProps {
  learner: Learner;
  modeType?: 'quiz' | 'sentence_completion' | 'story';
  onBack: () => void;
  onStarsEarned: (count: number) => void;
}

export const LearningActivityScreen: React.FC<LearningActivityScreenProps> = ({
  learner,
  modeType,
  onBack,
  onStarsEarned
}) => {
  const [activity, setActivity] = useState<Activity | null>(null);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [answeredIds, setAnsweredIds] = useState<string[]>([]);
  const [pipMood, setPipMood] = useState<CharacterMood>('happy');

  const loadNextActivity = async () => {
    setIsLoading(true);
    setSelectedChoice(null);
    setIsAnswered(false);
    setIsCorrect(null);
    setFeedbackText('');
    setShowHint(false);
    setPipMood('happy');

    try {
      const act = await apiClient.fetchNextActivity(learner.level, answeredIds, modeType);
      setActivity(act);
      const audioToSpeak = act.promptAudioText || act.question;
      speechService.speak(audioToSpeak);
    } catch {
      // Error loading next activity
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNextActivity();
  }, [learner.level, modeType]);

  const handleSelectChoice = async (choiceText: string) => {
    if (isAnswered || !activity) return;

    setSelectedChoice(choiceText);
    setIsAnswered(true);

    try {
      const result = await apiClient.submitActivityAnswer(
        learner.id,
        activity.id,
        choiceText,
        showHint
      );

      setIsCorrect(result.isCorrect);
      setFeedbackText(result.explanation);
      setAnsweredIds(prev => [...prev, activity.id]);

      if (result.isCorrect) {
        setPipMood('cheering');
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
        speechService.speak(`Super! ${result.explanation}`);
        if (result.starsEarned > 0) {
          onStarsEarned(result.starsEarned);
        }
      } else {
        setPipMood('comforting');
        speechService.speak(`Nice try! ${result.explanation}`);
      }
    } catch {
      // Fallback
    }
  };

  const handleToggleHint = () => {
    setShowHint(true);
    setPipMood('thinking');
    if (activity?.hint) {
      speechService.speak(`Hint: ${activity.hint}`);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center">
        <PipCharacter mood="thinking" size="lg" speechBubble="Getting your next fun question ready..." />
        <div className="mt-4 text-slate-500 font-bold">Loading...</div>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center">
        <PipCharacter mood="celebrating" size="lg" speechBubble="You finished all current exercises! Awesome!" />
        <button
          type="button"
          onClick={onBack}
          className="kid-button mt-6 px-6 py-3 rounded-2xl bg-amber-400 text-slate-900 font-black shadow-md"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-5 px-4">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={onBack}
          className="kid-button inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/80 hover:bg-white text-slate-700 text-xs sm:text-sm font-bold border border-slate-200 shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit Activity</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-xs font-black">
            Level {activity.level} • {activity.skillId.replace(/_/g, ' ').toUpperCase()}
          </span>
        </div>
      </div>

      {/* Main Activity Card */}
      <div className="card-pastel p-6 sm:p-8 border-4 border-amber-200/90 shadow-2xl relative">
        <div className="flex items-center justify-between mb-4">
          <PipCharacter mood={pipMood} size="sm" />
          <button
            type="button"
            onClick={() => speechService.speak(activity.promptAudioText || activity.question)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold transition shadow-xs"
          >
            <Volume2 className="w-4 h-4 text-amber-700" />
            <span>Read Question</span>
          </button>
        </div>

        {/* Story Passage if present (Level 3 stories) */}
        {activity.storyPassage && (
          <div className="mb-5 p-4 rounded-2xl bg-amber-50/80 border-2 border-amber-200/60 text-slate-800 text-sm sm:text-base leading-relaxed font-medium">
            <div className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1 flex items-center gap-1">
              <span>📖 Story Passage</span>
            </div>
            {activity.storyPassage}
          </div>
        )}

        {/* Question Header */}
        <div className="text-center mb-6">
          {activity.emoji && (
            <div className="text-6xl mb-3 animate-bounce-slow">
              {activity.emoji}
            </div>
          )}
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight leading-snug">
            {activity.question}
          </h2>
        </div>

        {/* Answer Choices */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {activity.choices?.map(choice => {
            const isSelected = selectedChoice === choice.text;
            let btnClass = 'border-2 border-slate-200 bg-white hover:bg-amber-50 hover:border-amber-300 text-slate-800';

            if (isAnswered) {
              if (choice.text.toLowerCase() === (activity.correctAnswer || '').toLowerCase()) {
                btnClass = 'border-3 border-emerald-500 bg-emerald-100 text-emerald-950 font-black shadow-md ring-2 ring-emerald-300';
              } else if (isSelected && !isCorrect) {
                btnClass = 'border-3 border-rose-400 bg-rose-50 text-rose-900 font-bold opacity-80';
              } else {
                btnClass = 'border-slate-200 bg-slate-50 text-slate-400 opacity-60';
              }
            }

            return (
              <button
                key={choice.id}
                type="button"
                disabled={isAnswered}
                onClick={() => handleSelectChoice(choice.text)}
                className={`kid-button p-4 sm:p-5 rounded-2xl text-left flex items-center justify-between transition-all duration-200 ${btnClass}`}
              >
                <div className="flex items-center gap-3">
                  {choice.emoji && <span className="text-3xl">{choice.emoji}</span>}
                  <span className="text-base sm:text-lg font-bold">{choice.text}</span>
                </div>
                {isAnswered && choice.text.toLowerCase() === (activity.correctAnswer || '').toLowerCase() && (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Hint Box */}
        {!isAnswered && !showHint && activity.hint && (
          <div className="text-center mb-4">
            <button
              type="button"
              onClick={handleToggleHint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 text-xs font-bold transition"
            >
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <span>Need a Hint?</span>
            </button>
          </div>
        )}

        {showHint && activity.hint && (
          <div className="mb-4 p-3 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs sm:text-sm font-semibold flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <span>{activity.hint}</span>
          </div>
        )}

        {/* Feedback Section */}
        {isAnswered && (
          <div
            className={`p-4 rounded-2xl mb-4 border-2 flex items-start gap-3 ${
              isCorrect
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                : 'bg-rose-50 border-rose-300 text-rose-950'
            }`}
          >
            {isCorrect ? (
              <Sparkles className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
            ) : (
              <HelpCircle className="w-6 h-6 text-rose-500 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <div className="font-extrabold text-base mb-0.5">
                {isCorrect ? '🌟 Super Job!' : "Keep Going, You're Doing Great!"}
              </div>
              <div className="text-sm font-semibold opacity-90">{feedbackText}</div>
            </div>
          </div>
        )}

        {/* Next Question Button */}
        {isAnswered && (
          <button
            type="button"
            onClick={loadNextActivity}
            className="kid-button w-full py-4 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-900 text-lg font-black shadow-lg flex items-center justify-center gap-2"
          >
            <span>Next Fun Question!</span>
            <ArrowRight className="w-6 h-6" />
          </button>
        )}
      </div>
    </div>
  );
};
