import React, { useState, useEffect } from 'react';
import { WelcomeScreen } from './screens/WelcomeScreen.js';
import { DashboardScreen } from './screens/DashboardScreen.js';
import { ChatScreen } from './screens/ChatScreen.js';
import { LearningActivityScreen } from './screens/LearningActivityScreen.js';
import { FeelingsScreen } from './screens/FeelingsScreen.js';
import { ParentDashboardScreen } from './screens/ParentDashboardScreen.js';
import { SettingsScreen } from './screens/SettingsScreen.js';
import { apiClient } from './api/client.js';
import type { Learner, LearningProgress, LearningLevel } from '@chatbot/shared';

type ScreenType = 'welcome' | 'dashboard' | 'learn' | 'play' | 'talk' | 'feelings' | 'parent' | 'settings';

export const App: React.FC = () => {
  const [screen, setScreen] = useState<ScreenType>('welcome');
  const [learner, setLearner] = useState<Learner | null>(null);
  const [progress, setProgress] = useState<LearningProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session from localStorage if exists
  useEffect(() => {
    const savedLearnerId = localStorage.getItem('pip_learner_id');
    if (savedLearnerId) {
      apiClient
        .fetchProgress(savedLearnerId)
        .then(res => {
          setLearner(res.learner);
          setProgress(res.progress);
          setScreen('dashboard');
        })
        .catch(() => {
          // If fetch fails, keep on welcome screen
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  const handleStartLearner = async (nickname: string, avatar: string, level: LearningLevel) => {
    setIsLoading(true);
    try {
      const existingId = localStorage.getItem('pip_learner_id') || undefined;
      const res = await apiClient.startSession(existingId, nickname, avatar, level);
      setLearner(res.learner);
      setProgress(res.progress);
      localStorage.setItem('pip_learner_id', res.learner.id);
      setScreen('dashboard');
    } catch (err) {
      console.error('Session start error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStarsEarned = (newStars: number) => {
    if (progress) {
      setProgress({
        ...progress,
        totalStars: progress.totalStars + newStars
      });
    }
    if (learner) {
      setLearner({
        ...learner,
        stars: learner.stars + newStars
      });
    }
  };

  const handleLevelChanged = (newLevel: LearningLevel) => {
    if (learner) {
      setLearner({ ...learner, level: newLevel });
    }
    if (progress) {
      setProgress({ ...progress, level: newLevel });
    }
  };

  const handleResetProgress = () => {
    if (learner) {
      apiClient.fetchProgress(learner.id).then(res => {
        setProgress(res.progress);
        setScreen('dashboard');
      });
    }
  };

  const handleDataDeleted = () => {
    localStorage.removeItem('pip_learner_id');
    setLearner(null);
    setProgress(null);
    setScreen('welcome');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-6xl mb-3 animate-bounce">🦉</div>
          <div className="text-xl font-black text-slate-800">Starting Pip & Friends...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between">
      <main className="flex-1">
        {screen === 'welcome' && <WelcomeScreen onStart={handleStartLearner} />}

        {screen === 'dashboard' && learner && progress && (
          <DashboardScreen
            learner={learner}
            progress={progress}
            onNavigate={target => setScreen(target)}
          />
        )}

        {screen === 'learn' && learner && (
          <LearningActivityScreen
            learner={learner}
            modeType="quiz"
            onBack={() => setScreen('dashboard')}
            onStarsEarned={handleStarsEarned}
          />
        )}

        {screen === 'play' && learner && (
          <LearningActivityScreen
            learner={learner}
            modeType="sentence_completion"
            onBack={() => setScreen('dashboard')}
            onStarsEarned={handleStarsEarned}
          />
        )}

        {screen === 'talk' && learner && (
          <ChatScreen
            learner={learner}
            onBack={() => setScreen('dashboard')}
            onUpdateStars={handleStarsEarned}
          />
        )}

        {screen === 'feelings' && learner && (
          <FeelingsScreen
            learner={learner}
            onBack={() => setScreen('dashboard')}
            onNavigateToChat={() => setScreen('talk')}
          />
        )}

        {screen === 'parent' && learner && (
          <ParentDashboardScreen
            learnerId={learner.id}
            onBack={() => setScreen('dashboard')}
            onLevelChanged={handleLevelChanged}
          />
        )}

        {screen === 'settings' && learner && (
          <SettingsScreen
            learner={learner}
            onBack={() => setScreen('dashboard')}
            onResetProgress={handleResetProgress}
            onDataDeleted={handleDataDeleted}
          />
        )}
      </main>

      {/* Child-Safe Footer */}
      <footer className="py-3 px-4 text-center text-xs text-slate-400 font-semibold border-t border-slate-200/50 bg-white/40">
        Pip & Friends • English Learning Companion for Children Under 7 • COPPA & Child-Safe
      </footer>
    </div>
  );
};
