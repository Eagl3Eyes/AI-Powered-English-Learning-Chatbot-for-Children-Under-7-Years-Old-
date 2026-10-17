export interface LlmCompletionRequest {
  systemPrompt: string;
  userPrompt: string;
  level: 1 | 2 | 3;
  timeoutMs?: number;
}

export interface LlmCompletionResponse {
  content: string;
  provider: 'gemini' | 'openai' | 'none';
  latencyMs: number;
}

export class LlmProviderService {
  private geminiKey: string | undefined;
  private openAiKey: string | undefined;

  constructor() {
    this.geminiKey = process.env.GEMINI_API_KEY;
    this.openAiKey = process.env.OPENAI_API_KEY;
  }

  isAvailable(): boolean {
    return Boolean(this.geminiKey || this.openAiKey);
  }

  async generateChildResponse(req: LlmCompletionRequest): Promise<LlmCompletionResponse | null> {
    const timeoutMs = req.timeoutMs || 1500;
    const startTime = performance.now();

    // If Gemini key is available
    if (this.geminiKey) {
      try {
        const result = await Promise.race([
          this.callGemini(req),
          new Promise<null>((_, reject) => setTimeout(() => reject(new Error('LLM Timeout')), timeoutMs))
        ]);
        if (result) {
          return {
            content: result,
            provider: 'gemini',
            latencyMs: Math.round(performance.now() - startTime)
          };
        }
      } catch (err) {
        // Fall back gracefully on error or timeout
      }
    }

    // If OpenAI key is available
    if (this.openAiKey) {
      try {
        const result = await Promise.race([
          this.callOpenAi(req),
          new Promise<null>((_, reject) => setTimeout(() => reject(new Error('LLM Timeout')), timeoutMs))
        ]);
        if (result) {
          return {
            content: result,
            provider: 'openai',
            latencyMs: Math.round(performance.now() - startTime)
          };
        }
      } catch (err) {
        // Fall back gracefully
      }
    }

    return null;
  }

  private async callGemini(req: LlmCompletionRequest): Promise<string | null> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.geminiKey}`;
    const payload = {
      systemInstruction: {
        parts: [{ text: req.systemPrompt }]
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: req.userPrompt }]
        }
      ],
      generationConfig: {
        temperature: 0.6,
        maxOutputTokens: 120
      }
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) return null;
    const data = (await res.json()) as any;
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return text ? text.trim() : null;
  }

  private async callOpenAi(req: LlmCompletionRequest): Promise<string | null> {
    const url = 'https://api.openai.com/v1/chat/completions';
    const payload = {
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: req.systemPrompt },
        { role: 'user', content: req.userPrompt }
      ],
      temperature: 0.6,
      max_tokens: 120
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.openAiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) return null;
    const data = (await res.json()) as any;
    const text = data?.choices?.[0]?.message?.content;
    return text ? text.trim() : null;
  }
}

export const llmProviderService = new LlmProviderService();
