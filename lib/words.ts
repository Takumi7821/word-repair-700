import type { Word } from "./types";
import { meetingsWords } from "./words-data/01-meetings";
import { hrWords } from "./words-data/02-hr";
import { financeWords } from "./words-data/03-finance";
import { salesWords } from "./words-data/04-sales";
import { marketingWords } from "./words-data/05-marketing";
import { logisticsWords } from "./words-data/06-logistics";
import { legalWords } from "./words-data/07-legal";
import { officeWords } from "./words-data/08-office";
import { techWords } from "./words-data/09-tech";
import { customerServiceWords } from "./words-data/10-customer-service";
import { manufacturingWords } from "./words-data/11-manufacturing";
import { generalWords } from "./words-data/12-general";

/** The full TOEIC700 business-vocabulary word bank (300 headwords). */
export const WORDS: Word[] = [
  ...meetingsWords,
  ...hrWords,
  ...financeWords,
  ...salesWords,
  ...marketingWords,
  ...logisticsWords,
  ...legalWords,
  ...officeWords,
  ...techWords,
  ...customerServiceWords,
  ...manufacturingWords,
  ...generalWords,
];

const WORDS_BY_ID = new Map(WORDS.map((w) => [w.id, w]));

export function getWordById(id: string): Word | undefined {
  return WORDS_BY_ID.get(id);
}

export const THEME_LABELS_JA: Record<string, string> = {
  meetings: "会議",
  hr: "人事",
  finance: "財務・会計",
  sales: "営業",
  marketing: "マーケティング",
  logistics: "物流",
  legal: "契約・法務",
  office: "総務・オフィス",
  tech: "IT・技術",
  customer_service: "顧客対応",
  manufacturing: "製造・品質",
  general: "ビジネス全般",
};
