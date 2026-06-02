-- Account progress for question banks stored in the application bundle.
-- These questions use stable text ids, so they cannot use user_answers.question_id,
-- which references the UUID-based questions table.
CREATE TABLE IF NOT EXISTS local_user_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  question_id text NOT NULL,
  selected_answer text NOT NULL CHECK (selected_answer IN ('a', 'b', 'c', 'd', 'e')),
  is_correct boolean NOT NULL DEFAULT false,
  answered_at timestamptz DEFAULT now(),
  UNIQUE(user_id, question_id)
);

ALTER TABLE local_user_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own local answers"
  ON local_user_answers FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own local answers"
  ON local_user_answers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own local answers"
  ON local_user_answers FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own local answers"
  ON local_user_answers FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_local_user_answers_user_id ON local_user_answers(user_id);
CREATE INDEX IF NOT EXISTS idx_local_user_answers_question_id ON local_user_answers(question_id);
