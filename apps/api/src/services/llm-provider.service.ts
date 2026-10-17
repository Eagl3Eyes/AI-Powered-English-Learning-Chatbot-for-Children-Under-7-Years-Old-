import type { InteractionMode } from '@chatbot/shared';

export interface ChildLlmContext {
  level: 1 | 2 | 3;
  learnerNickname: string;
  userPrompt: string;
  activeActivity?: {
    id: string;
    type: string;
    question: string;
    hint?: string;
  };
  recentTurns?: Array<{ sender: string; text: string }>;
  masterySummary?: string;
  timeoutMs?: number;
}

export interface LlmCompletionResponse {
  message: string;
  detectedIntent?: InteractionMode;
  suggestedReplies?: string[];
  provider: 'gemini' | 'openai' | 'groq';
  modelName: string;
  latencyMs: number;
}

export class LlmProviderService {
  private getKeys() {
    return {
      geminiKey: process.env.GEMINI_API_KEY?.trim(),
      openAiKey: process.env.OPENAI_API_KEY?.trim(),
      groqKey: process.env.GROQ_API_KEY?.trim()
    };
  }

  isAvailable(): boolean {
    const { geminiKey, openAiKey, groqKey } = this.getKeys();
    return Boolean(geminiKey || openAiKey || groqKey);
  }

  getActiveProviderName(): string {
    const { groqKey, geminiKey, openAiKey } = this.getKeys();
    if (groqKey) return 'Groq (Llama-3.1-8B-Instant)';
    if (geminiKey) return 'Google Gemini 1.5 Flash';
    if (openAiKey) return 'OpenAI GPT-4o-mini';
    return 'Deterministic Safety Engine (Zero Credentials Needed)';
  }

  async generateChildResponse(ctx: ChildLlmContext): Promise<LlmCompletionResponse | null> {
    const timeoutMs = ctx.timeoutMs || 1500;
    const { groqKey, geminiKey, openAiKey } = this.getKeys();

    // Provider Priority: Groq (<200ms latency) -> Gemini (ultra cost-effective) -> OpenAI
    if (groqKey) {
      const res = await this.executeWithTimeout(() => this.callGroq(ctx, groqKey), timeoutMs);
      if (res) return res;
    }

    if (geminiKey) {
      const res = await this.executeWithTimeout(() => this.callGemini(ctx, geminiKey), timeoutMs);
      if (res) return res;
    }

    if (openAiKey) {
      const res = await this.executeWithTimeout(() => this.callOpenAi(ctx, openAiKey), timeoutMs);
      if (res) return res;
    }

    return null;
  }

  private async executeWithTimeout(
    fn: () => Promise<LlmCompletionResponse | null>,
    timeoutMs: number
  ): Promise<LlmCompletionResponse | null> {
    try {
      return await Promise.race([
        fn(),
        new Promise<null>((_, reject) => setTimeout(() => reject(new Error('LLM Timeout')), timeoutMs))
      ]);
    } catch {
      return null;
    }
  }

  private buildSystemPrompt(ctx: ChildLlmContext): string {
    const ageDesc = ctx.level === 1 ? 'Ages 3-4 (Level 1: Foundations)' : ctx.level === 2 ? 'Ages 4-5 (Level 2: Growing Skills)' : 'Ages 5-6 (Level 3: Early Comprehension)';
    const maxWords = ctx.level === 1 ? 15 : ctx.level === 2 ? 22 : 30;

    return `You are Pip, a cheerful, wise little owl companion helping a young child learn English.
Learner: "${ctx.learnerNickname}" | Development Stage: ${ageDesc}.
Pedagogical Rules:
1. Keep your reply VERY short (1-2 sentences maximum, strictly under ${maxWords} words).
2. Use warm, simple, encouraging vocabulary. Never use formal grammar terminology or technical explanations.
3. If the child is sad, crying, or frustrated, prioritize empathy and reassurance over teaching.
4. If the child asks an open question, answer enthusiastically and ask one playful follow-up question.
5. If the child mentions learning or asks a quiz question, offer joyful encouragement.
6. Provide output ONLY in valid JSON matching this schema:
{
  "detectedIntent": "LEARNING" | "CONVERSATION" | "ENGAGEMENT" | "SUPPORT",
  "message": "...",
  "suggestedReplies": ["short reply 1", "short reply 2"]
}`;
  }

  private buildUserMessage(ctx: ChildLlmContext): string {
    const parts: string[] = [];
    if (ctx.activeActivity) {
      parts.push(`[Active Practice: "${ctx.activeActivity.question}" (Type: ${ctx.activeActivity.type})]`);
    }
    if (ctx.masterySummary) {
      parts.push(`[Learner Mastery Context: ${ctx.masterySummary}]`);
    }
    if (ctx.recentTurns && ctx.recentTurns.length > 0) {
      const historyStr = ctx.recentTurns.slice(-4).map(t => `${t.sender}: ${t.text}`).join('\n');
      parts.push(`[Recent Context:\n${historyStr}]`);
    }
    parts.push(`Child message: "${ctx.userPrompt}"`);
    return parts.join('\n\n');
  }

  private parseStructuredOutput(
    rawText: string,
    provider: 'gemini' | 'openai' | 'groq',
    modelName: string,
    latencyMs: number
  ): LlmCompletionResponse {
    try {
      const cleanJson = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      if (parsed.message && typeof parsed.message === 'string') {
        return {
          message: parsed.message.trim(),
          detectedIntent: parsed.detectedIntent,
          suggestedReplies: Array.isArray(parsed.suggestedReplies) ? parsed.suggestedReplies.slice(0, 3) : undefined,
          provider,
          modelName,
          latencyMs
        };
      }
    } catch {
      // If LLM returned raw text rather than JSON, wrap it cleanly
    }

    return {
      message: rawText.replace(/[{"}]+/g, ' ').trim(),
      provider,
      modelName,
      latencyMs
    };
  }

  private async callGemini(ctx: ChildLlmContext, apiKey: string): Promise<LlmCompletionResponse | null> {
    const startTime = performance.now();
    const model = 'gemini-1.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const payload = {
      systemInstruction: {
        parts: [{ text: this.buildSystemPrompt(ctx) }]
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: this.buildUserMessage(ctx) }]
        }
      ],
      generationConfig: {
        temperature: 0.5,
        maxOutputTokens: 120,
        responseMimeType: 'application/json'
      }
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) return null;
    const data = (await res.json()) as any;
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) return null;

    const latencyMs = Math.round(performance.now() - startTime);
    return this.parseStructuredOutput(rawText, 'gemini', model, latencyMs);
  }

  private async callGroq(ctx: ChildLlmContext, apiKey: string): Promise<LlmCompletionResponse | null> {
    const startTime = performance.now();
    const model = 'llama-3.1-8b-instant';
    const url = 'https://api.groq.com/openai/v1/chat/completions';

    const payload = {
      model,
      messages: [
        { role: 'system', content: this.buildSystemPrompt(ctx) },
        { role: 'user', content: this.buildUserMessage(ctx) }
      ],
      temperature: 0.5,
      max_tokens: 120,
      response_format: { type: 'json_object' }
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) return null;
    const data = (await res.json()) as any;
    const rawText = data?.choices?.[0]?.message?.content;
    if (!rawText) return null;

    const latencyMs = Math.round(performance.now() - startTime);
    return this.parseStructuredOutput(rawText, 'groq', model, latencyMs);
  }

  private async callOpenAi(ctx: ChildLlmContext, apiKey: string): Promise<LlmCompletionResponse | null> {
    const startTime = performance.now();
    const model = 'gpt-4o-mini';
    const url = 'https://api.openai.com/v1/chat/completions';

    const payload = {
      model,
      messages: [
        { role: 'system', content: this.buildSystemPrompt(ctx) },
        { role: 'user', content: this.buildUserMessage(ctx) }
      ],
      temperature: 0.5,
      max_tokens: 120,
      response_format: { type: 'json_object' }
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) return null;
    const data = (await res.json()) as any;
    const rawText = data?.choices?.[0]?.message?.content;
    if (!rawText) return null;

    const latencyMs = Math.round(performance.now() - startTime);
    return this.parseStructuredOutput(rawText, 'openai', model, latencyMs);
  }
}

export const llmProviderService = new LlmProviderService();
