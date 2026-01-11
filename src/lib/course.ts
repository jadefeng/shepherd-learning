import { copy, type LanguageCode } from "@/lib/i18n";

export type Course = {
  id: string;
  title: string;
  description: string;
  videoIds: string[];
};

export const courses: Course[] = [
  {
    id: "osha-foundations",
    title: "OSHA Foundations",
    description:
      "Short OSHA training videos with knowledge checks after each lesson.",
    videoIds: [
      "wX43IcprUEI",
      "-ndcXUkjTXE",
      "6ZheSIc5B-g",
      "zti9BL6Sdbc",
      "VZkyaIDYN1s",
      "k7wwzhyP2UM",
      "U-hEKSUPaEI",
      "ikTBuTnkJUk",
      "2NJazykm5iI",
    ],
  },
  {
    id: "ladder-safety",
    title: "Ladder Safety in Construction",
    description:
      "Ladder safety essentials for construction crews, inspections, and daily use.",
    videoIds: [
      "LndgPWwAFsg",
      "7lpWZPgm_eA",
      "8_lfU0pP8b4",
    ],
  },
];

export const getCourseById = (id: string | null) =>
  courses.find((course) => course.id === id) ?? courses[0];

export const getTotalLessons = (course: Course) => course.videoIds.length;

export const getVideoEmbedUrl = (videoId: string) =>
  `https://www.youtube.com/embed/${videoId}`;

export const getVideoWatchUrl = (videoId: string) =>
  `https://www.youtube.com/watch?v=${videoId}`;

export const getCourseCopy = (course: Course, language: LanguageCode) => {
  const localized = copy[language]?.courses?.[course.id];
  const fallback = copy.en.courses?.[course.id];
  return {
    title: localized?.title ?? fallback?.title ?? course.title,
    description:
      localized?.description ?? fallback?.description ?? course.description,
  };
};
