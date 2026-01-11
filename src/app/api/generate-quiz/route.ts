import { NextResponse } from "next/server";
import OpenAI from "openai";
import { generateQuiz } from "@/lib/quiz";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      videoId?: string;
      videoTitle?: string;
      transcriptText?: string;
      seed?: number;
      language?: "en" | "es";
    };
    if (!body.videoId || !body.videoTitle || !body.transcriptText) {
      return NextResponse.json(
        { error: "videoId, videoTitle, and transcriptText are required." },
        { status: 400 },
      );
    }
    const fallback = () =>
      generateQuiz({
        videoId: body.videoId ?? "",
        videoTitle: body.videoTitle ?? "Module",
        transcriptText: body.transcriptText ?? "",
        seed: body.seed,
      });

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ questions: fallback() });
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const transcriptText = body.transcriptText.slice(0, 8000);
    const language = body.language ?? "en";
    const prompt = [
      "You are an OSHA safety trainer creating assessment questions.",
      "Read the module transcript and generate exactly 3 original multiple-choice questions.",
      "Questions must reference specific details from the transcript (numbers, steps, order, equipment, or rules).",
      language === "es"
        ? "Do not mention the word transcript. Use the word modulo if needed."
        : "Do not mention the word transcript. Use the word module if needed.",
      "Each question must have 4 choices (A-D), with exactly one correct answer.",
      "The other 3 choices should be clearly wrong but plausible.",
      language === "es"
        ? "Write all prompts, choices, and explanations in Spanish."
        : "Write all prompts, choices, and explanations in English.",
      "Return ONLY valid JSON following the provided schema.",
    ].join(" ");

    try {
      const completion = await client.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.6,
        seed: body.seed,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "quiz",
            schema: {
              type: "object",
              additionalProperties: false,
              required: ["questions"],
              properties: {
                questions: {
                  type: "array",
                  minItems: 3,
                  maxItems: 3,
                  items: {
                    type: "object",
                    additionalProperties: false,
                    required: [
                      "id",
                      "prompt",
                      "choices",
                      "correct",
                      "explanation",
                    ],
                    properties: {
                      id: { type: "string" },
                      prompt: { type: "string" },
                      choices: {
                        type: "object",
                        additionalProperties: false,
                        required: ["A", "B", "C", "D"],
                        properties: {
                          A: { type: "string" },
                          B: { type: "string" },
                          C: { type: "string" },
                          D: { type: "string" },
                        },
                      },
                      correct: { type: "string", enum: ["A", "B", "C", "D"] },
                      explanation: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
        messages: [
          { role: "system", content: prompt },
          {
            role: "user",
            content: [
              `Course: ${body.videoTitle}`,
              "Transcript:",
              transcriptText,
            ].join("\n"),
          },
        ],
      });

      const raw = completion.choices[0]?.message?.content;
      if (!raw) {
        return NextResponse.json({ questions: fallback() });
      }

      const parsed = JSON.parse(raw) as {
        questions: Array<{
          id: string;
          prompt: string;
          choices: { A: string; B: string; C: string; D: string };
          correct: "A" | "B" | "C" | "D";
          explanation: string;
        }>;
      };

      if (!parsed.questions || parsed.questions.length !== 3) {
        return NextResponse.json({ questions: fallback() });
      }

      const questions = parsed.questions.map((question, index) => ({
        id: question.id || `q-${index + 1}`,
        prompt: question.prompt,
        choices: question.choices,
        correct: question.correct,
        explanation: question.explanation,
      }));

      return NextResponse.json({ questions });
    } catch {
      return NextResponse.json({ questions: fallback() });
    }
  } catch {
    return NextResponse.json(
      { error: "Unable to generate quiz." },
      { status: 500 },
    );
  }
}
