export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type SourceType = 'pdf' | 'image' | 'text';
export type TranslationStatus = 'pending' | 'processing' | 'done' | 'failed';

export interface AppSetting {
  key: string;
  value: Json;
  description?: string | null;
  updated_at: string;
}

export interface Profile {
  id: string;
  email: string;
  langue_preferee: string;
  full_name?: string | null;
  monthly_cap_override?: number | null;
  free_quota_override?: number | null;
  created_at: string;
  updated_at: string;
}

export interface TutorialMaterial {
  name: string;
  quantity?: string;
  details?: string;
}

export interface Tutorial {
  id: string;
  user_id: string;
  source_type: SourceType;
  file_path: string;
  file_name?: string | null;
  file_type?: string | null;
  title: string;
  note?: string | null;
  raw_content?: string | null;
  raw_content_language?: string | null;
  stitch?: string | null;
  level?: string | null;
  project_type?: string | null;
  materials?: TutorialMaterial[] | Json | null;
  gauge?: string | null;
  saved_at: string;
  updated_at: string;
}

export interface TutorialWithProgress extends Tutorial {
  totalSteps?: number;
  completedSteps?: number;
  progressPercent?: number;
  isCompleted?: boolean;
}

export interface ChecklistItem {
  id: string;
  tutorial_id: string;
  label: string;
  section: string;
  order_index: number;
  checked: boolean;
  note?: string | null;
  edited_by_user: boolean;
  created_at: string;
  updated_at: string;
}

export interface TranslationItem {
  order_index: number;
  original_label: string;
  translated_label: string;
  section: string;
  note?: string;
}

export interface Translation {
  id: string;
  tutorial_id: string;
  target_language: string;
  status: TranslationStatus;
  content: TranslationItem[] | Json;
  created_at: string;
  updated_at: string;
}

export interface ProgressCounter {
  id: string;
  tutorial_id: string;
  current_row: number;
  current_stitch: number;
  total_rows?: number | null;
  updated_at: string;
}

export interface AiUsage {
  id: string;
  user_id: string;
  action: 'parse_pattern' | 'translate_pattern';
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  model_used: string;
  created_at: string;
}

export interface PatternCache {
  content_hash: string;
  title: string;
  language?: string | null;
  project_type?: string | null;
  level?: string | null;
  stitch?: string | null;
  materials?: TutorialMaterial[] | Json | null;
  gauge?: string | null;
  summary?: string | null;
  sections: string[] | Json;
  steps: Json;
  created_at: string;
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: {
          id: string;
          email: string;
          langue_preferee?: string;
          full_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          langue_preferee?: string;
          full_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      tutorials: {
        Row: Tutorial;
        Insert: {
          id?: string;
          user_id: string;
          source_type: SourceType;
          file_path: string;
          file_name?: string | null;
          file_type?: string | null;
          title: string;
          note?: string | null;
          raw_content?: string | null;
          raw_content_language?: string | null;
          stitch?: string | null;
          level?: string | null;
          project_type?: string | null;
          materials?: TutorialMaterial[] | Json | null;
          gauge?: string | null;
          saved_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          source_type?: SourceType;
          file_path?: string;
          file_name?: string | null;
          file_type?: string | null;
          title?: string;
          note?: string | null;
          raw_content?: string | null;
          raw_content_language?: string | null;
          stitch?: string | null;
          level?: string | null;
          project_type?: string | null;
          materials?: TutorialMaterial[] | Json | null;
          gauge?: string | null;
          saved_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      checklist_items: {
        Row: ChecklistItem;
        Insert: {
          id?: string;
          tutorial_id: string;
          label: string;
          section?: string;
          order_index: number;
          checked?: boolean;
          note?: string | null;
          edited_by_user?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tutorial_id?: string;
          label?: string;
          section?: string;
          order_index?: number;
          checked?: boolean;
          note?: string | null;
          edited_by_user?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      translations: {
        Row: Translation;
        Insert: {
          id?: string;
          tutorial_id: string;
          target_language: string;
          status?: TranslationStatus;
          content?: TranslationItem[] | Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tutorial_id?: string;
          target_language?: string;
          status?: TranslationStatus;
          content?: TranslationItem[] | Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      progress_counters: {
        Row: ProgressCounter;
        Insert: {
          id?: string;
          tutorial_id: string;
          current_row?: number;
          current_stitch?: number;
          total_rows?: number | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tutorial_id?: string;
          current_row?: number;
          current_stitch?: number;
          total_rows?: number | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      ai_usage: {
        Row: AiUsage;
        Insert: {
          id?: string;
          user_id: string;
          action: 'parse_pattern' | 'translate_pattern';
          input_tokens?: number;
          output_tokens?: number;
          total_tokens?: number;
          model_used: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          action?: 'parse_pattern' | 'translate_pattern';
          input_tokens?: number;
          output_tokens?: number;
          total_tokens?: number;
          model_used?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
