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

const librasVideoSrcByFile = {
  'hospital.mp4': '/libras/normal/hospital.mp4',
  'obrigado.mp4': '/libras/normal/obrigado.mp4',
  'boa tarde.mp4': '/libras/normal/boa-tarde.mp4',
  'onde você mora.mp4': '/libras/normal/onde-voce-mora.mp4',
  'o que aconteceu.mp4': '/libras/normal/o-que-aconteceu.mp4',
  'praça.mp4': '/libras/normal/praca.mp4',
  'deus abençoe.mp4': '/libras/normal/deus-abencoe.mp4',
  'calma.mp4': '/libras/normal/calma.mp4',
  'estou aprendendo libras.mp4': '/libras/normal/estou-aprendendo-libras.mp4',
  'feliz aniversario.mp4': '/libras/normal/feliz-aniversario.mp4',
  'assedio.mp4': '/libras/normal/assedio.mp4',
  'trabalhar.mp4': '/libras/normal/trabalhar.mp4',
  'documentos.mp4': '/libras/normal/documentos.mp4',
  'não entendi.mp4': '/libras/normal/nao-entendi.mp4',
  'desculpa.mp4': '/libras/normal/desculpa.mp4',
  'policia.mp4': '/libras/normal/policia.mp4',
  'nome.mp4': '/libras/normal/nome.mp4',
  'ajudar.mp4': '/libras/normal/ajudar.mp4',
  'estupro.mp4': '/libras/normal/estupro.mp4',
  'medico.mp4': '/libras/normal/medico.mp4',
} satisfies Record<(typeof rawLibrasCards)[number]['videoFile'], string>;

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
  videoSrc: librasVideoSrcByFile[card.videoFile],
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

const inverseVideoByWord = {
  Hospital: {
    file: 'hospital.mp4',
    src: '/libras/inverso/hospital.mp4',
  },
  Obrigado: {
    file: 'obrigado.mp4',
    src: '/libras/inverso/obrigado.mp4',
  },
  'Boa tarde': {
    file: 'boa-tarde.mp4',
    src: '/libras/inverso/boa-tarde.mp4',
  },
  'Onde você mora': {
    file: 'onde-voce-mora.mp4',
    src: '/libras/inverso/onde-voce-mora.mp4',
  },
  'O que aconteceu': {
    file: 'o-que-aconteceu.mp4',
    src: '/libras/inverso/o-que-aconteceu.mp4',
  },
  Praça: {
    file: 'praca.mp4',
    src: '/libras/inverso/praca.mp4',
  },
  'Deus abençoe': {
    file: 'deus-abencoe.mp4',
    src: '/libras/inverso/deus-abencoe.mp4',
  },
  Calma: {
    file: 'calma.mp4',
    src: '/libras/inverso/calma.mp4',
  },
  'Estou aprendendo Libras': {
    file: 'eu-estou-aprendendo-libras.mp4',
    src: '/libras/inverso/eu-estou-aprendendo-libras.mp4',
  },
  'Feliz aniversário': {
    file: 'feliz-aniversario.mp4',
    src: '/libras/inverso/feliz-aniversario.mp4',
  },
  Assédio: {
    file: 'assedio.mp4',
    src: '/libras/inverso/assedio.mp4',
  },
  Trabalhar: {
    file: 'trabalhar.mp4',
    src: '/libras/inverso/trabalhar.mp4',
  },
  Documentos: {
    file: 'documentos.mp4',
    src: '/libras/inverso/documentos.mp4',
  },
  'Não entendi': {
    file: 'nao-entendi.mp4',
    src: '/libras/inverso/nao-entendi.mp4',
  },
  Desculpa: {
    file: 'desculpa.mp4',
    src: '/libras/inverso/desculpa.mp4',
  },
  Polícia: {
    file: 'policia.mp4',
    src: '/libras/inverso/policia.mp4',
  },
  Nome: {
    file: 'nome.mp4',
    src: '/libras/inverso/nome.mp4',
  },
  Ajudar: {
    file: 'ajudar.mp4',
    src: '/libras/inverso/ajudar.mp4',
  },
  Estupro: {
    file: 'estupro.mp4',
    src: '/libras/inverso/estupro.mp4',
  },
  Médico: {
    file: 'medico.mp4',
    src: '/libras/inverso/medico.mp4',
  },
} satisfies Record<(typeof rawLibrasCards)[number]['word'], { file: string; src: string }>;

const inverseAnswerByWord: Record<string, string> = {
  'Estou aprendendo Libras': 'Eu estou aprendendo Libras',
};

export const librasInverseCards: LibrasInverseCard[] = librasCards.map(card => {
  const sourceWord = card.word as keyof typeof inverseVideoByWord;
  const inverseWord = inverseAnswerByWord[card.word] ?? card.word;
  const video = inverseVideoByWord[sourceWord];
  const choices = inverseChoicesByWord[inverseWord] ?? [inverseWord];
  const correctIndex = choices.findIndex(choice => choice === inverseWord);
  const correctLetter = String.fromCharCode(97 + Math.max(0, correctIndex));

  return {
    ...card,
    id: `${librasInverseSubjectId}-q-${String(card.questionNumber).padStart(2, '0')}`,
    word: inverseWord,
    videoFile: video.file,
    videoSrc: video.src,
    correctAnswer: correctLetter,
    options: choices.map((choice, index) => ({
      letter: String.fromCharCode(97 + index),
      text: choice,
    })),
  };
});
