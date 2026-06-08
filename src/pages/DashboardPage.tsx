import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BookOpen, CheckCircle, Clock, ChevronRight,
  TrendingUp, LogOut, Settings, BarChart2, AlertCircle, RotateCcw, AlertTriangle, ArrowUpDown
} from 'lucide-react';
import { useAuth } from '../contexts/useAuth';
import { supabase, Subject } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import { getLocalQuestions, isLocalSubject, localSubjects } from '../data/localQuestionBank';
import { loadProgressAnswers, resetProgressAnswers } from '../lib/localProgress';
import { librasInverseSubjectId, librasSubjectId } from '../data/librasCards';

const logoUrl = 'https://firebasestorage.googleapis.com/v0/b/gcm-caxias-17535.firebasestorage.app/o/logo-gcm-sem%20fundo.png?alt=media&token=abcb7bfd-cecf-4101-87b9-83f942235ebd';
const featuredSubjectIds = ['local-provao-09-06', 'local-provao-11-06'];

type SortMode = 'default' | 'difficulty';
type SubjectDifficulty = 'URUBU' | 'ALTA' | 'FÁCIL';

const difficultyOrder: Record<SubjectDifficulty, number> = {
  URUBU: 0,
  ALTA: 1,
  FÁCIL: 2,
};

function getSubjectDifficulty(subjectId: string): SubjectDifficulty {
  if (subjectId === 'local-marcio-legislacao-penal-eca') return 'URUBU';
  if (
    featuredSubjectIds.includes(subjectId) ||
    subjectId === librasSubjectId ||
    subjectId === librasInverseSubjectId ||
    subjectId === 'local-marcelo-porte-arma-fogo'
  ) return 'ALTA';
  return 'FÁCIL';
}

function getFeaturedSubjectRank(subjectId: string) {
  const rank = featuredSubjectIds.indexOf(subjectId);
  return rank === -1 ? featuredSubjectIds.length : rank;
}

type SubjectStats = {
  subject: Subject;
  total: number;
  answered: number;
  correct: number;
};

type DashboardProps = {
  onSelectSubject: (subject: Subject) => void;
  onAdmin: () => void;
  onLogout: () => void;
  isGuest: boolean;
  user: User | null;
};

export default function DashboardPage({ onSelectSubject, onAdmin, onLogout, isGuest, user }: DashboardProps) {
  const { profile, signOut } = useAuth();
  const [stats, setStats] = useState<SubjectStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [resettingSubjectId, setResettingSubjectId] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>('difficulty');
  const userId = user?.id;

  async function handleLogout() {
    try {
      if (!isGuest) await signOut();
    } finally {
      onLogout();
    }
  }

  const buildLocalStats = useCallback(async (subjects = localSubjects) => {
    const localAnswerMap = new Map(
      Array.from((await loadProgressAnswers(userId, isGuest)).entries())
        .map(([id, answer]) => [id, answer.is_correct] as const)
    );

    return subjects.map(subject => {
      const subjectQuestions = getLocalQuestions(subject.id);
      const answered = subjectQuestions.filter(q => localAnswerMap.has(q.id)).length;
      const correct = subjectQuestions.filter(q => localAnswerMap.get(q.id) === true).length;

      return { subject, total: subjectQuestions.length, answered, correct };
    });
  }, [isGuest, userId]);

  const loadStats = useCallback(async () => {
    setLoading(true);

    if (isGuest || !userId) {
      setStats(await buildLocalStats());
      setLoading(false);
      return;
    }

    const { data: subjects, error: subjectsError } = await supabase.from('subjects').select('*').order('name');
    if (subjectsError || !subjects) {
      setStats(await buildLocalStats());
      setLoading(false);
      return;
    }

    const { data: questions } = await supabase.from('questions').select('id, subject_id');
    const { data: answers } = await supabase
      .from('user_answers')
      .select('question_id, is_correct')
      .eq('user_id', userId);

    const answeredMap = new Map<string, boolean>();
    answers?.forEach(a => answeredMap.set(a.question_id, a.is_correct));

    const result: SubjectStats[] = subjects.map(subject => {
      const subjectQuestions = (questions || []).filter(q => q.subject_id === subject.id);
      const total = subjectQuestions.length;
      const answered = subjectQuestions.filter(q => answeredMap.has(q.id)).length;
      const correct = subjectQuestions.filter(q => answeredMap.get(q.id) === true).length;
      return { subject, total, answered, correct };
    });

    const localOnlySubjects = localSubjects.filter(
      localSubject => !subjects.some(subject => subject.id === localSubject.id || subject.name === localSubject.name)
    );

    setStats([...result, ...(await buildLocalStats(localOnlySubjects))]);
    setLoading(false);
  }, [buildLocalStats, isGuest, userId]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  async function resetSubjectProgress(subject: Subject) {
    if (resettingSubjectId) return;

    const confirmed = window.confirm(`Resetar o progresso de "${subject.name}"?`);
    if (!confirmed) return;

    setResettingSubjectId(subject.id);

    try {
      if (isLocalSubject(subject.id)) {
        const questionIds = getLocalQuestions(subject.id).map(question => question.id);
        await resetProgressAnswers(userId, isGuest, questionIds);
        await loadStats();
        return;
      }

      if (!userId) return;

      const { data: subjectQuestions } = await supabase
        .from('questions')
        .select('id')
        .eq('subject_id', subject.id);

      const questionIds = (subjectQuestions || []).map(question => question.id);
      if (questionIds.length > 0) {
        await supabase
          .from('user_answers')
          .delete()
          .eq('user_id', userId)
          .in('question_id', questionIds);
      }

      await loadStats();
    } finally {
      setResettingSubjectId(null);
    }
  }

  const totalAnswered = stats.reduce((a, s) => a + s.answered, 0);
  const totalQuestions = stats.reduce((a, s) => a + s.total, 0);
  const totalCorrect = stats.reduce((a, s) => a + s.correct, 0);
  const overallPct = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;
  const displayedStats = useMemo(() => {
    return stats
      .map((item, index) => ({ item, index }))
      .sort((a, b) => {
        const featuredDelta = getFeaturedSubjectRank(a.item.subject.id) - getFeaturedSubjectRank(b.item.subject.id);
        if (featuredDelta !== 0) return featuredDelta;

        if (sortMode !== 'difficulty') return a.index - b.index;

        const difficultyDelta = difficultyOrder[getSubjectDifficulty(a.item.subject.id)] - difficultyOrder[getSubjectDifficulty(b.item.subject.id)];
        if (difficultyDelta !== 0) return difficultyDelta;
        return a.index - b.index;
      })
      .map(({ item }) => item);
  }, [sortMode, stats]);

  return (
    <div className="min-h-screen bg-[#050a14] text-white">
      {/* Header */}
      <header className="bg-[#0d1a2e] border-b border-[#1a3050] sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-[#0a1525] border border-[#1e4a8a] flex items-center justify-center overflow-hidden shrink-0">
                <img src={logoUrl} alt="Guarda Municipal de Duque de Caxias" className="w-8 h-8 object-contain" />
              </div>
              <div className="min-w-0">
                <p className="text-white text-sm font-semibold leading-none truncate">Revisador de Questões</p>
                <p className="text-slate-500 text-[10px] leading-none mt-0.5 truncate">Guarda Municipal de Duque de Caxias</p>
              </div>
            </div>
            {isGuest && (
              <p className="hidden sm:block text-[10px] text-amber-200/80 border border-amber-500/20 bg-amber-500/10 rounded-lg px-2 py-1 text-center">
                Crie sua conta para salvar seu progresso
              </p>
            )}
            <div className="flex items-center gap-2">
              {!isGuest && profile?.is_admin && (
                <button
                  onClick={onAdmin}
                  className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-[#1a2a4a] transition-colors"
                >
                  <Settings className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-[#1a2a4a] transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
          {isGuest && (
            <p className="sm:hidden mt-2 text-[10px] text-amber-200/80 border border-amber-500/20 bg-amber-500/10 rounded-lg px-2 py-1 text-center">
              Crie sua conta para salvar seu progresso
            </p>
          )}
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Welcome */}
        <div>
          <h1 className="text-xl font-bold text-white">
            Olá, {isGuest ? 'Convidado' : profile?.name || user?.email?.split('@')[0] || 'Aluno'}
          </h1>
          <div className="flex items-center justify-between mt-0.5">
            <p className="text-slate-400 text-sm">Revise suas matérias para a prova</p>
            {isGuest && <span className="text-yellow-500/70 text-xs font-medium">Modo Convidado</span>}
          </div>
        </div>

        {/* Overall stats */}
        {!loading && totalQuestions > 0 && (
          <div className="bg-[#0d1a2e] border border-[#1a3050] rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <BarChart2 className="w-4 h-4 text-blue-400" />
              <span className="text-slate-300 text-sm font-medium">Progresso Geral</span>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-[#0a1525] rounded-xl p-3 text-center">
                <p className="text-blue-400 text-xl font-bold">{totalAnswered}</p>
                <p className="text-slate-500 text-[10px] mt-0.5">Respondidas</p>
              </div>
              <div className="bg-[#0a1525] rounded-xl p-3 text-center">
                <p className="text-emerald-400 text-xl font-bold">{totalCorrect}</p>
                <p className="text-slate-500 text-[10px] mt-0.5">Acertos</p>
              </div>
              <div className="bg-[#0a1525] rounded-xl p-3 text-center">
                <p className="text-white text-xl font-bold">{overallPct}%</p>
                <p className="text-slate-500 text-[10px] mt-0.5">Taxa Acerto</p>
              </div>
            </div>
            <div className="h-2 bg-[#0a1525] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full transition-all duration-700"
                style={{ width: `${totalQuestions > 0 ? Math.round((totalAnswered / totalQuestions) * 100) : 0}%` }}
              />
            </div>
            <p className="text-slate-500 text-xs mt-1.5 text-right">
              {totalAnswered}/{totalQuestions} questões respondidas
            </p>
          </div>
        )}

        {/* Subject list */}
        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-slate-300 text-xs font-semibold uppercase tracking-widest flex items-center gap-2">
              <BookOpen className="w-3.5 h-3.5" /> Matérias
            </h2>
            <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              <ArrowUpDown className="w-3.5 h-3.5" />
              Ordenar
              <select
                value={sortMode}
                onChange={event => setSortMode(event.target.value as SortMode)}
                className="bg-[#0a1525] border border-[#1a3050] text-slate-300 rounded-lg px-2 py-1 text-[10px] font-semibold focus:outline-none focus:border-blue-500"
              >
                <option value="default">Padrão</option>
                <option value="difficulty">Dificuldade</option>
              </select>
            </label>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-[#0d1a2e] border border-[#1a3050] rounded-2xl p-4 animate-pulse">
                  <div className="h-4 bg-[#1a3050] rounded w-2/3 mb-2" />
                  <div className="h-3 bg-[#1a3050] rounded w-1/3" />
                </div>
              ))}
            </div>
          ) : stats.length === 0 ? (
            <div className="bg-[#0d1a2e] border border-[#1a3050] rounded-2xl p-8 text-center">
              <AlertCircle className="w-8 h-8 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">Nenhuma matéria disponível ainda.</p>
              {profile?.is_admin && (
                <button
                  onClick={onAdmin}
                  className="mt-3 text-blue-400 text-sm hover:text-blue-300 transition-colors"
                >
                  Adicionar matérias no painel admin
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {displayedStats.map(({ subject, total, answered, correct }) => {
                const pct = total > 0 ? Math.round((answered / total) * 100) : 0;
                const isComplete = answered === total && total > 0;
                const isStarted = answered > 0;
                const accuracy = answered > 0 ? Math.round((correct / answered) * 100) : 0;
                const isProvaoSubject = featuredSubjectIds.includes(subject.id);
                const isLibrasSubject = subject.id === librasSubjectId || subject.id === librasInverseSubjectId;
                const isMarcioSubject = subject.id === 'local-marcio-legislacao-penal-eca';
                const difficulty = getSubjectDifficulty(subject.id);
                const difficultyLabel = `Dificuldade: ${difficulty}`;

                return (
                  <div key={subject.id} className="relative group">
                    <button
                      onClick={() => onSelectSubject(subject)}
                      className={`w-full border rounded-2xl p-4 text-left transition-all duration-200 ${
                        isProvaoSubject
                          ? 'bg-gradient-to-br from-sky-950/60 via-[#0d1a2e] to-amber-950/35 border-sky-400/60 ring-2 ring-sky-300/30 hover:border-sky-300 hover:from-sky-950/75'
                          : isLibrasSubject
                          ? 'bg-amber-950/20 border-amber-500/50 ring-1 ring-amber-400/25 hover:border-amber-400 hover:bg-amber-950/30'
                          : isMarcioSubject
                          ? 'bg-red-950/20 border-red-500/50 ring-1 ring-red-400/25 hover:border-red-400 hover:bg-red-950/30'
                          : difficulty === 'ALTA'
                          ? 'bg-amber-950/20 border-amber-500/50 ring-1 ring-amber-400/25 hover:border-amber-400 hover:bg-amber-950/30'
                          : 'bg-[#0d1a2e] border-[#1a3050] hover:border-blue-700 hover:bg-[#0f1e35]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 pr-9">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            {isComplete ? (
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            ) : isStarted ? (
                              <Clock className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                            ) : (
                              <div className="w-3.5 h-3.5 rounded-full border border-slate-600 shrink-0" />
                            )}
                            <p className="text-white text-sm font-semibold truncate">{subject.name}</p>
                          </div>
                          <p className="text-slate-500 text-xs pl-5">{subject.teacher_name}</p>
                          {!isProvaoSubject && difficultyLabel && (
                            <div className="pl-5 mt-2">
                              <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                                isProvaoSubject
                                  ? 'border-sky-300/50 bg-sky-400/10 text-sky-100'
                                  : isMarcioSubject
                                  ? 'border-red-400/40 bg-red-500/10 text-red-200'
                                  : difficulty === 'ALTA'
                                  ? 'border-amber-400/40 bg-amber-400/10 text-amber-200'
                                  : 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200'
                              }`}>
                                {difficulty === 'FÁCIL' ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                                {difficultyLabel}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <p className="text-slate-300 text-xs">{answered}/{total}</p>
                            {answered > 0 && (
                              <p className="text-slate-500 text-[10px]">{accuracy}% acertos</p>
                            )}
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-blue-400 transition-colors" />
                        </div>
                      </div>
                      {total > 0 && (
                        <div className="mt-3 h-1.5 bg-[#0a1525] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${
                              isComplete ? 'bg-emerald-500' : 'bg-blue-600'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      )}
                      <div className="mt-1.5 flex items-center justify-between">
                        <span className={`text-[10px] ${
                          isComplete ? 'text-emerald-500' : isStarted ? 'text-yellow-500' : 'text-slate-600'
                        }`}>
                          {isComplete ? 'Concluída' : isStarted ? 'Em andamento' : 'Não iniciada'}
                        </span>
                        <span className="text-[10px] text-slate-600">{pct}%</span>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        resetSubjectProgress(subject);
                      }}
                      disabled={!isStarted || resettingSubjectId === subject.id}
                      title={isStarted ? 'Resetar progresso' : 'Sem progresso para resetar'}
                      aria-label={`Resetar progresso de ${subject.name}`}
                      className="absolute right-3 top-3 z-[2] p-2 rounded-lg bg-[#0a1525] border border-[#1a3050] text-slate-500 transition-colors hover:border-red-600/60 hover:text-red-300 disabled:opacity-35 disabled:cursor-not-allowed disabled:hover:border-[#1a3050] disabled:hover:text-slate-500"
                    >
                      <RotateCcw className={`w-3.5 h-3.5 ${resettingSubjectId === subject.id ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Study tip */}
        {!loading && stats.some(s => s.answered < s.total) && (
          <div className="bg-blue-900/20 border border-blue-800/30 rounded-2xl p-4 flex items-start gap-3">
            <TrendingUp className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <p className="text-blue-300/80 text-xs leading-relaxed">
              Continue revisando as matérias em andamento para maximizar sua preparação para a prova.
            </p>
          </div>
        )}

        <footer className="border-t border-[#1a3050]/60 pt-5 pb-2 text-center">
          <p className="text-slate-500 text-xs">
            Revisador de Questões. Todos os direitos reservados.
          </p>
          <p className="text-slate-600 text-[10px] mt-1">
            Créditos: 6 Pelotão
          </p>
        </footer>
      </div>
    </div>
  );
}
