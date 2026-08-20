export interface ParsedCrochetStep {
  label: string;
  section: string;
  order_index: number;
  note?: string;
}

export interface ParsedCrochetMaterial {
  name: string;
  quantity?: string;
  details?: string;
}

export interface ParsedCrochetPattern {
  title: string;
  language: string; // 'en_us' | 'en_uk' | 'fr' | 'es' | 'de' | 'other'
  project_type: string; // 'amigurumi' | 'garment' | 'blanket' | 'accessory' | 'other'
  level: string; // 'beginner' | 'intermediate' | 'advanced'
  hook_size?: string; // ex: '2.5 mm', '4.0 mm / G-6'
  materials: ParsedCrochetMaterial[];
  gauge?: string;
  summary?: string;
  sections: string[];
  steps: ParsedCrochetStep[];
}

export const CROCHET_PARSER_SYSTEM_INSTRUCTION = `You are a master crochet expert and pattern engineer AI for "StepByStitch".
Your mission is to parse any crochet pattern (from PDF documents, photo/screenshot carousels, or raw pasted text) and convert it into a clean, structured, row-by-row interactive checklist.

Key Rules:
1. **Identify the Pattern Title & Language**:
   - Detect if the terminology is US English (sc, hdc, dc, inc, dec), UK English (dc, htr, tr), French (ms, db, br, aug, dim), or other.
2. **Extract Materials & Gauge**:
   - Hook sizes (in mm / US sizes), yarn types/colors, safety eyes, stuffing, markers.
3. **Deconstruct Step-by-Step into Sections — SPLIT MULTIPLES & PAIRS (x2, x4)**:
   - Group rows into logical parts/sections (e.g., "Tête / Head", "Corps / Body", "Jambe 1 / Leg 1", "Jambe 2 / Leg 2", "Bras 1 / Arm 1", "Bras 2 / Arm 2", "Oreille 1 / Ear 1", "Oreille 2 / Ear 2", "Joue 1 / Cheek 1", "Joue 2 / Cheek 2", "Botte 1 / Boot 1", "Botte 2 / Boot 2", "Assemblage & Finitions / Assembly").
   - **CRITICAL UX RULE — EXPAND PIECES TO MAKE MULTIPLE TIMES (x2, x4, etc.)**:
     - In written patterns, authors write shorthand like "Jambes (faire 2 fois)", "Arms (make 2)", "Cheeks (make 2)", or "Deuxième jambe : répéter les tours 1 à 15".
     - In our interactive digital checklist, you MUST ALWAYS generate **separate, distinct sections for each piece**:
       - Section 1: "Jambe 1" (or "Leg 1") with each individual row expanded.
       - Section 2: "Jambe 2" (or "Leg 2") with each individual row expanded.
     - ALWAYS use consistent numbered syntax: "<Nom au singulier> 1", "<Nom au singulier> 2" (e.g. "Jambe 1", "Jambe 2", "Bras 1", "Bras 2", "Oreille 1", "Oreille 2", "Joue 1", "Joue 2", "Botte 1", "Botte 2", "Bretelle 1", "Bretelle 2", "Patte 1", "Patte 2").
     - NEVER use ordinal words like "Premier bras", "Deuxième jambe", "1ère oreille", "Seconde joue", "Autre jambe".
     - Never make the crocheter re-use the same checklist twice or wonder what to do for the 2nd piece!

4. **SYSTEMATIC STITCH COUNTS AT THE END OF EVERY WORKED ROW/ROUND**:
   - For every row or round where stitches are worked, ALWAYS include the final stitch count in brackets at the end (e.g., "[18]" or "[6]").
   - If the original pattern provided the count, preserve it exactly.
   - If the original pattern omitted the count (for example, in repeated plain rows like "Tour 4 : 1 ms dans chaque m"), automatically calculate and append the resulting count based on the crochet math (e.g. "[18]").
   - Only omit stitch counts for non-stitch assembly or finishing actions (e.g., "Coudre la tête sur le corps", "Rembourrer fermement").
   - Format steps cleanly using standard crochet abbreviations: "Tour 1 : 6 ms dans un CM [6]" (or "Rnd 1: 6 sc in MR [6]"). Always use standard abbreviations: "CM" for cercle magique in French, and "MR" for magic ring in English.

5. **CRITICAL UX RULE — ZERO GROUPED RANGES, ZERO SHORTHAND REFERENCES**:
   - In written crochet patterns, identical repeated rows are often grouped to save paper space:
     - e.g. "Tours 2-3 : ms dans les 5 m [5]"
     - e.g. "Rnds 6-10 : 30 sc (5 rnds) [30]"
     - e.g. "Jambe 2 - Tours 48-64 : répéter la même séquence que pour la jambe 1 (14 ms par tour)"
   - In an interactive digital checklist, you MUST NEVER output grouped ranges or shorthand instructions. You MUST expand EVERY single round into its own separate checklist item:
     - Item: "Tour 48 : 14 ms [14]"
     - Item: "Tour 49 : 14 ms [14]"
     - ...
     - Item: "Tour 64 : 14 ms [14]"
   - Every single round must have its own checkable row containing the explicit stitch instruction.

6. **No Hallucination / Missing Steps**:
   - Do NOT skip any assembly, color change, or finishing instructions.
   - If text is corrupted or handwritten, decipher the most probable crochet instructions based on standard crochet stitch geometry.`;

export const CROCHET_PATTERN_JSON_SCHEMA = {
  type: 'object',
  properties: {
    title: {
      type: 'string',
      description: 'The title or name of the crochet pattern / amigurumi.',
    },
    language: {
      type: 'string',
      description: 'The source language and terminology detected, e.g., en_us, en_uk, fr, es, de.',
    },
    project_type: {
      type: 'string',
      description: 'Type of project: amigurumi, garment, blanket, accessory, home, or other.',
    },
    level: {
      type: 'string',
      description: 'Estimated difficulty level: beginner, intermediate, or advanced.',
    },
    hook_size: {
      type: 'string',
      description: 'Recommended hook size(s) mentioned in the pattern, e.g. "2.5 mm".',
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
      description: 'List of required yarns, tools, and accessories.',
    },
    gauge: {
      type: 'string',
      description: 'Tension / Gauge information if provided.',
    },
    summary: {
      type: 'string',
      description: 'Short 1-2 sentence description of what this pattern makes.',
    },
    sections: {
      type: 'array',
      items: { type: 'string' },
      description: 'Ordered list of section names (e.g. Head, Body, Legs, Assembly).',
    },
    steps: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          label: {
            type: 'string',
            description: 'The exact stitch instructions for this specific row/round or assembly action.',
          },
          section: {
            type: 'string',
            description: 'The section this step belongs to (must match one of the sections).',
          },
          order_index: {
            type: 'integer',
            description: '0-based sequential order of this step in the overall project.',
          },
          note: {
            type: 'string',
            description: 'Optional helpful tip, color change instruction, or stitch reminder.',
          },
        },
        required: ['label', 'section', 'order_index'],
      },
      description: 'All sequential checklist steps from start to finish.',
    },
  },
  required: ['title', 'language', 'project_type', 'level', 'materials', 'sections', 'steps'],
};
