# Delivery Plan — Fastest Demo MVP

## 1) Delivery Strategy
Deliver the fastest demo MVP with simulated telephony first. Keep review gates where absolutely necessary to avoid rework and demo risk.

## 2) Phases and Review Gates
### Phase 0 — Inputs Freeze (Gate A)
Outputs:
- Confirm languages: English/Arabic/Urdu
- Confirm demo journeys: Order Tracking, Delivery Issue + Callback, Admin dashboard
- Confirm WhatsApp demo mode:
  - real WABA vs simulated send

Gate A acceptance:
- PRD and demo script approved
- API contracts approved (at least the shape)

### Phase 1 — Foundations (Gate B)
Outputs:
- Session + language selection working end-to-end
- Orchestrator skeleton with tool interface
- Simulator UI basic flow
- Minimal data store and event logging

Gate B acceptance:
- Language-first selection demonstrated
- One “hello world” intent handled with stable logs

### Phase 2 — Demo Journeys (Gate C)
Outputs:
- Order tracking journey end-to-end using:
  - customer API if ready, else demo dataset
- Delivery issue → ticket create → callback request
- Admin dashboard shows metrics from real interactions

Gate C acceptance:
- Demo script runs without manual intervention
- Tool-first truth enforced in failure mode

### Phase 3 — WhatsApp Continuity (Gate D)
Outputs:
- WhatsApp send integrated (real or simulated)
- Ticket update/tracking link message sent and logged

Gate D acceptance:
- WhatsApp send visible and deterministic in demo run

### Phase 4 — Demo Hardening (Gate E)
Outputs:
- Reliability hardening for demo day
- Test script checklist + rehearsal results
- Basic performance logging summary

Gate E acceptance:
- Three consecutive “clean” demo rehearsals

## 3) Customer Prerequisites
- Provide preferred provider for second demo real integration (if needed)
- Provide:
  - WABA credentials and webhook endpoint details (or sandbox)
  - template names and approval status (if template messages are required)
  - order/returns API endpoints and auth details for staging
- Provide compliance requirements (recording, retention, data residency)

## 4) Optional MVP-2 (Second Demo with Real Telephony)
Trigger:
- Customer requests real call experience after MVP-1 demo

Scope:
- Implement one telephony adapter (the chosen provider)
- Keep orchestrator unchanged; swap simulator adapter for provider adapter

