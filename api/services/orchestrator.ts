import type { Database } from "sql.js";
import type {
  LanguageCode,
  Intent,
  TurnResponse,
  SuggestedAction,
} from "../../shared/types.js";
import {
  createSession,
  getSession,
  setSessionLanguage,
  setSessionContext,
  setSessionOutcome,
  addTurn,
  addEvent,
  createCallback,
} from "../repositories/store.js";
import { classifyIntent } from "./intent.js";
import { t } from "./i18n.js";
import { orderLookup } from "./tools/orders.js";
import { logger } from "../utils/logger.js";
import { createTicketTool } from "./tools/tickets.js";
import { sendWhatsApp } from "./tools/whatsapp.js";
import { getAdapter } from "./telephony/factory.js";
import type { TelephonyChannel, SessionHandle, AssistantOutput } from "./telephony/types.js";
import { classifyIntentWithLlm, generateResponseWithLlm } from "./llm/orchestrator.js";
import type { LlmConfig } from "./llm/types.js";

export interface OrchestratorConfig {
  forceOrderLookupFail?: boolean;
  forceTicketCreateFail?: boolean;
  forceWhatsAppSendFail?: boolean;
}

export interface SessionContext {
  language: LanguageCode;
  state: "awaiting_language" | "active" | "awaiting_order_number" | "awaiting_issue_details" | "awaiting_phone" | "ended";
  collected: Record<string, string>;
  last_order?: {
    order_number: string;
    status: string;
    tracking_url?: string;
    eta?: string;
  };
  tickets: string[];
  whatsapp_sent: boolean;
  callbacks: string[];
}

const DEFAULT_CONTEXT: Omit<SessionContext, "language"> = {
  state: "awaiting_language",
  collected: {},
  tickets: [],
  whatsapp_sent: false,
  callbacks: [],
};

export function parseContext(contextJson: string | null): Omit<SessionContext, "language"> {
  if (!contextJson) return { ...DEFAULT_CONTEXT };
  try {
    const parsed = JSON.parse(contextJson);
    return { ...DEFAULT_CONTEXT, ...parsed };
  } catch {
    return { ...DEFAULT_CONTEXT };
  }
}

export async function createNewSession(
  db: Database,
  channel: TelephonyChannel,
): Promise<{ session_id: string; next_prompt: string }> {
  const session = createSession(db, channel);

  addEvent(db, session.session_id, "session_started", { channel: session.channel });

  try {
    const adapter = getAdapter(channel);
    await adapter.startSession();
  } catch (err) {
    addEvent(db, session.session_id, "error", { error: err instanceof Error ? err.message : "adapter_error" });
  }

  return {
    session_id: session.session_id,
    next_prompt: t("language_prompt", "en"),
  };
}

export async function setLanguage(
  db: Database,
  sessionId: string,
  language: LanguageCode,
): Promise<{ ok: boolean; next_prompt: string } | { error: string }> {
  const session = getSession(db, sessionId);
  if (!session) {
    return { error: "Session not found" };
  }

  setSessionLanguage(db, sessionId, language);

  const context = parseContext(session.context_json);
  const fullContext: SessionContext = {
    language,
    ...context,
    state: "active",
  };
  setSessionContext(db, sessionId, JSON.stringify(fullContext));

  addEvent(db, sessionId, "language_selected", { language });

  return {
    ok: true,
    next_prompt: t("welcome_back", language),
  };
}

export async function processTurn(
  db: Database,
  sessionId: string,
  text: string,
  config: OrchestratorConfig = {},
  llmConfig?: LlmConfig,
): Promise<TurnResponse> {
  const session = getSession(db, sessionId);
  if (!session) {
    throw new Error("Session not found");
  }

  if (!session.language) {
    return {
      assistant_text: t("language_prompt", "en"),
      events: [{ type: "error", detail: "Language not selected" }],
      suggested_actions: [{ type: "continue_on_whatsapp" as const, label: "Continue on WhatsApp" }],
    };
  }

  const lang = session.language as LanguageCode;
  const context = parseContext(session.context_json);
  const fullContext: SessionContext = { language: lang, ...context };

  const startTime = Date.now();
  let detected: { intent: Intent; confidence: number; slots: Record<string, string> };
  if (llmConfig && llmConfig.enabled) {
    try {
      detected = await classifyIntentWithLlm(db, text, lang, llmConfig);
    } catch (err) {
      addEvent(db, sessionId, "llm_error", { error: err instanceof Error ? err.message : "llm_error" });
      detected = classifyIntent(text, lang);
    }
  } else {
    detected = classifyIntent(text, lang);
  }
  const intentMs = Date.now() - startTime;

  addEvent(db, sessionId, "intent_detected", {
    intent: detected.intent,
    confidence: detected.confidence,
  });

  const events: Array<{ type: string; detail: string }> = [
    { type: "intent", detail: `${detected.intent} (confidence: ${Math.round(detected.confidence * 100)}%)` },
  ];

  const toolStart = Date.now();
  const response = await handleIntent(db, sessionId, lang, fullContext, detected, text, config, events, llmConfig);
  const toolMs = Date.now() - toolStart;

  let finalText = response.assistant_text;
  if (llmConfig?.enabled) {
    try {
      const toolResult = detected.intent === "unknown" ? null : response.assistant_text;
      const llmResponse = await generateResponseWithLlm(db, text, { intent: detected.intent, tool_result: toolResult }, lang, llmConfig);
      finalText = llmResponse;
    } catch (err) {
      logger.error({ err: err }, 'LLM response generation failed');
      addEvent(db, sessionId, "llm_response_error", { error: err instanceof Error ? err.message : "llm_response_error" });
    }
  }

  const timings = {
    intent_ms: intentMs,
    tool_ms: toolMs,
    response_ms: Date.now() - startTime,
  };

  addTurn(db, {
    session_id: sessionId,
    user_input_type: "text",
    user_text: text,
    assistant_text: finalText,
    tool_calls_json: JSON.stringify(events.filter((e) => e.type.startsWith("tool_") || e.type.startsWith("intent"))),
    timings_json: JSON.stringify(timings),
  });

  setSessionContext(db, sessionId, JSON.stringify({ ...fullContext }));

  try {
    const adapter = getAdapter(session.channel as TelephonyChannel);
    const handle: SessionHandle = {
      sessionId,
      channel: session.channel as TelephonyChannel,
      metadata: {},
    };
    const output: AssistantOutput = {
      text: finalText,
      suggestedActions: response.suggested_actions,
    };
    await adapter.sendOutput(handle, output);
  } catch (err) {
    addEvent(db, sessionId, "error", { error: err instanceof Error ? err.message : "adapter_error" });
  }

  return {
    assistant_text: finalText,
    events,
    suggested_actions: response.suggested_actions,
  };
}

interface IntentHandlerResult {
  assistant_text: string;
  suggested_actions: SuggestedAction[];
}

async function handleIntent(
  db: Database,
  sessionId: string,
  lang: LanguageCode,
  context: SessionContext,
  detected: { intent: Intent; confidence: number; slots: Record<string, string> },
  text: string,
  config: OrchestratorConfig,
  events: Array<{ type: string; detail: string }>,
  llmConfig?: LlmConfig,
): Promise<IntentHandlerResult> {
  const { intent, slots } = detected;

  const orderNumber = slots.order_number || context.collected.order_number;
  const phone = slots.phone || context.collected.phone;

  if (context.state === "awaiting_order_number") {
    if (orderNumber || phone) {
      if (orderNumber) context.collected.order_number = orderNumber;
      if (phone) context.collected.phone = phone;
      context.state = "active";
      return await handleOrderLookup(db, sessionId, lang, context, orderNumber, events, config);
    }
    return {
      assistant_text: t("ask_order_number", lang),
      suggested_actions: [],
    };
  }

  if (context.state === "awaiting_issue_details") {
    if (orderNumber) context.collected.order_number = orderNumber;
    if (phone) context.collected.phone = phone;
    context.collected.description = text;
    return await handleTicketCreation(db, sessionId, lang, context, orderNumber, events, config);
  }

  if (context.state === "awaiting_phone") {
    if (phone) {
      context.collected.phone = phone;
      return await handleCallbackRequest(db, sessionId, lang, context, phone, text, events);
    }
    return {
      assistant_text: t("ask_phone", lang),
      suggested_actions: [],
    };
  }

  if (context.state === "ended") {
    return {
      assistant_text: t("session_ended", lang),
      suggested_actions: [],
    };
  }

  switch (intent) {
    case "order_tracking":
      if (orderNumber || phone) {
        if (orderNumber) context.collected.order_number = orderNumber;
        if (phone) context.collected.phone = phone;
        return await handleOrderLookup(db, sessionId, lang, context, orderNumber, events, config);
      } else {
        context.state = "awaiting_order_number";
        return {
          assistant_text: t("ask_order_number", lang),
          suggested_actions: [],
        };
      }

    case "delivery_issue":
      context.collected.intent = "delivery_issue";
      context.collected.description = text;
      if (orderNumber || phone) {
        if (orderNumber) context.collected.order_number = orderNumber;
        if (phone) context.collected.phone = phone;
        return await handleTicketCreation(db, sessionId, lang, context, orderNumber, events, config);
      } else {
        context.state = "awaiting_issue_details";
        return {
          assistant_text: t("ask_issue_details", lang),
          suggested_actions: [],
        };
      }

    case "returns_refunds":
      context.collected.intent = "returns_refunds";
      if (orderNumber) context.collected.order_number = orderNumber;
      if (phone) context.collected.phone = phone;
      return await handleTicketCreation(db, sessionId, lang, context, orderNumber, events, config);

    case "agent_support":
      context.state = "ended";
      return {
        assistant_text: t("session_ended", lang),
        suggested_actions: [],
      };

    default: {
      const defaultResult = {
        assistant_text: t("clarify", lang),
        suggested_actions: [
          { type: "request_callback" as const, label: "Request Callback" },
        ],
      };
      if (llmConfig?.enabled) {
        try {
          const llmText = await generateResponseWithLlm(db, text, { intent: detected.intent }, lang, llmConfig);
          return { ...defaultResult, assistant_text: llmText };
        } catch (err) {
          logger.error({ err: err }, 'LLM response generation failed');
          addEvent(db, sessionId, "llm_response_error", { error: err instanceof Error ? err.message : "llm_response_error" });
        }
      }
      return defaultResult;
    }
  }
}

const CALLBACK_LABEL: Record<LanguageCode, string> = {
  en: "Request Callback",
  ar: "طلب مكالمة",
  ur: "کال بیک کی درخواست",
};

function callbackLabel(lang: LanguageCode): string {
  return CALLBACK_LABEL[lang];
}

const WHATSAPP_LABEL: Record<LanguageCode, string> = {
  en: "Send to WhatsApp",
  ar: "إرسال إلى واتساب",
  ur: "واٹساپ پر بھیجیں",
};

function whatsappLabel(lang: LanguageCode): string {
  return WHATSAPP_LABEL[lang];
}

async function handleOrderLookup(
  db: Database,
  sessionId: string,
  lang: LanguageCode,
  context: SessionContext,
  orderNumber: string | undefined,
  events: Array<{ type: string; detail: string }>,
  config: OrchestratorConfig,
): Promise<IntentHandlerResult> {
  const result = await orderLookup(
    db,
    {
      order_number: orderNumber,
      phone: context.collected.phone,
      language: lang,
    },
    sessionId,
    config.forceOrderLookupFail ?? false,
  );

  events.push({ type: "tool_order_lookup", detail: result.found ? "found" : result.error || "not_found" });

  if (result.error) {
    return {
      assistant_text: t("order_lookup_failed", lang),
      suggested_actions: [{ type: "request_callback" as const, label: callbackLabel(lang) }],
    };
  }

  if (!result.found || !result.order) {
    return {
      assistant_text: t("order_not_found", lang),
      suggested_actions: [
        { type: "request_callback" as const, label: callbackLabel(lang) },
        { type: "continue_on_whatsapp" as const, label: whatsappLabel(lang) },
      ],
    };
  }

  const order = result.order;
  context.last_order = {
    order_number: order.order_number,
    status: order.status,
    tracking_url: order.tracking_url,
    eta: order.eta,
  };
  context.collected.order_number = order.order_number;
  if (order.phone && !context.collected.phone) {
    context.collected.phone = order.phone;
  }

  return {
    assistant_text: t("order_status", lang, {
      order_number: order.order_number,
      status: order.status,
      tracking_url: order.tracking_url,
      eta: order.eta,
    }),
    suggested_actions: [
      { type: "continue_on_whatsapp" as const, label: whatsappLabel(lang) },
      { type: "request_callback" as const, label: callbackLabel(lang) },
    ],
  };
}

async function handleTicketCreation(
  db: Database,
  sessionId: string,
  lang: LanguageCode,
  context: SessionContext,
  orderNumber: string | undefined,
  events: Array<{ type: string; detail: string }>,
  config: OrchestratorConfig,
): Promise<IntentHandlerResult> {
  const description = context.collected.description || "Delivery issue reported";
  const category = (context.collected.intent as "delivery_issue" | "returns_refunds" | "order_tracking" | "other") ?? "delivery_issue";

  const result = await createTicketTool(
    db,
    {
      session_id: sessionId,
      language: lang,
      category,
      description,
      order_number: orderNumber ?? context.collected.order_number,
      phone: context.collected.phone,
    },
    config.forceTicketCreateFail ?? false,
  );

  events.push({ type: "tool_ticket_create", detail: result.ticket_id ? "created" : result.error || "failed" });

  if (result.error || !result.ticket_id) {
    return {
      assistant_text: t("clarify", lang),
      suggested_actions: [{ type: "request_callback" as const, label: callbackLabel(lang) }],
    };
  }

  context.tickets.push(result.ticket_id);
  context.collected.ticket_id = result.ticket_id;
  context.state = "active";

  const orderNum = (orderNumber ?? context.collected.order_number ?? "N/A");
  return {
    assistant_text: t("ticket_created", lang, {
      ticket_id: result.ticket_id,
      category,
      order_number: orderNum,
    }),
    suggested_actions: [
      { type: "request_callback" as const, label: callbackLabel(lang) },
    ],
  };
}

async function handleCallbackRequest(
  db: Database,
  sessionId: string,
  lang: LanguageCode,
  context: SessionContext,
  phone: string,
  reason: string,
  events: Array<{ type: string; detail: string }>,
): Promise<IntentHandlerResult> {
  const cbResult = createCallback(db, {
    session_id: sessionId,
    phone: phone || null,
    reason: reason,
    preferred_time: null,
    status: "requested",
  });

  const callbackId = cbResult.callback_id;

  addEvent(db, sessionId, "callback_requested", { callback_id: callbackId, phone: phone || null });
  events.push({ type: "callback_requested", detail: callbackId });

  context.callbacks.push(callbackId);
  context.state = "ended";

  return {
    assistant_text: t("callback_created", lang, { callback_id: callbackId, phone: phone || "your phone" }),
    suggested_actions: [],
  };
}

export async function sendWhatsAppForSession(
  db: Database,
  sessionId: string,
  config: OrchestratorConfig = {},
): Promise<{ success: boolean; message?: string }> {
  const session = getSession(db, sessionId);
  if (!session) {
    return { success: false, message: "Session not found" };
  }

  const lang = session.language as LanguageCode;
  const context = parseContext(session.context_json);

  if (!context.last_order) {
    return { success: false, message: "No order info available for WhatsApp" };
  }

  const rawPhone = context.collected.phone || "";
  if (!rawPhone) {
    return { success: false, message: "No phone number on file for WhatsApp" };
  }
  const phone = rawPhone;

  const text = t("whatsapp_message_template", lang, {
    order_number: context.last_order.order_number,
    status: context.last_order.status,
    tracking_url: context.last_order.tracking_url,
  });

  const result = await sendWhatsApp(
    db,
    {
      phone,
      message_type: "text",
      text,
      context: {
        session_id: sessionId,
        order_number: context.last_order.order_number,
      },
    },
     config.forceWhatsAppSendFail ?? false,
  );

  if (result.error) {
    return { success: false, message: result.error };
  }

  context.whatsapp_sent = true;
  setSessionContext(db, sessionId, JSON.stringify(context));

  return { success: true, message: result.message_id };
}

export async function requestCallbackForSession(
  db: Database,
  sessionId: string,
  reason: string,
): Promise<{ callback_id: string; status: string }> {
  const session = getSession(db, sessionId);
  if (!session) {
    throw new Error("Session not found");
  }

  const context = parseContext(session.context_json);
  const phone = context.collected.phone || "";

  const cbResult = createCallback(db, {
    session_id: sessionId,
    phone: phone || null,
    reason: reason,
    preferred_time: null,
    status: "requested",
  });

  const callbackId = cbResult.callback_id;

  addEvent(db, sessionId, "callback_requested", { callback_id: callbackId });

  context.callbacks.push(callbackId);
  setSessionContext(db, sessionId, JSON.stringify(context));

  return { callback_id: callbackId, status: "requested" };
}

export async function endSession(db: Database, sessionId: string): Promise<void> {
  const session = getSession(db, sessionId);
  if (!session) return;

  const context = parseContext(session.context_json);
  context.state = "ended";
  setSessionContext(db, sessionId, JSON.stringify(context));
  setSessionOutcome(db, sessionId, "contained");
  addEvent(db, sessionId, "session_ended", { outcome: "contained" });
}
