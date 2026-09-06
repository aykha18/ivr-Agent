# Implementation Gaps

This document lists features and integrations that are **not yet implemented** in the current codebase, excluding PostgreSQL migration work.

## 1. Adapters Not Implemented

| Adapter | Status | Notes |
|---------|--------|-------|
| Exotel | **Stub only** | Factory returns `null`; selecting `exotel` channel throws at runtime |
| Genesys | **Stub only** | Factory returns `null`; selecting `genesys` channel throws at runtime |

## 2. Telephony Webhooks Not Validated

- Twilio webhook routes (`/api/telephony/twilio/events`) accept requests without signature verification
- Yeastar webhook routes (`/api/telephony/yeastar/events`) accept requests without shared-secret validation
- Asterisk webhook routes (`/api/telephony/asterisk/events`) accept requests without shared-secret validation
- The middleware exists in `api/middleware/webhook.ts` but is not applied in route definitions

## 3. External Integrations Not Wired

| Integration | Current State | Needed |
|-------------|---------------|--------|
| WhatsApp WABA | Simulated (logs to DB) | Real WABA client or keep simulated |
| Order/Returns API | Mock data in `api/services/tools/orders.ts` | Customer API endpoint + auth |
| Ticketing CRM | Internal DB store | Optional external CRM integration |

## 4. Frontend Gaps

| Feature | Status | Notes |
|---------|--------|-------|
| Admin Audit Log UI | Missing | Backend `/api/admin/audit` exists; no frontend view |
| Frontend i18n | Missing | UI is English-only; backend responses are multilingual |
| Real-time WebSocket | Missing | Admin dashboard polls every 5 seconds |
| Session recovery | Partial | URL param sharing works; localStorage persistence incomplete |

## 5. Code Quality Gaps

| Item | Status | Notes |
|------|--------|-------|
| Orchestrator refactor | Needed | `handleIntent` is 300+ lines; extract dialog manager, tool executor, response builder |
| E2E tests | Missing | No Playwright/Cypress tests for demo journeys |
| Feature flags | Missing | No gradual rollout or A/B testing capability |
| Database migrations | Missing | Schema changes require manual DB deletion |

## 6. Security Gaps

| Item | Status | Notes |
|------|--------|-------|
| PII encryption | Missing | `api_key` and sensitive fields stored as plaintext |
| Secret scanning | Needed | Ensure no secrets committed; demo.db already removed from git |

## 7. Observability Gaps

| Item | Status | Notes |
|------|--------|-------|
| Grafana dashboard | Missing | Prometheus metrics endpoint exists but no visualization |
| Alerting | Missing | No alerts for errors, latency spikes, or adapter failures |
| Latency analysis | Missing | Per-turn timings logged but not aggregated or visualized |
