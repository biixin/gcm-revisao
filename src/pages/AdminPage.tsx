import { useEffect, useState } from 'react';
import {
  ChevronLeft, Plus, ChevronDown,
  Save, Check, AlertCircle, Star
} from 'lucide-react';
import { supabase, Subject, Question, QuestionOption } from '../lib/supabase';

type AdminPageProps = { onBack: () => void };

type QuestionForm = {
  question_number: string;
  question_text: string;
  correct_answer: string;
  is_exam_question: boolean;
  options: { letter: string; option_text: string }[];
};

const LETTERS = ['a', 'b', 'c', 'd', 'e'];

const emptyQuestion = (): QuestionForm => ({
  question_number: '',
  question_text: '',
  correct_answer: 'a',
  is_exam_question: false,
  options: LETTERS.slice(0, 4).map(letter => ({ letter, option_text: '' })),
});

export default function AdminPage({ onBack }: AdminPageProps) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSubject, setActiveSubject] = useState<Subject | null>(null);
  const [questions, setQuestions] = useState<(Question & { options: QuestionOption[] })[]>([]);
  const [view, setView] = useState<'subjects' | 'questions' | 'add-subject' | 'add-question'>('subjects');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Subject form
  const [subjectForm, setSubjectForm] = useState({ name: '', teacher_name: '', description: '', guided_mode_password: '' });

  // Question form
  const [questionForm, setQuestionForm] = useState<QuestionForm>(emptyQuestion());

  useEffect(() => {
    loadSubjects();
  }, []);

  async function loadSubjects() {
    setLoading(true);
    const { data } = await supabase.from('subjects').select('*').order('name');
    setSubjects(data || []);
    setLoading(false);
  }

  async function loadQuestions(subjectId: string) {
    const { data } = await supabase
      .from('questions')
      .select('*, options:question_options(*)')
      .eq('subject_id', subjectId)
      .order('question_number');
    setQuestions(data || []);
  }

  async function saveSubject() {
    if (!subjectForm.name.trim()) { setErrorMsg('Informe o nome da matéria.'); return; }
    setSaving(true);
    const { error } = await supabase.from('subjects').insert({
      name: subjectForm.name.trim(),
      teacher_name: subjectForm.teacher_name.trim(),
      description: subjectForm.description.trim(),
      guided_mode_password: subjectForm.guided_mode_password.trim(),
    });
    setSaving(false);
    if (error) { setErrorMsg('Erro ao salvar.'); return; }
    setSuccessMsg('Matéria criada!');
    setSubjectForm({ name: '', teacher_name: '', description: '', guided_mode_password: '' });
    loadSubjects();
    setTimeout(() => setSuccessMsg(''), 2500);
  }

  async function saveQuestion() {
    if (!activeSubject) return;
    if (!questionForm.question_text.trim()) { setErrorMsg('Informe o texto da questão.'); return; }
    if (!questionForm.question_number) { setErrorMsg('Informe o número da questão.'); return; }
    const filledOptions = questionForm.options.filter(o => o.option_text.trim());
    if (filledOptions.length < 2) { setErrorMsg('Adicione pelo menos 2 alternativas.'); return; }
    if (!filledOptions.find(o => o.letter === questionForm.correct_answer)) {
      setErrorMsg('A alternativa correta deve ter texto.');
      return;
    }

    setSaving(true);
    const { data: q, error: qErr } = await supabase
      .from('questions')
      .insert({
        subject_id: activeSubject.id,
        question_number: parseInt(questionForm.question_number),
        question_text: questionForm.question_text.trim(),
        correct_answer: questionForm.correct_answer,
        is_exam_question: questionForm.is_exam_question,
      })
      .select()
      .single();

    if (qErr || !q) { setSaving(false); setErrorMsg('Erro ao salvar questão.'); return; }

    const optInserts = filledOptions.map(o => ({ question_id: q.id, letter: o.letter, option_text: o.option_text.trim() }));
    await supabase.from('question_options').insert(optInserts);

    setSaving(false);
    setSuccessMsg('Questão adicionada!');
    setQuestionForm(emptyQuestion());
    loadQuestions(activeSubject.id);
    setTimeout(() => setSuccessMsg(''), 2500);
  }

  return (
    <div className="min-h-screen bg-[#050a14] text-white">
      {/* Header */}
      <header className="bg-[#0d1a2e] border-b border-[#1a3050] sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => {
              if (view !== 'subjects') setView(activeSubject ? 'questions' : 'subjects');
              else onBack();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1a2a4a] transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <p className="text-white text-sm font-semibold">
              {view === 'subjects' ? 'Painel Admin' : view === 'questions' ? activeSubject?.name : view === 'add-subject' ? 'Nova Matéria' : 'Nova Questão'}
            </p>
            <p className="text-slate-500 text-xs">
              {view === 'subjects' ? 'Gerenciar matérias' : view === 'questions' ? 'Questões' : ''}
            </p>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">
        {/* Feedback messages */}
        {successMsg && (
          <div className="flex items-center gap-2 bg-emerald-900/30 border border-emerald-700/40 text-emerald-300 text-sm rounded-xl px-4 py-3">
            <Check className="w-4 h-4" /> {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="flex items-center gap-2 bg-red-900/30 border border-red-700/40 text-red-300 text-sm rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4" /> {errorMsg}
          </div>
        )}

        {/* SUBJECTS LIST */}
        {view === 'subjects' && (
          <>
            <button
              onClick={() => { setView('add-subject'); setErrorMsg(''); setSuccessMsg(''); }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-[#1a3050] text-slate-400 hover:text-blue-400 hover:border-blue-700 text-sm transition-all"
            >
              <Plus className="w-4 h-4" /> Adicionar nova matéria
            </button>

            {loading ? (
              <div className="text-slate-500 text-sm text-center py-8">Carregando...</div>
            ) : subjects.length === 0 ? (
              <div className="text-slate-500 text-sm text-center py-8">Nenhuma matéria cadastrada.</div>
            ) : (
              <div className="space-y-2">
                {subjects.map(s => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setActiveSubject(s);
                      loadQuestions(s.id);
                      setView('questions');
                    }}
                    className="w-full bg-[#0d1a2e] border border-[#1a3050] hover:border-blue-700 rounded-xl p-4 text-left flex items-center justify-between group transition-all"
                  >
                    <div>
                      <p className="text-white text-sm font-medium">{s.name}</p>
                      <p className="text-slate-500 text-xs mt-0.5">{s.teacher_name}</p>
                    </div>
                    <ChevronDown className="w-4 h-4 text-slate-600 group-hover:text-blue-400 transition-colors -rotate-90" />
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* ADD SUBJECT */}
        {view === 'add-subject' && (
          <div className="bg-[#0d1a2e] border border-[#1a3050] rounded-2xl p-5 space-y-4">
            <div className="space-y-1.5">
              <label className="text-slate-400 text-xs uppercase tracking-wider">Nome da Matéria *</label>
              <input
                value={subjectForm.name}
                onChange={e => setSubjectForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Ex: Direito Constitucional"
                className="w-full bg-[#0a1525] border border-[#1a3050] text-white placeholder-slate-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-slate-400 text-xs uppercase tracking-wider">Professor</label>
              <input
                value={subjectForm.teacher_name}
                onChange={e => setSubjectForm(f => ({ ...f, teacher_name: e.target.value }))}
                placeholder="Nome do professor"
                className="w-full bg-[#0a1525] border border-[#1a3050] text-white placeholder-slate-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-slate-400 text-xs uppercase tracking-wider">Descrição</label>
              <textarea
                value={subjectForm.description}
                onChange={e => setSubjectForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Breve descrição da matéria..."
                rows={2}
                className="w-full bg-[#0a1525] border border-[#1a3050] text-white placeholder-slate-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-slate-400 text-xs uppercase tracking-wider">Senha do Modo Guiado</label>
              <input
                value={subjectForm.guided_mode_password}
                onChange={e => setSubjectForm(f => ({ ...f, guided_mode_password: e.target.value }))}
                placeholder="Deixe vazio para desativar"
                className="w-full bg-[#0a1525] border border-[#1a3050] text-white placeholder-slate-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <button
              onClick={saveSubject}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-xl py-3 text-sm transition-colors"
            >
              <Save className="w-4 h-4" /> {saving ? 'Salvando...' : 'Salvar Matéria'}
            </button>
          </div>
        )}

        {/* QUESTIONS LIST */}
        {view === 'questions' && activeSubject && (
          <>
            <button
              onClick={() => { setView('add-question'); setQuestionForm(emptyQuestion()); setErrorMsg(''); setSuccessMsg(''); }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-[#1a3050] text-slate-400 hover:text-blue-400 hover:border-blue-700 text-sm transition-all"
            >
              <Plus className="w-4 h-4" /> Adicionar questão
            </button>

            {questions.length === 0 ? (
              <div className="text-slate-500 text-sm text-center py-8">Nenhuma questão cadastrada.</div>
            ) : (
              <div className="space-y-2">
                {questions.map(q => (
                  <div key={q.id} className={`bg-[#0d1a2e] border rounded-xl p-4 ${q.is_exam_question ? 'border-red-700/40' : 'border-[#1a3050]'}`}>
                    <div className="flex items-start gap-3">
                      <span className="text-slate-500 text-xs shrink-0 mt-0.5">Q{q.question_number}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm leading-relaxed line-clamp-2">{q.question_text}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-emerald-400 text-xs">Correta: {q.correct_answer.toUpperCase()}</span>
                          {q.is_exam_question && (
                            <span className="flex items-center gap-1 text-red-400 text-xs">
                              <Star className="w-3 h-3" /> Prova
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ADD QUESTION */}
        {view === 'add-question' && activeSubject && (
          <div className="bg-[#0d1a2e] border border-[#1a3050] rounded-2xl p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-slate-400 text-xs uppercase tracking-wider">Numero *</label>
                <input
                  type="number"
                  value={questionForm.question_number}
                  onChange={e => setQuestionForm(f => ({ ...f, question_number: e.target.value }))}
                  placeholder="1"
                  className="w-full bg-[#0a1525] border border-[#1a3050] text-white placeholder-slate-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-slate-400 text-xs uppercase tracking-wider">Alternativa Correta *</label>
                <select
                  value={questionForm.correct_answer}
                  onChange={e => setQuestionForm(f => ({ ...f, correct_answer: e.target.value }))}
                  className="w-full bg-[#0a1525] border border-[#1a3050] text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500"
                >
                  {LETTERS.map(l => <option key={l} value={l}>{l.toUpperCase()}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-400 text-xs uppercase tracking-wider">Texto da Questão *</label>
              <textarea
                value={questionForm.question_text}
                onChange={e => setQuestionForm(f => ({ ...f, question_text: e.target.value }))}
                placeholder="Digite o enunciado da questão..."
                rows={4}
                className="w-full bg-[#0a1525] border border-[#1a3050] text-white placeholder-slate-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>

            {/* Options */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-slate-400 text-xs uppercase tracking-wider">Alternativas *</label>
                <button
                  onClick={() => {
                    const current = questionForm.options.length;
                    if (current < 5) {
                      setQuestionForm(f => ({ ...f, options: [...f.options, { letter: LETTERS[current], option_text: '' }] }));
                    }
                  }}
                  disabled={questionForm.options.length >= 5}
                  className="text-blue-400 text-xs disabled:opacity-30 hover:text-blue-300 transition-colors"
                >
                  + Adicionar alternativa E
                </button>
              </div>
              {questionForm.options.map((opt, i) => (
                <div key={opt.letter} className="flex items-center gap-2">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    questionForm.correct_answer === opt.letter
                      ? 'bg-emerald-900/40 border border-emerald-600 text-emerald-400'
                      : 'bg-[#0a1525] border border-[#1a3050] text-slate-500'
                  }`}>
                    {opt.letter.toUpperCase()}
                  </span>
                  <input
                    value={opt.option_text}
                    onChange={e => {
                      const opts = [...questionForm.options];
                      opts[i] = { ...opts[i], option_text: e.target.value };
                      setQuestionForm(f => ({ ...f, options: opts }));
                    }}
                    placeholder={`Alternativa ${opt.letter.toUpperCase()}`}
                    className="flex-1 bg-[#0a1525] border border-[#1a3050] text-white placeholder-slate-600 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              ))}
            </div>

            {/* Exam question toggle */}
            <button
              onClick={() => setQuestionForm(f => ({ ...f, is_exam_question: !f.is_exam_question }))}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                questionForm.is_exam_question
                  ? 'bg-red-900/20 border-red-700/50 text-red-300'
                  : 'bg-[#0a1525] border-[#1a3050] text-slate-400'
              }`}
            >
              <Star className={`w-4 h-4 ${questionForm.is_exam_question ? 'fill-red-400 text-red-400' : ''}`} />
              <span className="text-sm">Esta questão caiu na prova</span>
            </button>

            <button
              onClick={saveQuestion}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-xl py-3 text-sm transition-colors"
            >
              <Save className="w-4 h-4" /> {saving ? 'Salvando...' : 'Salvar Questão'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
