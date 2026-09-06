# Architecture — Enterprise MVP (Multi-Telephony)

## 1) Architectural Principles
- Telephony is abstracted behind a pluggable adapter interface
- Adapters normalize provider-specific protocols (REST, SIP, WebRTC, webhooks) to a common internal contract
- The orchestrator is telephony-agnostic; it only knows the internal interface
- Adding a new telephony provider requires implementing the adapter interface + config entry only
- Tool-first truth for business data (orders/returns/tickets), no fabricated statuses
- Separate concerns so scaling later is additive:
  - telephony adapters (pluggable)
  - UI simulator
  - orchestration/dialog manager
  - LLM inference
  - speech (ASR/TTS)
  - integrations (orders/returns, WhatsApp, ticketing)
- Record events for analytics from day 1 (even if minimal)

## 2) High-Level Components
### A) Telephony Adapter Layer (Pluggable)
- Common internal interface (`TelephonyAdapter`)
- Built-in adapters:
  - SimulatorAdapter (default, web-based UI)
  - TwilioAdapter (Twilio Programmable Voice)
  - AsteriskAdapter (SIP/Asterisk via ARI)
  - YeastarAdapter (Yeastar PBX webhook mode)
  - ExotelAdapter and GenesysAdapter are reserved but not yet implemented
- Each adapter:
  - Starts/ends sessions
  - Receives user input (text, DTMF, audio ref)
  - Delivers assistant output (text + optional audio)
  - Handles provider-specific webhooks, auth, and signaling
  - Maps provider events to internal session events

### B) Conversation Orchestrator (Backend Service)
- Owns the session state machine:
  - language locked
  - current intent, slots, tool results
  - escalation/callback decisions
- Telephony-agnostic: calls adapters through the common interface
- Calls:
  - LLM service for intent + response planning
  - tools (orders, ticketing, WhatsApp)
- Emits analytics events

### C) LLM Inference Service (Configurable)
- Pluggable providers: OpenAI, Anthropic, Ollama (self-hosted), Mock
- Admin can configure provider, model, API URL/key, temperature, and max tokens via dashboard
- Provides:
  - intent classification + structured plan output (optional, falls back to keyword matching)
  - response generation constrained by tool outputs (optional)
- Enabled/disabled via admin config

### D) Speech Services (Optional for MVP-1, recommended for MVP-2)
- ASR:
  - language-aware transcription (English/Arabic/Urdu)
- TTS:
  - language-aware response audio
- For MVP-1, typed utterances and text responses are acceptable for demo reliability

### E) Integration Adapters
- Orders/Returns adapter (customer API ready)
- Ticketing adapter (internal DB for MVP, optional external CRM integration later)
- WhatsApp adapter (WABA available):
  - send tracking link, ticket update, “continue on WhatsApp” message

### F) Data Store + Analytics
- Stores:
  - sessions, turns, tool calls
  - tickets, callbacks
  - metrics aggregates (optional precomputed)
  - telephony provider metadata per session
- Logs must avoid storing raw PII unnecessarily

## 3) Telephony Adapter Architecture
### Internal Interface (Contract)
```typescript
interface TelephonyAdapter {
  name: string;
  startSession(): Promise<SessionHandle>;
  endSession(session: SessionHandle): Promise<void>;
  sendOutput(session: SessionHandle, output: AssistantOutput): Promise<void>;
  onInput(callback: (input: UserInput) => void): void;
  onEvent(callback: (event: AdapterEvent) => void): void;
}
```

### Adapter Implementations
| Adapter | Transport | Auth | Notes |
|---------|-----------|------|-------|
| SimulatorAdapter | WebSocket / HTTP | None | Default for demos |
| TwilioAdapter | TwiML / Webhooks | API Key / Token | Programmable Voice |
| ExotelAdapter | REST API / Webhooks | API Key | Cloud telephony |
| SipAdapter | SIP / WebRTC | IP / Credentials | Asterisk / FreeSWITCH (via ARI) |
| YeastarAdapter | REST API / Webhooks | API Key | Yeastar PBX webhook mode |
| GenesysAdapter | REST / WebSocket | OAuth / API Key | Genesys Cloud |

### Adapter Selection
- Configured via `TELEPHONY_ADAPTER` environment variable
- Values: `simulator`, `twilio`, `asterisk`, `yeastar`
- Default: `simulator` (fallback when no config is loaded)
- The `sip` session channel is aliased to the Asterisk adapter for SIP bridge deployments
- Adapters are loaded dynamically based on config
- Note: `exotel` and `genesys` are reserved channel names but not yet implemented; they resolve to null stubs in the factory and will throw if selected

### Pilot Rule
- Build the orchestrator and internal interface now
- Implement the simulator adapter now
- Implement Twilio adapter for first real telephony demo
- Additional adapters (Exotel, SIP, Genesys) follow the same interface

## 4) Request Flow (Enterprise MVP)
1. Adapter starts session (simulator or real telephony)
2. Orchestrator prompts language selection
3. User selects language (speech/typed/DTMF)
4. User utterance → Adapter → Orchestrator → LLM (intent + slots)
5. Orchestrator calls tools:
   - order lookup / ticket create / WhatsApp send
6. Orchestrator returns response to Adapter
7. Adapter delivers response to user (text + optional audio)
8. Orchestrator emits analytics events

## 5) Guardrails and Tool-First Policy
- For any factual statement about:
  - order status, delivery ETA, refund state, ticket status
the system must rely on tool output.

Failure behavior:
- If tool fails or times out:
  - ask for retry or offer callback/agent escalation
  - do not guess

## 6) Deployment Model (Enterprise MVP)
- Single-node deployment acceptable for MVP demo:
  - orchestrator + DB + simulator UI
  - LLM inference on same node if GPU available
- Scale-ready later:
  - isolate LLM on GPU node
  - isolate speech services
  - horizontal scale orchestrator instances (stateless) + shared state store
  - deploy telephony adapters as separate services if needed

## 7) Observability (Enterprise Baseline)
- Capture per-turn timings:
  - time to intent
  - tool latency
  - response generation latency
  - adapter latency (provider-specific)
- Capture outcomes:
  - contained vs escalated
  - callback created
  - WhatsApp sent
  - top intents by language
  - telephony provider/channel breakdown
