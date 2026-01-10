import { NextResponse } from "next/server";
import { generateQuiz } from "@/lib/quiz";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      videoId?: string;
      videoTitle?: string;
      transcriptText?: string;
      seed?: number;
    };
    if (!body.videoId || !body.videoTitle || !body.transcriptText) {
      return NextResponse.json(
        { error: "videoId, videoTitle, and transcriptText are required." },
        { status: 400 },
      );
    }
    const questions = generateQuiz({
      videoId: body.videoId,
      videoTitle: body.videoTitle,
      transcriptText: body.transcriptText,
      seed: body.seed,
    });
    return NextResponse.json({ questions });
  } catch {
    return NextResponse.json(
      { error: "Unable to generate quiz." },
      { status: 500 },
    );
  }
}
