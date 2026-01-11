import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      text?: string;
      target?: "es" | "en";
    };
    if (!body.text || !body.target) {
      return NextResponse.json(
        { error: "text and target are required." },
        { status: 400 },
      );
    }
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not configured." },
        { status: 500 },
      );
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "translation",
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["translatedText"],
            properties: {
              translatedText: { type: "string" },
            },
          },
        },
      },
      messages: [
        {
          role: "system",
          content:
            "Translate the text to the target language. Preserve meaning and formatting. Return JSON only.",
        },
        {
          role: "user",
          content: JSON.stringify({
            target: body.target,
            text: body.text.slice(0, 8000),
          }),
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) {
      return NextResponse.json(
        { error: "No translation generated." },
        { status: 500 },
      );
    }
    const parsed = JSON.parse(raw) as { translatedText: string };
    return NextResponse.json({ translatedText: parsed.translatedText });
  } catch {
    return NextResponse.json(
      { error: "Unable to translate text." },
      { status: 500 },
    );
  }
}
