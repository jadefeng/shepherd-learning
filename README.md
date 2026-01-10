## OSHA Foundations Learning Platform

Mobile-first learning flow for fixed safety courses. The app walks through each course’s YouTube lessons, pulls transcripts when possible, and generates a 3-question knowledge check after each video.

## Getting Started

First, install dependencies and run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## How transcripts work

- The app calls `GET /api/transcript?videoId=...` to try to auto-fetch a transcript.
- If that fails, the quiz still generates using a generic OSHA fallback summary.
- Transcripts are loaded from the markdown files in `public/transcripts/`.

## OpenAI quiz generation

- Set `OPENAI_API_KEY` in `.env.local` for local development.
- In Vercel, add the same key in Project Settings → Environment Variables.
- The server route `src/app/api/generate-quiz/route.ts` calls `gpt-4o-mini` and returns exactly 3 MCQs.

## Replacing the heuristic quiz generator

`src/lib/quiz.ts` contains the deterministic fallback generator. If you want to disable OpenAI, swap the API route to call `generateQuiz` directly.

## Project structure

- `src/app/page.tsx` → course start / resume
- `src/app/learn/page.tsx` → learning flow
- `src/app/review/page.tsx` → review completed lessons
- `src/app/api/transcript/route.ts` → transcript fetch
- `src/app/api/generate-quiz/route.ts` → quiz generation
- `src/lib/course.ts` → fixed course catalog

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
