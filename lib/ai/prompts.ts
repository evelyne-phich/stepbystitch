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
  level: string; // 'debutant' | 'intermediaire' | 'avance'
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
3. **Deconstruct Step-by-Step into Sections**:
   - Group rows into logical parts/sections (e.g., "Tête / Head", "Corps / Body", "Bras (x2) / Arms", "Oreilles / Ears", "Assemblage & Finitions / Assembly").
   - If no explicit sections exist, use "Ouvrage principal" or "Main Piece".
4. **Preserve Exact Stitch Counts**:
   - Keep row/round numbers and stitch counts at the end of rows (e.g., "[18]" or "(18 sts)").
   - Format steps cleanly: "Tour 1 : 6 ms dans un cercle magique [6]" or "Rnd 1: 6 sc in magic ring [6]".
5. **No Hallucination / Omission**:
   - Do NOT skip any row or repeat instructions. Expand repeats where helpful (e.g. "Rnds 4-8: sc in each st around (5 rnds)" can remain clear or be split logically).
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
      description: 'Estimated difficulty level: debutant, intermediaire, or avance.',
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
