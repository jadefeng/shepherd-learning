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

const expandSentences = (sentences: string[]) => {
  const expanded: string[] = [];
  sentences.forEach((sentence) => {
    expanded.push(sentence);
    const parts = sentence
      .split(/[;:]/)
      .map((part) => part.trim())
      .filter((part) => part.length > 35 && part.length < 160);
    expanded.push(...parts);
  });
  return Array.from(new Set(expanded));
};

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

type QuestionDraft = {
  prompt: string;
  correct: string;
  distractors: string[];
  explanation: string;
};

const NUMBER_PATTERN =
  /(\d+(?:\.\d+)?)(\s?(%|percent|inches|inch|feet|ft|minutes|minute|hours|hour|days|day|seconds|second|degrees|degree|in|cm|mm))?/i;

const ensurePeriod = (text: string) => {
  const trimmed = text.trim();
  return trimmed.endsWith(".") ? trimmed : `${trimmed}.`;
};

const capitalize = (text: string) =>
  text.length ? text[0].toUpperCase() + text.slice(1) : text;

const cleanAction = (text: string) =>
  text
    .replace(
      /^(you|workers|employees|the worker|the employee|crew|operators)\s+/i,
      "",
    )
    .replace(/^(must|should|required to|required|need to)\s+/i, "")
    .trim();

const extractNumberFacts = (sentences: string[]) => {
  const numbers = sentences
    .map((sentence) => sentence.match(NUMBER_PATTERN)?.[0])
    .filter(Boolean) as string[];
  const uniqueNumbers = Array.from(new Set(numbers));
  return sentences
    .map((sentence) => {
      const match = sentence.match(NUMBER_PATTERN);
      if (!match) {
        return null;
      }
      const tokens = sentence.split(/\s+/);
      const index = tokens.findIndex((token) => /\d/.test(token));
      const context = tokens
        .slice(Math.max(0, index - 3), Math.min(tokens.length, index + 4))
        .filter((token) => !/\d/.test(token))
        .join(" ")
        .replace(/[,.;:]+/g, "")
        .trim();
      const prompt = context
        ? `What is the specified value for ${context}?`
        : "What value is specified in the module?";
      const correct = match[0].trim();
      const distractors = uniqueNumbers.filter((item) => item !== correct);
      return {
        prompt,
        correct,
        distractors,
        explanation: sentence,
      } satisfies QuestionDraft;
    })
    .filter(Boolean) as QuestionDraft[];
};

const extractTimingFacts = (sentences: string[]) => {
  const timingFacts: QuestionDraft[] = [];
  sentences.forEach((sentence) => {
    const match = sentence.match(/(.+?)\b(before|after)\b(.+)/i);
    if (!match) {
      return;
    }
    const action = cleanAction(match[1]);
    const timing = `${match[2]} ${match[3]}`.replace(/[.]+$/, "").trim();
    if (!action || !timing) {
      return;
    }
    const prompt = `When should you ${action}?`;
    const correct = capitalize(timing);
    const opposite =
      timing.startsWith("before")
        ? timing.replace(/^before/i, "After")
        : timing.replace(/^after/i, "Before");
    timingFacts.push({
      prompt,
      correct: ensurePeriod(correct),
      distractors: [ensurePeriod(opposite)],
      explanation: sentence,
    });
  });
  return timingFacts;
};

const extractDirectiveFacts = (sentences: string[]) => {
  const actionPhrases: string[] = [];
  const drafts: QuestionDraft[] = [];
  sentences.forEach((sentence) => {
    const match = sentence.match(
      /\b(must|should|required|never|always)\b(.*)/i,
    );
    if (!match) {
      return;
    }
    const keyword = match[1].toLowerCase();
    const action = cleanAction(match[2]);
    if (action.length < 6) {
      return;
    }
    actionPhrases.push(ensurePeriod(capitalize(action)));
    let prompt = "Which specific rule or detail is stated in the module?";
    if (keyword === "must" || keyword === "required") {
      prompt = "Which required action is stated in the module?";
    }
    if (keyword === "should") {
      prompt = "Which recommended action is stated in the module?";
    }
    if (keyword === "never") {
      prompt = "Which action should never be taken in the module?";
    }
    if (keyword === "always") {
      prompt = "Which action should always be taken in the module?";
    }
    drafts.push({
      prompt,
      correct: ensurePeriod(capitalize(action)),
      distractors: [],
      explanation: sentence,
    });
  });
  return { drafts, actionPhrases };
};

const extractDetailFacts = (sentences: string[]) => {
  const detailKeywords = [
    "ladder",
    "rung",
    "rail",
    "contact",
    "base",
    "top",
    "angle",
    "inspect",
    "report",
    "secure",
    "tie",
    "hazard",
    "ppe",
    "helmet",
    "gloves",
    "harness",
  ];
  return sentences
    .map((sentence) => {
      const keyword = detailKeywords.find((item) =>
        sentence.toLowerCase().includes(item),
      );
      if (!keyword) {
        return null;
      }
      const prompt = `Which statement about ${keyword} is correct?`;
      return {
        prompt,
        correct: ensurePeriod(sentence),
        distractors: [],
        explanation: sentence,
      } satisfies QuestionDraft;
    })
    .filter(Boolean) as QuestionDraft[];
};

const buildSentenceDistractors = (
  correct: string,
  sentencePool: string[],
  random: () => number,
) => {
  const pool = sentencePool.filter((item) => item !== correct);
  const wrongBySwap = mutateSentence(correct);
  const shuffled = shuffle(pool, random);
  const candidates = [wrongBySwap, ...shuffled];
  const filtered = candidates
    .filter(Boolean)
    .filter(
      (option) => option!.toLowerCase() !== correct.toLowerCase(),
    ) as string[];
  while (filtered.length < 3) {
    filtered.push("This detail is not stated in the module.");
  }
  return filtered.slice(0, 3);
};

const buildQuestionFromDraft = (
  draft: QuestionDraft,
  index: number,
  random: () => number,
): QuizQuestion => {
  const uniqueDistractors = Array.from(
    new Set(
      draft.distractors
        .map((item) => ensurePeriod(item))
        .filter(
          (item) => item.toLowerCase() !== draft.correct.toLowerCase(),
        ),
    ),
  );
  while (uniqueDistractors.length < 3) {
    uniqueDistractors.push("This option is not stated in the module.");
  }
  const options = shuffle(
    [draft.correct, ...uniqueDistractors.slice(0, 3)],
    random,
  );
  const order = ["A", "B", "C", "D"] as AnswerChoice[];
  const choices = order.reduce(
    (acc, key, idx) => {
      acc[key] = options[idx];
      return acc;
    },
    {} as Record<AnswerChoice, string>,
  );
  const correctIndex = options.findIndex(
    (item) => item.toLowerCase() === draft.correct.toLowerCase(),
  );
  const safeIndex = correctIndex === -1 ? 0 : correctIndex;
  return {
    id: `q-${index + 1}`,
    prompt: draft.prompt,
    choices,
    correct: order[safeIndex],
    explanation: draft.explanation,
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
  const baseSentences = splitSentences(payload.transcriptText);
  const sentences = expandSentences(baseSentences);
  const withContext = sentences.length
    ? sentences
    : [`This module highlights safety steps for ${payload.videoTitle}.`];
  const ranked = [...sentences]
    .sort((a, b) => scoreSentence(b) - scoreSentence(a))
    .slice(0, 12);
  const pool = ranked.length ? ranked : withContext;

  const numberDrafts = extractNumberFacts(pool);
  const timingDrafts = extractTimingFacts(pool);
  const directiveData = extractDirectiveFacts(pool);
  const detailDrafts = extractDetailFacts(pool);

  const actionDistractors = directiveData.actionPhrases;
  const timedPhrases = timingDrafts.map((draft) => draft.correct);

  const drafts = shuffle(
    [
      ...numberDrafts,
      ...timingDrafts,
      ...directiveData.drafts,
      ...detailDrafts,
    ],
    random,
  );

  drafts.forEach((draft) => {
    if (draft.distractors.length > 0) {
      return;
    }
    if (draft.prompt.startsWith("When should")) {
      draft.distractors = timedPhrases.filter((item) => item !== draft.correct);
    } else if (draft.prompt.includes("action")) {
      draft.distractors = actionDistractors.filter(
        (item) => item !== draft.correct,
      );
    } else {
      draft.distractors = buildSentenceDistractors(
        draft.correct,
        pool,
        random,
      );
    }
  });

  const selectedDrafts: QuestionDraft[] = [];
  for (const draft of drafts) {
    if (
      selectedDrafts.some((item) => item.prompt === draft.prompt) ||
      selectedDrafts.some(
        (item) => item.correct.toLowerCase() === draft.correct.toLowerCase(),
      )
    ) {
      continue;
    }
    selectedDrafts.push(draft);
    if (selectedDrafts.length === 3) {
      break;
    }
  }

  while (selectedDrafts.length < 3) {
    const fallbackSentence =
      pool[selectedDrafts.length % pool.length] ?? withContext[0];
    selectedDrafts.push({
      prompt: "Which statement about the module is correct?",
      correct: ensurePeriod(fallbackSentence),
      distractors: buildSentenceDistractors(
        fallbackSentence,
        pool,
        random,
      ),
      explanation: fallbackSentence,
    });
  }

  return selectedDrafts.map((draft, index) =>
    buildQuestionFromDraft(draft, index, random),
  );
};

const mutateSentence = (sentence: string) => {
  const replacements: Array<[RegExp, string]> = [
    [/\b(always|must|required)\b/i, "optional"],
    [/\b(never)\b/i, "often"],
    [/\b(before)\b/i, "after"],
    [/\b(after)\b/i, "before"],
    [/\b(up|increase)\b/i, "reduce"],
    [/\b(reduce)\b/i, "increase"],
    [/\b(report)\b/i, "ignore"],
    [/\b(inspect)\b/i, "skip inspection of"],
    [/\bsecure\b/i, "leave unsecured"],
  ];
  for (const [pattern, replacement] of replacements) {
    if (pattern.test(sentence)) {
      return sentence.replace(pattern, replacement);
    }
  }
  return `The module does not say: "${sentence.slice(0, 60)}..."`;
};
