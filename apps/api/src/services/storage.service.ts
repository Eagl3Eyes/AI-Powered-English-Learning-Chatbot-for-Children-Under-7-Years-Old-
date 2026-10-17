import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type {
  Learner,
  LearningProgress,
  SessionContext,
  ActivityAttempt,
  LearningLevel,
  InteractionMode
} from '@chatbot/shared';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface DbSchema {
  learners: Record<string, Learner>;
  progress: Record<string, LearningProgress>;
  sessions: Record<string, SessionContext>;
  attempts: ActivityAttempt[];
}

export class StorageService {
  private dbPath: string;
  private data: DbSchema;

  constructor(customPath?: string) {
    this.dbPath = customPath || path.resolve(process.cwd(), 'data', 'db.json');
    this.data = {
      learners: {},
      progress: {},
      sessions: {},
      attempts: []
    };
    this.init();
  }

  private init() {
    try {
      const dir = path.dirname(this.dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      if (fs.existsSync(this.dbPath)) {
        const raw = fs.readFileSync(this.dbPath, 'utf-8');
        this.data = JSON.parse(raw);
      } else {
        this.seedInitialData();
        this.persist();
      }
    } catch {
      // In serverless environments with read-only root, fall back gracefully to memory
      this.seedInitialData();
    }
  }

  private persist() {
    try {
      fs.writeFileSync(this.dbPath, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch {
      // Memory fallback if disk write fails (e.g. read-only container)
    }
  }

  private seedInitialData() {
    const demoLearner: Learner = {
      id: 'demo-learner-1',
      nickname: 'Leo',
      avatar: 'owl',
      level: 1,
      createdAt: new Date().toISOString(),
      stars: 12,
      badges: ['Early Explorer', 'Color Champion'],
      preferences: {
        audioAutoPlay: true,
        theme: 'playful',
        favoriteTopics: ['animals', 'colors']
      }
    };

    const demoProgress: LearningProgress = {
      learnerId: demoLearner.id,
      level: 1,
      skills: {
        colors: {
          skillId: 'colors',
          skillName: 'Colors & Shapes',
          level: 1,
          attempts: 6,
          correct: 5,
          mastered: true,
          masteryScore: 0.85,
          consecutiveSuccess: 4,
          lastPracticed: new Date().toISOString()
        },
        animals: {
          skillId: 'animals',
          skillName: 'Animal Friends',
          level: 1,
          attempts: 4,
          correct: 3,
          mastered: false,
          masteryScore: 0.72,
          consecutiveSuccess: 1,
          lastPracticed: new Date().toISOString()
        },
        numbers: {
          skillId: 'numbers',
          skillName: 'Numbers 1-10',
          level: 1,
          attempts: 3,
          correct: 3,
          mastered: true,
          masteryScore: 0.95,
          consecutiveSuccess: 3,
          lastPracticed: new Date().toISOString()
        }
      },
      totalStars: 12,
      totalAttempts: 13,
      totalCorrect: 11,
      streakDays: 3,
      lastSessionDate: new Date().toISOString(),
      sessionsCount: 3,
      recommendedNextActivity: 'q_l1_03'
    };

    this.data.learners[demoLearner.id] = demoLearner;
    this.data.progress[demoLearner.id] = demoProgress;
  }

  // Learner Methods
  getLearner(id: string): Learner | undefined {
    return this.data.learners[id];
  }

  getOrCreateLearner(id: string): Learner {
    if (!this.data.learners[id]) {
      this.data.learners[id] = {
        id,
        nickname: 'Explorer',
        avatar: 'owl',
        level: 1,
        createdAt: new Date().toISOString(),
        stars: 0,
        badges: ['Welcome Explorer'],
        preferences: {
          audioAutoPlay: true,
          theme: 'playful',
          favoriteTopics: ['colors', 'animals']
        }
      };
      if (!this.data.progress[id]) {
        this.createInitialProgress(id, 1);
      }
      this.persist();
    }
    return this.data.learners[id];
  }

  saveLearner(learner: Learner): Learner {
    this.data.learners[learner.id] = { ...learner };
    if (!this.data.progress[learner.id]) {
      this.createInitialProgress(learner.id, learner.level);
    }
    this.persist();
    return this.data.learners[learner.id];
  }

  deleteLearnerData(id: string): boolean {
    delete this.data.learners[id];
    delete this.data.progress[id];
    delete this.data.sessions[id];
    this.data.attempts = this.data.attempts.filter(a => a.learnerId !== id);
    this.persist();
    return true;
  }

  resetLearnerProgress(id: string, newLevel: LearningLevel = 1): LearningProgress {
    this.createInitialProgress(id, newLevel);
    if (this.data.learners[id]) {
      this.data.learners[id].level = newLevel;
      this.data.learners[id].stars = 0;
      this.data.learners[id].badges = ['Fresh Start'];
    }
    this.persist();
    return this.data.progress[id];
  }

  // Progress Methods
  getProgress(learnerId: string): LearningProgress {
    let prog = this.data.progress[learnerId];
    if (!prog) {
      const learner = this.getLearner(learnerId);
      prog = this.createInitialProgress(learnerId, learner ? learner.level : 1);
    }
    return prog;
  }

  saveProgress(progress: LearningProgress): LearningProgress {
    this.data.progress[progress.learnerId] = { ...progress };
    this.persist();
    return this.data.progress[progress.learnerId];
  }

  private createInitialProgress(learnerId: string, level: LearningLevel): LearningProgress {
    const prog: LearningProgress = {
      learnerId,
      level,
      skills: {},
      totalStars: 0,
      totalAttempts: 0,
      totalCorrect: 0,
      streakDays: 1,
      lastSessionDate: new Date().toISOString(),
      sessionsCount: 1
    };
    this.data.progress[learnerId] = prog;
    this.persist();
    return prog;
  }

  // Session Methods
  getSession(learnerId: string): SessionContext {
    let session = this.data.sessions[learnerId];
    if (!session) {
      session = {
        id: `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        learnerId,
        startedAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
        currentMode: 'IDLE',
        recentTurns: [],
        consecutiveIncorrectAnswers: 0,
        consecutiveDisengagementCount: 0
      };
      this.data.sessions[learnerId] = session;
    }
    return session;
  }

  saveSession(session: SessionContext): SessionContext {
    this.data.sessions[session.learnerId] = { ...session, lastActiveAt: new Date().toISOString() };
    this.persist();
    return this.data.sessions[session.learnerId];
  }

  // Attempt Methods
  recordAttempt(attempt: ActivityAttempt): void {
    this.data.attempts.push(attempt);
    // Keep max 2000 attempts in log
    if (this.data.attempts.length > 2000) {
      this.data.attempts = this.data.attempts.slice(-2000);
    }
    this.persist();
  }

  getAttempts(learnerId: string): ActivityAttempt[] {
    return this.data.attempts.filter(a => a.learnerId === learnerId);
  }
}

export const storage = new StorageService();
