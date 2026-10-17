import { storage } from './storage.service.js';
import { modeDetectionService } from './mode-detection.service.js';
import { safetyService } from './safety.service.js';
import { selService } from './sel.service.js';
import { learningEngineService } from './learning-engine.service.js';
import { contentService } from './content.service.js';
import { llmProviderService } from './llm-provider.service.js';
import type {
  ChatRequest,
  ChatResponse,
  Activity,
  InteractionMode,
  LearningLevel
} from '@chatbot/shared';

export class ConversationOrchestratorService {
  async processMessage(req: ChatRequest): Promise<ChatResponse> {
    const startTime = performance.now();
    const learnerId = req.learnerId;
    const rawMessage = req.message || '';

    // 1. Fetch learner, progress, and session
    let learner = storage.getLearner(learnerId);
    if (!learner) {
      learner = storage.saveLearner({
        id: learnerId,
        nickname: 'Explorer',
        avatar: 'owl',
        level: 1,
        createdAt: new Date().toISOString(),
        stars: 0,
        badges: ['Welcome Friend'],
        preferences: {
          audioAutoPlay: true,
          theme: 'playful',
          favoriteTopics: ['colors', 'animals']
        }
      });
    }

    const progress = storage.getProgress(learnerId);
    const session = storage.getSession(learnerId);

    // 2. Safety filter on user input
    const safetyCheck = safetyService.checkInput(rawMessage);
    if (!safetyCheck.isSafe && safetyCheck.overrideResponse) {
      session.recentTurns.push(
        { sender: 'child', text: safetyCheck.sanitizedMessage, timestamp: new Date().toISOString() },
        { sender: 'companion', text: safetyCheck.overrideResponse, timestamp: new Date().toISOString(), mode: 'SUPPORT' }
      );
      storage.saveSession(session);

      return {
        message: safetyCheck.overrideResponse,
        mode: 'SUPPORT',
        level: learner.level,
        quickReplies: ['I will tell a grown-up', 'Play a game', 'Hear a story'],
        safetyAction: safetyCheck.action,
        latencyMs: Math.round(performance.now() - startTime),
        metadata: {
          modeReason: 'Safety guardrail triggered by sensitive content.',
          usedFallback: true,
          provider: 'safety-rule-engine'
        }
      };
    }

    // 3. Child Mode Classification
    const modeResult = modeDetectionService.classify(safetyCheck.sanitizedMessage, session, progress);
    session.currentMode = modeResult.mode;

    // 4. Update session history turns (keep last 6 to prevent context bloat and keep latency low)
    session.recentTurns.push({
      sender: 'child',
      text: safetyCheck.sanitizedMessage,
      timestamp: new Date().toISOString(),
      mode: modeResult.mode
    });
    if (session.recentTurns.length > 6) {
      session.recentTurns = session.recentTurns.slice(-6);
    }

    // 5. Check if this is an answer submission for an active activity
    if (req.currentActivityId && modeResult.mode === 'LEARNING') {
      const answerResult = learningEngineService.submitAnswer(
        learnerId,
        req.currentActivityId,
        safetyCheck.sanitizedMessage
      );

      session.currentActivityId = undefined;
      if (answerResult.isCorrect) {
        session.consecutiveIncorrectAnswers = 0;
      } else {
        session.consecutiveIncorrectAnswers += 1;
      }
      storage.saveSession(session);

      const feedback = answerResult.isCorrect
        ? `🌟 Fantastic job! ${answerResult.explanation} You earned ${answerResult.starsEarned} star${answerResult.starsEarned > 1 ? 's' : ''}!`
        : `Almost! ${answerResult.explanation} Don't worry, every try helps you grow!`;

      return {
        message: feedback,
        mode: 'LEARNING',
        level: answerResult.progress.level,
        quickReplies: ['Next Question!', 'Tell me a story', 'Check my stars!'],
        progressUpdate: {
          starsEarned: answerResult.starsEarned,
          newBadge: answerResult.newBadge,
          levelUp: answerResult.levelUp,
          accuracy: answerResult.progress.totalAttempts > 0
            ? Math.round((answerResult.progress.totalCorrect / answerResult.progress.totalAttempts) * 100)
            : 100
        },
        latencyMs: Math.round(performance.now() - startTime),
        metadata: {
          modeReason: 'Processed activity answer submission.',
          usedFallback: true,
          provider: 'learning-engine'
        }
      };
    }

    // 6. Check Social & Emotional Learning (SEL)
    const selResult = selService.evaluateMessage(safetyCheck.sanitizedMessage);
    if (selResult) {
      session.currentMode = selResult.suggestedMode;
      session.recentTurns.push({
        sender: 'companion',
        text: selResult.response,
        timestamp: new Date().toISOString(),
        mode: selResult.suggestedMode
      });
      storage.saveSession(session);

      return {
        message: selResult.response,
        mode: selResult.suggestedMode,
        level: learner.level,
        quickReplies: selResult.quickReplies,
        latencyMs: Math.round(performance.now() - startTime),
        metadata: {
          modeReason: `SEL triggered for emotion: ${selResult.emotion}`,
          usedFallback: true,
          provider: 'sel-engine'
        }
      };
    }

    // 7. Mode-Specific Response Strategies
    let companionMessage = '';
    let nextActivity: Activity | undefined;
    let quickReplies: string[] = [];
    let usedFallback = true;
    let provider = 'deterministic-engine';

    if (modeResult.mode === 'LEARNING') {
      nextActivity = contentService.getNextActivityForLearner(learner.level);
      session.currentActivityId = nextActivity.id;
      companionMessage = `Ready for a fun challenge? ${nextActivity.question}`;
      quickReplies = nextActivity.choices ? nextActivity.choices.map(c => c.text) : ['Yes!', 'Give me a hint'];
    } else if (modeResult.mode === 'SUPPORT') {
      const frustration = selService.getFrustrationRecoveryPrompt();
      companionMessage = frustration.response;
      quickReplies = frustration.quickReplies;
    } else if (modeResult.mode === 'ENGAGEMENT') {
      companionMessage = "Would you like to hear a funny animal story, do a quick star dance, or take a little rest?";
      quickReplies = ['Hear a fun story', 'Let’s dance!', 'Take a break'];
    } else if (modeResult.mode === 'IDLE') {
      companionMessage = `Hi ${learner.nickname}! 🦉 I'm Pip, your English companion! Are you ready to explore some fun words together?`;
      quickReplies = ["Let's learn!", 'How are you feeling?', 'Tell me a story'];
    } else {
      // CONVERSATION Mode: Attempt LLM first if available, with deterministic fallback
      if (llmProviderService.isAvailable()) {
        const systemPrompt = `You are Pip, a gentle, cheerful English-teaching companion for a child aged 3-6 at Level ${learner.level}. Use simple vocabulary, high warmth, short sentences (maximum 2 sentences). Praise curiosity. Never use scary words, sarcasm, or complex grammar. Encourage learning English happily.`;
        const llmResponse = await llmProviderService.generateChildResponse({
          systemPrompt,
          userPrompt: safetyCheck.sanitizedMessage,
          level: learner.level,
          timeoutMs: 1400
        });

        if (llmResponse && llmResponse.content) {
          companionMessage = safetyService.validateOutput(llmResponse.content, learner.level);
          usedFallback = false;
          provider = llmResponse.provider;
        }
      }

      // Fallback if LLM was unavailable or timed out
      if (!companionMessage) {
        companionMessage = this.generateDeterministicConversation(safetyCheck.sanitizedMessage, learner.level);
        usedFallback = true;
        provider = 'deterministic-fallback';
      }

      quickReplies = ["Let's learn a word!", 'Tell me a secret story', 'How do you feel?'];
    }

    // Save turn to session
    session.recentTurns.push({
      sender: 'companion',
      text: companionMessage,
      timestamp: new Date().toISOString(),
      mode: modeResult.mode
    });
    storage.saveSession(session);

    const totalLatency = Math.round(performance.now() - startTime);

    return {
      message: companionMessage,
      mode: modeResult.mode,
      level: learner.level,
      activity: nextActivity,
      quickReplies,
      latencyMs: totalLatency,
      metadata: {
        modeReason: modeResult.reason,
        usedFallback,
        provider
      }
    };
  }

  private generateDeterministicConversation(userText: string, level: LearningLevel): string {
    const raw = userText.toLowerCase();

    if (raw.includes('who are you') || raw.includes('your name')) {
      return "I'm Pip! 🦉 I'm your playful owl buddy who loves helping you discover awesome English words!";
    }
    if (raw.includes('favorite color') || raw.includes('colour')) {
      return "I love sunny yellow and sky blue! ☀️ What is your favorite color in the whole world?";
    }
    if (raw.includes('favorite animal') || raw.includes('animal')) {
      return "I love friendly puppies and fluffy kittens! 🐶 🐱 Do you have a favorite pet?";
    }
    if (raw.includes('weather') || raw.includes('rain') || raw.includes('sun')) {
      return "Looking at the sky is so much fun! Whether it's sunny or rainy, every day is a learning adventure!";
    }
    if (raw.includes('thank')) {
      return "You are so very welcome! Being kind makes my heart sing! 💖";
    }

    // Level-specific general conversation fallbacks
    if (level === 1) {
      return "That sounds so neat! You are learning great English words. Shall we play with colors or numbers?";
    } else if (level === 2) {
      return "That is wonderful to hear! I love chatting with you. Would you like to practice action words or animal names?";
    } else {
      return "What an imaginative thing to share! Talking in English is such a super adventure with you. What shall we explore next?";
    }
  }
}

export const conversationOrchestratorService = new ConversationOrchestratorService();
