import { GoogleGenAI } from '@google/genai';
import type { ChecklistItem, TutorialMaterial } from '@/lib/types/database';

export type TranslationLanguage =
  | 'fr'
  | 'en_us'
  | 'en_uk'
  | 'es'
  | 'de'
  | 'ru'
  | 'pt'
  | 'zh';

export interface TranslationLanguageInfo {
  code: TranslationLanguage;
  name: string;
  nativeName: string;
  flag: string;
}

export const SUPPORTED_TRANSLATION_LANGUAGES: TranslationLanguageInfo[] = [
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'en_us', name: 'English (US)', nativeName: 'English (US)', flag: '🇺🇸' },
  { code: 'en_uk', name: 'English (UK)', nativeName: 'English (UK)', flag: '🇬🇧' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
];

export interface TranslatedStep {
  order_index: number;
  label: string;
  section: string;
  note?: string | null;
}

export interface TranslatedPatternContent {
  title: string;
  target_language: TranslationLanguage;
  materials?: TutorialMaterial[];
  sections: string[];
  steps: TranslatedStep[];
}

export interface TranslatePatternInput {
  tutorialId: string;
  title: string;
  sourceLanguage?: string;
  targetLanguage: TranslationLanguage;
  materials?: TutorialMaterial[];
  sections: string[];
  steps: Array<{
    id?: string;
    order_index: number;
    label: string;
    section: string;
    note?: string | null;
  }>;
}

export interface TranslatePatternResult {
  content: TranslatedPatternContent;
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    modelUsed: string;
  };
}

const CROCHET_TRANSLATOR_SYSTEM_INSTRUCTION = `You are a master technical crochet translator for "Step by Stitch".
Your task is to accurately translate structured crochet patterns, steps, stitch abbreviations, sections, and materials into the target language.

TECHNICAL CROCHET DICTIONARY & CONVERSIONS:
1. US English ➔ French:
   - sc (single crochet) ➔ ms (maille serrée)
   - inc (increase) ➔ aug (augmentation)
   - dec / sc2tog (decrease) ➔ dim (diminution)
   - dc (double crochet) ➔ br (bride)
   - hdc (half double crochet) ➔ db (demi-bride)
   - tr (treble crochet) ➔ dbr (double bride)
   - sl st (slip stitch) ➔ mc (maille coulée)
   - ch (chain) ➔ ml (maille en l'air / maille chaînette)
   - MR (magic ring) ➔ CM (cercle magique)
   - BLO (back loop only) ➔ BAR (brin arrière uniquement)
   - FLO (front loop only) ➔ BAV (brin avant uniquement)
   - Round / Row ➔ Tour / Rang
   - FO / Fasten off ➔ Couper et rentrer le fil / Arrêter le fil

2. UK English ➔ French:
   - dc (double crochet) ➔ ms (maille serrée) [WARNING: UK dc = US sc = FR ms]
   - htr (half treble) ➔ db (demi-bride)
   - tr (treble) ➔ br (bride)
   - dtr (double treble) ➔ dbr (double bride)
   - ss (slip stitch) ➔ mc (maille coulée)
   - ch ➔ ml
   - MR ➔ CM
   - Round / Row ➔ Tour / Rang

3. French ➔ US English:
   - ms ➔ sc
   - aug ➔ inc
   - dim ➔ dec
   - br ➔ dc
   - db ➔ hdc
   - dbr ➔ tr
   - mc ➔ sl st
   - ml ➔ ch
   - CM ➔ MR
   - BAR ➔ BLO
   - BAV ➔ FLO
   - Tour / Rang ➔ Round / Row (always write "Round", NEVER "Rnd")

4. French ➔ UK English:
   - ms ➔ dc
   - aug ➔ inc
   - dim ➔ dec
   - br ➔ tr
   - db ➔ htr
   - mc ➔ ss
   - ml ➔ ch
   - CM ➔ MR
   - Tour / Rang ➔ Round / Row (always write "Round", NEVER "Rnd")

5. Spanish (ES) Standard:
   - pb / mp (punto bajo) = sc / ms
   - aum (aumento) = inc / aug
   - dism / dim (disminución) = dec / dim
   - pa (punto alto) = dc / br
   - mpa (medio punto alto) = hdc / db
   - pe / pr (punto enano / raso) = sl st / mc
   - cad (cadena) = ch / ml
   - am (anillo mágico) = MR / CM

6. German (DE) Standard:
   - fM (feste Masche) = sc / ms
   - Zun (Zunahme) = inc / aug
   - Abn (Abnahme) = dec / dim
   - Stb (Stäbchen) = dc / br
   - hStb (halbes Stäbchen) = hdc / db
   - KM (Kettmasche) = sl st / mc
   - Lm (Luftmasche) = ch / ml
   - MR / Fadenring = MR / CM

7. Russian (RU) Standard:
   - сбн (столбик без накида) = sc / ms
   - пр (прибавка) = inc / aug
   - уб (убавка) = dec / dim
   - ссн (столбик с накидом) = dc / br
   - пссн (полустолбик с накидом) = hdc / db
   - сс (соединительный столбик) = sl st / mc
   - вп (воздушная петля) = ch / ml
   - КА (кольцо амигуруми) = MR / CM

8. Portuguese (PT) Standard:
   - pb (ponto baixo) = sc / ms
   - aum (aumento) = inc / aug
   - dim (diminuição) = dec / dim
   - pa (ponto alto) = dc / br
   - mpa (meio ponto alto) = hdc / db
   - pbx (ponto baixíssimo) = sl st / mc
   - corr (correntinha) = ch / ml
   - am (anel mágico) = MR / CM

9. Chinese (ZH) Standard:
   - X (短针) = sc / ms
   - V (加针) = inc / aug
   - A (减针) = dec / dim
   - F / T (长针/中长针) = dc / hdc
   - SL / W (引拔针) = sl st / mc
   - CH (锁针) = ch / ml
   - MR (起针环) = MR / CM

CRITICAL UX & TECHNICAL RULES:
1. **STRICT CANONICAL VOCABULARY — ZERO TOLERANCE FOR HYBRID TERMS**:
   - You MUST use ONLY the exact standard abbreviations defined in the dictionary table above for the target language.
   - For French target: NEVER generate "hdb" or "hdc" — ALWAYS generate "db" for demi-bride.
   - For US English target: ALWAYS use "sc, hdc, dc, tr, sl st, ch, MR, inc, dec, BLO, FLO".
   - For UK English target: ALWAYS use "dc, htr, tr, dtr, ss, ch, MR, inc, dec, BLO, FLO".

2. **STRICT 1:1 PRESERVATION OF ORDER_INDEX**:
   - You MUST return every single step with its exact original \`order_index\`.
   - Never skip or reorder steps.

3. **PRESERVE STITCH COUNTS IN BRACKETS**:
   - Always preserve the exact stitch counts in brackets at the end of each row (e.g. "[18]"). Do not translate numbers.

3. **ACCURATELY TRANSLATE SECTIONS**:
   - "Tête" ➔ "Head" / "Cabeza" / "Kopf"
   - "Corps" ➔ "Body" / "Cuerpo" / "Körper"
   - "Jambe 1" ➔ "Leg 1" / "Pierna 1" / "Bein 1"
   - "Jambe 2" ➔ "Leg 2" / "Pierna 2" / "Bein 2"
   - "Assemblage & Finitions" ➔ "Assembly & Finishing" / "Montaje" / "Zusammennähen"

4. Return structured JSON matching the provided schema.`;

const CROCHET_TRANSLATION_JSON_SCHEMA = {
  type: 'object',
  properties: {
    title: {
      type: 'string',
      description: 'Translated title of the pattern.',
    },
    materials: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          quantity: { type: 'string' },
          details: { type: 'string' },
        },
        required: ['name'],
      },
      description: 'Translated list of materials, tools, and yarn.',
    },
    sections: {
      type: 'array',
      items: { type: 'string' },
      description: 'Ordered list of translated section names.',
    },
    steps: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          order_index: {
            type: 'integer',
            description: 'The exact 0-based sequential order_index from the source pattern.',
          },
          label: {
            type: 'string',
            description: 'The translated stitch instructions with standard target terminology.',
          },
          section: {
            type: 'string',
            description: 'The translated section name this step belongs to.',
          },
          note: {
            type: 'string',
            description: 'Translated tips or color notes if present.',
          },
        },
        required: ['order_index', 'label', 'section'],
      },
      description: 'All translated checklist steps in exact sequential order.',
    },
  },
  required: ['title', 'sections', 'steps'],
};

const DEFAULT_MODELS = ['gemini-3.6-flash', 'gemini-2.0-flash'];
const PRIMARY_MODEL = process.env.GEMINI_MODEL || DEFAULT_MODELS[0];

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in environment variables.');
  }
  return new GoogleGenAI({ apiKey });
}

/**
 * Translates a structured crochet pattern into the specified target language using Gemini.
 */
export async function translateCrochetPatternWithGemini(
  input: TranslatePatternInput
): Promise<TranslatePatternResult> {
  const startTime = Date.now();
  const ai = getAiClient();

  const targetLangInfo = SUPPORTED_TRANSLATION_LANGUAGES.find(
    (l) => l.code === input.targetLanguage
  );
  const targetLangLabel = targetLangInfo
    ? `${targetLangInfo.name} (${targetLangInfo.nativeName})`
    : input.targetLanguage;

  const payloadToTranslate = {
    title: input.title,
    sourceLanguage: input.sourceLanguage || 'auto',
    targetLanguage: input.targetLanguage,
    targetLanguageDescription: targetLangLabel,
    materials: input.materials || [],
    sections: input.sections,
    steps: input.steps.map((s) => ({
      order_index: s.order_index,
      label: s.label,
      section: s.section,
      note: s.note,
    })),
  };

  const promptText = `Please translate this crochet pattern into ${targetLangLabel}.\n` +
    `Ensure all stitch abbreviations adhere to standard ${targetLangLabel} crochet notation.\n\n` +
    `PATTERN PAYLOAD TO TRANSLATE:\n` +
    JSON.stringify(payloadToTranslate, null, 2);

  const modelsToTry = [
    PRIMARY_MODEL,
    ...DEFAULT_MODELS.filter((m) => m !== PRIMARY_MODEL),
  ];

  let lastError: any = null;

  for (let i = 0; i < modelsToTry.length; i++) {
    const model = modelsToTry[i];
    try {
      console.log(`[AI Translator] 🌐 Translating pattern "${input.title}" to "${input.targetLanguage}" using model "${model}"...`);

      const response = await ai.models.generateContent({
        model,
        contents: [
          {
            role: 'user',
            parts: [{ text: promptText }],
          },
        ],
        config: {
          systemInstruction: CROCHET_TRANSLATOR_SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseSchema: CROCHET_TRANSLATION_JSON_SCHEMA,
          temperature: 0.1, // High deterministic precision for crochet math and abbreviations
        },
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error('Gemini returned an empty translation response.');
      }

      const parsedJson = JSON.parse(responseText);

      // Validate step count
      const inputStepCount = input.steps.length;
      const outputStepCount = parsedJson.steps ? parsedJson.steps.length : 0;
      console.log(
        `[AI Translator] ✅ Translation finished in ${Date.now() - startTime}ms. Steps: ${outputStepCount}/${inputStepCount}`
      );

      const usage = {
        inputTokens: response.usageMetadata?.promptTokenCount || 0,
        outputTokens: response.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: response.usageMetadata?.totalTokenCount || 0,
        modelUsed: model,
      };

      return {
        content: {
          title: parsedJson.title || input.title,
          target_language: input.targetLanguage,
          materials: parsedJson.materials || input.materials,
          sections: parsedJson.sections || input.sections,
          steps: parsedJson.steps || [],
        },
        usage,
      };
    } catch (err: any) {
      console.warn(`[AI Translator] ⚠️ Model "${model}" failed during translation:`, err.message);
      lastError = err;
    }
  }

  throw new Error(`Failed to translate crochet pattern with Gemini: ${lastError?.message || 'Unknown error'}`);
}
