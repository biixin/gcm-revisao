import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  ArrowLeft, ArrowRight, ChevronLeft, Filter, Lock, Unlock,
  CheckCircle, XCircle, Circle, AlertTriangle, BookOpen
} from 'lucide-react';
import { useAuth } from '../contexts/useAuth';
import { supabase, Subject, Question, UserAnswer } from '../lib/supabase';
import { getLocalQuestions, isLocalSubject } from '../data/localQuestionBank';
import { loadProgressAnswers, saveProgressAnswer } from '../lib/localProgress';

type FilterType = 'all' | 'unanswered' | 'wrong';

type StudyPageProps = {
  subject: Subject;
  onBack: () => void;
  isGuest: boolean;
};

export default function StudyPage({ subject, onBack, isGuest }: StudyPageProps) {
  const { user } = useAuth();
  const localSubject = isLocalSubject(subject.id);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Map<string, UserAnswer>>(new Map());
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [filter, setFilter] = useState<FilterType>('all');
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
  const [showGuidedModal, setShowGuidedModal] = useState(false);
  const [guidedPassword, setGuidedPassword] = useState('');
  const [guidedMode, setGuidedMode] = useState(false);
  const [guidedError, setGuidedError] = useState('');
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const currentQuestionIdRef = useRef<string | null>(null);
  const previousFilterRef = useRef<FilterType>(filter);

  useEffect(() => {
    async function load() {
      setLoading(true);

      if (localSubject) {
        const localQuestions = getLocalQuestions(subject.id);
        setQuestions(localQuestions);
        setAnswers(await loadProgressAnswers(
          user?.id,
          isGuest,
          localQuestions.map(question => question.id)
        ));
        setLoading(false);
        return;
      }

      if (!user) {
        setQuestions([]);
        setAnswers(new Map());
        setLoading(false);
        return;
      }

      const { data: qs } = await supabase
        .from('questions')
        .select('*, options:question_options(*)')
        .eq('subject_id', subject.id)
        .order('question_number');

      const { data: ans } = await supabase
        .from('user_answers')
        .select('*')
        .eq('user_id', user.id)
        .in('question_id', (qs || []).map(q => q.id));

      const ansMap = new Map<string, UserAnswer>();
      ans?.forEach(a => ansMap.set(a.question_id, a));

      setQuestions(qs || []);
      setAnswers(ansMap);
      setLoading(false);
    }
    load();
  }, [isGuest, localSubject, subject.id, user]);

  const questionIds = useMemo(() => new Set(questions.map(question => question.id)), [questions]);
  const subjectAnswers = useMemo(() => {
    const scopedAnswers = new Map<string, UserAnswer>();
    answers.forEach((answer, questionId) => {
      if (questionIds.has(questionId)) scopedAnswers.set(questionId, answer);
    });
    return scopedAnswers;
  }, [answers, questionIds]);

  useEffect(() => {
    const filterChanged = previousFilterRef.current !== filter;
    previousFilterRef.current = filter;

    let filtered = [...questions];
    if (filter === 'unanswered') filtered = filtered.filter(q => !subjectAnswers.has(q.id));
    if (filter === 'wrong') filtered = filtered.filter(q => subjectAnswers.get(q.id)?.is_correct === false);

    const currentQuestionId = currentQuestionIdRef.current;
    setFilteredQuestions(filtered);
    setCurrentIndex(previousIndex => {
      if (filterChanged) return 0;

      const sameQuestionIndex = currentQuestionId
        ? filtered.findIndex(question => question.id === currentQuestionId)
        : -1;

      if (sameQuestionIndex >= 0) return sameQuestionIndex;
      return Math.max(0, Math.min(previousIndex, filtered.length - 1));
    });
  }, [filter, questions, subjectAnswers]);

  const currentQuestion = filteredQuestions[currentIndex] ?? null;
  const currentAnswer = currentQuestion ? subjectAnswers.get(currentQuestion.id) : null;

  useEffect(() => {
    currentQuestionIdRef.current = currentQuestion?.id ?? null;
  }, [currentQuestion?.id]);

  useEffect(() => {
    setSelectedAnswer(currentAnswer?.selected_answer ?? null);
    setRevealed(!!currentAnswer);
  }, [currentIndex, currentAnswer]);

  const submitAnswer = useCallback(async (letter: string) => {
    if (!currentQuestion || revealed) return;
    const isCorrect = letter === currentQuestion.correct_answer;
    const existing = answers.get(currentQuestion.id);
    const newAnswer: UserAnswer = {
      id: existing?.id || `${localSubject ? 'local' : 'pending'}-${currentQuestion.id}`,
      user_id: user?.id || 'guest',
      question_id: currentQuestion.id,
      selected_answer: letter,
      is_correct: isCorrect,
      answered_at: new Date().toISOString(),
    };

    setSelectedAnswer(letter);
    setRevealed(true);
    setAnswers(prev => new Map(prev).set(currentQuestion.id, newAnswer));

    if (localSubject) {
      await saveProgressAnswer(user?.id, isGuest, newAnswer);
      return;
    }

    if (isGuest) return;
    if (!user) return;

    if (existing) {
      await supabase
        .from('user_answers')
        .update({ selected_answer: letter, is_correct: isCorrect, answered_at: new Date().toISOString() })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('user_answers')
        .insert({ user_id: user.id, question_id: currentQuestion.id, selected_answer: letter, is_correct: isCorrect });
    }
  }, [answers, currentQuestion, isGuest, localSubject, revealed, user]);

  function activateGuidedMode() {
    if (guidedPassword === subject.guided_mode_password && subject.guided_mode_password !== '') {
      setGuidedMode(true);
      setShowGuidedModal(false);
      setGuidedPassword('');
      setGuidedError('');
    } else {
      setGuidedError('Senha incorreta.');
    }
  }

  const answered = subjectAnswers.size;
  const correct = Array.from(subjectAnswers.values()).filter(a => a.is_correct).length;
  const pct = questions.length > 0 ? Math.round((answered / questions.length) * 100) : 0;

  const options = currentQuestion?.options ? [...currentQuestion.options].sort((a, b) => a.letter.localeCompare(b.letter)) : [];
  const isExamQ = currentQuestion?.is_exam_question && guidedMode;

  if (loading) {
    return (
      <div className="notranslate min-h-screen bg-[#050a14] flex items-center justify-center" translate="no">
        <div className="text-slate-400 text-sm">Carregando questões...</div>
      </div>
    );
  }

  return (
    <div className="notranslate min-h-screen bg-[#050a14] text-white flex flex-col" translate="no">
      {/* Header */}
      <header className="bg-[#0d1a2e] border-b border-[#1a3050] sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1a2a4a] transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold truncate">{subject.name}</p>
              <p className="text-slate-500 text-xs">{subject.teacher_name}</p>
            </div>
            <div className="flex items-center gap-2">
              {/* Guided mode toggle */}
              {subject.guided_mode_password && (
                <button
                  onClick={() => guidedMode ? setGuidedMode(false) : setShowGuidedModal(true)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    guidedMode
                      ? 'bg-red-900/40 border border-red-700/50 text-red-400'
                      : 'bg-[#0a1525] border border-[#1a3050] text-slate-400 hover:text-white'
                  }`}
                >
                  {guidedMode ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                  {guidedMode ? 'Guiado' : 'Guiado'}
                </button>
              )}
              {/* Filter */}
              <div className="relative">
                <button
                  onClick={() => setShowFilterMenu(!showFilterMenu)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    filter !== 'all'
                      ? 'bg-blue-900/40 border-blue-700/50 text-blue-400'
                      : 'bg-[#0a1525] border-[#1a3050] text-slate-400 hover:text-white'
                  }`}
                >
                  <Filter className="w-3.5 h-3.5" />
                </button>
                {showFilterMenu && (
                  <div className="absolute right-0 top-full mt-1 bg-[#0d1a2e] border border-[#1a3050] rounded-xl shadow-2xl overflow-hidden z-20 w-44">
                    {(['all', 'unanswered', 'wrong'] as FilterType[]).map(f => (
                      <button
                        key={f}
                        onClick={() => { setFilter(f); setShowFilterMenu(false); }}
                        className={`w-full text-left px-4 py-2.5 text-xs transition-colors ${
                          filter === f ? 'bg-blue-900/30 text-blue-400' : 'text-slate-300 hover:bg-[#1a2a4a]'
                        }`}
                      >
                        {f === 'all' ? 'Todas as questões' : f === 'unanswered' ? 'Não respondidas' : 'Questões erradas'}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          {isGuest && (
            <p className="mt-2 text-[10px] text-amber-200/80 border border-amber-500/20 bg-amber-500/10 rounded-lg px-2 py-1 text-center">
              Crie sua conta para salvar seu progresso
            </p>
          )}
          {/* Progress bar */}
          <div className="mt-3 h-1 bg-[#0a1525] rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-slate-600 text-[10px]">{answered}/{questions.length} respondidas</span>
            {answered > 0 && <span className="text-slate-600 text-[10px]">{Math.round((correct / answered) * 100)}% acertos</span>}
          </div>
        </div>
      </header>

      {/* Question breadcrumbs */}
      {filteredQuestions.length > 0 && (
        <div className="bg-[#0a1220] border-b border-[#1a3050]/50 overflow-x-auto">
          <div className="flex gap-1 px-4 py-2 max-w-2xl mx-auto w-max">
            {filteredQuestions.map((q, i) => {
              const ans = answers.get(q.id);
              return (
                <button
                  key={q.id}
                  onClick={() => { setCurrentIndex(i); }}
                  className={`w-7 h-7 rounded-md text-[10px] font-semibold transition-all shrink-0 ${
                    i === currentIndex
                      ? 'bg-blue-600 text-white ring-2 ring-blue-400/50'
                      : ans?.is_correct === true
                      ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-700/40'
                      : ans?.is_correct === false
                      ? 'bg-red-900/50 text-red-400 border border-red-700/40'
                      : 'bg-[#0d1a2e] text-slate-500 border border-[#1a3050]'
                  } ${isExamQ && q.is_exam_question ? 'ring-1 ring-red-500' : ''}`}
                >
                  {q.question_number}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-5 flex flex-col gap-4">
        {filteredQuestions.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center">
            <BookOpen className="w-10 h-10 text-slate-700" />
            <p className="text-slate-400 text-sm">
              {filter === 'unanswered' ? 'Todas as questões foram respondidas!' : filter === 'wrong' ? 'Nenhuma questão errada. Parabéns!' : 'Nenhuma questão encontrada.'}
            </p>
            <button onClick={() => setFilter('all')} className="text-blue-400 text-sm hover:text-blue-300 transition-colors">
              Ver todas as questões
            </button>
          </div>
        ) : currentQuestion ? (
          <>
            {/* Question status bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-slate-500 text-xs">
                  {currentIndex + 1} de {filteredQuestions.length}
                </span>
                {isExamQ && (
                  <span className="flex items-center gap-1 bg-red-900/30 border border-red-700/50 text-red-400 text-[10px] font-medium px-2 py-0.5 rounded-full">
                    <AlertTriangle className="w-2.5 h-2.5" /> Caiu na prova
                  </span>
                )}
                {!currentAnswer ? (
                  <span className="flex items-center gap-1 text-slate-500 text-[10px]">
                    <Circle className="w-2.5 h-2.5" /> Não respondida
                  </span>
                ) : currentAnswer.is_correct ? (
                  <span className="flex items-center gap-1 text-emerald-500 text-[10px]">
                    <CheckCircle className="w-2.5 h-2.5" /> Acertou
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-red-500 text-[10px]">
                    <XCircle className="w-2.5 h-2.5" /> Errou
                  </span>
                )}
              </div>
              <span className="text-slate-500 text-xs">Q{currentQuestion.question_number}</span>
            </div>

            {/* Question card */}
            <div className={`bg-[#0d1a2e] rounded-2xl p-5 border ${isExamQ ? 'border-red-700/60 ring-1 ring-red-800/40' : 'border-[#1a3050]'}`}>
              {isExamQ && (
                <div className="flex items-center gap-2 mb-3 pb-3 border-b border-red-800/30">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                  <span className="text-red-400 text-xs font-medium">Esta questão caiu na prova</span>
                </div>
              )}
              <p className="text-white text-sm leading-relaxed">{currentQuestion.question_text}</p>
            </div>

            {/* Options */}
            <div className="space-y-2.5">
              {options.map(opt => {
                const isSelected = selectedAnswer === opt.letter;
                const isCorrect = opt.letter === currentQuestion.correct_answer;
                const showResult = revealed;

                let classes = 'w-full text-left flex items-start gap-3 p-4 rounded-xl border text-sm transition-all duration-200 ';
                if (!showResult) {
                  classes += isSelected
                    ? 'bg-blue-900/40 border-blue-600 text-white'
                    : 'bg-[#0d1a2e] border-[#1a3050] text-slate-300 hover:border-blue-700 hover:bg-[#0f1e35]';
                } else {
                  if (isCorrect) {
                    classes += 'bg-emerald-900/30 border-emerald-600/60 text-emerald-300';
                  } else if (isSelected && !isCorrect) {
                    classes += 'bg-red-900/30 border-red-600/60 text-red-300';
                  } else {
                    classes += 'bg-[#0d1a2e] border-[#1a3050] text-slate-500';
                  }
                }

                return (
                  <button
                    key={opt.id}
                    onClick={() => submitAnswer(opt.letter)}
                    disabled={revealed}
                    className={classes}
                  >
                    <span className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                      showResult && isCorrect
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                        : showResult && isSelected && !isCorrect
                        ? 'bg-red-500/20 border-red-500 text-red-300'
                        : isSelected
                        ? 'bg-blue-500/20 border-blue-500 text-blue-300'
                        : 'border-slate-600 text-slate-500'
                    }`}>
                      {opt.letter.toUpperCase()}
                    </span>
                    <span className="leading-relaxed">{opt.option_text}</span>
                    {showResult && isCorrect && <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 ml-auto mt-0.5" />}
                    {showResult && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-red-400 shrink-0 ml-auto mt-0.5" />}
                  </button>
                );
              })}
            </div>

            {/* Result feedback */}
            {revealed && currentAnswer && (
              <div className={`rounded-xl p-3 border text-sm ${
                currentAnswer.is_correct
                  ? 'bg-emerald-900/20 border-emerald-700/40 text-emerald-300'
                  : 'bg-red-900/20 border-red-700/40 text-red-300'
              }`}>
                {currentAnswer.is_correct
                  ? 'Resposta correta!'
                  : `Resposta incorreta. A correta é a alternativa ${currentAnswer ? currentQuestion.correct_answer.toUpperCase() : ''}.`}
              </div>
            )}
          </>
        ) : null}
      </div>

      {/* Navigation */}
      {filteredQuestions.length > 0 && (
        <div className="sticky bottom-0 bg-[#050a14]/90 backdrop-blur border-t border-[#1a3050]/50 px-4 py-3">
          <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
            <button
              onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
              disabled={currentIndex === 0}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0d1a2e] border border-[#1a3050] text-slate-300 text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:border-blue-700 hover:text-white transition-all"
            >
              <ArrowLeft className="w-4 h-4" /> Anterior
            </button>

            <span className="text-slate-500 text-xs">{currentIndex + 1}/{filteredQuestions.length}</span>

            <button
              onClick={() => setCurrentIndex(i => Math.min(filteredQuestions.length - 1, i + 1))}
              disabled={currentIndex === filteredQuestions.length - 1}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0d1a2e] border border-[#1a3050] text-slate-300 text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:border-blue-700 hover:text-white transition-all"
            >
              Próxima <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Guided mode modal */}
      {showGuidedModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-[#0d1a2e] border border-[#1a3050] rounded-2xl p-6 w-full max-w-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-900/30 border border-blue-700/40 flex items-center justify-center">
                <Lock className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="text-white text-sm font-semibold">Modo Guiado</h3>
                <p className="text-slate-400 text-xs">Insira a senha para ativar</p>
              </div>
            </div>
            <input
              type="password"
              value={guidedPassword}
              onChange={e => { setGuidedPassword(e.target.value); setGuidedError(''); }}
              onKeyDown={e => e.key === 'Enter' && activateGuidedMode()}
              placeholder="Senha do modo guiado"
              autoFocus
              className="w-full bg-[#0a1525] border border-[#1a3050] text-white placeholder-slate-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 mb-2"
            />
            {guidedError && <p className="text-red-400 text-xs mb-3">{guidedError}</p>}
            <p className="text-slate-500 text-xs mb-4 leading-relaxed">
              O modo guiado destaca em vermelho as questões que caíram na prova, se houver no banco de dados.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => { setShowGuidedModal(false); setGuidedPassword(''); setGuidedError(''); }}
                className="flex-1 py-2.5 rounded-xl bg-[#0a1525] border border-[#1a3050] text-slate-300 text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={activateGuidedMode}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
              >
                Ativar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Close filter menu on outside click */}
      {showFilterMenu && (
        <div className="fixed inset-0 z-[5]" onClick={() => setShowFilterMenu(false)} />
      )}
    </div>
  );
}
