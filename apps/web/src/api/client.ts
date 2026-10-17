import type {
  Learner,
  LearningProgress,
  ChatResponse,
  Activity,
  ParentSummary,
  LearningLevel
} from '@chatbot/shared';

const API_BASE = '/api/v1';

export const apiClient = {
  async startSession(learnerId?: string, nickname?: string, avatar?: string, level: number = 1): Promise<{
    learner: Learner;
    sessionId: string;
    progress: LearningProgress;
  }> {
    const res = await fetch(`${API_BASE}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ learnerId, nickname, avatar, level })
    });
    if (!res.ok) throw new Error('Failed to create session');
    return res.json();
  },

  async sendChatMessage(
    learnerId: string,
    message: string,
    currentActivityId?: string,
    audioEnabled: boolean = true
  ): Promise<ChatResponse> {
    const res = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ learnerId, message, currentActivityId, audioEnabled })
    });
    if (!res.ok) throw new Error('Chat failed');
    return res.json();
  },

  async fetchProgress(learnerId: string): Promise<{ progress: LearningProgress; learner: Learner }> {
    const res = await fetch(`${API_BASE}/progress/${learnerId}`);
    if (!res.ok) throw new Error('Failed to load progress');
    return res.json();
  },

  async fetchLevels(): Promise<{ levels: any[] }> {
    const res = await fetch(`${API_BASE}/learning/levels`);
    if (!res.ok) throw new Error('Failed to load levels');
    return res.json();
  },

  async fetchNextActivity(level: LearningLevel, excludeIds: string[] = [], type?: string): Promise<Activity> {
    const query = new URLSearchParams({
      level: String(level),
      exclude: excludeIds.join(','),
      ...(type ? { type } : {})
    });
    const res = await fetch(`${API_BASE}/activities/next?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to load activity');
    return res.json();
  },

  async submitActivityAnswer(
    learnerId: string,
    activityId: string,
    answer: string,
    usedHint: boolean = false
  ): Promise<{
    isCorrect: boolean;
    explanation: string;
    starsEarned: number;
    newBadge?: string;
    levelUp?: boolean;
    newLevel?: LearningLevel;
    progress: LearningProgress;
  }> {
    const res = await fetch(`${API_BASE}/activities/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ learnerId, activityId, answer, usedHint })
    });
    if (!res.ok) throw new Error('Answer submission failed');
    return res.json();
  },

  async submitSelCheckin(emotionId: string): Promise<{
    isSelTriggered: boolean;
    emotion: string;
    response: string;
    quickReplies: string[];
    suggestedMode: string;
  }> {
    const res = await fetch(`${API_BASE}/sel/checkin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emotionId })
    });
    if (!res.ok) throw new Error('Feelings checkin failed');
    return res.json();
  },

  async fetchParentSummary(learnerId: string): Promise<ParentSummary> {
    const res = await fetch(`${API_BASE}/parent/summary/${learnerId}`);
    if (!res.ok) throw new Error('Failed to load parent summary');
    return res.json();
  },

  async resetLearner(learnerId: string, level: LearningLevel = 1): Promise<void> {
    const res = await fetch(`${API_BASE}/learners/${learnerId}/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level })
    });
    if (!res.ok) throw new Error('Failed to reset learner');
  },

  async deleteLearnerData(learnerId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/learners/${learnerId}/data`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete learner data');
  }
};
