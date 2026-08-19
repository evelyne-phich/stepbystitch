export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type SourceType = 'pdf' | 'screenshot' | 'manuscrit';
export type TranslationStatus = 'pending' | 'processing' | 'done' | 'failed';

export interface Profile {
  id: string;
  email: string;
  langue_preferee: string;
  full_name?: string | null;
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
  materials?: TutorialMaterial[] | null;
  gauge?: string | null;
  saved_at: string;
  updated_at: string;
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
  content: TranslationItem[];
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

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string; email: string };
        Update: Partial<Profile>;
      };
      tutorials: {
        Row: Tutorial;
        Insert: Omit<Tutorial, 'id' | 'saved_at' | 'updated_at'> & {
          id?: string;
          saved_at?: string;
          updated_at?: string;
        };
        Update: Partial<Tutorial>;
      };
      checklist_items: {
        Row: ChecklistItem;
        Insert: Omit<ChecklistItem, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<ChecklistItem>;
      };
      translations: {
        Row: Translation;
        Insert: Omit<Translation, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Translation>;
      };
      progress_counters: {
        Row: ProgressCounter;
        Insert: Omit<ProgressCounter, 'id' | 'updated_at'> & {
          id?: string;
          updated_at?: string;
        };
        Update: Partial<ProgressCounter>;
      };
    };
  };
}
