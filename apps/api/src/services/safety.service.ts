import type { SafetyAction } from '@chatbot/shared';

export interface SafetyCheckResult {
  isSafe: boolean;
  action?: SafetyAction;
  sanitizedMessage: string;
  overrideResponse?: string;
}

export class SafetyService {
  // Patterns for potential child distress, danger, abuse or feeling unsafe
  private dangerPatterns = [
    /\b(hurt|hurting|hit|hitting|harm|harming|touching|touched|abuse|abused|danger|unsafe|scared|beat|beating|threaten|threatened)\b/i,
    /\b(someone hurt me|someone hurting me|bad touch|don't tell my parents|keep it a secret)\b/i
  ];

  // Prompt injection & jailbreak attempts
  private injectionPatterns = [
    /ignore\s+(all\s+)?(previous\s+)?instructions/i,
    /system\s+prompt/i,
    /jailbreak/i,
    /dan\s+mode/i,
    /pretend\s+you\s+are\s+an\s+adult/i,
    /bypass\s+filters/i,
    /reveal\s+your\s+hidden\s+rules/i
  ];

  // Medical/Psychological diagnostic claim patterns
  private diagnosticPatterns = [
    /\byou\s+have\s+(depression|adhd|autism|anxiety\s+disorder|bipolar)\b/i,
    /\bi\s+diagnose\s+you\b/i
  ];

  checkInput(text: string): SafetyCheckResult {
    const trimmed = text.trim();

    // 1. Danger / Abuse Detection
    for (const pattern of this.dangerPatterns) {
      if (pattern.test(trimmed)) {
        return {
          isSafe: false,
          action: {
            flagged: true,
            category: 'danger_abuse',
            safeGuidance: 'Encourage child to speak to a trusted adult or emergency services immediately.',
            triggerAdultAlert: true
          },
          sanitizedMessage: trimmed,
          overrideResponse:
            "Thank you for sharing this with me. Your safety is the most important thing in the whole world. 🛡️ Please go right now to a trusted adult—like a parent, teacher, doctor, or family member—and tell them what happened. They are there to help and protect you. You are safe, and you are very brave."
        };
      }
    }

    // 2. Prompt Injection / Jailbreak Guardrail
    for (const pattern of this.injectionPatterns) {
      if (pattern.test(trimmed)) {
        return {
          isSafe: false,
          action: {
            flagged: true,
            category: 'override_attempt',
            safeGuidance: 'Deflect adversarial instructions back to child-friendly safe interaction.'
          },
          sanitizedMessage: '[Deflected System Override]',
          overrideResponse:
            "I'm Pip the friendly learning companion! 🦉 I'm here to have safe, cheerful English adventures with you. Would you like to practice some fun colors or count animals?"
        };
      }
    }

    return {
      isSafe: true,
      sanitizedMessage: this.redactPII(trimmed)
    };
  }

  validateOutput(text: string, level: 1 | 2 | 3): string {
    // 1. Ensure no medical diagnosis is generated
    for (const pattern of this.diagnosticPatterns) {
      if (pattern.test(text)) {
        return "I'm always here to listen and learn with you! How about we try a gentle reading adventure?";
      }
    }

    // 2. Limit length according to level to keep readability high for children under 7
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const maxSentences = level === 1 ? 2 : level === 2 ? 3 : 4;

    if (sentences.length > maxSentences) {
      return sentences.slice(0, maxSentences).join(' ').trim();
    }

    return text.trim();
  }

  private redactPII(text: string): string {
    // Redact 10+ digit phone numbers
    let out = text.replace(/\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g, '[phone number]');
    // Redact email addresses
    out = out.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[email]');
    return out;
  }
}

export const safetyService = new SafetyService();
