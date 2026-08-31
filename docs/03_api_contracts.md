# API Contracts — Enterprise MVP

## 1) Purpose
Define stable internal APIs for the enterprise MVP so the simulator UI, orchestration logic, integrations, and telephony adapters can evolve independently.

## 2) Internal APIs (MVP Backend)
### 2.1 Create Session
- Method: POST
- Path: /api/sessions
- Body:
  - channel: "simulator" | "twilio" | "exotel" | "sip" | "genesys"
  - metadata:
    - caller_id (optional)
    - adapter_data (optional, provider-specific)
- Response:
  - session_id
  - next_prompt (language selection prompt)
  - channel

### 2.2 Set Language
- Method: POST
- Path: /api/sessions/{session_id}/language
- Body:
  - language: "en" | "ar" | "ur"
- Response:
  - ok
  - next_prompt

### 2.3 Send User Utterance
- Method: POST
- Path: /api/sessions/{session_id}/turns
- Body:
  - input_type: "text" | "audio" | "dtmf"
  - text (if input_type="text")
  - dtmf (if input_type="dtmf")
  - audio_ref (if input_type="audio")
  - channel: optional channel override
- Response:
  - assistant_text
  - assistant_audio_ref (optional)
  - events[] (tool calls summarized for demo)
  - suggested_actions[]:
    - continue_on_whatsapp (optional)
    - request_callback (optional)

### 2.4 Request Callback
- Method: POST
- Path: /api/sessions/{session_id}/callback
- Body:
  - phone (optional if known)
  - reason
  - preferred_time (optional)
- Response:
  - callback_id
  - status

### 2.5 Send WhatsApp
- Method: POST
- Path: /api/sessions/{session_id}/whatsapp
- Body: (empty or optional context)
- Response:
  - success: boolean
  - message_id (if success)
  - error (if failed)

### 2.6 End Session
- Method: POST
- Path: /api/sessions/{session_id}/end
- Response:
  - ok: boolean

### 2.7 Admin Metrics
- Method: GET
- Path: /api/admin/metrics
- Query params (optional):
  - from, to
  - language
  - channel (telephony provider filter)
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

### 2.8 LLM Config
- Method: GET
- Path: /api/llm
- Response:
  - provider: "openai" | "anthropic" | "ollama" | "mock"
  - model: string
  - api_url?: string
  - api_key?: string
  - temperature: number
  - max_tokens: number
  - enabled: boolean

### 2.9 Update LLM Config
- Method: POST
- Path: /api/llm
- Body: same as response above
- Response:
  - ok: boolean

### 2.8 Admin Records
- Method: GET
- Path: /api/admin/records
- Query params (optional):
  - channel
  - limit
- Response:
  - sessions[]
  - tickets[]
  - callbacks[]

## 3) Tool Contracts (Integration Layer)
The orchestrator should call tools through an internal abstraction so tools can be mocked in MVP-1 and pointed to customer APIs later.

### 3.1 Order Lookup Tool
- Name: order_lookup
- Input:
  - order_number (optional)
  - phone (optional)
  - language
- Output:
  - found: boolean
  - order:
    - order_number
    - status: "processing" | "shipped" | "delivered" | "unknown"
    - carrier (optional)
    - tracking_url (optional)
    - eta (optional)
    - phone (optional)
  - error (optional)

### 3.2 Create Ticket Tool
- Name: ticket_create
- Input:
  - session_id
  - language
  - category: "delivery_issue" | "returns_refunds" | "order_tracking" | "other"
  - subcategory (optional)
  - description
  - order_number (optional)
  - phone (optional)
- Output:
  - ticket_id
  - status
  - error (optional)

### 3.3 WhatsApp Send Tool (WABA)
- Name: whatsapp_send
- Input:
  - phone
  - message_type: "template" | "text"
  - template_name (optional)
  - parameters (optional)
  - text (optional)
  - context:
    - session_id
    - ticket_id (optional)
    - order_number (optional)
- Output:
  - message_id
  - status
  - error (optional)

## 4) Telephony Adapter Contracts
### 4.1 Adapter Interface
- All adapters must implement `TelephonyAdapter` from `api/services/telephony/adapter.ts`
- Adapters are loaded dynamically based on `TELEPHONY_ADAPTER` config
- Adapters handle provider-specific signaling and normalize to internal interface

### 4.2 Adapter Events
- `session_started` — adapter has established a session
- `session_ended` — adapter has terminated a session
- `input_received` — user input received via telephony
- `output_sent` — assistant output delivered to user
- `error` — adapter encountered an error

## 5) Customer-Provided APIs (Assumed Ready)
For MVP-1 demo, these may be stubbed. For MVP-2 they are mapped.

### Orders API (Example Contract)
- GET /orders/{order_number}
- Response:
  - order_number
  - status
  - tracking_url
  - eta

### Returns API (Example Contract)
- POST /returns
- GET /returns/{return_id}

## 6) Error Handling Rules (MVP)
- Tool failures must not lead to fabricated answers
- Adapter failures must not crash the orchestrator
- Orchestrator response must include:
  - a clear statement of inability to fetch data
  - an option to escalate or request callback
- If a telephony adapter fails, the orchestrator should:
  - log the error with telemetry
  - offer escalation or callback to the user
