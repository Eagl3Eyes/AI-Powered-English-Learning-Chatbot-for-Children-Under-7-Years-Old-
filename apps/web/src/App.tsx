import React, { useState, useEffect, Component, type ErrorInfo, type ReactNode } from 'react';
import { WelcomeScreen } from './screens/WelcomeScreen.js';
import { DashboardScreen } from './screens/DashboardScreen.js';
import { ChatScreen } from './screens/ChatScreen.js';
import { LearningActivityScreen } from './screens/LearningActivityScreen.js';
import { FeelingsScreen } from './screens/FeelingsScreen.js';
import { ParentDashboardScreen } from './screens/ParentDashboardScreen.js';
import { SettingsScreen } from './screens/SettingsScreen.js';
import { apiClient } from './api/client.js';
import type { Learner, LearningProgress, LearningLevel } from '@chatbot/shared';

// Error Boundary to prevent blank screens on unhandled client exceptions
interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, errorMessage: error?.message || 'Unexpected error' };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Client ErrorBoundary caught:', error, errorInfo);
  }

  handleReset = () => {
    localStorage.clear();
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-amber-50 to-orange-100 text-slate-800 font-comic">
          <div className="card-pastel p-8 max-w-md text-center border-4 border-amber-300 shadow-xl">
            <div className="text-6xl mb-3 animate-bounce">🦉</div>
            <h2 className="text-2xl font-black text-slate-800 mb-2">Oops! Pip Stumbled!</h2>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              Pip bumped into a tiny pebble! Let's shake our feathers and restart our fun adventure together.
            </p>
            <button
              type="button"
              onClick={this.handleReset}
              className="px-6 py-3 bg-amber-400 hover:bg-amber-500 text-slate-900 font-black rounded-2xl shadow-md transition transform active:scale-95"
            >
              Restart Adventure ✨
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

type ScreenType = 'welcome' | 'dashboard' | 'learn' | 'play' | 'talk' | 'feelings' | 'parent' | 'settings';

export const AppContent: React.FC = () => {
  const [screen, setScreen] = useState<ScreenType>('welcome');
  const [learner, setLearner] = useState<Learner | null>(null);
  const [progress, setProgress] = useState<LearningProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session safely from localStorage if exists
  useEffect(() => {
    const savedLearnerId = localStorage.getItem('pip_learner_id');
    if (savedLearnerId) {
      apiClient
        .fetchProgress(savedLearnerId)
        .then(res => {
          if (res && res.learner && res.progress) {
            setLearner(res.learner);
            setProgress(res.progress);
            setScreen('dashboard');
          } else {
            localStorage.removeItem('pip_learner_id');
            setScreen('welcome');
          }
        })
        .catch(() => {
          // If fetch fails or learner is not found, safely default to welcome screen
          localStorage.removeItem('pip_learner_id');
          setScreen('welcome');
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setScreen('welcome');
      setIsLoading(false);
    }
  }, []);

  const handleStartLearner = async (nickname: string, avatar: string, level: LearningLevel) => {
    setIsLoading(true);
    try {
      const existingId = localStorage.getItem('pip_learner_id') || undefined;
      const res = await apiClient.startSession(existingId, nickname, avatar, level);
      if (res && res.learner && res.progress) {
        setLearner(res.learner);
        setProgress(res.progress);
        localStorage.setItem('pip_learner_id', res.learner.id);
        setScreen('dashboard');
      } else {
        setScreen('welcome');
      }
    } catch (err) {
      console.error('Session start error:', err);
      setScreen('welcome');
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
        if (res && res.progress) {
          setProgress(res.progress);
        }
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
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-pink-50 to-amber-50">
        <div className="text-center">
          <div className="text-6xl mb-3 animate-bounce">🦉</div>
          <div className="text-xl font-black text-slate-800">Starting Pip & Friends...</div>
          <div className="text-xs text-slate-500 font-semibold mt-1">Ready for an English adventure!</div>
        </div>
      </div>
    );
  }

  // Fallback: If learner/progress is missing, always render WelcomeScreen
  const isLearnerReady = Boolean(learner && progress);

  return (
    <div className="min-h-screen flex flex-col justify-between">
      <main className="flex-1">
        {(!isLearnerReady || screen === 'welcome') && (
          <WelcomeScreen onStart={handleStartLearner} />
        )}

        {isLearnerReady && screen === 'dashboard' && learner && progress && (
          <DashboardScreen
            learner={learner}
            progress={progress}
            onNavigate={target => setScreen(target)}
          />
        )}

        {isLearnerReady && screen === 'learn' && learner && (
          <LearningActivityScreen
            learner={learner}
            modeType="quiz"
            onBack={() => setScreen('dashboard')}
            onStarsEarned={handleStarsEarned}
          />
        )}

        {isLearnerReady && screen === 'play' && learner && (
          <LearningActivityScreen
            learner={learner}
            modeType="sentence_completion"
            onBack={() => setScreen('dashboard')}
            onStarsEarned={handleStarsEarned}
          />
        )}

        {isLearnerReady && screen === 'talk' && learner && (
          <ChatScreen
            learner={learner}
            onBack={() => setScreen('dashboard')}
            onUpdateStars={handleStarsEarned}
          />
        )}

        {isLearnerReady && screen === 'feelings' && learner && (
          <FeelingsScreen
            learner={learner}
            onBack={() => setScreen('dashboard')}
            onNavigateToChat={() => setScreen('talk')}
          />
        )}

        {isLearnerReady && screen === 'parent' && learner && (
          <ParentDashboardScreen
            learnerId={learner.id}
            onBack={() => setScreen('dashboard')}
            onLevelChanged={handleLevelChanged}
          />
        )}

        {isLearnerReady && screen === 'settings' && learner && (
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

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
};
