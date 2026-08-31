import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  LanguageCode,
  LlmConfig,
  TelephonyConfig,
  TurnResponse,
  AdminMetricsResponse,
  AdminRecordsResponse,
  AuditLog,
  Session,
  Ticket,
  Callback,
  WhatsAppMessage,
} from "../../shared/types.js";

export interface ChatMessage {
  type: "user" | "assistant";
  text: string;
  timestamp: string;
  events?: Array<{ type: string; detail: string }>;
  suggested_actions?: Array<{ type: string; label: string }>;
}

interface SessionState {
  sessionId: string | null;
  language: LanguageCode | null;
  languageLocked: boolean;
  started: boolean;
  ended: boolean;
  messages: ChatMessage[];
  loading: boolean;

  startSession: (channel?: string) => Promise<void>;
  selectLanguage: (lang: LanguageCode) => Promise<void>;
  sendMessage: (text: string) => Promise<void>;
  sendWhatsApp: () => Promise<void>;
  requestCallback: (reason: string, phone?: string) => Promise<void>;
  endSession: () => Promise<void>;
  reset: () => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      sessionId: null,
      language: null,
      languageLocked: false,
      started: false,
      ended: false,
      messages: [],
      loading: false,

      startSession: async (channel = "yeastar") => {
        set({ loading: true });
        const res = await fetch("/api/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ channel }),
        });
        const data: { session_id: string; next_prompt: string } = await res.json();
        set({ sessionId: data.session_id, started: true, ended: false, messages: [], loading: false });

        set((state) => ({
          messages: [...state.messages, { type: "assistant", text: data.next_prompt, timestamp: new Date().toISOString() }],
        }));
      },

      selectLanguage: async (lang) => {
        const { sessionId } = get();
        if (!sessionId) return;

        set({ loading: true });
        const res = await fetch(`/api/sessions/${sessionId}/language`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ language: lang }),
        });
        const data: { ok: boolean; next_prompt: string } = await res.json();
        set({ language: lang, languageLocked: true, loading: false });

        set((state) => ({
          messages: [...state.messages, { type: "assistant", text: data.next_prompt, timestamp: new Date().toISOString() }],
        }));
      },

      sendMessage: async (text) => {
        const { sessionId, languageLocked } = get();
        if (!sessionId || !languageLocked) return;

        set((state) => ({
          messages: [...state.messages, { type: "user", text, timestamp: new Date().toISOString() }],
          loading: true,
        }));

        const res = await fetch(`/api/sessions/${sessionId}/turns`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ input_type: "text", text }),
        });
        const data: TurnResponse = await res.json();

        set((state) => ({
          messages: [
            ...state.messages,
            {
              type: "assistant",
              text: data.assistant_text,
              timestamp: new Date().toISOString(),
              events: data.events,
              suggested_actions: data.suggested_actions,
            },
          ],
          loading: false,
        }));
      },

  sendWhatsApp: async () => {
    const { sessionId } = get();
    if (!sessionId) return;

    const res = await fetch(`/api/sessions/${sessionId}/whatsapp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const data = await res.json();

    set((state) => ({
      messages: [
        ...state.messages,
        {
          type: "assistant",
          text: data.success
            ? "✓ Tracking link sent to your WhatsApp."
            : `Failed to send WhatsApp: ${data.error || "unknown"}`,
          timestamp: new Date().toISOString(),
        },
      ],
    }));
  },

  requestCallback: async (reason, phone?) => {
    const { sessionId } = get();
    if (!sessionId) return;

    const res = await fetch(`/api/sessions/${sessionId}/callback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason, phone }),
    });
    const data: { callback_id: string; status: string } = await res.json();

    set((state) => ({
      messages: [
        ...state.messages,
        {
          type: "assistant",
          text: `✓ Callback requested (ID: ${data.callback_id}). Someone will call you shortly.`,
          timestamp: new Date().toISOString(),
        },
      ],
    }));
  },

  endSession: async () => {
    const { sessionId } = get();
    if (!sessionId) return;

    await fetch(`/api/sessions/${sessionId}/end`, { method: "POST" });
    set({ ended: true });
  },

  reset: () => {
    set({
      sessionId: null,
      language: null,
      languageLocked: false,
      started: false,
      ended: false,
      messages: [],
    });
  },
  }),
  {
    name: 'session-storage',
    partialize: (state) => ({
      sessionId: state.sessionId,
      language: state.language,
      languageLocked: state.languageLocked,
      started: state.started,
      ended: state.ended,
      messages: state.messages,
    }),
  }),
);

interface AdminState {
  metrics: AdminMetricsResponse | null;
  records: AdminRecordsResponse | null;
  llmConfig: LlmConfig | null;
  telephonyConfig: TelephonyConfig | null;
  auditLogs: AuditLog[];
  loading: boolean;
  telStatus: { provider: string; connected: boolean; ari_app?: string; ari_app_status?: string; active_channels?: number; channels?: any[]; error?: string; details?: string[] } | null;
  fetchMetrics: () => Promise<void>;
  fetchRecords: () => Promise<void>;
  fetchLlmConfig: () => Promise<void>;
  updateLlmConfig: (config: LlmConfig) => Promise<void>;
  fetchTelephonyConfig: () => Promise<void>;
  updateTelephonyConfig: (config: TelephonyConfig) => Promise<void>;
  fetchAuditLogs: () => Promise<void>;
  fetchTelStatus: () => Promise<void>;
}

export const useAdminStore = create<AdminState>((set) => ({
  metrics: null,
  records: null,
  llmConfig: null,
  telephonyConfig: null,
  auditLogs: [],
  loading: false,
  telStatus: null,

  fetchMetrics: async () => {
    set({ loading: true });
    const res = await fetch("/api/admin/metrics");
    const data: AdminMetricsResponse = await res.json();
    set({ metrics: data, loading: false });
  },

  fetchRecords: async () => {
    set({ loading: true });
    const res = await fetch("/api/admin/records");
    const data: AdminRecordsResponse = await res.json();
    set({ records: data, loading: false });
  },

  fetchLlmConfig: async () => {
    const res = await fetch("/api/admin/llm");
    const data: LlmConfig = await res.json();
    set({ llmConfig: data });
  },

  updateLlmConfig: async (config: LlmConfig) => {
    await fetch("/api/admin/llm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    set({ llmConfig: config });
  },

  fetchTelephonyConfig: async () => {
    const res = await fetch("/api/admin/telephony");
    const data: TelephonyConfig = await res.json();
    set({ telephonyConfig: data });
  },

  updateTelephonyConfig: async (config: TelephonyConfig) => {
    await fetch("/api/admin/telephony", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    set({ telephonyConfig: config });
  },

  fetchAuditLogs: async () => {
    const res = await fetch("/api/admin/audit");
    const data = await res.json();
    set({ auditLogs: data.logs || [] });
  },

  fetchTelStatus: async () => {
    try {
      const res = await fetch("/api/admin/telephony/status");
      const data = await res.json();
      set({ telStatus: data });
    } catch {
      set({ telStatus: null });
    }
  },
}));

export const useAgentStore = create<{
  sessions: Session[];
  tickets: Ticket[];
  callbacks: Callback[];
  whatsapp_messages: WhatsAppMessage[];
  loading: boolean;
  fetchRecords: () => Promise<void>;
  refresh: () => Promise<void>;
}>((set, get) => ({
  sessions: [],
  tickets: [],
  callbacks: [],
  whatsapp_messages: [],
  loading: false,

  fetchRecords: async () => {
    set({ loading: true });
    const res = await fetch("/api/admin/records");
    const data: AdminRecordsResponse = await res.json();
    set({
      sessions: data.sessions,
      tickets: data.tickets,
      callbacks: data.callbacks,
      whatsapp_messages: data.whatsapp_messages,
      loading: false,
    });
  },

  refresh: async () => {
    const { fetchRecords } = get();
    await fetchRecords();
  },
}));
