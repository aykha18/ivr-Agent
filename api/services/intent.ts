import type { Intent, LanguageCode } from "../../shared/types.js";

export interface DetectedIntent {
  intent: Intent;
  confidence: number;
  slots: Record<string, string>;
}

interface IntentKeyword {
  intent: Intent;
  keywords: string[];
}

const INTENT_KEYWORDS: IntentKeyword[] = [
  {
    intent: "order_tracking",
    keywords: [
      "track",
      "tracking",
      "status",
      "order",
      "where is",
      "تتبع",
      "حالة",
      "أين",
      "طلب",
      "آرڈر",
      "کہاں",
    ],
  },
  {
    intent: "delivery_issue",
    keywords: [
      "damaged",
      "broken",
      "late",
      "delay",
      "not received",
      "missing",
      "تلف",
      "مكسور",
      "متأخر",
      "تأخير",
      "لم يتم التسليم",
      "مفقود",
      "براٹا",
      "ٹوٹا",
      "دیری",
      "نہ ملائی",
      "غائب",
      "پچھا",
    ],
  },
  {
    intent: "returns_refunds",
    keywords: [
      "return",
      "refund",
      "exchange",
      "money back",
      "replace",
      "إرجاع",
      "استعادة",
      "استرداد",
      "استبدال",
      "وعد",
      "جانا",
      "واپسی",
      "ریفنڈ",
      "بدل",
    ],
  },
  {
    intent: "promotions",
    keywords: [
      "discount",
      "promo",
      "sale",
      "coupon",
      "voucher",
      "خصم",
      "عرض",
      "تخفيض",
      "كوبون",
      "ڈسکاؤنٹ",
      "پرومو",
      "سیل",
    ],
  },
  {
    intent: "product_info",
    keywords: [
      "product",
      "item",
      "spec",
      "feature",
      "size",
      "color",
      "price",
      "منتج",
      "بضاعة",
      "مواصفات",
      "مميزات",
      "سعر",
      "رنگ",
      "برآ",
      "خاصیات",
      "قیمت",
      "وزن",
    ],
  },
  {
    intent: "wholesale",
    keywords: [
      "bulk",
      "wholesale",
      "resell",
      "جملة",
      "بيع بالجملة",
      "تجارة",
      "ڈریول",
      "جلدی",
    ],
  },
  {
    intent: "agent_support",
    keywords: [
      "agent",
      "representative",
      "human",
      "operator",
      "manager",
      "speak to",
      "وكيل",
      "ممثل",
      "بشري",
      "مشغل",
      "مدير",
      "ایجنٹ",
      "نمائندہ",
      "انسان",
      "اوپريٹر",
    ],
  },
];

const ORDER_NUMBER_REGEX = {
  en: /\b[A-Z0-9]{2,}-\d{4,}(?:-\d+)?\b/i,
  ar: /\b[٠-٩]{2,}-\d{4,}(?:-\d+)?\b/,
  ur: /\b[A-Z0-9]{2,}-\d{4,}(?:-\d+)?\b/i,
};

const PHONE_REGEX = {
  en: /\b\d{7,15}\b/,
  ar: /\b[٠-٩]{7,15}\b|\b\d{7,15}\b/,
  ur: /\b\+?\d{7,15}\b/,
};

function normalizeArabicDigits(text: string): string {
  return text.replace(/[٠-٩]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1632 + 48));
}

function normalizeUrduDigits(text: string): string {
  return text.replace(/[۰-۹]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1776 + 48));
}

export function classifyIntent(text: string, language: LanguageCode): DetectedIntent {
  const normalized = normalizeArabicDigits(normalizeUrduDigits(text)).toLowerCase().trim();

  let bestIntent: Intent = "unknown";
  let bestScore = 0;

  for (const { intent, keywords } of INTENT_KEYWORDS) {
    let score = 0;
    for (const kw of keywords) {
      const kwLower = kw.toLowerCase();
      if (normalized.includes(kwLower)) {
        score += 1;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestIntent = intent;
    }
  }

  const confidence = Math.min(bestScore / 2, 1);
  if (bestScore === 0) {
    return { intent: "unknown", confidence: 0, slots: {} };
  }

  const slots = extractSlots(normalized, language);

  return {
    intent: bestIntent,
    confidence,
    slots,
  };
}

export function extractSlots(text: string, language: LanguageCode): Record<string, string> {
  const slots: Record<string, string> = {};
  const normalized = normalizeArabicDigits(normalizeUrduDigits(text));

  const orderMatch = normalized.match(ORDER_NUMBER_REGEX[language]) ?? normalized.match(ORDER_NUMBER_REGEX.en);
  if (orderMatch) {
    slots.order_number = orderMatch[0];
  }

  const phoneMatch = normalized.match(PHONE_REGEX[language]);
  if (phoneMatch) {
    slots.phone = phoneMatch[0];
  }

  return slots;
}
