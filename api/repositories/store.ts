import { randomUUID } from "crypto"
import type { Database } from "sql.js"
import type {
  AdminMetricsResponse,
  AdminRecordsResponse,
  AuditLog,
  Callback,
  LanguageCode,
  LlmConfig,
  Session,
  SessionChannel,
  TelephonyConfig,
  Ticket,
  Turn,
  WhatsAppMessage,
} from "../../shared/types.js"

function nowIso() {
  return new Date().toISOString()
}

function oneRow<T>(rows: Array<Record<string, unknown>>): T | null {
  if (rows.length === 0) return null
  return rows[0] as T
}

function allRows(db: Database, sql: string, params: Record<string, unknown> = {}) {
  const stmt = db.prepare(sql)
  try {
    stmt.bind(params)
    const out: Array<Record<string, unknown>> = []
    while (stmt.step()) out.push(stmt.getAsObject())
    return out
  } finally {
    stmt.free()
  }
}

function run(db: Database, sql: string, params: Record<string, unknown> = {}) {
  const stmt = db.prepare(sql)
  try {
    const namedParams: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(params)) {
      const namedKey = key.startsWith(":") ? key : `:${key}`
      namedParams[namedKey] = value
    }
    stmt.bind(namedParams)
    stmt.step()
  } finally {
    stmt.free()
  }
}

export function createSession(db: Database, channel: SessionChannel): Session {
  const session: Session = {
    session_id: randomUUID(),
    channel,
    language: null,
    outcome: "in_progress",
    context_json: JSON.stringify({}),
    started_at: nowIso(),
    ended_at: null,
  }

  run(
    db,
    `insert into sessions (session_id, channel, language, outcome, context_json, started_at, ended_at)
     values (:session_id, :channel, :language, :outcome, :context_json, :started_at, :ended_at)`,
    session,
  )

  return session
}

export function getSession(db: Database, sessionId: string): Session | null {
  const rows = allRows(
    db,
    `select session_id, channel, language, outcome, context_json, started_at, ended_at
     from sessions where session_id = :session_id`,
    { ":session_id": sessionId },
  )
  return oneRow<Session>(rows)
}

export function getTurnsForSession(db: Database, sessionId: string): Turn[] {
  const rows = allRows(
    db,
    `select turn_id, session_id, user_input_type, user_text, assistant_text, tool_calls_json, timings_json, created_at
     from turns where session_id = :session_id order by created_at asc`,
    { ":session_id": sessionId },
  )
  return rows.map((row) => ({
    turn_id: String(row.turn_id),
    session_id: String(row.session_id),
    user_input_type: String(row.user_input_type) as Turn["user_input_type"],
    user_text: row.user_text ? String(row.user_text) : null,
    assistant_text: String(row.assistant_text),
    tool_calls_json: String(row.tool_calls_json),
    timings_json: String(row.timings_json),
    created_at: String(row.created_at),
  }))
}

export function setSessionLanguage(db: Database, sessionId: string, language: LanguageCode): Session | null {
  run(db, `update sessions set language = :language where session_id = :session_id`, {
    ":language": language,
    ":session_id": sessionId,
  })
  return getSession(db, sessionId)
}

export function setSessionContext(db: Database, sessionId: string, contextJson: string): void {
  run(db, `update sessions set context_json = :context_json where session_id = :session_id`, {
    ":context_json": contextJson,
    ":session_id": sessionId,
  })
}

export function setSessionOutcome(db: Database, sessionId: string, outcome: Session["outcome"]): void {
  run(db, `update sessions set outcome = :outcome where session_id = :session_id`, {
    ":outcome": outcome,
    ":session_id": sessionId,
  })
}

export function addTurn(db: Database, input: Omit<Turn, "turn_id" | "created_at">): Turn {
  const turn: Turn = {
    ...input,
    turn_id: randomUUID(),
    created_at: nowIso(),
  }
  run(
    db,
    `insert into turns (turn_id, session_id, user_input_type, user_text, assistant_text, tool_calls_json, timings_json, created_at)
     values (:turn_id, :session_id, :user_input_type, :user_text, :assistant_text, :tool_calls_json, :timings_json, :created_at)`,
    turn,
  )
  return turn
}

export function createTicket(db: Database, input: Omit<Ticket, "ticket_id" | "created_at" | "updated_at">): Ticket {
  const ts = nowIso()
  const ticket: Ticket = {
    ...input,
    ticket_id: randomUUID(),
    created_at: ts,
    updated_at: ts,
  }
  run(
    db,
    `insert into tickets (ticket_id, session_id, category, subcategory, description, order_number, status, created_at, updated_at)
     values (:ticket_id, :session_id, :category, :subcategory, :description, :order_number, :status, :created_at, :updated_at)`,
    ticket,
  )
  return ticket
}

export function createCallback(db: Database, input: Omit<Callback, "callback_id" | "created_at" | "updated_at">): Callback {
  const ts = nowIso()
  const cb: Callback = {
    ...input,
    callback_id: randomUUID(),
    created_at: ts,
    updated_at: ts,
  }
  run(
    db,
    `insert into callbacks (callback_id, session_id, phone, reason, preferred_time, status, created_at, updated_at)
     values (:callback_id, :session_id, :phone, :reason, :preferred_time, :status, :created_at, :updated_at)`,
    cb,
  )
  return cb
}

export function createWhatsAppMessage(
  db: Database,
  input: Omit<WhatsAppMessage, "message_id" | "created_at">,
): WhatsAppMessage {
  const msg: WhatsAppMessage = {
    ...input,
    message_id: randomUUID(),
    created_at: nowIso(),
  }
  run(
    db,
    `insert into whatsapp_messages (message_id, session_id, phone, message_type, template_name, text, status, created_at)
     values (:message_id, :session_id, :phone, :message_type, :template_name, :text, :status, :created_at)`,
    msg,
  )
  return msg
}

export function addEvent(db: Database, sessionId: string, eventType: string, payload: unknown) {
  run(
    db,
    `insert into events (event_id, session_id, event_type, payload_json, created_at)
     values (:event_id, :session_id, :event_type, :payload_json, :created_at)`,
    {
      ":event_id": randomUUID(),
      ":session_id": sessionId,
      ":event_type": eventType,
      ":payload_json": JSON.stringify(payload ?? {}),
      ":created_at": nowIso(),
    },
  )
}

export function getAdminRecords(db: Database): AdminRecordsResponse {
  const sessions = allRows(
    db,
    `select session_id, channel, language, outcome, context_json, started_at, ended_at from sessions order by started_at desc limit 50`,
  ) as Session[]
  const tickets = allRows(db, `select * from tickets order by created_at desc limit 50`) as Ticket[]
  const callbacks = allRows(db, `select * from callbacks order by created_at desc limit 50`) as Callback[]
  const whatsapp_messages = allRows(
    db,
    `select * from whatsapp_messages order by created_at desc limit 50`,
  ) as WhatsAppMessage[]
  return { sessions, tickets, callbacks, whatsapp_messages }
}

export function getAdminMetrics(db: Database): AdminMetricsResponse {
  const totalSessions = allRows(db, `select count(*) as c from sessions`)[0]?.c as number

  const languageRows = allRows(db, `select language, count(*) as c from sessions where language is not null group by language`)
  const language_split: Record<string, number> = {}
  for (const r of languageRows) language_split[String(r.language)] = Number(r.c ?? 0)

  const channelRows = allRows(db, `select channel, count(*) as c from sessions group by channel`)
  const channel_split: Record<string, number> = {}
  for (const r of channelRows) channel_split[String(r.channel)] = Number(r.c ?? 0)

  const containmentCount = Number(
    allRows(db, `select count(*) as c from sessions where outcome = 'contained'`)[0]?.c ?? 0,
  )
  const escalationCount = Number(
    allRows(db, `select count(*) as c from sessions where outcome = 'escalated'`)[0]?.c ?? 0,
  )
  const callbackCount = Number(allRows(db, `select count(*) as c from callbacks`)[0]?.c ?? 0)
  const ticketsCreated = Number(allRows(db, `select count(*) as c from tickets`)[0]?.c ?? 0)
  const whatsappSent = Number(
    allRows(db, `select count(*) as c from whatsapp_messages where status = 'sent'`)[0]?.c ?? 0,
  )

  const topIntentRows = allRows(
    db,
    `select json_extract(payload_json, '$.intent') as intent, count(*) as c
     from events
     where event_type = 'intent_detected'
     group by intent
     order by c desc
     limit 10`,
  )
  const top_intents: Record<string, number> = {}
  for (const r of topIntentRows) top_intents[String(r.intent ?? "unknown")] = Number(r.c ?? 0)

  return {
    total_sessions: Number(totalSessions ?? 0),
    language_split,
    channel_split,
    containment_count: containmentCount,
    escalation_count: escalationCount,
    callback_count: callbackCount,
    tickets_created: ticketsCreated,
    whatsapp_sent: whatsappSent,
    top_intents,
  }
}

export function getLlmConfig(db: Database): LlmConfig {
  const rows = allRows(db, `select * from llm_config where config_key = 'active'`)
  const row = rows[0]
  if (!row) {
    return {
      provider: "mock",
      model: "mock-model",
      temperature: 0.7,
      maxTokens: 256,
      enabled: true,
    }
  }
  return {
    provider: String(row.provider) as LlmConfig["provider"],
    model: String(row.model),
    api_url: row.api_url ? String(row.api_url) : undefined,
    api_key: row.api_key ? String(row.api_key) : undefined,
    temperature: Number(row.temperature ?? 0.7),
    maxTokens: Number(row.max_tokens ?? 256),
    enabled: Boolean(row.enabled),
  }
}

export function upsertLlmConfig(db: Database, config: LlmConfig): void {
  const existing = allRows(db, `select config_key from llm_config where config_key = 'active'`)
  const now = nowIso()
  if (existing.length > 0) {
    run(db, `update llm_config set provider = :provider, model = :model, api_url = :api_url, api_key = :api_key, temperature = :temperature, max_tokens = :max_tokens, enabled = :enabled, updated_at = :updated_at where config_key = 'active'`, {
      provider: config.provider,
      model: config.model,
      api_url: config.api_url ?? null,
      api_key: config.api_key ?? null,
      temperature: config.temperature,
      max_tokens: config.maxTokens,
      enabled: config.enabled ? 1 : 0,
      updated_at: now,
    })
  } else {
    run(db, `insert into llm_config (config_key, provider, model, api_url, api_key, temperature, max_tokens, enabled, updated_at) values ('active', :provider, :model, :api_url, :api_key, :temperature, :max_tokens, :enabled, :updated_at)`, {
      provider: config.provider,
      model: config.model,
      api_url: config.api_url ?? null,
      api_key: config.api_key ?? null,
      temperature: config.temperature,
      max_tokens: config.maxTokens,
      enabled: config.enabled ? 1 : 0,
      updated_at: now,
    })
  }
}

export function getTelephonyConfig(db: Database): TelephonyConfig {
  const rows = allRows(db, `select * from telephony_config where config_key = 'active'`)
  const row = rows[0]
  if (!row) {
    return {
      provider: "yeastar",
      sip_trunk_port: 5060,
      enabled: true,
      peer_enabled: false,
      peer_port: 5060,
      peer_transport: 'udp',
      peer_dtmf: 'rfc4733',
      peer_context: 'ivr-ai',
    }
  }
  return {
    provider: String(row.provider) as TelephonyConfig["provider"],
    api_url: row.api_url ? String(row.api_url) : undefined,
    api_key: row.api_key ? String(row.api_key) : undefined,
    webhook_secret: row.webhook_secret ? String(row.webhook_secret) : undefined,
    sip_trunk_host: row.sip_trunk_host ? String(row.sip_trunk_host) : undefined,
    sip_trunk_port: Number(row.sip_trunk_port ?? 5060),
    sip_username: row.sip_username ? String(row.sip_username) : undefined,
    sip_password: row.sip_password ? String(row.sip_password) : undefined,
    outbound_caller_id: row.outbound_caller_id ? String(row.outbound_caller_id) : undefined,
    ari_app: row.ari_app ? String(row.ari_app) : undefined,
    ari_user: row.ari_user ? String(row.ari_user) : undefined,
    ari_password: row.ari_password ? String(row.ari_password) : undefined,
    peer_enabled: Boolean(row.peer_enabled),
    peer_name: row.peer_name ? String(row.peer_name) : undefined,
    peer_host: row.peer_host ? String(row.peer_host) : undefined,
    peer_port: Number(row.peer_port ?? 5060),
    peer_transport: String(row.peer_transport || 'udp'),
    peer_codecs: row.peer_codecs ? String(row.peer_codecs) : undefined,
    peer_dtmf: String(row.peer_dtmf || 'rfc4733'),
    peer_qualify: row.peer_qualify ? String(row.peer_qualify) : undefined,
    peer_context: String(row.peer_context || 'ivr-ai'),
    peer_insecure: row.peer_insecure ? String(row.peer_insecure) : undefined,
    enabled: Boolean(row.enabled),
  }
}

export function upsertTelephonyConfig(db: Database, config: TelephonyConfig): void {
  const existing = allRows(db, `select config_key from telephony_config where config_key = 'active'`)
  const now = nowIso()
  if (existing.length > 0) {
    run(db, `update telephony_config set provider = :provider, api_url = :api_url, api_key = :api_key, webhook_secret = :webhook_secret, sip_trunk_host = :sip_trunk_host, sip_trunk_port = :sip_trunk_port, sip_username = :sip_username, sip_password = :sip_password, outbound_caller_id = :outbound_caller_id, ari_app = :ari_app, ari_user = :ari_user, ari_password = :ari_password, peer_enabled = :peer_enabled, peer_name = :peer_name, peer_host = :peer_host, peer_port = :peer_port, peer_transport = :peer_transport, peer_codecs = :peer_codecs, peer_dtmf = :peer_dtmf, peer_qualify = :peer_qualify, peer_context = :peer_context, peer_insecure = :peer_insecure, enabled = :enabled, updated_at = :updated_at where config_key = 'active'`, {
      provider: config.provider,
      api_url: config.api_url ?? null,
      api_key: config.api_key ?? null,
      webhook_secret: config.webhook_secret ?? null,
      sip_trunk_host: config.sip_trunk_host ?? null,
      sip_trunk_port: config.sip_trunk_port,
      sip_username: config.sip_username ?? null,
      sip_password: config.sip_password ?? null,
      outbound_caller_id: config.outbound_caller_id ?? null,
      ari_app: config.ari_app ?? null,
      ari_user: config.ari_user ?? null,
      ari_password: config.ari_password ?? null,
      peer_enabled: config.peer_enabled ? 1 : 0,
      peer_name: config.peer_name ?? null,
      peer_host: config.peer_host ?? null,
      peer_port: config.peer_port ?? 5060,
      peer_transport: config.peer_transport || 'udp',
      peer_codecs: config.peer_codecs ?? null,
      peer_dtmf: config.peer_dtmf || 'rfc4733',
      peer_qualify: config.peer_qualify ?? null,
      peer_context: config.peer_context || 'ivr-ai',
      peer_insecure: config.peer_insecure ?? null,
      enabled: config.enabled ? 1 : 0,
      updated_at: now,
    })
  } else {
    run(db, `insert into telephony_config (config_key, provider, api_url, api_key, webhook_secret, sip_trunk_host, sip_trunk_port, sip_username, sip_password, outbound_caller_id, ari_app, ari_user, ari_password, peer_enabled, peer_name, peer_host, peer_port, peer_transport, peer_codecs, peer_dtmf, peer_qualify, peer_context, peer_insecure, enabled, updated_at) values ('active', :provider, :api_url, :api_key, :webhook_secret, :sip_trunk_host, :sip_trunk_port, :sip_username, :sip_password, :outbound_caller_id, :ari_app, :ari_user, :ari_password, :peer_enabled, :peer_name, :peer_host, :peer_port, :peer_transport, :peer_codecs, :peer_dtmf, :peer_qualify, :peer_context, :peer_insecure, :enabled, :updated_at)`, {
      provider: config.provider,
      api_url: config.api_url ?? null,
      api_key: config.api_key ?? null,
      webhook_secret: config.webhook_secret ?? null,
      sip_trunk_host: config.sip_trunk_host ?? null,
      sip_trunk_port: config.sip_trunk_port,
      sip_username: config.sip_username ?? null,
      sip_password: config.sip_password ?? null,
      outbound_caller_id: config.outbound_caller_id ?? null,
      ari_app: config.ari_app ?? null,
      ari_user: config.ari_user ?? null,
      ari_password: config.ari_password ?? null,
      peer_enabled: config.peer_enabled ? 1 : 0,
      peer_name: config.peer_name ?? null,
      peer_host: config.peer_host ?? null,
      peer_port: config.peer_port ?? 5060,
      peer_transport: config.peer_transport || 'udp',
      peer_codecs: config.peer_codecs ?? null,
      peer_dtmf: config.peer_dtmf || 'rfc4733',
      peer_qualify: config.peer_qualify ?? null,
      peer_context: config.peer_context || 'ivr-ai',
      peer_insecure: config.peer_insecure ?? null,
      enabled: config.enabled ? 1 : 0,
      updated_at: now,
    })
  }
}

export function addAuditLog(
  db: Database,
  args: {
    action: string;
    resource_type: string;
    resource_id?: string;
    old_value?: string;
    new_value?: string;
    ip_address?: string;
    user_agent?: string;
  }
): void {
  const logId = randomUUID();
  const now = nowIso();
  run(
    db,
    `insert into audit_log (log_id, action, resource_type, resource_id, old_value, new_value, ip_address, user_agent, created_at) values (:log_id, :action, :resource_type, :resource_id, :old_value, :new_value, :ip_address, :user_agent, :created_at)`,
    {
      log_id: logId,
      action: args.action,
      resource_type: args.resource_type,
      resource_id: args.resource_id ?? null,
      old_value: args.old_value ?? null,
      new_value: args.new_value ?? null,
      ip_address: args.ip_address ?? null,
      user_agent: args.user_agent ?? null,
      created_at: now,
    }
  )
}

export function getAuditLogs(db: Database, maxRows = 100): AuditLog[] {
  const safeLimit = Math.max(1, Math.min(maxRows, 500))
  const rows = allRows(db, `select * from audit_log order by created_at desc limit ${safeLimit}`)
  return rows.map((row) => ({
    log_id: String(row.log_id),
    action: String(row.action),
    resource_type: String(row.resource_type),
    resource_id: row.resource_id ? String(row.resource_id) : null,
    old_value: row.old_value ? String(row.old_value) : null,
    new_value: row.new_value ? String(row.new_value) : null,
    ip_address: row.ip_address ? String(row.ip_address) : null,
    user_agent: row.user_agent ? String(row.user_agent) : null,
    created_at: String(row.created_at),
  }))
}

