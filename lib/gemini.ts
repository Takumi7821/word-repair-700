import "server-only";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import {
  ERROR_TYPES,
  type DiagnoseRequest,
  type DiagnosisResult,
  type SummaryRequest,
  type SummaryResult,
} from "./types";

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const REQUEST_TIMEOUT_MS = 12000;

let cachedClient: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }
  if (!cachedClient) {
    cachedClient = new GoogleGenAI({ apiKey });
  }
  return cachedClient;
}

export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

const diagnosisSchema = z.object({
  errorType: z.enum(ERROR_TYPES),
  diagnosis: z.string().min(1).max(400),
  keyInsight: z.string().min(1).max(300),
  businessExample: z.object({
    english: z.string().min(1),
    japanese: z.string().min(1),
  }),
  repairQuestion: z.object({
    sentence: z.string().min(1),
    choices: z.array(z.string().min(1)).length(4),
    correctAnswer: z.string().min(1),
  }),
});

const summarySchema = z.object({
  summary: z.string().min(1).max(600),
});

// Gemini's responseSchema uses a JSON-Schema-like subset (lowercase "type" values).
const DIAGNOSIS_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    errorType: { type: "string", enum: [...ERROR_TYPES] },
    diagnosis: { type: "string" },
    keyInsight: { type: "string" },
    businessExample: {
      type: "object",
      properties: {
        english: { type: "string" },
        japanese: { type: "string" },
      },
      required: ["english", "japanese"],
    },
    repairQuestion: {
      type: "object",
      properties: {
        sentence: { type: "string" },
        choices: {
          type: "array",
          items: { type: "string" },
          minItems: 4,
          maxItems: 4,
        },
        correctAnswer: { type: "string" },
      },
      required: ["sentence", "choices", "correctAnswer"],
    },
  },
  required: ["errorType", "diagnosis", "keyInsight", "businessExample", "repairQuestion"],
} as const;

const SUMMARY_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    summary: { type: "string" },
  },
  required: ["summary"],
} as const;

const DIAGNOSIS_SYSTEM_PROMPT = `あなたはTOEIC700点を目指す忙しい社会人専属のVocabulary Learning Coachです。
あなたの仕事は正解を教えることではなく、ユーザーがなぜその誤答を選んだ可能性が高いかを診断し、
同じミスを繰り返さないための最小限かつ具体的なフィードバックを返すことです。

ルール:
- 必ず日本語で返す
- 学習者を責めない、大げさに褒めない
- 一般論を避け、必ず今回の単語・ユーザーの回答を具体的に参照する
- recentMistakesが与えられている場合は関連性を検討し、同じミス傾向があれば明示する
- 診断カテゴリ(errorType)は次の5つのみを使う: vocabulary_gap, confusion, part_of_speech, context_gap, memory_slip
- diagnosisとkeyInsightは短く、diagnosisは60〜150文字程度
- TOEIC700点レベルのビジネス文脈の英文を使う
- repairQuestionのsentenceは出題された元の英文をそのままコピーしない。同じ単語・同じ弱点を別のビジネス文脈の文で確認すること
- repairQuestionのchoicesは4つ、correctAnswerを必ず含める
- diagnosisとkeyInsightでは「修復」「直す」など欠陥を治すニュアンスの言葉は使わない。「突破する」「レベルアップする」「前に進む」のような、前進を表す前向きな言葉を使う`;

const SUMMARY_SYSTEM_PROMPT = `あなたはTOEIC700点を目指す忙しい社会人専属のVocabulary Learning Coachです。
1回の学習セッションが終わった直後に、その日の学習内容を短く総括します。

ルール:
- 必ず日本語で返す
- 学習者を責めない、大げさに褒めない
- 一般論を避け、渡されたその日の具体的な数値・単語・ミスの傾向に必ず言及する
- レベルアップ問題を突破できた弱点があれば前向きに触れる
- 「修復」「直す」など欠陥を治すニュアンスの言葉は使わない。「突破する」「レベルアップする」「前に進む」のような前進を表す言葉を使う
- 全体で80〜180文字程度`;

async function callGemini(
  systemInstruction: string,
  userMessage: string,
  responseSchema: object
): Promise<string> {
  const ai = getClient();
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: userMessage,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema,
      temperature: 0.5,
      maxOutputTokens: 1024,
      // This task is short structured extraction, not multi-step reasoning — disable
      // "thinking" so its token budget doesn't eat into (and truncate) the JSON output.
      thinkingConfig: { thinkingBudget: 0 },
      abortSignal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("Empty Gemini response");
  }
  return text;
}

function buildDiagnosePrompt(request: DiagnoseRequest): string {
  return JSON.stringify(
    {
      word: request.word,
      partOfSpeech: request.partOfSpeech,
      meaningJa: request.meaningJa,
      sentence: request.sentence,
      choices: request.choices,
      userAnswer: request.userAnswer,
      correctAnswer: request.correctAnswer,
      recentMistakes: request.recentMistakes,
    },
    null,
    2
  );
}

function buildSummaryPrompt(request: SummaryRequest): string {
  return JSON.stringify(request, null, 2);
}

export async function diagnoseWithGemini(request: DiagnoseRequest): Promise<DiagnosisResult> {
  const raw = await callGemini(
    DIAGNOSIS_SYSTEM_PROMPT,
    buildDiagnosePrompt(request),
    DIAGNOSIS_RESPONSE_SCHEMA
  );
  const json: unknown = JSON.parse(raw);
  const parsed = diagnosisSchema.parse(json);
  if (!parsed.repairQuestion.choices.includes(parsed.repairQuestion.correctAnswer)) {
    throw new Error("Repair question correctAnswer is missing from its own choices");
  }
  return {
    ...parsed,
    repairQuestion: {
      ...parsed.repairQuestion,
      choices: parsed.repairQuestion.choices as [string, string, string, string],
    },
  };
}

export async function summarizeWithGemini(request: SummaryRequest): Promise<SummaryResult> {
  const raw = await callGemini(
    SUMMARY_SYSTEM_PROMPT,
    buildSummaryPrompt(request),
    SUMMARY_RESPONSE_SCHEMA
  );
  const json: unknown = JSON.parse(raw);
  return summarySchema.parse(json);
}
