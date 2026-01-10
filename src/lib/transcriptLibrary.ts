import type { Course } from "@/lib/course";

export const getLibraryTranscriptPath = (course: Course, videoId: string) => {
  const index = course.videoIds.indexOf(videoId);
  if (index === -1) {
    return null;
  }
  return `/transcripts/${course.id}/lesson-${index + 1}-${videoId}.md`;
};

export const stripTranscriptHeading = (content: string) => {
  const lines = content.split("\n");
  if (lines.length === 0) {
    return "";
  }
  if (lines[0].startsWith("#")) {
    return lines.slice(1).join("\n").trim();
  }
  return content.trim();
};
