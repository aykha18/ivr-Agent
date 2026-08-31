# PRD — Enterprise MVP (Multi-Telephony)

## 1) Overview
Build an enterprise-ready MVP of a multilingual (language-first) conversational AI voice agent for e-commerce support, with WhatsApp Business API continuation. The platform MUST support pluggable telephony adapters, enabling integration with multiple providers (Twilio, Exotel, SIP/Asterisk, Genesys, etc.) while maintaining a unified orchestrator and session model. The Call Simulator remains as the default/fallback channel for demos and testing.

## 2) Goals
- Demonstrate an end-to-end customer experience in under 7 minutes:
  - Language selection (English/Arabic/Urdu)
  - Conversational order tracking
  - Delivery issue logging with callback option
  - Continue on WhatsApp with tracking link and ticket update
  - Admin metrics reflecting the interaction
- Prove “tool-first truth” for order/returns/ticket data (no hallucinated status)
- Provide a pluggable telephony adapter architecture that supports multiple providers without changing the orchestrator
- Enable switching between Simulator and real telephony via configuration (no code changes to core logic)
- Keep the system scalable to higher concurrency and additional languages

## 3) Non-Goals (Enterprise MVP)
- Full contact-center feature set (WFM, advanced supervisor tooling, workforce management)
- Complex fraud prevention, deep personalization, or training custom models
- Full production hardening for high concurrency (beyond basic stability)
- Real-time audio streaming for ASR/TTS (text-based telephony flows acceptable for MVP)

## 4) Assumptions
- Customer has:
  - One or more telephony platform subscriptions (Twilio/Exotel/SIP/Asterisk/Genesys)
  - WhatsApp Business API access
  - API readiness for orders/returns (or at least a staging/sandbox API)
- MVP runs with Simulator as default, with the ability to switch to a real telephony adapter via config
- LLM is configurable: supports self-hosted (Ollama) and cloud providers (OpenAI, Anthropic)
- Admin can switch LLM providers/models from the dashboard without code changes
- Each telephony adapter handles provider-specific signaling (SIP, REST webhooks, etc.) and normalizes to the internal interface

## 5) Primary Users
- Caller (end customer): wants order status, delivery issue resolution, returns/refunds help
- Agent (optional in MVP): receives escalations and callback tickets
- Admin/Supervisor: views call outcomes, self-service rate, top intents, language split, channel/telephony provider breakdown

## 6) MVP User Journeys (Must-Have)
### Journey A — Order Tracking (Conversational)
1. Caller starts “call” in Simulator or via real telephony adapter
2. Selects language (speech or keypad fallback)
3. Says: “Track my order”
4. Provides order number or phone number
5. System retrieves status via tool call (or uses demo dataset)
6. System responds with status and offers WhatsApp tracking link
7. Caller chooses WhatsApp option, system sends link via WhatsApp adapter

### Journey B — Delivery Issue → Ticket + Callback
1. Caller selects language
2. Says: “My item arrived damaged”
3. System confirms order and issue details
4. System creates ticket via tool call (or demo ticket store)
5. System offers callback request and/or agent escalation
6. Callback request creates a callback record and appears in agent/admin screens

### Journey C — Admin Visibility
1. Admin opens dashboard
2. Sees:
   - total sessions/calls
   - language split
   - channel/telephony provider split
   - containment/self-service completions
   - transfers/escalations
   - callbacks created
   - tickets created
   - top intents / issue categories

## 7) Functional Requirements (Enterprise MVP)
### Language Selection
- Language selection must be the first step
- Supported: English, Arabic, Urdu
- Must lock session language for prompts, ASR config, and response templates

### Conversational Handling
- Support voice-like conversational input in the simulator (typed text accepted for demo stability)
- Intent detection and response generation via LLM, constrained by:
  - tool-first policy for factual data
  - safe fallback prompts and escalation rules

### Pluggable Telephony Adapter Layer
- Abstract telephony behind a common internal interface
- Supported adapters (Enterprise MVP):
  - Simulator (default, web-based)
  - Twilio (Voice/Programmable Voice)
  - Exotel
  - SIP/Asterisk
  - Genesys
- Adapter selection via configuration (env var or config file)
- Each adapter normalizes to:
  - Start session / end session
  - Receive user input (utterance, DTMF, audio)
  - Deliver assistant output (text + optional audio)
  - Trigger escalation / callback
- Adapters must be independently deployable and testable

### WhatsApp Business API
- Send tracking links and ticket updates
- Maintain conversation context identifier (session id) for continuity

### Integrations (Assumed Ready)
- Order tracking API contract available
- Returns/refunds API contract available (can be stubbed in first demo if not needed)

### Agent/Callback (Minimum)
- Callback request creates a record with:
  - customer identifier, requested time (optional), reason, language, ticket id (if any)
- Simple agent view can list callbacks and tickets (basic status updates)

### Admin Dashboard (Minimum)
- Must show real-time or near-real-time counters from demo interactions
- Must support filtering by language, intent category, and telephony channel/provider

## 8) Non-Functional Requirements (Enterprise MVP)
- Reliability: demo must run end-to-end without manual DB edits
- Latency: conversational responses should feel interactive; log measured turn latencies
- Security (baseline):
  - no secrets in repo
  - minimal PII stored; redact logs where feasible
- Extensibility: adding a new telephony adapter must not require changes to the orchestrator core logic

## 9) Out of Scope (Explicit)
- Call recording and retention policies (unless customer requests)
- Complex authentication flows (SSO, SAML)
- Multi-tenant enterprise admin controls
- Real-time audio streaming for ASR/TTS in telephony adapters (text-based flows acceptable)

## 10) Acceptance Criteria (Demo-Ready)
- Language selection works for all three languages
- Journey A and Journey B run end-to-end without failures via Simulator
- “Tool-first truth” is enforced:
  - if order API fails, system clearly says it cannot fetch status and offers escalation
- WhatsApp message is sent successfully (real or simulated based on readiness)
- Admin dashboard reflects the interactions (calls, tickets, callbacks, language split, channel split)
- At least one real telephony adapter (Twilio) can be enabled via config switch
- Adding a new telephony adapter requires only implementing the adapter interface + config entry

## 11) Demo Script (7 Minutes)
1. Start session via Simulator → select English
2. “Track my order” → provide order number → hear status → send WhatsApp link
3. Start second session via Simulator → select Arabic → “Item damaged” → ticket created → callback requested
4. Open dashboard → show metrics updated and ticket/callback records visible
5. Show telephony adapter config switch (Simulator ↔ Twilio) and explain extensibility
