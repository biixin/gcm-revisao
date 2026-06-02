/*
  # Core Schema for Question Review Platform
  
  ## Summary
  Creates the complete database schema for the Guarda Municipal de Duque de Caxias 
  question review platform.
  
  ## New Tables
  
  1. `profiles`
     - `id` (uuid, PK, references auth.users)
     - `name` (text)
     - `is_admin` (boolean, default false)
     - `created_at` (timestamptz)
  
  2. `subjects`
     - `id` (uuid, PK)
     - `name` (text) - subject name
     - `teacher_name` (text)
     - `description` (text)
     - `guided_mode_password` (text) - password to unlock guided mode
     - `created_at` (timestamptz)
  
  3. `questions`
     - `id` (uuid, PK)
     - `subject_id` (uuid, FK to subjects)
     - `question_number` (integer)
     - `question_text` (text)
     - `correct_answer` (text) - 'a', 'b', 'c', 'd', or 'e'
     - `is_exam_question` (boolean) - true if this question appeared in the actual exam
     - `created_at` (timestamptz)
  
  4. `question_options`
     - `id` (uuid, PK)
     - `question_id` (uuid, FK to questions)
     - `letter` (text) - 'a', 'b', 'c', 'd', 'e'
     - `option_text` (text)
  
  5. `user_answers`
     - `id` (uuid, PK)
     - `user_id` (uuid, FK to auth.users)
     - `question_id` (uuid, FK to questions)
     - `selected_answer` (text)
     - `is_correct` (boolean)
     - `answered_at` (timestamptz)
  
  ## Security
  - RLS enabled on all tables
  - Profiles: users read/update own profile, admins can read all
  - Subjects & Questions: all authenticated users can read
  - Question options: all authenticated users can read
  - User answers: users can only read/write own answers
*/

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  is_admin boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Subjects table
CREATE TABLE IF NOT EXISTS subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  teacher_name text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  guided_mode_password text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view subjects"
  ON subjects FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert subjects"
  ON subjects FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can update subjects"
  ON subjects FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Questions table
CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  question_number integer NOT NULL,
  question_text text NOT NULL,
  correct_answer text NOT NULL CHECK (correct_answer IN ('a', 'b', 'c', 'd', 'e')),
  is_exam_question boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(subject_id, question_number)
);

ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view questions"
  ON questions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert questions"
  ON questions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can update questions"
  ON questions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Question options table
CREATE TABLE IF NOT EXISTS question_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  letter text NOT NULL CHECK (letter IN ('a', 'b', 'c', 'd', 'e')),
  option_text text NOT NULL,
  UNIQUE(question_id, letter)
);

ALTER TABLE question_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view question options"
  ON question_options FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert question options"
  ON question_options FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can update question options"
  ON question_options FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- User answers table
CREATE TABLE IF NOT EXISTS user_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  selected_answer text NOT NULL CHECK (selected_answer IN ('a', 'b', 'c', 'd', 'e')),
  is_correct boolean NOT NULL DEFAULT false,
  answered_at timestamptz DEFAULT now(),
  UNIQUE(user_id, question_id)
);

ALTER TABLE user_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own answers"
  ON user_answers FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own answers"
  ON user_answers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own answers"
  ON user_answers FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_questions_subject_id ON questions(subject_id);
CREATE INDEX IF NOT EXISTS idx_question_options_question_id ON question_options(question_id);
CREATE INDEX IF NOT EXISTS idx_user_answers_user_id ON user_answers(user_id);
CREATE INDEX IF NOT EXISTS idx_user_answers_question_id ON user_answers(question_id);

-- Function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'name', ''));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
