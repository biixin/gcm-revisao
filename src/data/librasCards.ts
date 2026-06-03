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
  'ajudar.mp4': 'https://firebasestorage.googleapis.com/v0/b/gcm-caxias-17535.firebasestorage.app/o/libras%2Fajudar.mp4?alt=media&token=a3dac882-02d7-404a-a715-e00fb0af31ac',
  'assedio.mp4': 'https://firebasestorage.googleapis.com/v0/b/gcm-caxias-17535.firebasestorage.app/o/libras%2Fassedio.mp4?alt=media&token=a5888a10-28fd-4894-9577-69ef6daea20a',
  'boa tarde.mp4': 'https://firebasestorage.googleapis.com/v0/b/gcm-caxias-17535.firebasestorage.app/o/libras%2Fboa%20tarde.mp4?alt=media&token=66a6da77-a3ea-49c3-b835-bba82c3c03c4',
  'calma.mp4': 'https://firebasestorage.googleapis.com/v0/b/gcm-caxias-17535.firebasestorage.app/o/libras%2Fcalma.mp4?alt=media&token=b07bdc4c-e4e4-4bf6-b29a-d76194a259d8',
  'desculpa.mp4': 'https://firebasestorage.googleapis.com/v0/b/gcm-caxias-17535.firebasestorage.app/o/libras%2Fdesculpa.mp4?alt=media&token=6d52309e-9dc1-4489-8f36-6327a0d61b2e',
  'deus abençoe.mp4': 'https://firebasestorage.googleapis.com/v0/b/gcm-caxias-17535.firebasestorage.app/o/libras%2Fdeus%20aben%C3%A7oe.mp4?alt=media&token=abe7ad4b-9e27-479b-934c-7d3e130e0e39',
  'documentos.mp4': 'https://firebasestorage.googleapis.com/v0/b/gcm-caxias-17535.firebasestorage.app/o/libras%2Fdocumentos.mp4?alt=media&token=5511e29a-2f72-4eac-b32a-e675f6788c62',
  'estou aprendendo libras.mp4': 'https://firebasestorage.googleapis.com/v0/b/gcm-caxias-17535.firebasestorage.app/o/libras%2Festou%20aprendendo%20libras.mp4?alt=media&token=489203ac-f667-4f8a-a3ea-251036c50fa1',
  'estupro.mp4': 'https://firebasestorage.googleapis.com/v0/b/gcm-caxias-17535.firebasestorage.app/o/libras%2Festupro.mp4?alt=media&token=0923b7c3-ab04-4b6b-bfad-1bdf90644931',
  'feliz aniversario.mp4': 'https://firebasestorage.googleapis.com/v0/b/gcm-caxias-17535.firebasestorage.app/o/libras%2Ffeliz%20aniversario.mp4?alt=media&token=cf03cf35-b375-4dde-95d0-ebb06ccbf19f',
  'hospital.mp4': 'https://firebasestorage.googleapis.com/v0/b/gcm-caxias-17535.firebasestorage.app/o/libras%2Fhospital.mp4?alt=media&token=a838d3de-93d4-46c4-884b-2296cd6cd512',
  'medico.mp4': 'https://firebasestorage.googleapis.com/v0/b/gcm-caxias-17535.firebasestorage.app/o/libras%2Fmedico.mp4?alt=media&token=2f7f1ba3-2361-4c00-8667-accc64e2366c',
  'nome.mp4': 'https://firebasestorage.googleapis.com/v0/b/gcm-caxias-17535.firebasestorage.app/o/libras%2Fnome.mp4?alt=media&token=d3a68fc2-a60a-42a3-a090-0b1d2d31aee6',
  'não entendi.mp4': 'https://firebasestorage.googleapis.com/v0/b/gcm-caxias-17535.firebasestorage.app/o/libras%2Fn%C3%A3o%20entendi.mp4?alt=media&token=11f7807a-9118-44b8-8454-88df657394cf',
  'o que aconteceu.mp4': 'https://firebasestorage.googleapis.com/v0/b/gcm-caxias-17535.firebasestorage.app/o/libras%2Fo%20que%20aconteceu.mp4?alt=media&token=c45b0543-3475-406b-b1d1-e06436fa2662',
  'obrigado.mp4': 'https://firebasestorage.googleapis.com/v0/b/gcm-caxias-17535.firebasestorage.app/o/libras%2Fobrigado.mp4?alt=media&token=f633f0fa-a495-4ab3-bd2a-65515e8d1845',
  'onde você mora.mp4': 'https://firebasestorage.googleapis.com/v0/b/gcm-caxias-17535.firebasestorage.app/o/libras%2Fonde%20voc%C3%AA%20mora.mp4?alt=media&token=5da11d4e-a635-4333-a70c-cb699b35db3a',
  'policia.mp4': 'https://firebasestorage.googleapis.com/v0/b/gcm-caxias-17535.firebasestorage.app/o/libras%2Fpolicia.mp4?alt=media&token=5186fdca-1099-4beb-98b1-3310a0664de6',
  'praça.mp4': 'https://firebasestorage.googleapis.com/v0/b/gcm-caxias-17535.firebasestorage.app/o/libras%2Fpra%C3%A7a.mp4?alt=media&token=f6ee4f1c-c4b7-4139-b3cd-0935c03d425b',
  'trabalhar.mp4': 'https://firebasestorage.googleapis.com/v0/b/gcm-caxias-17535.firebasestorage.app/o/libras%2Ftrabalhar.mp4?alt=media&token=d73781dd-3133-4cac-8c1b-2162bda7d17e',
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
    file: 'hospital1.mp4',
    src: 'https://firebasestorage.googleapis.com/v0/b/gcm-caxias-17535.firebasestorage.app/o/libras%2Finversos%2Fhospital1.mp4?alt=media&token=a01354fe-1588-4345-9aea-92805c25fad1',
  },
  Obrigado: {
    file: 'obrigado1.mp4',
    src: 'https://firebasestorage.googleapis.com/v0/b/gcm-caxias-17535.firebasestorage.app/o/libras%2Finversos%2Fobrigado1.mp4?alt=media&token=11307355-b2a0-4404-98d8-4924d2fb14b4',
  },
  'Boa tarde': {
    file: 'boa tarde1.mp4',
    src: 'https://firebasestorage.googleapis.com/v0/b/gcm-caxias-17535.firebasestorage.app/o/libras%2Finversos%2Fboa%20tarde1.mp4?alt=media&token=80d8ce57-4a4d-4f89-b55e-bb24bb8e22b0',
  },
  'Onde você mora': {
    file: 'onde você mora1.mp4',
    src: 'https://firebasestorage.googleapis.com/v0/b/gcm-caxias-17535.firebasestorage.app/o/libras%2Finversos%2Fonde%20voc%C3%AA%20mora1.mp4?alt=media&token=fbf37474-b5a1-41af-b279-fa9237363b07',
  },
  'O que aconteceu': {
    file: 'o que aconteceu1.mp4',
    src: 'https://firebasestorage.googleapis.com/v0/b/gcm-caxias-17535.firebasestorage.app/o/libras%2Finversos%2Fo%20que%20aconteceu1.mp4?alt=media&token=733b271b-9f16-4cbf-bb89-41bebfde8a8e',
  },
  Praça: {
    file: 'praça1.mp4',
    src: 'https://firebasestorage.googleapis.com/v0/b/gcm-caxias-17535.firebasestorage.app/o/libras%2Finversos%2Fpra%C3%A7a1.mp4?alt=media&token=f5d36f49-6807-415d-b73f-aa36fff0997d',
  },
  'Deus abençoe': {
    file: 'deus abençoe1.mp4',
    src: 'https://firebasestorage.googleapis.com/v0/b/gcm-caxias-17535.firebasestorage.app/o/libras%2Finversos%2Fdeus%20aben%C3%A7oe1.mp4?alt=media&token=4326a8b0-0d59-49df-a316-bac5e6512a65',
  },
  Calma: {
    file: 'calma1.mp4',
    src: 'https://firebasestorage.googleapis.com/v0/b/gcm-caxias-17535.firebasestorage.app/o/libras%2Finversos%2Fcalma1.mp4?alt=media&token=96b725d4-1fe9-432a-8c88-7fd08bbbe206',
  },
  'Estou aprendendo Libras': {
    file: 'eu estou aprendendo libras1.mp4',
    src: 'https://firebasestorage.googleapis.com/v0/b/gcm-caxias-17535.firebasestorage.app/o/libras%2Finversos%2Feu%20estou%20aprendendo%20libras1.mp4?alt=media&token=e8219bf3-fa0c-4f85-adac-f7338a0b2e51',
  },
  'Feliz aniversário': {
    file: 'feliz aniversario1.mp4',
    src: 'https://firebasestorage.googleapis.com/v0/b/gcm-caxias-17535.firebasestorage.app/o/libras%2Finversos%2Ffeliz%20aniversario1.mp4?alt=media&token=f8de37b8-78d8-4d07-810d-66d1d84de1d2',
  },
  Assédio: {
    file: 'assedio1.mp4',
    src: 'https://firebasestorage.googleapis.com/v0/b/gcm-caxias-17535.firebasestorage.app/o/libras%2Finversos%2Fassedio1.mp4?alt=media&token=cce5b04b-5248-4dd0-b7df-541927af50fe',
  },
  Trabalhar: {
    file: 'trabalhar1.mp4',
    src: 'https://firebasestorage.googleapis.com/v0/b/gcm-caxias-17535.firebasestorage.app/o/libras%2Finversos%2Ftrabalhar1.mp4?alt=media&token=888f8882-00f3-4a72-b65b-955d38c59c94',
  },
  Documentos: {
    file: 'documentos1.mp4',
    src: 'https://firebasestorage.googleapis.com/v0/b/gcm-caxias-17535.firebasestorage.app/o/libras%2Finversos%2Fdocumentos1.mp4?alt=media&token=382ef27b-57f0-4f86-a301-9fba3431d6bb',
  },
  'Não entendi': {
    file: 'nao entendi1.mp4',
    src: 'https://firebasestorage.googleapis.com/v0/b/gcm-caxias-17535.firebasestorage.app/o/libras%2Finversos%2Fnao%20entendi1.mp4?alt=media&token=a81bccff-2c40-4635-96d4-b87b1c934ef2',
  },
  Desculpa: {
    file: 'desculpa1.mp4',
    src: 'https://firebasestorage.googleapis.com/v0/b/gcm-caxias-17535.firebasestorage.app/o/libras%2Finversos%2Fdesculpa1.mp4?alt=media&token=def970cc-61d3-4436-aaf6-6fd37193d024',
  },
  Polícia: {
    file: 'policia1.mp4',
    src: 'https://firebasestorage.googleapis.com/v0/b/gcm-caxias-17535.firebasestorage.app/o/libras%2Finversos%2Fpolicia1.mp4?alt=media&token=e6fdd569-4d7e-4425-8915-f91747fefc80',
  },
  Nome: {
    file: 'nome1.mp4',
    src: 'https://firebasestorage.googleapis.com/v0/b/gcm-caxias-17535.firebasestorage.app/o/libras%2Finversos%2Fnome1.mp4?alt=media&token=bc9639e2-06de-4054-9514-6dade8e24956',
  },
  Ajudar: {
    file: 'ajudar1.mp4',
    src: 'https://firebasestorage.googleapis.com/v0/b/gcm-caxias-17535.firebasestorage.app/o/libras%2Finversos%2Fajudar1.mp4?alt=media&token=2ebb1df3-d571-4b66-b7fc-771d4627a1be',
  },
  Estupro: {
    file: 'estupro1.mp4',
    src: 'https://firebasestorage.googleapis.com/v0/b/gcm-caxias-17535.firebasestorage.app/o/libras%2Finversos%2Festupro1.mp4?alt=media&token=e14f55a3-1070-4a7e-9bd2-7aa176bfb9fe',
  },
  Médico: {
    file: 'medico1.mp4',
    src: 'https://firebasestorage.googleapis.com/v0/b/gcm-caxias-17535.firebasestorage.app/o/libras%2Finversos%2Fmedico1.mp4?alt=media&token=9a3d1764-b0da-4a14-90e8-5067c98d9796',
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
