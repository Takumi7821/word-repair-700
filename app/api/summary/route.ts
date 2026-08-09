import { NextResponse } from "next/server";
import { z } from "zod";
import { isGeminiConfigured, summarizeWithGemini } from "@/lib/gemini";
import { fallbackSummary } from "@/lib/fallback";
import { ERROR_TYPES } from "@/lib/types";

export const runtime = "nodejs";

const mistakeProfileSchema = z.object({
  vocabulary_gap: z.number(),
  confusion: z.number(),
  part_of_speech: z.number(),
  context_gap: z.number(),
  memory_slip: z.number(),
});

const requestSchema = z.object({
  sessionCorrect: z.number().int().min(0),
  sessionIncorrect: z.number().int().min(0),
  repairedCount: z.number().int().min(0),
  mistakes: z
    .array(
      z.object({
        wordId: z.string(),
        word: z.string(),
        errorType: z.enum(ERROR_TYPES),
        diagnosis: z.string(),
        wasRepaired: z.boolean(),
      })
    )
    .max(20),
  errorTypeCounts: mistakeProfileSchema,
  previousMistakeProfile: mistakeProfileSchema,
  masteredWords: z.number().int().min(0),
  readyScore: z.number().min(0).max(100),
});

export async function POST(req: Request) {
  let body: z.infer<typeof requestSchema>;
  try {
    body = requestSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }

  let summary: string;
  let source: "gemini" | "fallback";

  if (isGeminiConfigured()) {
    try {
      const result = await summarizeWithGemini(body);
      summary = result.summary;
      source = "gemini";
    } catch (err) {
      console.error(
        "[summary] Gemini call failed, using fallback:",
        err instanceof Error ? err.message : "unknown error"
      );
      summary = fallbackSummary(body);
      source = "fallback";
    }
  } else {
    summary = fallbackSummary(body);
    source = "fallback";
  }

  return NextResponse.json({ summary, source });
}
