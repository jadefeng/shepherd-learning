import { NextResponse } from "next/server";
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
  const assetPath = getLibraryTranscriptPath(course, videoId);
  if (!assetPath) {
    return NextResponse.json(
      { error: "Transcript not found for this lesson." },
      { status: 404 },
    );
  }

  try {
    const assetUrl = new URL(assetPath, request.url);
    const assetResponse = await fetch(assetUrl);
    if (!assetResponse.ok) {
      return NextResponse.json(
        { error: "Transcript not available in library yet." },
        { status: 404 },
      );
    }
    const content = await assetResponse.text();
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
