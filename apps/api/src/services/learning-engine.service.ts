import { storage } from './storage.service.js';
import { contentService } from './content.service.js';
import {
  type ActivityAttempt,
  type LearningLevel,
  type LearningProgress,
  type ParentSummary,
  type SkillProgress,
  MASTERY_CONFIG,
  PROGRESSION_RULES
} from '@chatbot/shared';

export interface AnswerValidationResult {
  isCorrect: boolean;
  explanation: string;
  starsEarned: number;
  newBadge?: string;
  levelUp?: boolean;
  newLevel?: LearningLevel;
  progress: LearningProgress;
  skillMasteryScore?: number;
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

    // Check exact or partial match
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

    // 1. Calculate Evidence Score for this attempt
    let latestEvidence = 0.0;
    if (isCorrect) {
      latestEvidence = usedHint ? (1.0 - MASTERY_CONFIG.HINT_PENALTY) : 1.0;
    } else {
      latestEvidence = usedHint ? 0.10 : 0.0;
    }

    // 2. Update Skill-Specific Progress with Exponential Moving Average:
    // newMastery = alpha * latestEvidence + (1 - alpha) * previousMastery
    const skillId = activity.skillId;
    if (!progress.skills[skillId]) {
      const skillDef = contentService.getSkillById(skillId);
      progress.skills[skillId] = {
        skillId,
        skillName: skillDef?.name || this.getSkillDisplayName(skillId),
        level: activity.level,
        attempts: 0,
        correct: 0,
        mastered: false,
        masteryScore: 0.0,
        lastPracticed: new Date().toISOString(),
        consecutiveSuccess: 0
      };
    }

    const skill = progress.skills[skillId];
    skill.attempts += 1;
    if (isCorrect) {
      skill.correct += 1;
      skill.consecutiveSuccess = (skill.consecutiveSuccess ?? 0) + 1;
    } else {
      skill.consecutiveSuccess = 0;
    }
    skill.lastPracticed = new Date().toISOString();

    const previousMastery = skill.masteryScore ?? (skill.correct / skill.attempts);
    const updatedMastery =
      skill.attempts === 1
        ? latestEvidence
        : MASTERY_CONFIG.ALPHA * latestEvidence + (1 - MASTERY_CONFIG.ALPHA) * previousMastery;

    skill.masteryScore = Math.round(updatedMastery * 100) / 100;

    // Mastery threshold condition: at least 3 attempts and masteryScore >= 0.80
    if (
      skill.attempts >= MASTERY_CONFIG.MIN_ATTEMPTS_FOR_MASTERY &&
      skill.masteryScore >= MASTERY_CONFIG.MASTERY_THRESHOLD
    ) {
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
    if (progressionCheck.readyForNextLevel && progress.level < PROGRESSION_RULES.MAX_LEVEL) {
      levelUp = true;
      progress.level = (progress.level + 1) as LearningLevel;
      newLevel = progress.level;
      newBadge = `Level ${newLevel} Champion!`;

      if (learner) {
        learner.level = newLevel;
        if (!learner.badges.includes(newBadge)) {
          learner.badges.push(newBadge);
        }
        learner.stars += 10; // Level up celebration bonus
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
      progress,
      skillMasteryScore: skill.masteryScore
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
    masteryFormula: string;
  } {
    const accuracy = progress.totalAttempts > 0 ? (progress.totalCorrect / progress.totalAttempts) * 100 : 0;
    const currentLevel = progress.level;
    const targetLevel = (Math.min(PROGRESSION_RULES.MAX_LEVEL, currentLevel + 1)) as LearningLevel;

    const minRequired = currentLevel === 1 ? PROGRESSION_RULES.MIN_PRACTICE_QUESTIONS : 20;
    const minSessionsRequired = PROGRESSION_RULES.MIN_SESSIONS_REQUIRED;

    const criteriaMet: string[] = [];
    const criteriaRemaining: string[] = [];

    // Criterion 1: Practice questions
    if (progress.totalAttempts >= minRequired) {
      criteriaMet.push(`Completed ${progress.totalAttempts}/${minRequired} practice activities`);
    } else {
      criteriaRemaining.push(`Complete ${minRequired - progress.totalAttempts} more practice activities`);
    }

    // Criterion 2: Overall accuracy >= 80%
    if (accuracy >= PROGRESSION_RULES.MIN_ACCURACY_PERCENT) {
      criteriaMet.push(`Maintained ${accuracy.toFixed(1)}% accuracy (Target: ≥ ${PROGRESSION_RULES.MIN_ACCURACY_PERCENT}%)`);
    } else {
      criteriaRemaining.push(`Achieve at least ${PROGRESSION_RULES.MIN_ACCURACY_PERCENT}% overall accuracy (Current: ${accuracy.toFixed(1)}%)`);
    }

    // Criterion 3: Session count >= 2 to confirm longitudinal retention
    if (progress.sessionsCount >= minSessionsRequired) {
      criteriaMet.push(`Practiced across ${progress.sessionsCount} separate sessions`);
    } else {
      criteriaRemaining.push(`Practice in at least ${minSessionsRequired} sessions to confirm mastery`);
    }

    // Criterion 4: Level core skill mastery coverage
    const levelSkills = contentService.getSkills(currentLevel);
    const masteredLevelSkills = levelSkills.filter(s => progress.skills[s.id]?.mastered);
    const requiredSkillsCount = Math.max(2, Math.floor(levelSkills.length * 0.6));

    if (masteredLevelSkills.length >= requiredSkillsCount) {
      criteriaMet.push(`Demonstrated mastery across ${masteredLevelSkills.length}/${levelSkills.length} core skills`);
    } else {
      criteriaRemaining.push(`Master at least ${requiredSkillsCount - masteredLevelSkills.length} more core skills in Level ${currentLevel}`);
    }

    const readyForNextLevel =
      currentLevel < PROGRESSION_RULES.MAX_LEVEL &&
      progress.totalAttempts >= minRequired &&
      accuracy >= PROGRESSION_RULES.MIN_ACCURACY_PERCENT &&
      progress.sessionsCount >= minSessionsRequired &&
      masteredLevelSkills.length >= requiredSkillsCount;

    return {
      readyForNextLevel,
      targetLevel,
      criteriaMet,
      criteriaRemaining,
      accuracyPercent: Math.round(accuracy),
      totalPracticed: progress.totalAttempts,
      minRequired,
      sessionsCompleted: progress.sessionsCount,
      minSessionsRequired,
      masteryFormula: `newMastery = 0.35 * latestEvidence + 0.65 * previousMastery`
    };
  }

  getParentSummary(learnerId: string): ParentSummary {
    const learner = storage.getLearner(learnerId);
    const progress = storage.getProgress(learnerId);
    const attempts = storage.getAttempts(learnerId);
    const allSkills = contentService.getSkills();

    const overallAccuracy =
      progress.totalAttempts > 0
        ? Math.round((progress.totalCorrect / progress.totalAttempts) * 100)
        : 100;

    const masteredIds = Object.keys(progress.skills).filter(k => progress.skills[k]?.mastered);

    const skillsBreakdown = allSkills.map(s => {
      const p = progress.skills[s.id];
      const attemptsCount = p ? p.attempts : 0;
      const correctCount = p ? p.correct : 0;
      const mastery = p ? Math.round((p.masteryScore || (attemptsCount > 0 ? correctCount / attemptsCount : 0)) * 100) : 0;

      let status: 'mastered' | 'learning' | 'needs_practice' = 'learning';
      if (p?.mastered) status = 'mastered';
      else if (attemptsCount >= 3 && mastery < 65) status = 'needs_practice';

      const prereqsMet = s.prerequisites.every(pr => masteredIds.includes(pr));

      return {
        skillId: s.id,
        skillName: s.name,
        masteryPercent: mastery,
        attempts: attemptsCount,
        correct: correctCount,
        status,
        prerequisitesMet: prereqsMet
      };
    });

    const progressionStatus = this.checkLevelProgression(progress);

    const recommendations: string[] = [];
    const needsPractice = skillsBreakdown.filter(s => s.status === 'needs_practice');
    if (needsPractice.length > 0) {
      const names = needsPractice.map(s => s.skillName).slice(0, 3).join(', ');
      recommendations.push(`Reinforce foundational exercises in: ${names}.`);
    }
    if (progress.totalAttempts < 10) {
      recommendations.push("Maintain short 5-minute playful daily sessions to build early speech confidence.");
    } else if (progressionStatus.readyForNextLevel) {
      recommendations.push(`Ready to graduate to Level ${progressionStatus.targetLevel}! Celebrate with your child.`);
    } else {
      recommendations.push("Steady progress! Encourage verbal pronunciation using the speaker button.");
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
    return skillId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
}

export const learningEngineService = new LearningEngineService();
