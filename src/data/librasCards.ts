export const librasSubjectId = 'local-libras';
export const librasInverseSubjectId = 'local-libras-inverso';

export const librasSubject = {
  id: librasSubjectId,
  name: 'LIBRAS',
  teacher_name: 'Flashcards em vídeo',
  description: 'Treino de sinais em LIBRAS com respostas em vídeo.',
} as const;

export const librasInverseSubject = {
  id: librasInverseSubjectId,
  name: 'LIBRAS - Modo Inverso',
  teacher_name: 'Vídeo para múltipla escolha',
  description: 'Identifique o sinal em LIBRAS assistindo ao vídeo.',
} as const;

const videoBasePath = '/libras/0602';
const inverseVideoBasePath = '/libras/0602/inverso';

const rawLibrasCards = [
  { word: 'Hospital', videoFile: 'hospital.mp4' },
  { word: 'Obrigado', videoFile: 'obrigado.mp4' },
  { word: 'Boa tarde', videoFile: 'boa tarde.mp4' },
  { word: 'Onde você mora', videoFile: 'onde você mora.mp4' },
  { word: 'O que aconteceu', videoFile: 'o que aconteceu.mp4' },
  { word: 'Praça', videoFile: 'praça.mp4' },
  { word: 'Deus abençoe', videoFile: 'deus abençoe.mp4' },
  { word: 'Calma', videoFile: 'calma.mp4' },
  { word: 'Estou aprendendo Libras', videoFile: 'estou aprendendo libras.mp4' },
  { word: 'Feliz aniversário', videoFile: 'feliz aniversario.mp4' },
  { word: 'Assédio', videoFile: 'assedio.mp4' },
  { word: 'Trabalhar', videoFile: 'trabalhar.mp4' },
  { word: 'Documentos', videoFile: 'documentos.mp4' },
  { word: 'Não entendi', videoFile: 'não entendi.mp4' },
  { word: 'Desculpa', videoFile: 'desculpa.mp4' },
  { word: 'Polícia', videoFile: 'policia.mp4' },
  { word: 'Nome', videoFile: 'nome.mp4' },
  { word: 'Ajudar', videoFile: 'ajudar.mp4' },
  { word: 'Estupro', videoFile: 'estupro.mp4' },
  { word: 'Médico', videoFile: 'medico.mp4' },
] as const;

export type LibrasCard = {
  id: string;
  questionNumber: number;
  word: string;
  videoFile: string;
  videoSrc: string;
};

export type LibrasInverseOption = {
  letter: string;
  text: string;
};

export type LibrasInverseCard = LibrasCard & {
  correctAnswer: string;
  options: LibrasInverseOption[];
};

export const librasCards: LibrasCard[] = rawLibrasCards.map((card, index) => ({
  id: `${librasSubjectId}-q-${String(index + 1).padStart(2, '0')}`,
  questionNumber: index + 1,
  word: card.word,
  videoFile: card.videoFile,
  videoSrc: `${videoBasePath}/${card.videoFile}`,
}));

const inverseChoicesByWord: Record<string, string[]> = {
  Hospital: ['Médico', 'Hospital', 'Ambulância', 'Remédio'],
  Obrigado: ['Desculpa', 'Obrigado', 'Por favor', 'Com licença'],
  'Boa tarde': ['Boa noite', 'Bom dia', 'Boa tarde', 'Até logo'],
  'Onde você mora': ['Qual é seu nome', 'Onde você mora', 'Onde fica o hospital', 'Você trabalha onde'],
  'O que aconteceu': ['Você está bem', 'Não entendi', 'O que aconteceu', 'Precisa de ajuda'],
  Praça: ['Parque', 'Praça', 'Rua', 'Escola'],
  'Deus abençoe': ['Obrigado', 'Feliz aniversário', 'Deus abençoe', 'Boa tarde'],
  Calma: ['Desculpa', 'Espera', 'Calma', 'Não entendi'],
  'Eu estou aprendendo Libras': ['Eu sei Libras', 'Não entendi', 'Meu nome é', 'Eu estou aprendendo Libras'],
  'Feliz aniversário': ['Deus abençoe', 'Feliz aniversário', 'Boa tarde', 'Obrigado'],
  Assédio: ['Estupro', 'Ameaça', 'Assédio', 'Violência'],
  Trabalhar: ['Estudar', 'Trabalhar', 'Ajudar', 'Nome'],
  Documentos: ['Nome', 'Carteira', 'Documentos', 'Papel'],
  'Não entendi': ['Desculpa', 'O que aconteceu', 'Não entendi', 'Calma'],
  Desculpa: ['Obrigado', 'Desculpa', 'Com licença', 'Não entendi'],
  Polícia: ['Guarda municipal', 'Hospital', 'Polícia', 'Médico'],
  Nome: ['Documento', 'Endereço', 'Nome', 'Idade'],
  Ajudar: ['Trabalhar', 'Ajudar', 'Socorrer', 'Calma'],
  Estupro: ['Assédio', 'Violência', 'Estupro', 'Agressão'],
  Médico: ['Hospital', 'Médico', 'Remédio', 'Enfermeiro'],
};

const inverseVideoFileByWord: Record<string, string> = {
  Hospital: 'hospital.mp4',
  Obrigado: 'obrigado.mp4',
  'Boa tarde': 'boa tarde.mp4',
  'Onde você mora': 'onde você mora.mp4',
  'O que aconteceu': 'o que aconteceu.mp4',
  Praça: 'praça.mp4',
  'Deus abençoe': 'deus abençoe.mp4',
  Calma: 'calma.mp4',
  'Estou aprendendo Libras': 'eu estou aprendendo libras.mp4',
  'Feliz aniversário': 'feliz aniversario.mp4',
  Assédio: 'assedio.mp4',
  Trabalhar: 'trabalhar.mp4',
  Documentos: 'documentos.mp4',
  'Não entendi': 'nao entendi.mp4',
  Desculpa: 'desculpa.mp4',
  Polícia: 'policia.mp4',
  Nome: 'nome.mp4',
  Ajudar: 'ajudar.mp4',
  Estupro: 'estupro.mp4',
  Médico: 'medico.mp4',
};

const inverseAnswerByWord: Record<string, string> = {
  'Estou aprendendo Libras': 'Eu estou aprendendo Libras',
};

export const librasInverseCards: LibrasInverseCard[] = librasCards.map(card => {
  const inverseWord = inverseAnswerByWord[card.word] ?? card.word;
  const videoFile = inverseVideoFileByWord[card.word] ?? card.videoFile;
  const choices = inverseChoicesByWord[inverseWord] ?? [inverseWord];
  const correctIndex = choices.findIndex(choice => choice === inverseWord);
  const correctLetter = String.fromCharCode(97 + Math.max(0, correctIndex));

  return {
    ...card,
    id: `${librasInverseSubjectId}-q-${String(card.questionNumber).padStart(2, '0')}`,
    word: inverseWord,
    videoFile,
    videoSrc: `${inverseVideoBasePath}/${videoFile}`,
    correctAnswer: correctLetter,
    options: choices.map((choice, index) => ({
      letter: String.fromCharCode(97 + index),
      text: choice,
    })),
  };
});
