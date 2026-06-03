import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle,
  ChevronLeft,
  Circle,
  Eye,
  Filter,
  Video,
  XCircle,
} from 'lucide-react';
import LibrasVideoPlayer from '../components/LibrasVideoPlayer';
import { useAuth } from '../contexts/useAuth';
import { librasCards } from '../data/librasCards';
import { loadProgressAnswers, saveProgressAnswer } from '../lib/localProgress';
import { Subject, UserAnswer } from '../lib/supabase';

type FilterType = 'all' | 'unanswered' | 'wrong';

type LibrasStudyPageProps = {
  subject: Subject;
  onBack: () => void;
  isGuest: boolean;
};

export default function LibrasStudyPage({ subject, onBack, isGuest }: LibrasStudyPageProps) {
  const { user } = useAuth();
  const [answers, setAnswers] = useState<Map<string, UserAnswer>>(new Map());
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [filter, setFilter] = useState<FilterType>('all');
  const [filteredCards, setFilteredCards] = useState(librasCards);
  const [answerVisible, setAnswerVisible] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const currentCardIdRef = useRef<string | null>(null);
  const previousFilterRef = useRef<FilterType>(filter);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      const loadedAnswers = await loadProgressAnswers(
        user?.id,
        isGuest,
        librasCards.map(card => card.id)
      );

      if (!active) return;
      setAnswers(loadedAnswers);
      setLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, [isGuest, user?.id]);

  const cardIds = useMemo(() => new Set(librasCards.map(card => card.id)), []);
  const subjectAnswers = useMemo(() => {
    const scopedAnswers = new Map<string, UserAnswer>();
    answers.forEach((answer, cardId) => {
      if (cardIds.has(cardId)) scopedAnswers.set(cardId, answer);
    });
    return scopedAnswers;
  }, [answers, cardIds]);

  useEffect(() => {
    const filterChanged = previousFilterRef.current !== filter;
    previousFilterRef.current = filter;

    let nextCards = [...librasCards];
    if (filter === 'unanswered') nextCards = nextCards.filter(card => !subjectAnswers.has(card.id));
    if (filter === 'wrong') nextCards = nextCards.filter(card => subjectAnswers.get(card.id)?.is_correct === false);

    const currentCardId = currentCardIdRef.current;
    setFilteredCards(nextCards);
    setCurrentIndex(previousIndex => {
      if (filterChanged) return 0;

      const sameCardIndex = currentCardId
        ? nextCards.findIndex(card => card.id === currentCardId)
        : -1;

      if (sameCardIndex >= 0) return sameCardIndex;
      return Math.max(0, Math.min(previousIndex, nextCards.length - 1));
    });
  }, [filter, subjectAnswers]);

  const currentCard = filteredCards[currentIndex] ?? null;
  const currentAnswer = currentCard ? subjectAnswers.get(currentCard.id) : null;

  useEffect(() => {
    currentCardIdRef.current = currentCard?.id ?? null;
  }, [currentCard?.id]);

  useEffect(() => {
    setAnswerVisible(!!currentAnswer);
  }, [currentAnswer, currentCard?.id]);

  const submitResult = useCallback(async (isCorrect: boolean) => {
    if (!currentCard || !answerVisible) return;

    const existing = answers.get(currentCard.id);
    const newAnswer: UserAnswer = {
      id: existing?.id || `local-${currentCard.id}`,
      user_id: user?.id || 'guest',
      question_id: currentCard.id,
      selected_answer: isCorrect ? 'acertou' : 'errou',
      is_correct: isCorrect,
      answered_at: new Date().toISOString(),
    };

    setAnswers(prev => new Map(prev).set(currentCard.id, newAnswer));
    await saveProgressAnswer(user?.id, isGuest, newAnswer);
  }, [answerVisible, answers, currentCard, isGuest, user?.id]);

  const answered = subjectAnswers.size;
  const correct = Array.from(subjectAnswers.values()).filter(answer => answer.is_correct).length;
  const pct = librasCards.length > 0 ? Math.round((answered / librasCards.length) * 100) : 0;

  if (loading) {
    return (
      <div className="notranslate min-h-screen bg-[#050a14] flex items-center justify-center" translate="no">
        <div className="text-slate-400 text-sm">Carregando LIBRAS...</div>
      </div>
    );
  }

  return (
    <div className="notranslate min-h-screen bg-[#050a14] text-white flex flex-col" translate="no">
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
                  {(['all', 'unanswered', 'wrong'] as FilterType[]).map(item => (
                    <button
                      key={item}
                      onClick={() => { setFilter(item); setShowFilterMenu(false); }}
                      className={`w-full text-left px-4 py-2.5 text-xs transition-colors ${
                        filter === item ? 'bg-blue-900/30 text-blue-400' : 'text-slate-300 hover:bg-[#1a2a4a]'
                      }`}
                    >
                      {item === 'all' ? 'Todos os cards' : item === 'unanswered' ? 'Não respondidos' : 'Cards errados'}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {isGuest && (
            <p className="mt-2 text-[10px] text-amber-200/80 border border-amber-500/20 bg-amber-500/10 rounded-lg px-2 py-1 text-center">
              Crie sua conta para salvar seu progresso
            </p>
          )}

          <div className="mt-3 h-1 bg-[#0a1525] rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-slate-600 text-[10px]">{answered}/{librasCards.length} respondidos</span>
            {answered > 0 && <span className="text-slate-600 text-[10px]">{Math.round((correct / answered) * 100)}% acertos</span>}
          </div>
        </div>
      </header>

      {filteredCards.length > 0 && (
        <div className="bg-[#0a1220] border-b border-[#1a3050]/50 overflow-x-auto">
          <div className="flex gap-1 px-4 py-2 max-w-2xl mx-auto w-max">
            {filteredCards.map((card, index) => {
              const answer = answers.get(card.id);
              return (
                <button
                  key={card.id}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-7 h-7 rounded-md text-[10px] font-semibold transition-all shrink-0 ${
                    index === currentIndex
                      ? 'bg-blue-600 text-white ring-2 ring-blue-400/50'
                      : answer?.is_correct === true
                      ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-700/40'
                      : answer?.is_correct === false
                      ? 'bg-red-900/50 text-red-400 border border-red-700/40'
                      : 'bg-[#0d1a2e] text-slate-500 border border-[#1a3050]'
                  }`}
                >
                  {card.questionNumber}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-5 flex flex-col gap-4">
        {filteredCards.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center">
            <BookOpen className="w-10 h-10 text-slate-700" />
            <p className="text-slate-400 text-sm">
              {filter === 'unanswered' ? 'Todos os cards foram respondidos!' : filter === 'wrong' ? 'Nenhum card errado. Parabéns!' : 'Nenhum card encontrado.'}
            </p>
            <button onClick={() => setFilter('all')} className="text-blue-400 text-sm hover:text-blue-300 transition-colors">
              Ver todos os cards
            </button>
          </div>
        ) : currentCard ? (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-slate-500 text-xs">
                  {currentIndex + 1} de {filteredCards.length}
                </span>
                {!currentAnswer ? (
                  <span className="flex items-center gap-1 text-slate-500 text-[10px]">
                    <Circle className="w-2.5 h-2.5" /> Não respondido
                  </span>
                ) : currentAnswer.is_correct ? (
                  <span className="flex items-center gap-1 text-emerald-500 text-[10px]">
                    <CheckCircle className="w-2.5 h-2.5" /> Acertei
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-red-500 text-[10px]">
                    <XCircle className="w-2.5 h-2.5" /> Errei
                  </span>
                )}
              </div>
              <span className="text-slate-500 text-xs">Card {currentCard.questionNumber}</span>
            </div>

            <div className="bg-[#0d1a2e] rounded-2xl p-5 border border-[#1a3050]">
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-widest mb-3">Flashcard de LIBRAS</p>
              <p className="text-slate-300 text-sm leading-relaxed">Simule o sinal em libras da palavra:</p>
              <p className="text-white text-2xl font-bold leading-tight mt-2">{currentCard.word}</p>
            </div>

            {answerVisible ? (
              <div className="bg-[#0d1a2e] rounded-2xl p-4 border border-[#1a3050]">
                <div className="flex items-center gap-2 mb-3">
                  <Video className="w-4 h-4 text-blue-400" />
                  <span className="text-slate-300 text-sm font-medium">Resposta em vídeo</span>
                </div>
                <LibrasVideoPlayer
                  key={currentCard.id}
                  src={currentCard.videoSrc}
                  title={`Resposta em vídeo: ${currentCard.word}`}
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setAnswerVisible(true)}
                className="w-full bg-[#0d1a2e] hover:bg-[#0f1e35] rounded-2xl p-5 border border-dashed border-[#2a4770] text-center transition-all"
              >
                <Eye className="w-6 h-6 text-blue-400 mx-auto mb-3" />
                <p className="text-slate-300 text-sm leading-relaxed">
                  Tente adivinhar o sinal, depois clique abaixo para ver a resposta
                </p>
              </button>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => submitResult(true)}
                disabled={!answerVisible}
                className={`flex items-center justify-center gap-2 rounded-xl border py-3 text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                  currentAnswer?.is_correct === true
                    ? 'bg-emerald-600 border-emerald-500 text-white'
                    : 'bg-emerald-900/20 border-emerald-700/50 text-emerald-300 hover:bg-emerald-900/35'
                }`}
              >
                <CheckCircle className="w-4 h-4" /> Acertei
              </button>
              <button
                onClick={() => submitResult(false)}
                disabled={!answerVisible}
                className={`flex items-center justify-center gap-2 rounded-xl border py-3 text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                  currentAnswer?.is_correct === false
                    ? 'bg-red-600 border-red-500 text-white'
                    : 'bg-red-900/20 border-red-700/50 text-red-300 hover:bg-red-900/35'
                }`}
              >
                <XCircle className="w-4 h-4" /> Errei
              </button>
            </div>
          </>
        ) : null}
      </div>

      {filteredCards.length > 0 && (
        <div className="sticky bottom-0 bg-[#050a14]/90 backdrop-blur border-t border-[#1a3050]/50 px-4 py-3">
          <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
            <button
              onClick={() => setCurrentIndex(index => Math.max(0, index - 1))}
              disabled={currentIndex === 0}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0d1a2e] border border-[#1a3050] text-slate-300 text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:border-blue-700 hover:text-white transition-all"
            >
              <ArrowLeft className="w-4 h-4" /> Anterior
            </button>

            <span className="text-slate-500 text-xs">{currentIndex + 1}/{filteredCards.length}</span>

            <button
              onClick={() => setCurrentIndex(index => Math.min(filteredCards.length - 1, index + 1))}
              disabled={currentIndex === filteredCards.length - 1}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0d1a2e] border border-[#1a3050] text-slate-300 text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:border-blue-700 hover:text-white transition-all"
            >
              Próximo <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {showFilterMenu && (
        <div className="fixed inset-0 z-[5]" onClick={() => setShowFilterMenu(false)} />
      )}
    </div>
  );
}
