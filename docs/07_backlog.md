# Implementation Backlog — Fastest Demo MVP

## Epic 1 — Demo Call Simulator
- Story 1.1: Start session + show language selection
  - Acceptance: creates session id and displays language prompt
- Story 1.2: Support user input (typed) and display assistant response
  - Acceptance: turns are recorded and visible in event log
- Story 1.3: Show “suggested actions” (WhatsApp, callback) as buttons
  - Acceptance: buttons trigger backend calls and update UI state

## Epic 2 — Orchestrator + State Machine
- Story 2.1: Session lifecycle and language lock
  - Acceptance: language cannot change after lock without explicit reset
- Story 2.2: Intent routing for top intents
  - Acceptance: order_tracking and delivery_issue intents recognized reliably in demo set
- Story 2.3: Tool-first truth enforcement
  - Acceptance: order status responses always backed by tool output, never guessed
- Story 2.4: Fallback + escalation rules
  - Acceptance: tool failure triggers apology + retry or callback option

## Epic 3 — Tools / Integrations (MVP Mode)
- Story 3.1: Orders tool adapter (mock + switchable to customer API)
  - Acceptance: supports known demo orders and “not found” path
- Story 3.2: Ticket tool (internal store)
  - Acceptance: creates ticket id, visible in admin records
- Story 3.3: Callback tool (internal store)
  - Acceptance: creates callback record, visible in agent/admin lists
- Story 3.4: WhatsApp adapter (real WABA or simulated)
  - Acceptance: “sent” event logged and visible; real send if credentials supplied

## Epic 4 — LLM Service Integration
- Story 4.1: LLM intent+plan output format
  - Acceptance: orchestrator receives structured intent + slots
- Story 4.2: Prompt/tooling policies
  - Acceptance: tool-first policy and safe behavior validated on demo script
- Story 4.3: Multilingual prompt packs
  - Acceptance: responses in correct language after selection

## Epic 5 — Admin Dashboard (Minimum)
- Story 5.1: Metrics endpoint + basic dashboard UI
  - Acceptance: shows counts and language split
- Story 5.2: Records view (sessions/tickets/callbacks)
  - Acceptance: latest interactions visible without manual refresh issues

## Epic 6 — QA + Demo Hardening
- Story 6.1: Automated demo script runner (optional) or manual checklist
  - Acceptance: repeatable runs with expected outputs
- Story 6.2: Latency instrumentation
  - Acceptance: per-turn timing logged and viewable
- Story 6.3: Privacy baseline
  - Acceptance: demo data is synthetic; logs avoid raw PII where feasible

## Epic 7 — Configurable LLM Integration
- Story 7.1: LLM abstraction layer with provider interface
  - Acceptance: OpenAI, Anthropic, Ollama, Mock providers implement common interface
- Story 7.2: Admin UI for LLM configuration
  - Acceptance: admin can select provider, model, API URL/key, temperature, max tokens, enable/disable
- Story 7.3: Database-backed LLM config
  - Acceptance: config persists across restarts, GET/POST /api/llm endpoints
- Story 7.4: Optional LLM-based intent classification
  - Acceptance: falls back to keyword matching when LLM is disabled or errors
- Story 7.5: Optional LLM-based response generation
  - Acceptance: falls back to template responses when LLM is disabled

