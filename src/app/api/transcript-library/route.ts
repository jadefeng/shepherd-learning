import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { getCourseById } from "@/lib/course";
import {
  getLibraryTranscriptPath,
  stripTranscriptHeading,
} from "@/lib/transcriptLibrary";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const courseId = searchParams.get("course");
  const videoId = searchParams.get("videoId");
  if (!courseId || !videoId) {
    return NextResponse.json(
      { error: "course and videoId query params are required" },
      { status: 400 },
    );
  }

  const course = getCourseById(courseId);
  const path = getLibraryTranscriptPath(course, videoId);
  if (!path) {
    return NextResponse.json(
      { error: "Transcript not found for this lesson." },
      { status: 404 },
    );
  }

  try {
    const content = await readFile(path, "utf8");
    const transcript = stripTranscriptHeading(content);
    if (!transcript || transcript.includes("PASTE TRANSCRIPT HERE")) {
      return NextResponse.json(
        { error: "Transcript not available in library yet." },
        { status: 404 },
      );
    }
    return NextResponse.json({ transcript });
  } catch {
    return NextResponse.json(
      { error: "Transcript not available in library yet." },
      { status: 404 },
    );
  }
}
