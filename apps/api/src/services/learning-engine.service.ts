import {
  storage
} from './storage.service.js';
import {
  contentService
} from './content.service.js';
import type {
  Activity,
  ActivityAttempt,
  LearningLevel,
  LearningProgress,
  ParentSummary,
  SkillProgress
} from '@chatbot/shared';

export interface AnswerValidationResult {
  isCorrect: boolean;
  explanation: string;
  starsEarned: number;
  newBadge?: string;
  levelUp?: boolean;
  newLevel?: LearningLevel;
  progress: LearningProgress;
}

export class LearningEngineService {
  submitAnswer(
    learnerId: string,
    activityId: string,
    submittedAnswer: string,
    usedHint: boolean = false
  ): AnswerValidationResult {
    const activity = contentService.getActivityById(activityId);
    if (!activity) {
      throw new Error(`Activity ${activityId} not found`);
    }

    const cleanSubmitted = submittedAnswer.trim().toLowerCase();
    const cleanCorrect = (activity.correctAnswer || '').trim().toLowerCase();

    // Check exact or partial match (e.g. choice text or ID)
    const isCorrect =
      cleanSubmitted === cleanCorrect ||
      cleanSubmitted.includes(cleanCorrect) ||
      cleanCorrect.includes(cleanSubmitted);

    const progress = storage.getProgress(learnerId);
    const learner = storage.getLearner(learnerId);

    // Update overall metrics
    progress.totalAttempts += 1;
    let starsEarned = 0;

    if (isCorrect) {
      progress.totalCorrect += 1;
      starsEarned = usedHint ? 1 : 2;
      progress.totalStars += starsEarned;
    }

    // Update skill-specific progress
    const skillId = activity.skillId;
    if (!progress.skills[skillId]) {
      progress.skills[skillId] = {
        skillId,
        skillName: this.getSkillDisplayName(skillId),
        level: activity.level,
        attempts: 0,
        correct: 0,
        mastered: false,
        lastPracticed: new Date().toISOString()
      };
    }

    const skill = progress.skills[skillId];
    skill.attempts += 1;
    if (isCorrect) skill.correct += 1;
    skill.lastPracticed = new Date().toISOString();

    // Skill mastery condition: at least 3 attempts with >= 80% accuracy
    if (skill.attempts >= 3 && (skill.correct / skill.attempts) >= 0.8) {
      skill.mastered = true;
    }

    // Record persistent attempt
    const attempt: ActivityAttempt = {
      id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      learnerId,
      activityId,
      submittedAnswer,
      isCorrect,
      usedHint,
      timestamp: new Date().toISOString()
    };
    storage.recordAttempt(attempt);

    // Check level progression criteria
    let levelUp = false;
    let newLevel: LearningLevel | undefined;
    let newBadge: string | undefined;

    const progressionCheck = this.checkLevelProgression(progress);
    if (progressionCheck.readyForNextLevel && progress.level < 3) {
      levelUp = true;
      progress.level = (progress.level + 1) as LearningLevel;
      newLevel = progress.level;
      newBadge = `Level ${newLevel} Champion!`;

      if (learner) {
        learner.level = newLevel;
        if (!learner.badges.includes(newBadge)) {
          learner.badges.push(newBadge);
        }
        learner.stars += 10; // Level up bonus
        storage.saveLearner(learner);
      }
    }

    // Save updated progress
    storage.saveProgress(progress);

    return {
      isCorrect,
      explanation: activity.explanation,
      starsEarned,
      newBadge,
      levelUp,
      newLevel,
      progress
    };
  }

  checkLevelProgression(progress: LearningProgress): {
    readyForNextLevel: boolean;
    targetLevel: LearningLevel;
    criteriaMet: string[];
    criteriaRemaining: string[];
    accuracyPercent: number;
    totalPracticed: number;
    minRequired: number;
    sessionsCompleted: number;
    minSessionsRequired: number;
  } {
    const accuracy = progress.totalAttempts > 0 ? (progress.totalCorrect / progress.totalAttempts) * 100 : 0;
    const currentLevel = progress.level;
    const targetLevel = (Math.min(3, currentLevel + 1)) as LearningLevel;

    const minRequired = currentLevel === 1 ? 15 : 20;
    const minSessionsRequired = 2;

    const criteriaMet: string[] = [];
    const criteriaRemaining: string[] = [];

    // Criterion 1: Practice questions
    if (progress.totalAttempts >= minRequired) {
      criteriaMet.push(`Completed ${progress.totalAttempts}/${minRequired} practice activities`);
    } else {
      criteriaRemaining.push(`Complete ${minRequired - progress.totalAttempts} more practice activities`);
    }

    // Criterion 2: Accuracy >= 80%
    if (accuracy >= 80) {
      criteriaMet.push(`Maintained ${accuracy.toFixed(1)}% accuracy (Target: ≥ 80%)`);
    } else {
      criteriaRemaining.push(`Achieve at least 80% overall accuracy (Current: ${accuracy.toFixed(1)}%)`);
    }

    // Criterion 3: Session count >= 2 to reduce lucky guesses
    if (progress.sessionsCount >= minSessionsRequired) {
      criteriaMet.push(`Practiced across ${progress.sessionsCount} separate sessions`);
    } else {
      criteriaRemaining.push(`Practice in at least ${minSessionsRequired} sessions to confirm mastery`);
    }

    const readyForNextLevel =
      currentLevel < 3 &&
      progress.totalAttempts >= minRequired &&
      accuracy >= 80 &&
      progress.sessionsCount >= minSessionsRequired;

    return {
      readyForNextLevel,
      targetLevel,
      criteriaMet,
      criteriaRemaining,
      accuracyPercent: Math.round(accuracy),
      totalPracticed: progress.totalAttempts,
      minRequired,
      sessionsCompleted: progress.sessionsCount,
      minSessionsRequired
    };
  }

  getParentSummary(learnerId: string): ParentSummary {
    const learner = storage.getLearner(learnerId);
    const progress = storage.getProgress(learnerId);
    const attempts = storage.getAttempts(learnerId);

    const overallAccuracy =
      progress.totalAttempts > 0
        ? Math.round((progress.totalCorrect / progress.totalAttempts) * 100)
        : 100;

    const skillsBreakdown = Object.values(progress.skills).map(s => {
      const mastery = s.attempts > 0 ? Math.round((s.correct / s.attempts) * 100) : 0;
      let status: 'mastered' | 'learning' | 'needs_practice' = 'learning';
      if (s.mastered) status = 'mastered';
      else if (s.attempts >= 3 && mastery < 65) status = 'needs_practice';

      return {
        skillId: s.skillId,
        skillName: s.skillName,
        masteryPercent: mastery,
        attempts: s.attempts,
        correct: s.correct,
        status
      };
    });

    const progressionStatus = this.checkLevelProgression(progress);

    const recommendations: string[] = [];
    if (skillsBreakdown.some(s => s.status === 'needs_practice')) {
      const needs = skillsBreakdown.filter(s => s.status === 'needs_practice').map(s => s.skillName);
      recommendations.push(`Review foundational exercises in: ${needs.join(', ')}.`);
    }
    if (progress.totalAttempts < 10) {
      recommendations.push("Keep practicing short 5-minute sessions to build daily English confidence.");
    } else if (progressionStatus.readyForNextLevel) {
      recommendations.push(`Ready to advance to Level ${progressionStatus.targetLevel}! Review with your child and celebrate.`);
    } else {
      recommendations.push("Steady progress! Encourage verbal pronunciation during the interactive quiz questions.");
    }

    return {
      learnerId,
      nickname: learner?.nickname || 'Learner',
      avatar: learner?.avatar || 'owl',
      currentLevel: progress.level,
      totalQuestionsAnswered: progress.totalAttempts,
      overallAccuracy,
      totalStars: progress.totalStars,
      skillsBreakdown,
      recentSessions: [
        {
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          durationMinutes: Math.max(5, Math.min(25, attempts.length * 2)),
          activitiesCompleted: attempts.length,
          accuracy: overallAccuracy,
          primaryMode: 'LEARNING'
        }
      ],
      progressionStatus,
      recommendations
    };
  }

  private getSkillDisplayName(skillId: string): string {
    const map: Record<string, string> = {
      colors: 'Colors & Shapes',
      numbers: 'Numbers & Counting',
      animals: 'Animal Friends',
      greetings: 'Greetings & Politeness',
      objects: 'Everyday Objects',
      actions: 'Action Verbs',
      food: 'Food & Nutrition',
      weather: 'Weather & Seasons',
      family: 'Family & Home',
      story_comprehension: 'Story Comprehension',
      sequencing: 'Sequencing & Time',
      social_communication: 'Social Communication',
      descriptive_words: 'Descriptive Words',
      sentence_building: 'Sentence Building'
    };
    return map[skillId] || skillId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
}

export const learningEngineService = new LearningEngineService();
