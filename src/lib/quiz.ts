import type { AnswerChoice } from "./storage";

export type QuizQuestion = {
  id: string;
  prompt: string;
  choices: Record<AnswerChoice, string>;
  correct: AnswerChoice;
  explanation: string;
};

export type QuizPayload = {
  videoId: string;
  videoTitle: string;
  transcriptText: string;
  seed?: number;
};

const KEYWORDS = [
  "must",
  "should",
  "required",
  "never",
  "always",
  "ensure",
  "hazard",
  "protect",
  "safety",
  "training",
  "procedure",
  "risk",
  "report",
  "inspect",
];

const splitSentences = (text: string) =>
  text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 40 && sentence.length < 220);

const scoreSentence = (sentence: string) => {
  const lowered = sentence.toLowerCase();
  let score = 0;
  for (const keyword of KEYWORDS) {
    if (lowered.includes(keyword)) {
      score += 2;
    }
  }
  if (/\b(must|should|required|never|always)\b/.test(lowered)) {
    score += 3;
  }
  return score + Math.min(sentence.length / 80, 2);
};

const buildDistractors = (
  correct: string,
  videoTitle: string,
  random: () => number,
) => {
  const genericWrong = [
    "Ignore safety rules if the task feels routine.",
    "Skip reporting hazards to avoid slowing the team down.",
    "Only supervisors must follow OSHA guidance.",
    "Personal protective equipment is optional for short tasks.",
    "Work faster by bypassing required procedures.",
    "If no one is watching, safety checks are unnecessary.",
    "Training is only required after an incident occurs.",
    "Hazards should be addressed only at the end of a project.",
  ];

  const lessonWrong = [
    `The lesson says OSHA guidance does not apply to ${videoTitle.toLowerCase()}.`,
    `The lesson recommends ignoring signage when you feel confident.`,
    `The lesson says you should prioritize speed over safety.`,
  ];

  const pool = shuffle([...genericWrong, ...lessonWrong], random);
  const filtered = pool.filter(
    (option) => option.toLowerCase() !== correct.toLowerCase(),
  );
  return filtered.slice(0, 3);
};

const createRulePrompt = (sentence: string) => {
  const lowered = sentence.toLowerCase();
  if (lowered.includes("must") || lowered.includes("required")) {
    return "Which requirement is emphasized in this lesson?";
  }
  if (lowered.includes("should")) {
    return "What is the recommended action from the lesson?";
  }
  if (lowered.includes("never")) {
    return "Which action should never be taken according to the lesson?";
  }
  if (lowered.includes("always")) {
    return "Which action should always be taken according to the lesson?";
  }
  return "Which safety rule is highlighted in this lesson?";
};

const asScenario = (sentence: string) =>
  `You are on the job site. Based on the lesson, what should you do?`;

const buildQuestion = (
  sentence: string,
  distractors: string[],
  index: number,
  random: () => number,
): QuizQuestion => {
  const prompt =
    index % 2 === 0 ? createRulePrompt(sentence) : asScenario(sentence);
  const options = [sentence, ...distractors];
  const offset = Math.floor(random() * 4);
  const rotated = options.slice(offset).concat(options.slice(0, offset));
  const order = ["A", "B", "C", "D"] as AnswerChoice[];
  const shuffled = order.map((key, idx) => ({
    key,
    value: rotated[idx],
  }));
  const correctIndex = (4 - offset) % 4;
  return {
    id: `q-${index + 1}`,
    prompt,
    choices: shuffled.reduce(
      (acc, item) => {
        acc[item.key] = item.value;
        return acc;
      },
      {} as Record<AnswerChoice, string>,
    ),
    correct: order[correctIndex],
    explanation: sentence,
  };
};

const normalizeChoices = (question: QuizQuestion): QuizQuestion => {
  const ordered: AnswerChoice[] = ["A", "B", "C", "D"];
  const values = ordered.map((choice) => question.choices[choice]);
  return {
    ...question,
    choices: {
      A: values[0],
      B: values[1],
      C: values[2],
      D: values[3],
    },
  };
};

const seededRandom = (seed: number) => {
  let value = seed;
  return () => {
    value |= 0;
    value = (value + 0x6d2b79f5) | 0;
    let t = Math.imul(value ^ (value >>> 15), 1 | value);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const shuffle = <T,>(items: T[], random: () => number) => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

export const generateQuiz = (payload: QuizPayload): QuizQuestion[] => {
  const seed =
    typeof payload.seed === "number" ? payload.seed : payload.videoId.length;
  const random = seededRandom(seed);
  const sentences = splitSentences(payload.transcriptText);
  const ranked = [...sentences]
    .sort((a, b) => scoreSentence(b) - scoreSentence(a))
    .slice(0, 8);
  const shuffledRanked = shuffle(ranked, random);
  const selected =
    shuffledRanked.length >= 3
      ? shuffledRanked.slice(0, 3)
      : sentences.slice(0, 3);

  const fallbackSentence = `This lesson emphasizes safe work practices and following OSHA guidance in ${payload.videoTitle}.`;
  const filled = [...selected];
  while (filled.length < 3) {
    filled.push(fallbackSentence);
  }

  return filled.map((sentence, index) => {
    const distractors = buildDistractors(
      sentence,
      payload.videoTitle,
      random,
    );
    const question = buildQuestion(sentence, distractors, index, random);
    return normalizeChoices(question);
  });
};
