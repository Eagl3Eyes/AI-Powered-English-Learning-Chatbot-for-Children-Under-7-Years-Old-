import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Activity, LearningLevel, ActivityType, SkillDefinition } from '@chatbot/shared';
import {
  defaultVocabulary,
  defaultQuizzes,
  defaultSentenceCompletions,
  defaultStories,
  defaultSelScenarios,
  defaultSkills,
  defaultConversations
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

export interface ConversationScenario {
  id: string;
  theme: string;
  triggerPhrases: string[];
  level: LearningLevel;
  botResponse: string;
  suggestedReplies: string[];
}

export class ContentService {
  private vocabulary: VocabularyItem[] = (defaultVocabulary as any) || [];
  private quizzes: Activity[] = (defaultQuizzes as any) || [];
  private sentenceCompletions: Activity[] = (defaultSentenceCompletions as any) || [];
  private stories: Activity[] = (defaultStories as any) || [];
  private selScenarios: SelScenario[] = (defaultSelScenarios as any) || [];
  private skills: SkillDefinition[] = (defaultSkills as any) || [];
  private conversations: ConversationScenario[] = (defaultConversations as any) || [];

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

      const skillsPath = this.resolveContentPath('skills.json');
      if (skillsPath && fs.existsSync(skillsPath)) {
        this.skills = JSON.parse(fs.readFileSync(skillsPath, 'utf-8'));
      }

      const convPath = this.resolveContentPath('conversations.json');
      if (convPath && fs.existsSync(convPath)) {
        this.conversations = JSON.parse(fs.readFileSync(convPath, 'utf-8'));
      }
    } catch {
      // Retain bundled defaults
    }
  }

  getSkills(level?: LearningLevel): SkillDefinition[] {
    if (!level) return this.skills;
    return this.skills.filter(s => s.level === level);
  }

  getSkillById(id: string): SkillDefinition | undefined {
    return this.skills.find(s => s.id === id);
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
    preferredType?: ActivityType,
    masteredSkills: string[] = []
  ): Activity {
    const allLevelActs = this.getAllActivities(level);

    // Filter by prerequisite readiness
    const eligible = allLevelActs.filter(act => {
      const skillDef = this.getSkillById(act.skillId);
      if (!skillDef || !skillDef.prerequisites || skillDef.prerequisites.length === 0) {
        return true;
      }
      // Check if all prerequisites are mastered
      return skillDef.prerequisites.every(p => masteredSkills.includes(p));
    });

    const candidatePool = eligible.length > 0 ? eligible : allLevelActs;
    const unpracticed = candidatePool.filter(a => !excludeIds.includes(a.id));
    const pool = unpracticed.length > 0 ? unpracticed : candidatePool;

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

  getConversations(level?: LearningLevel): ConversationScenario[] {
    if (!level) return this.conversations;
    return this.conversations.filter(c => c.level === level);
  }
}

export const contentService = new ContentService();
