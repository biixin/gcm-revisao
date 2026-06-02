import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

type QuestionImportOption = {
  letter: string;
  text: string;
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    const { subjectId, questionsData } = await req.json();

    if (!subjectId || !questionsData || !Array.isArray(questionsData)) {
      return new Response(
        JSON.stringify({ error: "Invalid payload" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let imported = 0;
    for (const qData of questionsData) {
      const { number, text, options, correct, isExam } = qData;

      const { data: question, error: qErr } = await supabase
        .from("questions")
        .insert({
          subject_id: subjectId,
          question_number: number,
          question_text: text,
          correct_answer: correct.toLowerCase(),
          is_exam_question: isExam || false,
        })
        .select()
        .single();

      if (qErr || !question) continue;

      const optInserts = (options as QuestionImportOption[]).map(opt => ({
        question_id: question.id,
        letter: opt.letter.toLowerCase(),
        option_text: opt.text,
      }));

      await supabase.from("question_options").insert(optInserts);
      imported++;
    }

    return new Response(
      JSON.stringify({ success: true, imported }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
