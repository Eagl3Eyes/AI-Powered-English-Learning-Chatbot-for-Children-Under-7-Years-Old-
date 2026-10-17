import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Activity, LearningLevel, ActivityType } from '@chatbot/shared';
import {
  defaultVocabulary,
  defaultQuizzes,
  defaultSentenceCompletions,
  defaultStories,
  defaultSelScenarios
} from './content.data.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface VocabularyItem {
  id: string;
  level: LearningLevel;
  word: string;
  emoji: string;
  phonics: string;
  definition: string;
  example: string;
  category: string;
}

export interface SelScenario {
  id: string;
  emotion: string;
  triggerPhrases: string[];
  response: string;
  quickReplies: string[];
  activitySuggestion?: string;
  safetyAction?: {
    flagged: boolean;
    category?: 'danger_abuse' | 'pii' | 'override_attempt' | 'inappropriate' | 'medical_diagnosis';
    safeGuidance?: string;
    triggerAdultAlert?: boolean;
  };
}

export class ContentService {
  private vocabulary: VocabularyItem[] = (defaultVocabulary as any) || [];
  private quizzes: Activity[] = (defaultQuizzes as any) || [];
  private sentenceCompletions: Activity[] = (defaultSentenceCompletions as any) || [];
  private stories: Activity[] = (defaultStories as any) || [];
  private selScenarios: SelScenario[] = (defaultSelScenarios as any) || [];

  constructor() {
    this.loadContent();
  }

  private resolveContentPath(filename: string): string | null {
    const candidates = [
      path.resolve(process.cwd(), 'content', filename),
      path.resolve(process.cwd(), '..', '..', 'content', filename),
      path.resolve(process.cwd(), '..', 'content', filename),
      path.resolve(__dirname, '..', '..', '..', 'content', filename),
      path.resolve(__dirname, '..', '..', 'content', filename),
      path.resolve('/var/task/content', filename)
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) return p;
    }
    return null;
  }

  private loadContent() {
    try {
      const vocabPath = this.resolveContentPath('vocabulary.json');
      if (vocabPath && fs.existsSync(vocabPath)) {
        this.vocabulary = JSON.parse(fs.readFileSync(vocabPath, 'utf-8'));
      }

      const quizPath = this.resolveContentPath('quizzes.json');
      if (quizPath && fs.existsSync(quizPath)) {
        this.quizzes = JSON.parse(fs.readFileSync(quizPath, 'utf-8'));
      }

      const scPath = this.resolveContentPath('sentence_completions.json');
      if (scPath && fs.existsSync(scPath)) {
        this.sentenceCompletions = JSON.parse(fs.readFileSync(scPath, 'utf-8'));
      }

      const storyPath = this.resolveContentPath('stories.json');
      if (storyPath && fs.existsSync(storyPath)) {
        this.stories = JSON.parse(fs.readFileSync(storyPath, 'utf-8'));
      }

      const selPath = this.resolveContentPath('sel_scenarios.json');
      if (selPath && fs.existsSync(selPath)) {
        this.selScenarios = JSON.parse(fs.readFileSync(selPath, 'utf-8'));
      }
    } catch (err) {
      // Retain bundled defaults if file reading encounters an issue
    }
  }

  getVocabulary(level?: LearningLevel): VocabularyItem[] {
    if (!level) return this.vocabulary;
    return this.vocabulary.filter(v => v.level === level);
  }

  getAllActivities(level?: LearningLevel): Activity[] {
    const all = [...this.quizzes, ...this.sentenceCompletions, ...this.stories];
    if (!level) return all;
    return all.filter(a => a.level === level);
  }

  getActivityById(id: string): Activity | undefined {
    return this.getAllActivities().find(a => a.id === id);
  }

  getNextActivityForLearner(
    level: LearningLevel,
    excludeIds: string[] = [],
    preferredType?: ActivityType
  ): Activity {
    const available = this.getAllActivities(level).filter(a => !excludeIds.includes(a.id));
    const pool = available.length > 0 ? available : this.getAllActivities(level);

    if (preferredType) {
      const typed = pool.filter(a => a.type === preferredType);
      if (typed.length > 0) {
        return typed[Math.floor(Math.random() * typed.length)];
      }
    }

    return pool[Math.floor(Math.random() * pool.length)] || this.quizzes[0];
  }

  getSelScenarios(): SelScenario[] {
    return this.selScenarios;
  }
}

export const contentService = new ContentService();
