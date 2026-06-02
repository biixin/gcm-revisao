import { hasSupabaseConfig, supabase, UserAnswer } from './supabase';

const storagePrefix = 'gmdc-local-answers';
const guestCookiePrefix = 'gmdc-guest-answers';
const guestCookieChunkCount = `${guestCookiePrefix}-chunks`;
const guestCookieMaxAge = 60 * 60 * 24 * 14;
const guestCookieChunkSize = 3000;

type StoredAccountAnswer = {
  id: string;
  user_id: string;
  question_id: string;
  selected_answer: string;
  is_correct: boolean;
  answered_at: string;
};

function getStorageKey(userId: string) {
  return `${storagePrefix}:${userId}`;
}

function toAccountAnswer(answer: UserAnswer) {
  return {
    user_id: answer.user_id,
    question_id: answer.question_id,
    selected_answer: answer.selected_answer,
    is_correct: answer.is_correct,
    answered_at: answer.answered_at,
  };
}

function toAnswerMap(answers: StoredAccountAnswer[]) {
  const answerMap = new Map<string, UserAnswer>();

  answers.forEach(answer => {
    answerMap.set(answer.question_id, {
      id: answer.id,
      user_id: answer.user_id,
      question_id: answer.question_id,
      selected_answer: answer.selected_answer,
      is_correct: answer.is_correct,
      answered_at: answer.answered_at,
    });
  });

  return answerMap;
}

function mergeAnswerMaps(base: Map<string, UserAnswer>, incoming: Map<string, UserAnswer>) {
  const merged = new Map(base);

  incoming.forEach((answer, questionId) => {
    const current = merged.get(questionId);
    if (!current || new Date(answer.answered_at).getTime() >= new Date(current.answered_at).getTime()) {
      merged.set(questionId, answer);
    }
  });

  return merged;
}

function readCookie(name: string) {
  if (typeof document === 'undefined') return '';

  const cookie = document.cookie
    .split(';')
    .map(item => item.trim())
    .find(item => item.startsWith(`${name}=`));

  if (!cookie) return '';

  const value = cookie.slice(name.length + 1);
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function writeCookie(name: string, value: string) {
  if (typeof document === 'undefined') return;

  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${guestCookieMaxAge}; Path=/; SameSite=Lax`;
}

function deleteCookie(name: string) {
  if (typeof document === 'undefined') return;

  document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`;
}

function clearGuestCookies() {
  const chunkCount = Number.parseInt(readCookie(guestCookieChunkCount), 10);
  const safeChunkCount = Number.isFinite(chunkCount) ? chunkCount : 0;

  for (let index = 0; index < safeChunkCount; index += 1) {
    deleteCookie(`${guestCookiePrefix}-${index}`);
  }

  deleteCookie(guestCookieChunkCount);
}

function splitQuestionId(questionId: string) {
  const marker = '-q-';
  const markerIndex = questionId.lastIndexOf(marker);
  if (markerIndex < 0) return { prefix: '', suffix: questionId };

  return {
    prefix: questionId.slice(0, markerIndex),
    suffix: questionId.slice(markerIndex + marker.length),
  };
}

function packGuestAnswers(answers: Map<string, UserAnswer>) {
  const prefixes: string[] = [];
  const prefixIndexes = new Map<string, number>();

  const records = Array.from(answers.values())
    .map(answer => {
      const { prefix, suffix } = splitQuestionId(answer.question_id);
      let prefixIndex = prefixIndexes.get(prefix);

      if (prefixIndex === undefined) {
        prefixIndex = prefixes.length;
        prefixes.push(prefix);
        prefixIndexes.set(prefix, prefixIndex);
      }

      return [
        prefixIndex.toString(36),
        suffix,
        answer.selected_answer,
        answer.is_correct ? '1' : '0',
      ].join(',');
    })
    .join(';');

  return `${prefixes.join('|')}#${records}`;
}

function unpackGuestAnswers(packed: string) {
  const answers = new Map<string, UserAnswer>();
  if (!packed) return answers;

  if (packed.includes('#')) {
    const [prefixChunk, records = ''] = packed.split('#');
    const prefixes = prefixChunk ? prefixChunk.split('|') : [''];

    records.split(';').forEach(item => {
      const [packedPrefixIndex, suffix, selectedAnswer, correctFlag] = item.split(',');
      if (!suffix || !selectedAnswer) return;

      const prefixIndex = Number.parseInt(packedPrefixIndex || '', 36);
      const prefix = Number.isFinite(prefixIndex) ? prefixes[prefixIndex] : '';
      const questionId = prefix ? `${prefix}-q-${suffix}` : suffix;

      answers.set(questionId, {
        id: `guest-${questionId}`,
        user_id: 'guest',
        question_id: questionId,
        selected_answer: selectedAnswer,
        is_correct: correctFlag === '1',
        answered_at: new Date().toISOString(),
      });
    });

    return answers;
  }

  packed.split(';').forEach(item => {
    const [questionId, selectedAnswer, correctFlag, packedTime] = item.split(',');
    if (!questionId || !selectedAnswer) return;

    const timestamp = Number.parseInt(packedTime || '', 36);
    const answeredAt = Number.isFinite(timestamp)
      ? new Date(timestamp).toISOString()
      : new Date().toISOString();

    answers.set(questionId, {
      id: `guest-${questionId}`,
      user_id: 'guest',
      question_id: questionId,
      selected_answer: selectedAnswer,
      is_correct: correctFlag === '1',
      answered_at: answeredAt,
    });
  });

  return answers;
}

export function loadGuestAnswers() {
  const chunkCount = Number.parseInt(readCookie(guestCookieChunkCount), 10);
  if (!Number.isFinite(chunkCount) || chunkCount <= 0) return new Map<string, UserAnswer>();

  let packed = '';
  for (let index = 0; index < chunkCount; index += 1) {
    packed += readCookie(`${guestCookiePrefix}-${index}`);
  }

  return unpackGuestAnswers(packed);
}

function saveGuestAnswers(answers: Map<string, UserAnswer>) {
  clearGuestCookies();

  if (answers.size === 0) return;

  const packed = packGuestAnswers(answers);
  const chunks = packed.match(new RegExp(`.{1,${guestCookieChunkSize}}`, 'g')) || [];

  chunks.forEach((chunk, index) => {
    writeCookie(`${guestCookiePrefix}-${index}`, chunk);
  });
  writeCookie(guestCookieChunkCount, String(chunks.length));
}

export function loadLocalAnswers(userId: string | null | undefined) {
  const answers = new Map<string, UserAnswer>();

  if (!userId || typeof window === 'undefined') return answers;

  try {
    const raw = window.localStorage.getItem(getStorageKey(userId));
    if (!raw) return answers;

    const parsed = JSON.parse(raw) as UserAnswer[];
    parsed.forEach(answer => answers.set(answer.question_id, answer));
  } catch {
    window.localStorage.removeItem(getStorageKey(userId));
  }

  return answers;
}

function saveLocalAnswers(userId: string, answers: Map<string, UserAnswer>) {
  if (typeof window === 'undefined') return;

  const storageKey = getStorageKey(userId);
  if (answers.size === 0) {
    window.localStorage.removeItem(storageKey);
    return;
  }

  window.localStorage.setItem(storageKey, JSON.stringify(Array.from(answers.values())));
}

export function saveLocalAnswer(userId: string | null | undefined, answer: UserAnswer) {
  if (!userId || typeof window === 'undefined') return;

  const answers = loadLocalAnswers(userId);
  answers.set(answer.question_id, answer);
  saveLocalAnswers(userId, answers);
}

async function loadAccountAnswers(userId: string, questionIds?: string[]) {
  const browserAnswers = mergeAnswerMaps(loadLocalAnswers(userId), loadGuestAnswers());

  if (!hasSupabaseConfig) return browserAnswers;

  let query = supabase
    .from('local_user_answers')
    .select('*')
    .eq('user_id', userId);

  if (questionIds && questionIds.length > 0) {
    query = query.in('question_id', questionIds);
  }

  const { data, error } = await query;
  if (error) {
    console.warn('Não foi possível carregar o progresso da conta.', error.message);
    return browserAnswers;
  }

  const accountAnswers = toAnswerMap((data || []) as StoredAccountAnswer[]);
  const mergedAnswers = mergeAnswerMaps(accountAnswers, browserAnswers);
  saveLocalAnswers(userId, mergedAnswers);

  const browserAnswersToSync = Array.from(browserAnswers.values());
  if (browserAnswersToSync.length > 0) {
    await supabase
      .from('local_user_answers')
      .upsert(
        browserAnswersToSync.map(answer => toAccountAnswer({ ...answer, user_id: userId })),
        { onConflict: 'user_id,question_id' }
      );
  }

  return mergedAnswers;
}

async function saveAccountAnswer(userId: string, answer: UserAnswer) {
  saveLocalAnswer(userId, answer);

  if (!hasSupabaseConfig) return;

  const { error } = await supabase
    .from('local_user_answers')
    .upsert(toAccountAnswer({ ...answer, user_id: userId }), { onConflict: 'user_id,question_id' });

  if (error) {
    console.warn('Não foi possível salvar o progresso da conta.', error.message);
  }
}

export async function loadProgressAnswers(
  userId: string | null | undefined,
  isGuest: boolean,
  questionIds?: string[]
) {
  if (isGuest) return loadGuestAnswers();
  if (!userId) return new Map<string, UserAnswer>();

  return loadAccountAnswers(userId, questionIds);
}

export async function saveProgressAnswer(userId: string | null | undefined, isGuest: boolean, answer: UserAnswer) {
  if (isGuest) {
    const answers = loadGuestAnswers();
    answers.set(answer.question_id, answer);
    saveGuestAnswers(answers);
    return;
  }

  if (!userId) return;

  await saveAccountAnswer(userId, answer);
}

export async function resetProgressAnswers(
  userId: string | null | undefined,
  isGuest: boolean,
  questionIds: string[]
) {
  const questionIdSet = new Set(questionIds);

  if (isGuest) {
    const answers = loadGuestAnswers();
    questionIdSet.forEach(questionId => answers.delete(questionId));
    saveGuestAnswers(answers);
    return;
  }

  if (!userId) return;

  const answers = loadLocalAnswers(userId);
  questionIdSet.forEach(questionId => answers.delete(questionId));
  saveLocalAnswers(userId, answers);

  if (!hasSupabaseConfig || questionIds.length === 0) return;

  const { error } = await supabase
    .from('local_user_answers')
    .delete()
    .eq('user_id', userId)
    .in('question_id', questionIds);

  if (error) {
    console.warn('Não foi possível resetar o progresso da conta.', error.message);
  }
}
