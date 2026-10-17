import { contentService, type SelScenario } from './content.service.js';
import type { InteractionMode } from '@chatbot/shared';

export interface SelEvaluationResult {
  isSelTriggered: boolean;
  emotion?: string;
  response: string;
  quickReplies: string[];
  suggestedMode: InteractionMode;
}

export class SelService {
  evaluateMessage(message: string): SelEvaluationResult | null {
    const raw = message.trim().toLowerCase();
    const scenarios = contentService.getSelScenarios();

    for (const scenario of scenarios) {
      const match = scenario.triggerPhrases.some(phrase => raw.includes(phrase));
      if (match) {
        return {
          isSelTriggered: true,
          emotion: scenario.emotion,
          response: scenario.response,
          quickReplies: scenario.quickReplies,
          suggestedMode: 'SUPPORT'
        };
      }
    }

    return null;
  }

  getEmotionCheckinResponse(emotionId: string): SelEvaluationResult {
    const scenarios = contentService.getSelScenarios();
    const scenario = scenarios.find(s => s.emotion.toLowerCase() === emotionId.toLowerCase()) || scenarios[0];

    return {
      isSelTriggered: true,
      emotion: scenario.emotion,
      response: scenario.response,
      quickReplies: scenario.quickReplies,
      suggestedMode: scenario.emotion === 'happy' || scenario.emotion === 'excited' ? 'CONVERSATION' : 'SUPPORT'
    };
  }

  getFrustrationRecoveryPrompt(): { response: string; quickReplies: string[] } {
    return {
      response:
        "You're doing great just by trying! 🌟 Mistakes are just puzzle pieces that help us learn. How about we look at an easier clue together?",
      quickReplies: ["Show me a hint", "Try an easier one", "Let's take a break"]
    };
  }
}

export const selService = new SelService();
