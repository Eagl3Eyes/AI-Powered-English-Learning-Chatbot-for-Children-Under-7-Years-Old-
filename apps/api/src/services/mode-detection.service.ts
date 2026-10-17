import type { InteractionMode, SessionContext, LearningProgress } from '@chatbot/shared';

export interface ModeClassificationResult {
  mode: InteractionMode;
  reason: string;
  confidence: number;
  suggestedAction?: 'continue_learning' | 'simplify_question' | 'offer_break' | 'empathy_support' | 'natural_chat' | 'exit_activity';
}

export class ModeDetectionService {
  classify(
    message: string,
    session: SessionContext,
    progress: LearningProgress
  ): ModeClassificationResult {
    const raw = message.trim().toLowerCase();

    // 1. Explicit requests to STOP or EXIT learning
    if (this.isStopRequest(raw)) {
      return {
        mode: 'CONVERSATION',
        reason: 'Child explicitly requested to stop learning or take a break; respecting autonomy.',
        confidence: 0.98,
        suggestedAction: 'exit_activity'
      };
    }

    // 2. SUPPORT Mode: Frustration, sadness, helplessness, or needing reassurance
    if (this.isFrustrationOrDistress(raw, session)) {
      return {
        mode: 'SUPPORT',
        reason: 'Detected distress, feelings of inadequacy, or repeated failure requiring emotional support.',
        confidence: 0.95,
        suggestedAction: 'empathy_support'
      };
    }

    // 3. ENGAGEMENT Mode: Boredom, repeated disengagement ("idk", "meh", "..."), or disengagement streaks
    if (this.isDisengagement(raw, session)) {
      return {
        mode: 'ENGAGEMENT',
        reason: 'Detected low engagement or repetitive non-substantive responses; offering playful break or mini story.',
        confidence: 0.90,
        suggestedAction: 'offer_break'
      };
    }

    // 4. Explicit LEARNING Requests
    if (this.isLearningRequest(raw, session)) {
      return {
        mode: 'LEARNING',
        reason: 'Child explicitly initiated or continued an educational practice lesson.',
        confidence: 0.95,
        suggestedAction: session.consecutiveIncorrectAnswers >= 2 ? 'simplify_question' : 'continue_learning'
      };
    }

    // 5. GREETING / IDLE Mode: Initial hello, session greeting
    if (this.isGreeting(raw, session)) {
      return {
        mode: 'IDLE',
        reason: 'Friendly opening greeting or icebreaker without an active lesson.',
        confidence: 0.92,
        suggestedAction: 'natural_chat'
      };
    }

    // 6. CONVERSATION Mode: Ordinary questions, sharing personal stories, pets, weather, feelings
    return {
      mode: 'CONVERSATION',
      reason: 'General child-led conversation or open-ended inquiry.',
      confidence: 0.85,
      suggestedAction: 'natural_chat'
    };
  }

  private isStopRequest(text: string): boolean {
    const stopTriggers = [
      'stop',
      'stop lesson',
      'exit',
      'quit',
      'i want to stop',
      'no more',
      'enough',
      'bye',
      'goodbye',
      'i am done',
      'pause'
    ];
    return stopTriggers.some(t => text === t || text.startsWith(t + ' ') || text.endsWith(' ' + t));
  }

  private isFrustrationOrDistress(text: string, session: SessionContext): boolean {
    const frustrationPatterns = [
      'i can\'t',
      'cant do this',
      'too hard',
      'i give up',
      'i am sad',
      'i am crying',
      'i hate this',
      'stupid',
      'i am bad at this',
      'help me please',
      'i feel bad',
      'so hard'
    ];

    if (frustrationPatterns.some(p => text.includes(p))) {
      return true;
    }

    // Consecutive errors without asking for help can signal silent frustration
    if (session.consecutiveIncorrectAnswers >= 3) {
      return true;
    }

    return false;
  }

  private isDisengagement(text: string, session: SessionContext): boolean {
    const disengagementPhrases = ['idk', 'dunno', 'boring', 'bored', 'meh', 'whatever', 'no', '...', 'um', 'uh'];
    const exactMatch = disengagementPhrases.includes(text) || text.length <= 2;

    if (exactMatch && session.consecutiveDisengagementCount >= 1) {
      return true;
    }

    return text.includes('bored') || text.includes('this is boring');
  }

  private isLearningRequest(text: string, session: SessionContext): boolean {
    const learningKeywords = [
      'learn',
      'teach me',
      'practice',
      'quiz',
      'question',
      'next word',
      'ready',
      'game',
      'lets play a quiz',
      'start learning',
      'next activity',
      'story'
    ];

    if (learningKeywords.some(k => text.includes(k))) {
      return true;
    }

    // If currently inside an active learning activity and submitted an answer choice
    if (session.currentActivityId && session.currentMode === 'LEARNING') {
      return true;
    }

    return false;
  }

  private isGreeting(text: string, session: SessionContext): boolean {
    const greetings = ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'pip', 'hiya', 'sup'];
    const words = text.split(/\s+/);
    return words.length <= 3 && greetings.some(g => text.includes(g));
  }
}

export const modeDetectionService = new ModeDetectionService();
