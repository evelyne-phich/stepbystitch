import { GoogleGenAI } from '@google/genai';
import {
  CROCHET_PARSER_SYSTEM_INSTRUCTION,
  CROCHET_PATTERN_JSON_SCHEMA,
  type ParsedCrochetPattern,
} from './prompts';

export interface ParsePatternInput {
  files?: Array<{
    buffer: Buffer;
    mimeType: string;
    fileName?: string;
  }>;
  rawText?: string;
  userHint?: string;
}

export interface ParsePatternResult {
  pattern: ParsedCrochetPattern;
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    modelUsed: string;
  };
}

const DEFAULT_MODELS = ['gemini-3.6-flash', 'gemini-2.0-flash'];
const PRIMARY_MODEL = process.env.GEMINI_MODEL || DEFAULT_MODELS[0];

/**
 * Initializes GoogleGenAI client
 */
function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('[AI Client] ❌ GEMINI_API_KEY environment variable is not configured.');
    throw new Error('GEMINI_API_KEY is not configured in environment variables.');
  }
  return new GoogleGenAI({ apiKey });
}

/**
 * Parses a crochet pattern from multimodal inputs (PDFs, images, or raw text)
 * with automatic fallback if the primary model is unavailable.
 */
export async function parsePatternWithGemini(
  input: ParsePatternInput
): Promise<ParsePatternResult> {
  const startTime = Date.now();
  const ai = getAiClient();
  const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];

  // 1. Add files (PDF, images) as inline base64 parts
  if (input.files && input.files.length > 0) {
    for (const file of input.files) {
      const base64Data = file.buffer.toString('base64');
      parts.push({
        inlineData: {
          mimeType: file.mimeType,
          data: base64Data,
        },
      });
    }
  }

  // 2. Add text prompt / raw pattern text / user notes
  let textPrompt = 'Please analyze this crochet pattern and generate the full structured JSON checklist.\n';
  if (input.rawText && input.rawText.trim()) {
    textPrompt += `\n--- RAW PATTERN TEXT ---\n${input.rawText.trim()}\n--- END RAW TEXT ---\n`;
  }
  if (input.userHint && input.userHint.trim()) {
    textPrompt += `\nUser additional note: ${input.userHint.trim()}`;
  }

  parts.push({ text: textPrompt });

  // 3. Try models in resilient sequence
  const modelsToTry = [
    PRIMARY_MODEL,
    ...DEFAULT_MODELS.filter((m) => m !== PRIMARY_MODEL),
  ];

  let lastError: any = null;

  for (let i = 0; i < modelsToTry.length; i++) {
    const model = modelsToTry[i];
    try {
      console.log(`[AI Parser] 🧶 Executing crochet pattern extraction with model "${model}"...`);

      const response = await ai.models.generateContent({
        model,
        contents: [
          {
            role: 'user',
            parts: parts as any,
          },
        ],
        config: {
          systemInstruction: CROCHET_PARSER_SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseSchema: CROCHET_PATTERN_JSON_SCHEMA as any,
          temperature: 0.1,
        },
      });

      const duration = Date.now() - startTime;
      const responseText = response.text || '';

      if (!responseText) {
        throw new Error('No content returned from AI model.');
      }

      // Token metrics
      const inputTokens = response.usageMetadata?.promptTokenCount || 0;
      const outputTokens = response.usageMetadata?.candidatesTokenCount || 0;
      const totalTokens = response.usageMetadata?.totalTokenCount || inputTokens + outputTokens;

      console.log(
        `[AI Parser] ✅ Pattern parsed successfully with "${model}" in ${duration}ms | Tokens: prompt=${inputTokens}, output=${outputTokens}, total=${totalTokens}`
      );

      const parsedPattern: ParsedCrochetPattern = JSON.parse(responseText);

      return {
        pattern: parsedPattern,
        usage: {
          inputTokens,
          outputTokens,
          totalTokens,
          modelUsed: model,
        },
      };
    } catch (error: any) {
      lastError = error;
      console.warn(`[AI Parser] ⚠️ Failed with model "${model}": ${error.message || error}`);
      if (i < modelsToTry.length - 1) {
        console.log(`[AI Parser] 🔄 Retrying with fallback model "${modelsToTry[i + 1]}"...`);
      }
    }
  }

  const duration = Date.now() - startTime;
  console.error(`[AI Parser] ❌ All models failed after ${duration}ms.`);
  throw lastError || new Error('Failed to parse crochet pattern with AI models.');
}
