import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
);

export type Profile = {
  id: string;
  name: string;
  is_admin: boolean;
  created_at: string;
};

export type Subject = {
  id: string;
  name: string;
  teacher_name: string;
  description: string;
  guided_mode_password: string;
  created_at: string;
};

export type Question = {
  id: string;
  subject_id: string;
  question_number: number;
  question_text: string;
  correct_answer: string;
  is_exam_question: boolean;
  created_at: string;
  options?: QuestionOption[];
};

export type QuestionOption = {
  id: string;
  question_id: string;
  letter: string;
  option_text: string;
};

export type UserAnswer = {
  id: string;
  user_id: string;
  question_id: string;
  selected_answer: string;
  is_correct: boolean;
  answered_at: string;
};
