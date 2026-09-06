# API Contracts — Enterprise MVP

## 1) Purpose
Define stable internal APIs for the enterprise MVP so the simulator UI, orchestration logic, integrations, and telephony adapters can evolve independently.

## 2) Internal APIs (MVP Backend)
Base path: `/api`

### 2.1 Health Check
- Method: GET
- Path: /api/health
- Response: `{ success: true, message: "ok" }`

### 2.2 Create Session
- Method: POST
- Path: /api/sessions
- Body:
  - channel: "simulator" | "twilio" | "asterisk" | "sip" | "yeastar"
- Response:
  - session_id
  - next_prompt (language selection prompt)
  - channel

### 2.3 Get Session
- Method: GET
- Path: /api/sessions/{session_id}
- Response:
  - session object
  - turns[]

### 2.4 Set Language
- Method: POST
- Path: /api/sessions/{session_id}/language
- Body:
  - language: "en" | "ar" | "ur"
- Response:
  - ok
  - next_prompt

### 2.5 Send User Utterance
- Method: POST
- Path: /api/sessions/{session_id}/turns
- Body:
  - input_type: "text" | "audio" | "dtmf"
  - text (if input_type="text")
  - dtmf (if input_type="dtmf")
  - audio_ref (if input_type="audio")
- Response:
  - assistant_text
  - events[] (tool calls summarized for demo)
  - suggested_actions[]:
    - continue_on_whatsapp (optional)
    - request_callback (optional)

### 2.6 Request Callback
- Method: POST
- Path: /api/sessions/{session_id}/callback
- Body:
  - reason
  - phone (optional)
  - preferred_time (optional)
- Response:
  - callback_id
  - status

### 2.7 Send WhatsApp
- Method: POST
- Path: /api/sessions/{session_id}/whatsapp
- Body: (empty)
- Response:
  - success: boolean
  - message_id (if success)
  - error (if failed)

### 2.8 End Session
- Method: POST
- Path: /api/sessions/{session_id}/end
- Response:
  - ok: boolean

### 2.9 Admin Metrics
- Method: GET
- Path: /api/admin/metrics
- Auth: X-Api-Key header required if ADMIN_API_KEY is set
- Response:
  - total_sessions
  - channel_split
  - language_split
  - containment_count
  - escalation_count
  - callback_count
  - tickets_created
  - whatsapp_sent
  - top_intents

### 2.10 Admin Metrics (Prometheus)
- Method: GET
- Path: /api/admin/metrics/prometheus
- Auth: X-Api-Key header required if ADMIN_API_KEY is set
- Response: text/plain Prometheus metrics

### 2.11 Admin Records
- Method: GET
- Path: /api/admin/records
- Auth: X-Api-Key header required if ADMIN_API_KEY is set
- Query params (optional):
  - channel
  - limit
- Response:
  - sessions[]
  - tickets[]
  - callbacks[]
  - whatsapp_messages[]

### 2.12 LLM Config
- Method: GET
- Path: /api/llm
- Auth: X-Api-Key header required if ADMIN_API_KEY is set
- Response:
  - provider: "openai" | "anthropic" | "ollama" | "mock" | "gemini" | "groq"
  - model: string
  - api_url?: string
  - api_key?: string
  - temperature: number
  - max_tokens: number
  - enabled: boolean

### 2.13 Update LLM Config
- Method: POST
- Path: /api/llm
- Auth: X-Api-Key header required if ADMIN_API_KEY is set
- Body: same as response above
- Response:
  - ok: boolean

### 2.14 Admin Telephony Config
- Method: GET
- Path: /api/admin/telephony
- Auth: X-Api-Key header required if ADMIN_API_KEY is set
- Response: TelephonyConfig

### 2.15 Update Admin Telephony Config
- Method: POST
- Path: /api/admin/telephony
- Auth: X-Api-Key header required if ADMIN_API_KEY is set
- Body: TelephonyConfig
- Response: updated TelephonyConfig

### 2.16 Validate Telephony Config
- Method: POST
- Path: /api/admin/telephony/validate
- Auth: X-Api-Key header required if ADMIN_API_KEY is set
- Body: TelephonyConfig (partial, for dry-run)
- Response:
  - valid: boolean
  - provider: string
  - message: string

### 2.17 Telephony Status
- Method: GET
- Path: /api/admin/telephony/status
- Auth: X-Api-Key header required if ADMIN_API_KEY is set
- Response:
  - provider: string
  - connected: boolean
  - error?: string
  - details?: string[]
  - channels?: array (asterisk)
  - ari_app?: string
  - ari_app_status?: string
  - active_channels?: number

### 2.18 Admin Audit Log
- Method: GET
- Path: /api/admin/audit
- Auth: X-Api-Key header required if ADMIN_API_KEY is set
- Query params:
  - limit (default 100, max 500)
- Response:
  - logs[]

## 3) Telephony Adapter Webhooks
### 3.1 Twilio
- POST /api/telephony/twilio/events — Twilio webhook for call events
- POST /api/telephony/twilio/answer — Answer call
- POST /api/telephony/twilio/hangup — End call

### 3.2 Asterisk
- POST /api/telephony/asterisk/events — ARI webhook for channel events
- POST /api/telephony/asterisk/answer — Answer channel
- POST /api/telephony/asterisk/hangup — End channel

### 3.3 Yeastar
- POST /api/telephony/yeastar/call — Create session from Yeastar call
- POST /api/telephony/yeastar/events — Handle Yeastar events (DTMF, speech)
- POST /api/telephony/yeastar/answer — Mark call as answered
- POST /api/telephony/yeastar/hangup — End session on hangup
