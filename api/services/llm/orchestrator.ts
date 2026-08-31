import type { Database } from "sql.js";
import type { LlmConfig, LlmMessage } from "../llm/types.js";
import type { Intent } from "../../../shared/types.js";
import { getLlmProvider } from "../llm/factory.js";

const SYSTEM_PROMPT_INTENT = `You are an intent classifier for an IVR system.

Classify the user's message into exactly one of these intents:
- order_tracking: user wants to check order status, tracking, shipping, delivery status, ETA, or asks "where is my order"
- delivery_issue: user reports damaged, broken, late, missing, or incorrect order/item
- returns_refunds: user wants to return, refund, exchange, or replace an item
- promotions: user asks about discounts, sales, coupons, vouchers, offers
- product_info: user asks about product details, specs, features, availability, price
- wholesale: user asks about bulk orders, wholesale pricing, reselling
- agent_support: user EXPLICITLY asks to speak to a human, agent, representative, operator, or manager. Do NOT classify general questions as agent_support.
- unknown: greetings, general questions, small talk, or anything that doesn't clearly match the above

Examples:
- "Where is my order?" → order_tracking
- "My package is damaged" → delivery_issue
- "I want a refund" → returns_refunds
- "Do you have discounts?" → promotions
- "What's the price?" → product_info
- "I need 100 units" → wholesale
- "I want to speak to a human" → agent_support
- "Hello" → unknown
- "What's your name?" → unknown
- "How many open tickets?" → unknown

Respond with JSON only: {"intent":"...","confidence":0.0,"slots":{}}.`;

const SYSTEM_PROMPT_RESPONSE = `You are a multilingual customer service assistant for an IVR system. Generate a concise, natural response. If the user asks about statistics, counts, or data (tickets, sessions, callbacks, WhatsApp messages), use the provided system stats. If no tool results are useful, just answer naturally. Keep it short and friendly.`;

const VALID_INTENTS = ["order_tracking", "delivery_issue", "returns_refunds", "promotions", "product_info", "wholesale", "agent_support", "unknown"] as const;

export async function classifyIntentWithLlm(
  db: Database,
  text: string,
  language: string,
  config: LlmConfig,
): Promise<{ intent: Intent; confidence: number; slots: Record<string, string> }> {
  if (!config.enabled) {
    throw new Error("LLM is disabled");
  }

  const provider = getLlmProvider(config.provider);
  const messages: LlmMessage[] = [
    { role: "system", content: SYSTEM_PROMPT_INTENT },
    { role: "user", content: `Language: ${language}. User said: "${text}"` },
  ];

  try {
    const response = await provider.chat(messages, config);
    let raw = response.content.trim();
    if (raw.startsWith('```')) {
      raw = raw.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
    }

    try {
      const parsed = JSON.parse(raw);
      const intent = VALID_INTENTS.includes(parsed.intent) ? parsed.intent : "unknown";
      return {
        intent: intent as Intent,
        confidence: parsed.confidence ?? 0,
        slots: parsed.slots || {},
      };
    } catch {
      return { intent: "unknown", confidence: 0, slots: {} };
    }
  } catch {
    return { intent: "unknown", confidence: 0, slots: {} };
  }
}

export async function generateResponseWithLlm(
  db: Database,
  text: string,
  toolResults: unknown,
  language: string,
  config: LlmConfig,
): Promise<string> {
  if (!config.enabled) {
    throw new Error("LLM is disabled");
  }

  const provider = getLlmProvider(config.provider);

  const totalSessions = (() => {
    try {
      const rows = db.exec('select count(*) as c from sessions');
      return rows[0]?.values[0]?.[0] ?? 0;
    } catch { return 0; }
  })();

  const openTickets = (() => {
    try {
      const rows = db.exec('select count(*) as c from tickets where status = "open"');
      return rows[0]?.values[0]?.[0] ?? 0;
    } catch { return 0; }
  })();

  const totalCallbacks = (() => {
    try {
      const rows = db.exec('select count(*) as c from callbacks');
      return rows[0]?.values[0]?.[0] ?? 0;
    } catch { return 0; }
  })();

  const whatsappSent = (() => {
    try {
      const rows = db.exec('select count(*) as c from whatsapp_messages where status = "sent"');
      return rows[0]?.values[0]?.[0] ?? 0;
    } catch { return 0; }
  })();

  const dbContext = JSON.stringify({
    total_sessions: totalSessions,
    open_tickets: openTickets,
    total_callbacks: totalCallbacks,
    whatsapp_sent: whatsappSent,
  });

  const messages: LlmMessage[] = [
    { role: "system", content: SYSTEM_PROMPT_RESPONSE },
    {
      role: "user",
      content: `Language: ${language}. System stats: ${dbContext}. User said: "${text}". Tool results: ${JSON.stringify(toolResults)}. Generate a response.`,
    },
  ];

  const response = await provider.chat(messages, config);
  return response.content.trim();
}
