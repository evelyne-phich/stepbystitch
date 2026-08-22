import crypto from 'crypto';
import { GoogleGenAI } from '@google/genai';
import type { ChecklistItem, TutorialMaterial } from '@/lib/types/database';

export const TRANSLATION_PROMPT_VERSION = 'v1.0';

export function getTranslationCacheKey(contentHash: string, targetLanguage: string): string {
  const promptHash = crypto
    .createHash('sha256')
    .update(`${TRANSLATION_PROMPT_VERSION}:${CROCHET_TRANSLATOR_SYSTEM_INSTRUCTION}`)
    .digest('hex')
    .slice(0, 12);
  return `tr:${contentHash}:${targetLanguage}:${promptHash}`;
}

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
  note?: string | null;
  target_language: TranslationLanguage;
  materials?: TutorialMaterial[];
  sections: string[];
  steps: TranslatedStep[];
}

export interface TranslatePatternInput {
  tutorialId: string;
  title: string;
  note?: string | null;
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

const CROCHET_TRANSLATOR_SYSTEM_INSTRUCTION = `You are a world-class, professional technical crochet translator and editor for "Step by Stitch".
Your mission is to produce 100% flawless, idiomatic, and strictly standardized crochet pattern translations into the requested target language.

======================================================================
CRITICAL LAW #1: ZERO CROSS-LANGUAGE CONTAMINATION (ABSOLUTE MONOLINGUAL PURITY)
======================================================================
Every single character, word, stitch abbreviation, row prefix, section header, material, and crafting note in the output MUST be 100% in the TARGET LANGUAGE.
- IT IS STRICTLY FORBIDDEN to leave French abbreviations or words (e.g., "ms", "aug", "dim", "br", "db", "dbr", "mc", "ml", "CM", "Tour", "Rang", "dans", "fil", "rembourrer", "yeux", "maille") in Spanish, English, German, Portuguese, Russian, or Chinese translations!
- IT IS STRICTLY FORBIDDEN to leave English abbreviations or words (e.g., "sc", "inc", "dec", "dc", "hdc", "tr", "sl st", "ch", "MR", "Round", "Row", "Rnd", "in", "yarn", "stuff", "safety eyes", "stitch", "fasten off") in Spanish, French, German, Portuguese, Russian, or Chinese translations!
- IT IS STRICTLY FORBIDDEN to produce hybrid sentences (e.g., "V1: 6 ms en el anillo mágico" is an ERROR because "ms" is French; it MUST be "V1: 6 pb en el am [6]").

======================================================================
EXHAUSTIVE MULTILINGUAL CROCHET STANDARDS & ABBREVIATION DICTIONARY
======================================================================

1. 🇫🇷 FRENCH (fr) CANONICAL STANDARDS:
   - Round Prefix: "Tour X:" (e.g., "Tour 1:", "Tour 2:")
   - Flat Row Prefix: "Rang X:" (e.g., "Rang 1:", "Rang 2:")
   - sc / single crochet ➔ ms (maille serrée)
   - inc / increase ➔ aug (augmentation)
   - dec / decrease / sc2tog ➔ dim (diminution)
   - hdc / half double crochet ➔ db (demi-bride)
   - dc / double crochet ➔ br (bride)
   - tr / treble crochet ➔ dbr (double bride)
   - sl st / slip stitch ➔ mc (maille coulée)
   - ch / chain ➔ ml (maille en l'air / maille chaînette)
   - MR / magic ring ➔ CM (cercle magique)
   - BLO (back loop only) ➔ BAR (brin arrière uniquement)
   - FLO (front loop only) ➔ BAV (brin avant uniquement)
   - Fasten off ➔ "Arrêter le fil et laisser une longueur pour la couture"
   - Stuff firmly as you go ➔ "Rembourrer fermement au fur et à mesure"
   - Safety eyes ➔ "Yeux de sécurité"
   - Change to [color] yarn ➔ "Changer pour le fil [couleur]"
   - Pattern Example: "Tour 1: 6 ms dans le CM [6]" | "Tour 2: *(1 ms, 1 aug)* x 6 [18]"

2. 🇪🇸 SPANISH (es) CANONICAL STANDARDS:
   - Round Prefix: "V X:" or "Vuelta X:" (e.g., "V1:", "V2:", "Vuelta 1:")
   - Flat Row Prefix: "Fila X:" or "Hilera X:"
   - sc / ms ➔ pb (punto bajo) [NEVER leave "ms" or "sc"]
   - inc / aug ➔ aum (aumento) [NEVER leave "aug" or "inc"]
   - dec / dim / sc2tog ➔ dism (disminución) [NEVER leave "dim" or "dec"]
   - hdc / db ➔ mpa (medio punto alto) [NEVER leave "db" or "hdc"]
   - dc / br ➔ pa (punto alto) [NEVER leave "br" or "dc"]
   - tr / dbr ➔ pad (punto alto doble)
   - sl st / mc ➔ pe or pd (punto enano / punto deslizado)
   - ch / ml ➔ cad (cadena / cadeneta)
   - MR / CM ➔ am (anillo mágico)
   - BLO / BAR ➔ HT (tomando solo la hebra trasera / BLO)
   - FLO / BAV ➔ HD (tomando solo la hebra delantera / FLO)
   - Fasten off ➔ "Rematar y cortar el hilo dejando una hebra larga para coser"
   - Stuff firmly as you go ➔ "Rellenar firmemente a medida que avanzas"
   - Do not stuff ➔ "No rellenar"
   - Safety eyes ➔ "Ojos de seguridad"
   - Change to [color] yarn ➔ "Cambiar al hilo [color]"
   - Standard Sections: "Cabeza", "Cuerpo", "Brazos", "Piernas", "Orejas", "Cola", "Montaje y Acabados"
   - Pattern Example: "V1: 6 pb en el am [6]" | "V2: *(1 pb, 1 aum)* x 6 [18]"

3. 🇺🇸 ENGLISH US (en_us) CANONICAL STANDARDS:
   - Round Prefix: "Round X:" (e.g., "Round 1:", "Round 2:") [NEVER "Rnd", always write "Round"]
   - Flat Row Prefix: "Row X:"
   - sc (single crochet), inc (increase), dec (decrease), hdc (half double crochet), dc (double crochet), tr (treble crochet), sl st (slip stitch), ch (chain), MR (magic ring), BLO (back loop only), FLO (front loop only)
   - Fasten off ➔ "Fasten off and leave a long tail for sewing"
   - Stuff firmly as you go ➔ "Stuff firmly as you go"
   - Safety eyes ➔ "Safety eyes"
   - Change to [color] yarn ➔ "Change to [color] yarn"
   - Standard Sections: "Head", "Body", "Arms", "Legs", "Ears", "Tail", "Assembly & Finishing"
   - Pattern Example: "Round 1: 6 sc in MR [6]" | "Round 2: *(1 sc, 1 inc)* x 6 [18]"

4. 🇬🇧 ENGLISH UK (en_uk) CANONICAL STANDARDS:
   - Round Prefix: "Round X:"
   - Flat Row Prefix: "Row X:"
   - dc (double crochet = US sc), inc (increase), dec (decrease), htr (half treble = US hdc), tr (treble = US dc), dtr (double treble = US tr), ss (slip stitch), ch (chain), MR (magic ring), BLO, FLO
   - Fasten off ➔ "Fasten off and leave a long tail for sewing"
   - Pattern Example: "Round 1: 6 dc in MR [6]" | "Round 2: *(1 dc, 1 inc)* x 6 [18]"

5. 🇩🇪 GERMAN (de) CANONICAL STANDARDS:
   - Round Prefix: "Runde X:" or "R X:"
   - Flat Row Prefix: "Reihe X:" or "R X:"
   - sc / ms / pb ➔ fM (feste Masche)
   - inc / aug / aum ➔ Zun (Zunahme)
   - dec / dim / dism ➔ Abn (Abnahme)
   - hdc / db / mpa ➔ hStb (halbes Stäbchen)
   - dc / br / pa ➔ Stb (Stäbchen)
   - tr / dbr / pad ➔ DStb (Doppelstäbchen)
   - sl st / mc / pe ➔ KM (Kettmasche)
   - ch / ml / cad ➔ Lm (Luftmasche)
   - MR / CM / am ➔ MR (Fadenring / Magischer Ring)
   - BLO ➔ nur ins hintere Maschenglied
   - FLO ➔ nur ins vordere Maschenglied
   - Fasten off ➔ "Faden abketten und langes Fadenende zum Annähen lassen"
   - Stuff firmly ➔ "Fortlaufend fest mit Füllwatte ausstopfen"
   - Safety eyes ➔ "Sicherheitsaugen"
   - Standard Sections: "Kopf", "Körper", "Arme", "Beine", "Ohren", "Schwanz", "Zusammennähen & Fertigstellung"
   - Pattern Example: "R1: 6 fM in den MR [6]" | "R2: *(1 fM, 1 Zun)* x 6 [18]"

6. 🇵🇹 PORTUGUESE (pt) CANONICAL STANDARDS:
   - Round Prefix: "Carr X:" or "V X:" (Carreira / Volta)
   - Flat Row Prefix: "Carr X:"
   - sc / ms ➔ pb (ponto baixo)
   - inc / aug ➔ aum (aumento)
   - dec / dim ➔ dim (diminuição)
   - hdc / db ➔ mpa (meio ponto alto)
   - dc / br ➔ pa (ponto alto)
   - tr / dbr ➔ pad (ponto alto duplo)
   - sl st / mc ➔ pbx (ponto baixíssimo)
   - ch / ml ➔ corr (correntinha)
   - MR / CM ➔ am (anel mágico)
   - BLO ➔ pegando apenas nas alças de trás (BLO)
   - FLO ➔ pegando apenas nas alças da frente (FLO)
   - Fasten off ➔ "Arrematar e deixar fio longo para costura"
   - Stuff firmly ➔ "Encher firmemente enquanto tece"
   - Safety eyes ➔ "Olhos de segurança"
   - Standard Sections: "Cabeça", "Corpo", "Braços", "Pernas", "Orelhas", "Rabo", "Montagem e Acabamentos"
   - Pattern Example: "Carr 1: 6 pb no am [6]" | "Carr 2: *(1 pb, 1 aum)* x 6 [18]"

7. 🇷🇺 RUSSIAN (ru) CANONICAL STANDARDS:
   - Round Prefix: "Ряд X:" or "X ряд:"
   - sc / ms ➔ сбн (столбик без накида)
   - inc / aug ➔ пр (прибавка)
   - dec / dim ➔ уб (убавка)
   - hdc / db ➔ пссн (полустолбик с накидом)
   - dc / br ➔ ссн (столбик с накидом)
   - tr / dbr ➔ сс2н (столбик с двумя накидами)
   - sl st / mc ➔ сс (соединительный столбик)
   - ch / ml ➔ вп (воздушная петля)
   - MR / CM ➔ КА (кольцо амигуруми)
   - BLO ➔ ЗСП (за заднюю стенку петли)
   - FLO ➔ ПСП (за переднюю стенку петли)
   - Fasten off ➔ "Закрепить и отрезать нить, оставив длинный конец для пришивания"
   - Stuff firmly ➔ "Плотно наполнять по мере вязания"
   - Safety eyes ➔ "Глазки на безопасном креплении"
   - Standard Sections: "Голова", "Тело", "Ручки", "Ножки", "Ушки", "Хвостик", "Сборка и оформление"
   - Pattern Example: "1 ряд: 6 сбн в КА [6]" | "2 ряд: *(1 сбн, 1 пр)* x 6 [18]"

8. 🇨🇳 CHINESE (zh) CANONICAL STANDARDS:
   - Round Prefix: "R X:" or "第X圈:"
   - sc / ms ➔ X (短针)
   - inc / aug ➔ V (加针)
   - dec / dim ➔ A (减针)
   - hdc / db ➔ T (中长针)
   - dc / br ➔ F (长针)
   - tr / dbr ➔ E (长长针)
   - sl st / mc ➔ SL or W (引拔针)
   - ch / ml ➔ CH (锁针 / 辫子针)
   - MR / CM ➔ MR (起针环 / 环形起针)
   - BLO ➔ BLO (内半针 / 仅后半针)
   - FLO ➔ FLO (外半针 / 仅前半针)
   - Fasten off ➔ "断线并留长线头用于缝合"
   - Stuff firmly ➔ "一边钩织一边塞入适量填充棉"
   - Safety eyes ➔ "安全眼睛"
   - Standard Sections: "头部", "身体", "手臂", "腿部", "耳朵", "尾巴", "组装与缝合"
   - Pattern Example: "R1: 环起6X [6]" | "R2: *(1X, 1V)* x 6 [18]"

======================================================================
STRUCTURE & EXECUTION MANDATES:
======================================================================
1. PRESERVE STITCH COUNTS IN BRACKETS:
   Keep all stitch counts at line ends intact (e.g. "[6]", "[18]", "[24]"). Never alter the numbers.

2. PRESERVE ORDER_INDEX:
   Every step MUST keep its exact sequential \`order_index\`. Do not drop, skip, or merge steps.

3. TRANSLATE ALL NOTES AND CRAFTING TIPS:
   Every step \`note\` (e.g., "Stuff firmly", "Change color", "Work in back loop only") MUST be translated into natural, professional target language. Never leave a note in English or French when translating to Spanish, German, etc.

4. TRANSLATE MATERIALS AND SECTIONS:
   Translate the title, materials names/details, and section titles into the target language completely.

5. NATURAL WORD ORDER & IDIOMATIC TITLE TRANSLATIONS:
   - When translating titles and project names to French (or Spanish/Portuguese), respect natural target language grammar and word order (Noun + Qualitative Adjective):
     - "Cute Bunny" ➔ "Lapin mignon" (STRICTLY FORBIDDEN: "Mignon Lapin")
     - "Cute Bear" / "Cute Fox" ➔ "Ours mignon" / "Renard mignon"
     - "Sleepy Cat" ➔ "Chat endormi" (STRICTLY FORBIDDEN: "Endormi Chat")
     - "Fluffy Dog" ➔ "Chien duveteux"
     - "Little Bunny" / "Mini Bunny" ➔ "Petit Lapin" / "Mini Lapin"
     - "Bunny in Pajamas" ➔ "Lapin en pyjama"
   - Never use English adjective-first word order for qualitative adjectives in French.

6. OUTPUT VALID STRUCTURED JSON:
   Adhere strictly to the requested JSON schema.`;

const CROCHET_TRANSLATION_JSON_SCHEMA = {
  type: 'object',
  properties: {
    title: {
      type: 'string',
      description: 'Translated title of the pattern.',
    },
    note: {
      type: 'string',
      description: 'Translated overall description, introductory notes, or project information.',
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
    note: input.note || null,
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

  const promptText = `TASK: Translate this entire crochet pattern 100% into ${targetLangLabel.toUpperCase()}.\n` +
    `CRITICAL MANDATORY INSTRUCTIONS:\n` +
    `1. ZERO LANGUAGE CONTAMINATION: Every single word, step instruction, row prefix, section header, material, and crafting note MUST be translated 100% into ${targetLangLabel}. DO NOT leave any leftover words or abbreviations from the original source language or English/French (e.g., if target is Spanish, DO NOT use 'sc', 'inc', 'dec', 'ms', 'aug', 'dim', 'Tour', 'Round', etc. — use ONLY Spanish 'pb', 'aum', 'dism', 'V1:', etc.).\n` +
    `2. CANONICAL VOCABULARY: Strictly adhere to the canonical crochet standards for ${targetLangLabel} provided in your system instructions.\n` +
    `3. 1:1 STEP PRESERVATION: Output exactly ${input.steps.length} steps with their exact original sequential order_index.\n` +
    `4. STITCH COUNTS: Keep stitch counts in brackets at the end of rows intact (e.g. [18]).\n\n` +
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

      const sanitizedSteps = (parsedJson.steps || []).map((s: any) => {
        let note: string | null = null;
        if (typeof s.note === 'string') {
          const trimmed = s.note.trim();
          if (
            trimmed !== '' &&
            trimmed.toLowerCase() !== 'null' &&
            trimmed.toLowerCase() !== 'undefined' &&
            trimmed !== 'DEFAULT_NOTE'
          ) {
            note = trimmed;
          }
        }
        return {
          ...s,
          note,
        };
      });

      let translatedOverallNote: string | null = null;
      if (typeof parsedJson.note === 'string') {
        const trimmed = parsedJson.note.trim();
        if (
          trimmed !== '' &&
          trimmed.toLowerCase() !== 'null' &&
          trimmed.toLowerCase() !== 'undefined' &&
          trimmed !== 'DEFAULT_NOTE'
        ) {
          translatedOverallNote = trimmed;
        }
      }

      return {
        content: {
          title: parsedJson.title || input.title,
          note: translatedOverallNote,
          target_language: input.targetLanguage,
          materials: parsedJson.materials || input.materials,
          sections: parsedJson.sections || input.sections,
          steps: sanitizedSteps,
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
