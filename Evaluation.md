# Evaluation Document — Conversational AI Voice Agent (E-commerce IVR)

## 1) Executive Summary
This document evaluates a scalable Tier-1 pilot architecture for a multilingual (language-first) conversational AI voice agent for an e-commerce customer support IVR, with:
- LLM for intent + response: Llama 3.x / Qwen / Mistral (7B–14B class for latency)
- Tier 1 pilot concurrency: 1–5 simultaneous calls, scalable to higher concurrency later
- Pluggable telephony: Twilio / Exotel / SIP / Asterisk / Genesys (customer already subscribed)
- Order/returns integrations: customer APIs available (assumed “API ready”)
- Full WhatsApp Business API support (customer already has WABA access)

Primary goal: deliver a production-oriented pilot that proves the customer experience, operational workflow, and measurable outcomes (containment, reduced queue, faster resolution), while keeping the system architecture ready to scale.

## 2) Scope
### In Scope (Pilot)
- Language selection at start of call (English/Arabic/Urdu), then conversational handling
- Core intents (typical e-commerce):
  - Order tracking (status, ETA, tracking link)
  - Delivery issues (damaged/wrong item/address change/delay)
  - Returns/refunds (create request, status check)
  - Agent escalation + callback request
- WhatsApp continuation:
  - Send tracking links, ticket updates, self-service prompts via WhatsApp
  - Session routing between voice and WhatsApp where applicable
- Pluggable telephony connector layer with one selected provider for pilot
- Observability + reporting baseline:
  - Call outcomes, containment rate, transfer rate, callback rate, CSAT capture (optional for pilot)

### Explicit Non-Goals (Pilot)
- Full contact-center suite replacement (WFM, advanced QA tooling, deep omnichannel routing)
- Complex personalization without verified customer data contracts
- Training custom ASR/LLM models (pilot uses open-source models and prompt/tooling)

## 3) Key Assumptions
- Customer provides and maintains:
  - Telephony platform subscription and necessary credentials/phone numbers
  - WhatsApp Business API (WABA) access and approved templates as needed
  - Secure, stable APIs for order/returns/tickets (or a staging environment)
- Expected peak concurrency for pilot: 1–5 simultaneous calls
- PII/compliance requirements are provided early (recording consent, retention, residency)

## 4) Success Criteria (Pilot)
- Latency targets (voice UX):
  - First response after user utterance: typically acceptable if end-to-end < 1.5–2.5s (pilot target)
  - Barge-in supported or planned (optional for pilot, recommended for scale)
- Quality targets:
  - Intent recognition accuracy on pilot test set: ≥ 85–90% for top intents (language-specific)
  - Safe fallback: misrecognition routes to clarification or agent escalation
- Operational targets:
  - Containment for “order tracking” and “simple delivery issue” flows demonstrably achievable
  - WhatsApp link delivery + conversation continuity works reliably

## 5) Reference Architecture (Tier-1, Scalable)
### Component Overview
- Telephony Connector (pluggable)
  - Twilio / Exotel / SIP / Asterisk / Genesys adapter
  - Handles call control events, audio streaming, DTMF fallback
- Speech Layer
  - ASR (speech-to-text): Whisper/faster-whisper class (language-aware)
  - TTS (text-to-speech): high-quality multilingual TTS engine (Arabic quality to be validated)
- Orchestration Layer (Conversation Brain)
  - Dialog manager (state machine + policies)
  - Tool/function calling for business actions (order lookup, ticket creation)
  - Guardrails (safety + PII filtering + escalation policies)
- LLM Service (self-hosted)
  - Candidate models: Llama 3.x / Qwen / Mistral (7B–14B)
  - Served via an inference server (e.g., vLLM-class)
- Business Integrations
  - Order/returns API adapter
  - Ticketing/CRM adapter (if separate)
  - WhatsApp Business API adapter
- Data + Analytics
  - Conversation logs (redacted), events, outcomes
  - Dashboard metrics (containment, transfer, callback, top intents, language split)
- Security + Ops
  - Secrets manager, access control, audit logs
  - Monitoring (latency, errors, ASR confidence distribution)

### Scale-Ready Design Choices
- Stateless services where possible; externalize state (DB/Redis)
- Queue-based async tasks for WhatsApp, callbacks, ticket updates
- Horizontal scaling:
  - Scale ASR/TTS independently from LLM
  - Add GPUs/instances for LLM as concurrency grows
- Provider-agnostic connector pattern:
  - One canonical “Call Session API” inside the platform
  - Provider-specific adapters translate events/audio

## 6) Model Candidates (LLM: Intent + Response)
### Candidate Set
- Llama 3.x (Instruct variants)
- Qwen (Instruct variants)
- Mistral (Instruct variants)

### Selection Guidance (7B–14B class)
Use 7B–8B as the default pilot starting point for latency and cost; move to 14B if:
- multilingual responses degrade at 7B,
- tool-calling reliability is insufficient,
- policy adherence requires larger model capability.

### Evaluation Dimensions (What to Measure)
- Latency (tokens/sec, time-to-first-token, end-to-end turn latency)
- Instruction following and tool-calling reliability
- Multilingual quality (especially Arabic) and code-switching behavior
- Hallucination rate (e.g., inventing order status) with tool-first policy
- Safety/PII handling and refusal behavior
- Stability under load (1–5 calls now; extrapolate to 20+ later)

### Recommended Pilot Approach
- Start with one primary model and one fallback model for A/B testing
- Build a small “golden set” of conversations per language:
  - 30–50 per language for pilot validation
  - Include noisy audio samples and real-world phrasing patterns

## 7) Tier-1 Hardware (Pilot: 1–5 concurrent calls, scalable later)
### Baseline Hardware Recommendation (Self-hosted)
- GPU: 1× 24GB VRAM class (e.g., NVIDIA L4 or equivalent)
- CPU: 16–24 cores
- RAM: 128GB
- Storage: NVMe SSD (logs + models)

Rationale:
- 24GB VRAM is a practical pilot baseline for 7B–8B models plus overhead
- Keeps the platform simple (single-node) while allowing later scale-out

### Scale-Up Path
- Add a second identical GPU node for redundancy and concurrency
- Separate the speech stack (ASR/TTS) from the LLM node if needed
- Move to multi-GPU or larger VRAM GPUs when:
  - concurrency increases,
  - larger LLM (14B+) is required,
  - lower latency targets are mandated.

## 8) Telephony Platform (Customer-Owned Subscription)
### Requirement
The system must allow selecting the telephony provider at deployment time, without rewriting conversation logic.

### Adapter Strategy
- Define one internal interface:
  - Call lifecycle: start/answer/hangup/transfer
  - Media: audio stream in/out
  - Input: DTMF events
- Implement provider adapters:
  - Twilio adapter
  - Exotel adapter
  - SIP/Asterisk adapter
  - Genesys adapter (if using their APIs)

### Pilot Recommendation
Pick exactly one provider for the pilot build-out to avoid schedule risk; keep the adapter interface stable so additional providers become incremental work.

## 9) WhatsApp Business API (Full Support)
### Capabilities (Pilot)
- Send tracking links and ticket summaries via WhatsApp
- Post-call handoff option:
  - “Continue on WhatsApp” with session/context continuity
- Template message support (customer-managed approvals)

### Operational Considerations
- Template approvals and opt-in policies can block go-live if not prepared early
- Conversation billing and message quotas are customer-owned, but must be observable in logs/metrics

## 10) Language Selection First (Multilingual UX)
### Requirement
Conversation must begin with language selection before proceeding.

### Recommended UX Pattern
- Step 1: Prompt for language selection (speech + keypad fallback)
  - “For English say ‘English’ or press 1…”
- Step 2: Confirm selection and pin session language
- Step 3: Route to language-specific prompts + NLU policies

### Why This Matters
- Improves ASR accuracy by constraining language early
- Prevents mixed-language confusion in early turns
- Creates clear analytics by language split

## 11) Order/Returns Integrations (API Ready)
### Assumed Inputs
- Order lookup endpoint(s): status, carrier, tracking link, ETA
- Returns endpoints: create request, status, refund state
- Customer identity resolution: phone/order number mapping (defined contract)

### Integration Pattern
- Adapter layer:
  - Normalizes upstream APIs into a stable internal schema
- Strict tool-first policy:
  - LLM must call tools for “truth” (order status), never fabricate
- Caching:
  - Optional short-lived cache for repeated lookups within a call

## 12) Security, Privacy, and Compliance (Pilot-Ready)
- PII handling:
  - Redaction for logs and analytics storage
  - Encrypt data in transit and at rest
- Secrets:
  - Store telephony/WhatsApp/API credentials securely (no hardcoding)
- Recording:
  - Consent flow and retention policy must be confirmed before enabling
- Auditability:
  - “Who did what” logs for agent actions and system actions

## 13) Risks and Mitigations
- Arabic voice quality risk (ASR/TTS):
  - Mitigation: validate with real sample calls early; allow DTMF fallback
- Latency risk (LLM + ASR/TTS chain):
  - Mitigation: streaming ASR, streaming TTS, smaller model baseline, tool response caching
- Provider API variability:
  - Mitigation: strict adapter interface, pilot with one provider, add others later
- WhatsApp template and policy delays:
  - Mitigation: start template approval workflow immediately and use fallback messages for pilot
- Hallucination risk:
  - Mitigation: enforce tool-only “truth” for order/returns + safe fallback and escalation

## 14) Pilot Deliverables Checklist (Evaluation Outputs)
- Working voice agent with language selection first (3 languages)
- Tool-calling integration for order tracking + one issue ticket creation
- WhatsApp send + continuity demo
- Metrics dashboard (minimum viable):
  - call count, language split, containment, transfers, callbacks, top intents
- Evaluation report:
  - latency benchmarks, accuracy on golden set, failure modes, recommended model/provider choices

## 15) Open Items (To Finalize Before Build)
- Target deployment environment: on-prem vs. cloud vs. hybrid
- Peak concurrency target beyond pilot (e.g., 20/50/100 calls)
- Recording and retention requirements
- Exact list of intents for day-1 production after pilot
- Escalation strategy: warm transfer vs. callback scheduling workflow

