# Data Model — Fastest Demo MVP

## 1) Goals
- Support the demo flows end-to-end
- Capture minimal analytics and auditability
- Stay compatible with future real telephony integration and higher concurrency

## 2) Entities (Logical)
### 2.1 Session
Represents one “call session” in the simulator or future telephony.
- session_id
- channel: simulator | telephony
- language: en | ar | ur
- started_at, ended_at
- outcome: contained | escalated | callback_requested | abandoned
- caller_ref (optional, tokenized)

### 2.2 Turn
Represents a user→assistant exchange.
- turn_id
- session_id
- user_input_type: text | audio | dtmf
- user_text (optional; consider redaction)
- asr_text (optional)
- assistant_text
- tool_calls_summary (optional)
- timings:
  - intent_ms
  - tools_ms
  - response_ms
- created_at

### 2.3 Ticket
Represents an issue logged during the conversation.
- ticket_id
- session_id
- category
- subcategory (optional)
- description
- order_number (optional)
- status: open | pending | resolved
- created_at, updated_at

### 2.4 Callback
Represents a callback request.
- callback_id
- session_id
- phone (optional; store securely or tokenized)
- reason
- preferred_time (optional)
- status: requested | scheduled | completed | canceled
- created_at, updated_at

### 2.5 WhatsApp Message
Represents an outbound WhatsApp send.
- message_id
- session_id
- phone (optional; tokenized)
- message_type: template | text
- template_name (optional)
- status: queued | sent | failed
- created_at

### 2.6 Event (Analytics/Audit)
Append-only event stream for metrics and debugging.
- event_id
- session_id
- event_type:
  - session_started
  - language_selected
  - intent_detected
  - tool_called
  - tool_succeeded
  - tool_failed
  - ticket_created
  - callback_requested
  - whatsapp_sent
  - session_ended
- payload (redacted)
- created_at

## 3) PII Guidelines (MVP)
- Prefer tokenized references for phone numbers and order numbers in logs/events
- Store raw values only where strictly required to complete the demo flow
- Ensure any “demo data” is synthetic

## 4) Metrics Derivation (From Events)
- total_sessions: count(session_started)
- language_split: count(language_selected grouped)
- containment_count: count(session_ended outcome=contained)
- callback_count: count(callback_requested)
- tickets_created: count(ticket_created)
- whatsapp_sent: count(whatsapp_sent)
- top_intents: count(intent_detected grouped)

