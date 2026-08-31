export type LanguageCode = "en" | "ar" | "ur"

export type SessionChannel = "simulator" | "twilio" | "exotel" | "sip" | "genesys" | "asterisk" | "yeastar"

export type SessionOutcome =
  | "in_progress"
  | "contained"
  | "escalated"
  | "callback_requested"
  | "abandoned"

export type UserInputType = "text" | "audio" | "dtmf"

export type EventType =
  | "session_started"
  | "language_selected"
  | "intent_detected"
  | "tool_called"
  | "tool_succeeded"
  | "tool_failed"
  | "ticket_created"
  | "callback_requested"
  | "whatsapp_sent"
  | "session_ended"

export type Intent =
  | "order_tracking"
  | "delivery_issue"
  | "returns_refunds"
  | "promotions"
  | "product_info"
  | "wholesale"
  | "agent_support"
  | "unknown"

export type DemoEvent = {
  id: string
  session_id: string
  event_type: EventType
  payload_json: string
  created_at: string
}

export type Session = {
  session_id: string
  channel: SessionChannel
  language: LanguageCode | null
  outcome: SessionOutcome
  context_json: string
  started_at: string
  ended_at: string | null
}

export type Turn = {
  turn_id: string
  session_id: string
  user_input_type: UserInputType
  user_text: string | null
  assistant_text: string
  tool_calls_json: string
  timings_json: string
  created_at: string
}

export type Ticket = {
  ticket_id: string
  session_id: string
  category: string
  subcategory: string | null
  description: string
  order_number: string | null
  status: "open" | "pending" | "resolved"
  created_at: string
  updated_at: string
}

export type Callback = {
  callback_id: string
  session_id: string
  phone: string | null
  reason: string
  preferred_time: string | null
  status: "requested" | "scheduled" | "completed" | "canceled"
  created_at: string
  updated_at: string
}

export type WhatsAppMessage = {
  message_id: string
  session_id: string
  phone: string | null
  message_type: "template" | "text"
  template_name: string | null
  text: string | null
  status: "queued" | "sent" | "failed"
  created_at: string
}

export type CreateSessionRequest = {
  channel: SessionChannel
  metadata?: {
    caller_id?: string
  }
}

export type CreateSessionResponse = {
  session_id: string
  next_prompt: string
}

export type SetLanguageRequest = {
  language: LanguageCode
}

export type TurnRequest = {
  input_type: UserInputType
  text?: string
  dtmf?: string
  audio_ref?: string
}

export type SuggestedAction = {
  type: "continue_on_whatsapp" | "request_callback"
  label: string
}

export type TurnResponse = {
  assistant_text: string
  events: Array<{ type: string; detail: string }>
  suggested_actions: SuggestedAction[]
}

export type CallbackRequest = {
  phone?: string
  reason: string
  preferred_time?: string
}

export type CallbackResponse = {
  callback_id: string
  status: string
}

export type AdminMetricsResponse = {
  total_sessions: number
  language_split: Record<string, number>
  channel_split: Record<string, number>
  containment_count: number
  escalation_count: number
  callback_count: number
  tickets_created: number
  whatsapp_sent: number
  top_intents: Record<string, number>
}

export type AdminRecordsResponse = {
  sessions: Session[]
  tickets: Ticket[]
  callbacks: Callback[]
  whatsapp_messages: WhatsAppMessage[]
}

export type TelephonyProvider = "simulator" | "twilio" | "asterisk" | "yeastar"

export type TelephonyConfig = {
  provider: TelephonyProvider
  api_url?: string
  api_key?: string
  webhook_secret?: string
  sip_trunk_host?: string
  sip_trunk_port: number
  sip_username?: string
  sip_password?: string
  outbound_caller_id?: string
  ari_app?: string
  ari_user?: string
  ari_password?: string
  peer_enabled: boolean
  peer_name?: string
  peer_host?: string
  peer_port: number
  peer_transport: string
  peer_codecs?: string
  peer_dtmf: string
  peer_qualify?: string
  peer_context: string
  peer_insecure?: string
  enabled: boolean
}

export type LlmProvider = "openai" | "anthropic" | "ollama" | "mock" | "gemini" | "groq"

export type LlmConfig = {
  provider: LlmProvider
  model: string
  api_url?: string
  api_key?: string
  temperature: number
  maxTokens: number
  enabled: boolean
}

export type AuditLog = {
  log_id: string
  action: string
  resource_type: string
  resource_id: string | null
  old_value: string | null
  new_value: string | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

