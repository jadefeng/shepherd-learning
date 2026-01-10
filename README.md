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
- Use the transcript manager at `/transcripts?course=...` to paste transcripts for each video, or load them directly from the markdown files in `transcripts/`.
- Manual transcripts are saved in `localStorage` and always override auto-fetched text.

## Replacing the heuristic quiz generator

`src/lib/quiz.ts` contains the deterministic quiz generator. To swap in an LLM later, replace the `generateQuiz` function implementation and keep the return shape the same. The API route `src/app/api/generate-quiz/route.ts` already calls this function.

## Project structure

- `src/app/page.tsx` → course start / resume
- `src/app/learn/page.tsx` → learning flow
- `src/app/review/page.tsx` → review completed lessons
- `src/app/api/transcript/route.ts` → transcript fetch
- `src/app/api/generate-quiz/route.ts` → quiz generation
- `src/lib/course.ts` → fixed course catalog

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
