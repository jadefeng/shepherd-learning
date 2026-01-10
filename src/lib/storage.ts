export type AnswerChoice = "A" | "B" | "C" | "D";

export type StoredCompletion = {
  completedAt: number;
  score: number;
  answers: Record<string, AnswerChoice>;
};

export type StoredTranscript = {
  source: "auto" | "manual" | "library";
  text: string;
  updatedAt: number;
};

export type CourseProgress = {
  currentStepIndex: number;
  completed: Record<string, StoredCompletion>;
  transcripts: Record<string, StoredTranscript>;
};

const STORAGE_KEY_PREFIX = "shepherd-course-progress";

export const defaultProgress: CourseProgress = {
  currentStepIndex: 0,
  completed: {},
  transcripts: {},
};

const getStorageKey = (courseId: string) => `${STORAGE_KEY_PREFIX}:${courseId}`;

export const loadProgress = (courseId: string): CourseProgress => {
  if (typeof window === "undefined") {
    return defaultProgress;
  }
  try {
    const raw = window.localStorage.getItem(getStorageKey(courseId));
    if (!raw) {
      return defaultProgress;
    }
    const parsed = JSON.parse(raw) as CourseProgress;
    return {
      currentStepIndex:
        typeof parsed.currentStepIndex === "number"
          ? parsed.currentStepIndex
          : 0,
      completed: parsed.completed ?? {},
      transcripts: parsed.transcripts ?? {},
    };
  } catch {
    return defaultProgress;
  }
};

export const saveProgress = (courseId: string, progress: CourseProgress) => {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(getStorageKey(courseId), JSON.stringify(progress));
  window.dispatchEvent(new Event("shepherd-progress"));
};
