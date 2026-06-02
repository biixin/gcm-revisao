import { hasSupabaseConfig, supabase, UserAnswer } from './supabase';

const storagePrefix = 'gmdc-local-answers';
const guestCookiePrefix = 'gmdc-guest-answers';
const guestCookieChunkCount = `${guestCookiePrefix}-chunks`;
const guestCookieMaxAge = 60 * 60 * 24 * 14;
const guestCookieChunkSize = 3000;
const accountMetadataKey = 'gmdc_progress_v1';

function getStorageKey(userId: string) {
  return `${storagePrefix}:${userId}`;
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

function filterAnswersByQuestionIds(answers: Map<string, UserAnswer>, questionIds?: string[]) {
  if (!questionIds || questionIds.length === 0) return answers;

  const questionIdSet = new Set(questionIds);
  const filteredAnswers = new Map<string, UserAnswer>();
  answers.forEach((answer, questionId) => {
    if (questionIdSet.has(questionId)) filteredAnswers.set(questionId, answer);
  });

  return filteredAnswers;
}

function deleteAnswers(answers: Map<string, UserAnswer>, questionIdSet: Set<string>) {
  questionIdSet.forEach(questionId => answers.delete(questionId));
  return answers;
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

function packAnswers(answers: Map<string, UserAnswer>) {
  const prefixes: string[] = [];
  const prefixIndexes = new Map<string, number>();

  const records = Array.from(answers.values())
    .sort((a, b) => a.question_id.localeCompare(b.question_id))
    .map(answer => {
      const { prefix, suffix } = splitQuestionId(answer.question_id);
      let prefixIndex = prefixIndexes.get(prefix);
      const timestamp = new Date(answer.answered_at).getTime();
      const packedTime = Number.isFinite(timestamp) ? timestamp.toString(36) : Date.now().toString(36);

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
        packedTime,
      ].join(',');
    })
    .join(';');

  return `${prefixes.join('|')}#${records}`;
}

function unpackAnswers(packed: string, userId: string) {
  const answers = new Map<string, UserAnswer>();
  if (!packed) return answers;

  if (packed.includes('#')) {
    const [prefixChunk, records = ''] = packed.split('#');
    const prefixes = prefixChunk ? prefixChunk.split('|') : [''];

    records.split(';').forEach(item => {
      const [packedPrefixIndex, suffix, selectedAnswer, correctFlag, packedTime] = item.split(',');
      if (!suffix || !selectedAnswer) return;

      const prefixIndex = Number.parseInt(packedPrefixIndex || '', 36);
      const prefix = Number.isFinite(prefixIndex) ? prefixes[prefixIndex] : '';
      const questionId = prefix ? `${prefix}-q-${suffix}` : suffix;
      const timestamp = Number.parseInt(packedTime || '', 36);
      const answeredAt = Number.isFinite(timestamp)
        ? new Date(timestamp).toISOString()
        : new Date().toISOString();

      answers.set(questionId, {
        id: `${userId}-${questionId}`,
        user_id: userId,
        question_id: questionId,
        selected_answer: selectedAnswer,
        is_correct: correctFlag === '1',
        answered_at: answeredAt,
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
      id: `${userId}-${questionId}`,
      user_id: userId,
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

  return unpackAnswers(packed, 'guest');
}

function saveGuestAnswers(answers: Map<string, UserAnswer>) {
  clearGuestCookies();

  if (answers.size === 0) return;

  const packed = packAnswers(answers);
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

async function loadAccountMetadataAnswers(userId: string) {
  if (!hasSupabaseConfig) return new Map<string, UserAnswer>();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user || data.user.id !== userId) {
    if (error) console.warn('Não foi possível carregar o progresso da conta.', error.message);
    return new Map<string, UserAnswer>();
  }

  const packed = data.user.user_metadata?.[accountMetadataKey];
  return typeof packed === 'string' ? unpackAnswers(packed, userId) : new Map<string, UserAnswer>();
}

async function saveAccountMetadataAnswers(userId: string, answers: Map<string, UserAnswer>) {
  if (!hasSupabaseConfig) return;

  const { data, error: getError } = await supabase.auth.getUser();
  if (getError || !data.user || data.user.id !== userId) {
    if (getError) console.warn('Não foi possível salvar o progresso da conta.', getError.message);
    return;
  }

  const { error } = await supabase.auth.updateUser({
    data: {
      ...data.user.user_metadata,
      [accountMetadataKey]: packAnswers(answers),
    },
  });

  if (error) {
    console.warn('Não foi possível salvar o progresso da conta.', error.message);
  }
}

async function loadAccountAnswers(userId: string, questionIds?: string[]) {
  const localAnswers = loadLocalAnswers(userId);
  const guestAnswers = loadGuestAnswers();
  const accountAnswers = await loadAccountMetadataAnswers(userId);
  const mergedAnswers = mergeAnswerMaps(
    mergeAnswerMaps(guestAnswers, accountAnswers),
    localAnswers
  );

  saveLocalAnswers(userId, mergedAnswers);

  if (packAnswers(mergedAnswers) !== packAnswers(accountAnswers)) {
    await saveAccountMetadataAnswers(userId, mergedAnswers);
  }

  return filterAnswersByQuestionIds(mergedAnswers, questionIds);
}

async function saveAccountAnswer(userId: string, answer: UserAnswer) {
  const accountAnswers = await loadAccountAnswers(userId);
  const answers = new Map(accountAnswers);

  answers.set(answer.question_id, { ...answer, user_id: userId });
  saveLocalAnswers(userId, answers);
  await saveAccountMetadataAnswers(userId, answers);
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

  const localAnswers = deleteAnswers(loadLocalAnswers(userId), questionIdSet);
  const guestAnswers = deleteAnswers(loadGuestAnswers(), questionIdSet);
  const accountAnswers = deleteAnswers(await loadAccountMetadataAnswers(userId), questionIdSet);
  const mergedAnswers = mergeAnswerMaps(
    mergeAnswerMaps(guestAnswers, accountAnswers),
    localAnswers
  );

  saveLocalAnswers(userId, mergedAnswers);
  saveGuestAnswers(guestAnswers);
  await saveAccountMetadataAnswers(userId, mergedAnswers);
}
