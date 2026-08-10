# TOEIC700 MASTER

> 今日も、700点に近づく。

TOEIC700点を目指す社会人向けの英単語学習アプリです。4つの学習モードを備えています。

1. **AI診断セッション** — 単なる4択クイズではなく、Gemini APIがユーザーの誤答原因を診断し、同じ学習セッション内でレベルアップ問題として弱点を突破する体験が中核
2. **英→日 4択クイズ** — 単語を見て意味を選ぶ、シンプルな4択（AI呼び出しなし）
3. **日→英 4択クイズ** — 意味から単語を選ぶ、逆方向の4択（AI呼び出しなし）
4. **暗記カード** — カードをめくって意味を確認し、習得状況で絞り込みながら反復できる

すべてのモードは同じ300語データセットと学習履歴（`localStorage`）を共有しており、どのモードで学習しても習得済み単語数・700 READY・マイルストーンに反映されます。

## AI診断セッションのコンセプト

1. 1回10問・8〜10分のセッションで学習
2. 通常問題（ビジネス文脈の穴埋め4択）に誤答すると、Geminiが「なぜ間違えたか」を5カテゴリ（語彙不足・類義語混同・品詞混同・文脈判断・記憶の弱化）で診断
3. 診断結果から生成されたレベルアップ問題が2〜3問後に、同じ弱点を**別のビジネス文脈**で再出題される
4. レベルアップ問題に正解すると `LEVEL UP` と表示され、「間違えた」ではなく「弱点を1つ突破した」という前向きな体験になる
5. セッション終了後、正答率・レベルアップ数・700 READY（到達度スコア）・Mistake DNA（弱点タイプの割合）・50語ごとのマイルストーン進捗・Geminiによるその日の総括を表示

## 技術スタック

- Next.js (App Router) + TypeScript + Tailwind CSS
- Google Gemini API（`@google/genai`、サーバー専用）
- Zod（Geminiの構造化JSON応答のバリデーション）
- `localStorage`（学習履歴の永続化。DB・認証・課金機能なし）

## セットアップ

```bash
npm install
cp .env.example .env.local
```

`.env.local` に Gemini APIキーを設定します（[Google AI Studio](https://aistudio.google.com/apikey) で取得）。

```bash
GEMINI_API_KEY=AIza...
GEMINI_MODEL=gemini-2.5-flash   # 省略可。未設定時のデフォルト
```

**APIキーが未設定でもアプリは完全に動作します。** `/api/diagnose` と `/api/summary` は、Gemini API呼び出しが失敗した場合（キー未設定・タイムアウト・エラー・不正なJSON応答など）、`lib/fallback.ts` の決定論的なロジックに自動的にフォールバックし、診断・Repair問題・コーチ総括を生成し続けます。

Gemini APIには `responseSchema` による構造化出力を使用しており、診断結果・Repair問題・総括は常に決まったJSON形式で返されます（受け取った後もZodで再検証します）。

## 開発

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) を開いてください。

## ビルド

```bash
npm run build
npm run start
```

## デプロイ（Vercel）

1. このリポジトリをVercelにインポート
2. 環境変数 `GEMINI_API_KEY`（および任意で `GEMINI_MODEL`）をVercelのプロジェクト設定に追加
3. デプロイ

APIキーは `app/api/*/route.ts` 内（サーバー専用）でのみ参照され、クライアントバンドルには一切含まれません（`server-only` パッケージでビルド時に混入を防止）。

## ディレクトリ構成

```
app/
  page.tsx            Home（学習モード選択・700 READY・マイルストーン進捗・データリセット）
  session/page.tsx     AI診断セッション（出題・診断・レベルアップ問題・KNOWN/WEAK FOUND/LEVEL UP）
  result/page.tsx       AI診断セッションの結果画面（正答率・Mistake DNA・マイルストーン達成演出・Gemini総括）
  quiz-en-ja/page.tsx    英→日 4択クイズ
  quiz-ja-en/page.tsx    日→英 4択クイズ
  flashcards/page.tsx    暗記カード（フリップカード・習得状況フィルタ）
  words/page.tsx         単語帳（300語の習得状況一覧・フィルタ）
  api/diagnose/route.ts   誤答診断 + レベルアップ問題生成API
  api/summary/route.ts     セッション総括生成API
lib/
  types.ts             共有の型定義
  words.ts / words-data/  TOEIC700レベル・ビジネス文脈300語のデータセット
  quiz-engine.ts        AI診断セッションの出題選択・4択生成・レベルアップ問題の再出題スケジューリング
  simple-quiz-engine.ts  英↔日4択クイズの出題選択・ディストラクタ生成（AI不使用）
  storage.ts             localStorage層（学習履歴・Mistake DNA集計・700 READY算出・データリセット）
  milestones.ts           習得50語ごとのマイルストーン進捗計算
  gemini.ts               Gemini API呼び出し（サーバー専用）
  fallback.ts             オフライン時の診断・総括生成ロジック
components/            UIコンポーネント（SimpleQuizSession・FlashCard・ModeCard など）
```

## 学習履歴（localStorage）

- 単語ごと: `seenCount` `correctCount` `incorrectCount` `repairSuccessCount` `lastSeenAt` `masteryStatus`（new / learning / fragile / repaired / mastered）`lastErrorType`
- 全体: `totalSessions` `totalQuestions` `totalCorrect` `masteredWords` `repairedWords` `mistakeProfile` `latestSessionResult`
- Home画面下部の「学習データをリセット」から、確認ダイアログを経て全データを削除できます（`resetAllProgress()`）

## 既知の注意点

- `npm audit` は Next.js が内部で使う `postcss` / `sharp`（画像最適化用、本アプリでは未使用）に対する既知の指摘を含みますが、いずれもビルド時専用の依存であり、本アプリのユーザー入力経路からは到達しません。Next.js のメジャーアップグレードで解消されますが、本コンペのスコープでは据え置いています。
- 300語データセットは運営配布データが存在しないため独自に作成したものです。配布データが提供された場合は `lib/types.ts` の `Word` 型に合わせて変換し、`lib/words.ts` を差し替えてください。
