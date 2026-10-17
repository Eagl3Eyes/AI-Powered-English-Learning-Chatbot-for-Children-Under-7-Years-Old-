import { Router, Request, Response } from 'express';
import { storage } from '../services/storage.service.js';
import { contentService } from '../services/content.service.js';
import { learningEngineService } from '../services/learning-engine.service.js';
import { conversationOrchestratorService } from '../services/conversation-orchestrator.service.js';
import { selService } from '../services/sel.service.js';
import { llmProviderService } from '../services/llm-provider.service.js';
import type { LearningLevel, ChatRequest } from '@chatbot/shared';

export const apiRouter = Router();

// 1. Session Creation / Sync
apiRouter.post('/sessions', (req: Request, res: Response) => {
  const { learnerId, nickname, avatar, level } = req.body;
  const id = learnerId || `learner_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  let learner = storage.getLearner(id);
  if (!learner) {
    learner = storage.saveLearner({
      id,
      nickname: nickname || 'Little Star',
      avatar: avatar || 'owl',
      level: (Number(level) || 1) as LearningLevel,
      createdAt: new Date().toISOString(),
      stars: 0,
      badges: ['Explorer Welcome'],
      preferences: {
        audioAutoPlay: true,
        theme: 'playful',
        favoriteTopics: ['colors', 'animals']
      }
    });
  }

  const session = storage.getSession(id);
  const progress = storage.getProgress(id);

  res.status(200).json({
    learner,
    sessionId: session.id,
    progress
  });
});

// 2. Chat Endpoint
apiRouter.post('/chat', async (req: Request, res: Response) => {
  const { learnerId, message, currentActivityId, audioEnabled } = req.body;

  if (!learnerId) {
    res.status(400).json({ error: 'learnerId is required' });
    return;
  }

  try {
    const chatReq: ChatRequest = {
      learnerId,
      message: message || '',
      currentActivityId,
      audioEnabled
    };

    const response = await conversationOrchestratorService.processMessage(chatReq);
    res.status(200).json(response);
  } catch (err: any) {
    console.error('Chat processing error:', err);
    res.status(500).json({
      message: "I'm right here with you! Let's take a deep breath and try that again.",
      mode: 'SUPPORT',
      level: 1,
      latencyMs: 10,
      metadata: {
        modeReason: 'Server error recovery',
        usedFallback: true,
        provider: 'resilience-handler'
      }
    });
  }
});

// 3. Learning Progress (both /learners/:learnerId/progress and /progress/:learnerId)
const getProgressHandler = (req: Request, res: Response) => {
  const { learnerId } = req.params;
  const progress = storage.getProgress(learnerId);
  const learner = storage.getLearner(learnerId);

  res.status(200).json({
    progress,
    learner
  });
};
apiRouter.get('/progress/:learnerId', getProgressHandler);
apiRouter.get('/learners/:learnerId/progress', getProgressHandler);

// 4. Curriculum Endpoints
const getLevelsHandler = (_req: Request, res: Response) => {
  res.status(200).json({
    levels: [
      {
        level: 1,
        title: 'Level 1: Foundations (Ages 3-4)',
        description: 'Single-sentence interactions, colors, numbers 1-10, greetings, friendly animals.',
        vocabCount: contentService.getVocabulary(1).length,
        activitiesCount: contentService.getAllActivities(1).length
      },
      {
        level: 2,
        title: 'Level 2: Growing Skills (Ages 4-5)',
        description: 'Action verbs, weather, family, food, numbers to 20, fill-in-the-blank sentences.',
        vocabCount: contentService.getVocabulary(2).length,
        activitiesCount: contentService.getAllActivities(2).length
      },
      {
        level: 3,
        title: 'Level 3: Confident Conversations (Ages 5-6)',
        description: 'Short interactive stories, comprehension, sequencing, descriptive words, empathy sharing.',
        vocabCount: contentService.getVocabulary(3).length,
        activitiesCount: contentService.getAllActivities(3).length
      }
    ]
  });
};
apiRouter.get('/learning/levels', getLevelsHandler);
apiRouter.get('/curriculum/levels', getLevelsHandler);

apiRouter.get('/curriculum/skills', (req: Request, res: Response) => {
  const level = req.query.level ? (Number(req.query.level) as LearningLevel) : undefined;
  const skills = contentService.getSkills(level);
  res.status(200).json({
    count: skills.length,
    skills
  });
});

apiRouter.get('/curriculum/prerequisites', (_req: Request, res: Response) => {
  const skills = contentService.getSkills();
  const graph = skills.map(s => ({
    id: s.id,
    name: s.name,
    level: s.level,
    prerequisites: s.prerequisites,
    masteryThreshold: s.masteryThreshold
  }));
  res.status(200).json({ graph });
});

// 5. Next Activity
apiRouter.get('/activities/next', (req: Request, res: Response) => {
  const level = (Number(req.query.level) || 1) as LearningLevel;
  const type = req.query.type as any;
  const exclude = req.query.exclude ? String(req.query.exclude).split(',') : [];

  const activity = contentService.getNextActivityForLearner(level, exclude, type);
  res.status(200).json(activity);
});

// 6. Submit Activity Answer / Attempt
const submitAnswerHandler = (req: Request, res: Response) => {
  const activityId = req.params.id || req.body.activityId;
  const { learnerId, answer, usedHint } = req.body;

  if (!learnerId || !activityId || answer === undefined) {
    res.status(400).json({ error: 'learnerId, activityId, and answer are required' });
    return;
  }

  try {
    const result = learningEngineService.submitAnswer(
      learnerId,
      activityId,
      String(answer),
      Boolean(usedHint)
    );
    res.status(200).json(result);
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
};
apiRouter.post('/activities/answer', submitAnswerHandler);
apiRouter.post('/activities/:id/attempts', submitAnswerHandler);

// 7. Feelings Check-in (SEL direct endpoint)
apiRouter.post('/sel/checkin', (req: Request, res: Response) => {
  const { emotionId } = req.body;
  if (!emotionId) {
    res.status(400).json({ error: 'emotionId is required' });
    return;
  }

  const result = selService.getEmotionCheckinResponse(emotionId);
  res.status(200).json(result);
});

// 8. Parent / Teacher Summary
const getParentSummaryHandler = (req: Request, res: Response) => {
  const { learnerId } = req.params;
  const summary = learningEngineService.getParentSummary(learnerId);
  res.status(200).json(summary);
};
apiRouter.get('/parent/summary/:learnerId', getParentSummaryHandler);
apiRouter.get('/parent/learners/:learnerId/summary', getParentSummaryHandler);

// 9. Reset Learner Progress (Parent action)
apiRouter.post('/learners/:learnerId/reset', (req: Request, res: Response) => {
  const { learnerId } = req.params;
  const level = (Number(req.body.level) || 1) as LearningLevel;
  const progress = storage.resetLearnerProgress(learnerId, level);
  res.status(200).json({ message: 'Progress successfully reset', progress });
});

// 10. Delete Learner Data (Privacy / GDPR-K / COPPA compliance)
apiRouter.delete('/learners/:learnerId/data', (req: Request, res: Response) => {
  const { learnerId } = req.params;
  storage.deleteLearnerData(learnerId);
  res.status(200).json({ message: 'All learner data permanently deleted' });
});

// 11. Health & Readiness Checks
apiRouter.get('/ready', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ready',
    timestamp: new Date().toISOString(),
    contentLoaded: contentService.getSkills().length > 0
  });
});

// 11. Health Check
apiRouter.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    features: {
      llmConfigured: llmProviderService.isAvailable(),
      activeProvider: llmProviderService.getActiveProviderName(),
      levelsSupported: [1, 2, 3],
      modesSupported: ['LEARNING', 'CONVERSATION', 'ENGAGEMENT', 'SUPPORT', 'IDLE'],
      contentCount: {
        vocab: contentService.getVocabulary().length,
        quizzes: contentService.getAllActivities().length
      }
    }
  });
});
