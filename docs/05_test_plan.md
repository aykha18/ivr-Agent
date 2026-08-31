# Test Plan — Fastest Demo MVP

## 1) Objectives
- Validate the demo flows end-to-end with deterministic outcomes
- Ensure tool-first truth (no fabricated order/ticket states)
- Ensure multilingual language-first selection works across English/Arabic/Urdu
- Capture baseline latency and stability metrics

## 2) Test Types
### 2.1 Unit Tests
- Orchestrator:
  - language selection state transitions
  - intent routing logic
  - tool-first enforcement rules
  - fallback/escalation decision rules
- Adapters:
  - orders tool adapter (mock)
  - ticket tool adapter (mock)
  - WhatsApp tool adapter (mock)

### 2.2 Integration Tests
- Orchestrator + tools:
  - order_lookup success/failure paths
  - ticket_create idempotency behavior (no duplicate tickets on retry)
  - whatsapp_send retries and failure surfaced to user correctly

### 2.3 End-to-End Demo Tests (Scripted)
Run as an automated or manual scripted “demo rehearsal” test.

Scenario A (English Order Tracking)
- Select English
- “Track my order”
- Provide known order number
- Verify:
  - status response matches tool output
  - WhatsApp message sent (real or stub) and logged
  - dashboard metrics updated

Scenario B (Arabic Delivery Issue + Callback)
- Select Arabic
- “My item arrived damaged”
- Provide order identifier
- Verify:
  - ticket created
  - callback created
  - dashboard shows ticket/callback counts

Scenario C (Tool Failure Path)
- Force order_lookup to fail
- Verify:
  - assistant does not guess status
  - assistant offers callback/escalation
  - failure event logged

## 3) Multilingual Validation
- Create a small “golden set” per language:
  - 20–30 utterances per language for top intents
  - include paraphrases and common noisy phrasing
- Validate:
  - intent mapping correctness
  - slot extraction reliability (order number/phone)
  - response fluency and correctness

## 4) Latency Benchmarks (Baseline)
Collect and report:
- end-to-end turn time
- tool latency distribution (p50/p95)
- LLM generation time distribution

Acceptance for MVP demo:
- Demo must feel responsive and stable during the script runs

## 5) Security/Privacy Checks (Baseline)
- Ensure no secrets committed
- Ensure PII is redacted or minimized in logs/events
- Ensure demo dataset is synthetic

