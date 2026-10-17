export type LearningLevel = 1 | 2 | 3;

export type InteractionMode = 'LEARNING' | 'CONVERSATION' | 'ENGAGEMENT' | 'SUPPORT' | 'IDLE';

export type ActivityType = 'vocab' | 'quiz' | 'sentence_completion' | 'story' | 'sel_checkin';

export interface SkillDefinition {
  id: string;
  level: LearningLevel;
  name: string;
  description: string;
  prerequisites: string[];
  masteryThreshold: number;
}

export interface LearnerPreferences {
  audioAutoPlay: boolean;
  theme: 'playful' | 'calm';
  favoriteTopics: string[];
}

export interface Learner {
  id: string;
  nickname: string;
  avatar: string; // 'owl' | 'lion' | 'bunny' | 'bear' | 'astronaut'
  level: LearningLevel;
  createdAt: string;
  stars: number;
  badges: string[];
  preferences: LearnerPreferences;
}

export interface SkillProgress {
  skillId: string;
  skillName: string;
  level: LearningLevel;
  attempts: number;
  correct: number;
  mastered: boolean;
  masteryScore?: number; // Exponentially weighted mastery estimate (0.0 - 1.0)
  lastPracticed: string;
  consecutiveSuccess?: number;
}

export interface LearningProgress {
  learnerId: string;
  level: LearningLevel;
  skills: Record<string, SkillProgress>;
  totalStars: number;
  totalAttempts: number;
  totalCorrect: number;
  streakDays: number;
  lastSessionDate: string;
  recommendedNextActivity?: string;
  sessionsCount: number;
}

export interface ActivityChoice {
  id: string;
  text: string;
  emoji?: string;
}

export interface Activity {
  id: string;
  title: string;
  type: ActivityType;
  level: LearningLevel;
  skillId: string;
  question: string;
  promptAudioText?: string;
  choices?: ActivityChoice[];
  correctAnswer?: string;
  explanation: string;
  hint?: string;
  emoji?: string;
  storyPassage?: string;
  difficulty?: number; // 1 (easy) to 3 (challenging)
}

export interface ActivityAttempt {
  id: string;
  learnerId: string;
  activityId: string;
  submittedAnswer: string;
  isCorrect: boolean;
  usedHint: boolean;
  timestamp: string;
  latencyMs?: number;
}

export interface SessionContext {
  id: string;
  learnerId: string;
  startedAt: string;
  lastActiveAt: string;
  currentMode: InteractionMode;
  currentActivityId?: string;
  recentTurns: Array<{
    sender: 'child' | 'companion';
    text: string;
    timestamp: string;
    mode?: InteractionMode;
  }>;
  consecutiveIncorrectAnswers: number;
  consecutiveDisengagementCount: number;
}

export interface SafetyAction {
  flagged: boolean;
  category?: 'danger_abuse' | 'pii' | 'override_attempt' | 'inappropriate' | 'medical_diagnosis';
  safeGuidance?: string;
  triggerAdultAlert?: boolean;
}

export interface ChatRequest {
  learnerId: string;
  message: string;
  currentActivityId?: string;
  audioEnabled?: boolean;
}

export interface ChatResponse {
  message: string;
  mode: InteractionMode;
  level: LearningLevel;
  activity?: Activity;
  quickReplies?: string[];
  progressUpdate?: {
    starsEarned: number;
    newBadge?: string;
    levelUp?: boolean;
    accuracy: number;
    masteryScore?: number;
  };
  safetyAction?: SafetyAction;
  latencyMs: number;
  metadata: {
    modeReason: string;
    usedFallback: boolean;
    provider?: string;
    modelName?: string;
    llmLatencyMs?: number;
    selectionRationale?: string;
  };
}

export interface ParentSummary {
  learnerId: string;
  nickname: string;
  avatar: string;
  currentLevel: LearningLevel;
  totalQuestionsAnswered: number;
  overallAccuracy: number;
  totalStars: number;
  skillsBreakdown: Array<{
    skillId: string;
    skillName: string;
    masteryPercent: number;
    attempts: number;
    correct: number;
    status: 'mastered' | 'learning' | 'needs_practice';
    prerequisitesMet: boolean;
  }>;
  recentSessions: Array<{
    date: string;
    durationMinutes: number;
    activitiesCompleted: number;
    accuracy: number;
    primaryMode: InteractionMode;
  }>;
  progressionStatus: {
    readyForNextLevel: boolean;
    targetLevel: LearningLevel;
    criteriaMet: string[];
    criteriaRemaining: string[];
    accuracyPercent: number;
    totalPracticed: number;
    minRequired: number;
    sessionsCompleted: number;
    minSessionsRequired: number;
    masteryFormula: string;
  };
  recommendations: string[];
}

export const MASTERY_CONFIG = {
  ALPHA: 0.35, // Exponential weighting factor for latest evidence
  HINT_PENALTY: 0.25, // Evidence deduction when child uses hint
  MASTERY_THRESHOLD: 0.80, // 80% threshold for skill mastery
  MIN_ATTEMPTS_FOR_MASTERY: 3,
};

export const PROGRESSION_RULES = {
  MIN_PRACTICE_QUESTIONS: 15,
  MIN_ACCURACY_PERCENT: 80,
  MIN_SESSIONS_REQUIRED: 2,
  MAX_LEVEL: 3 as LearningLevel,
};

export const SEL_EMOTIONS = [
  { id: 'happy', label: 'Happy', emoji: '😊', color: '#FCD34D', childPrompt: "I'm feeling happy!" },
  { id: 'sad', label: 'Sad', emoji: '😢', color: '#93C5FD', childPrompt: "I'm feeling sad." },
  { id: 'angry', label: 'Angry', emoji: '😠', color: '#FCA5A5', childPrompt: "I'm feeling angry." },
  { id: 'scared', label: 'Scared', emoji: '😨', color: '#C4B5FD', childPrompt: "I feel a little scared." },
  { id: 'worried', label: 'Worried', emoji: '🦋', color: '#FDE047', childPrompt: "I'm a little worried." },
  { id: 'excited', label: 'Excited', emoji: '🤩', color: '#FDE047', childPrompt: "I'm super excited!" },
  { id: 'tired', label: 'Tired', emoji: '😴', color: '#CBD5E1', childPrompt: "I'm feeling tired." },
  { id: 'confused', label: 'Confused', emoji: '🤔', color: '#A7F3D0', childPrompt: "I'm a bit confused." }
] as const;
