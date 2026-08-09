import { NextResponse } from "next/server";
import { z } from "zod";
import { diagnoseWithGemini, isGeminiConfigured } from "@/lib/gemini";
import { fallbackDiagnosis } from "@/lib/fallback";
import { ERROR_TYPES, type DiagnosisResult } from "@/lib/types";
import { getWordById } from "@/lib/words";

export const runtime = "nodejs";

const requestSchema = z.object({
  wordId: z.string().min(1),
  word: z.string().min(1),
  partOfSpeech: z.enum(["noun", "verb", "adjective", "adverb", "phrase"]),
  meaningJa: z.string().min(1),
  sentence: z.string().min(1),
  choices: z.array(z.string().min(1)).min(2).max(6),
  userAnswer: z.string().min(1),
  correctAnswer: z.string().min(1),
  recentMistakes: z
    .array(z.object({ word: z.string(), errorType: z.enum(ERROR_TYPES) }))
    .max(10),
});

export async function POST(req: Request) {
  let body: z.infer<typeof requestSchema>;
  try {
    body = requestSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }

  const word = getWordById(body.wordId);
  if (!word) {
    return NextResponse.json({ error: "unknown word" }, { status: 400 });
  }

  let result: DiagnosisResult;
  let source: "gemini" | "fallback";

  if (isGeminiConfigured()) {
    try {
      result = await diagnoseWithGemini(body);
      source = "gemini";
    } catch (err) {
      console.error(
        "[diagnose] Gemini call failed, using fallback:",
        err instanceof Error ? err.message : "unknown error"
      );
      result = fallbackDiagnosis(body, word);
      source = "fallback";
    }
  } else {
    result = fallbackDiagnosis(body, word);
    source = "fallback";
  }

  return NextResponse.json({ result, source });
}
