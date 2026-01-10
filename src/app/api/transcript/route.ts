import { NextResponse } from "next/server";

type TranscriptItem = {
  text?: string;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get("videoId");
  if (!videoId) {
    return NextResponse.json(
      { error: "videoId query param is required" },
      { status: 400 },
    );
  }

  try {
    const response = await fetch(
      `https://youtubetranscript.com/?server_vid2=${videoId}`,
      { cache: "no-store" },
    );
    if (!response.ok) {
      return NextResponse.json(
        { error: "Transcript not found for this video." },
        { status: 404 },
      );
    }
    const data = (await response.json()) as TranscriptItem[];
    const transcript = data
      .map((item) => item.text?.trim())
      .filter(Boolean)
      .join(" ");

    if (!transcript) {
      return NextResponse.json(
        { error: "Transcript unavailable for this video." },
        { status: 404 },
      );
    }
    return NextResponse.json({ transcript });
  } catch {
    return NextResponse.json(
      { error: "Unable to fetch transcript automatically." },
      { status: 500 },
    );
  }
}
