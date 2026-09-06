# MVP Improvement Roadmap

## 1) Executive Summary
This document tracks remaining work to make the IVR-AI MVP production-ready. Items marked **Done** are already implemented. Items marked **Remaining** still need work.

---

## 2) Completed Items (Already Implemented)

### P0 — Critical (Done)
- ✅ **API key auth** — `ADMIN_API_KEY` protects `/api/admin/*` and `/api/llm` via `requireApiKey` middleware
- ✅ **Zod input validation** — All major request bodies validated with length limits
- ✅ **Pino structured logging** — `api/utils/logger.ts` with redaction and request logging middleware
- ✅ **Rate limiting** — `express-rate-limit` on all `/api` routes, admin routes skipped
- ✅ **Frontend error boundaries** — `src/components/ErrorBoundary.tsx` exists
- ✅ **37 automated tests** — Vitest suite covering store, intent, orchestrator, LLM, tickets, orders, webhooks, metrics, admin, audit
- ✅ **Docker + Docker Compose** — `Dockerfile`, `Dockerfile.frontend`, `docker-compose.yml`
- ✅ **Webhook signature validation middleware** — `api/middleware/webhook.ts` has Twilio signature and shared secret validators
- ✅ **Admin audit log** — Backend stores audit logs; `/api/admin/audit` endpoint exists
- ✅ **Prometheus metrics** — `/api/admin/metrics/prometheus` endpoint exists
- ✅ **Peer trunk config UI** — Admin Dashboard has Peer Trunk section for direct IP-to-IP testing
- ✅ **LLM response generation wired** — `generateResponseWithLlm` called in orchestrator when LLM enabled
- ✅ **Session state recovery** — Simulator supports URL-based session sharing via `?session=` param
- ✅ **Error handling strategy** — Structured errors with events; tool failures surface to user

---

## 3) Remaining Implementation Gaps (Excluding PostgreSQL)

### High Priority (P1)

| # | Item | Effort | Notes |
|---|------|--------|-------|
| 1 | **Webhook signature validation in routes** | Low | Middleware exists but Twilio/Yeastar/Asterisk routes don't apply it yet |
| 2 | **Exotel adapter** | Medium | Channel reserved but factory returns null stub |
| 3 | **Genesys adapter** | Medium | Channel reserved but factory returns null stub |
| 4 | **Real WhatsApp WABA integration** | Medium | Currently simulated (logs to DB only); needs actual WABA client |
| 5 | **Real order/returns API integration** | Medium | Currently uses mock data; needs customer API endpoint |
| 6 | **Orchestrator refactor** | High | `handleIntent` is 300+ lines; extract dialog manager, tool executor, response builder |
| 7 | **Admin audit log UI** | Low | Backend exists; frontend view not built in Admin Dashboard |
| 8 | **Frontend i18n** | High | UI is English-only; backend responses are multilingual |
| 9 | **E2E tests** | High | No Playwright/Cypress tests for full user journeys |
| 10 | **Feature flags** | Medium | No gradual rollout or A/B testing capability |
| 11 | **WebSocket for real-time updates** | Medium | Admin dashboard polls every 5s; WebSocket would reduce latency |

### Medium Priority (P2)

| # | Item | Effort | Notes |
|---|------|--------|-------|
| 12 | **Database migrations** | Medium | Schema changes require manual DB deletion; need `umzug` or custom migration system |
| 13 | **Metrics export / analysis** | Medium | Prometheus endpoint exists but no Grafana dashboard or alerting |
| 14 | **Session state recovery** | Low | Partial: URL param sharing works, but localStorage persistence and recovery across refresh is incomplete |
| 15 | **Real ASR/TTS integration** | High | Currently text-only; real telephony needs speech-to-text and text-to-speech |
| 16 | **Multi-tenant support** | High | Single-tenant only; no org isolation |
| 17 | **PII encryption in DB** | Medium | `api_key` and other sensitive fields stored as plaintext |

### Low Priority (P3)

| # | Item | Effort | Notes |
|---|------|--------|-------|
| 18 | **E2E demo script runner** | Medium | Manual checklist exists but no automated runner |
| 19 | **Frontend loading states** | Low | Simulator has loading states but could be more comprehensive |
| 20 | **Call recording support** | High | Not in scope for MVP |
| 21 | **SSO/SAML authentication** | High | Not in scope for MVP |
| 22 | **Workforce management** | High | Not in scope for MVP |

---

## 4) Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| Webhook validation not applied in routes | **High** | Apply existing middleware to Twilio/Yeastar/Asterisk webhook routes |
| Exotel/Genesys stubs will crash if selected | **Medium** | Hide from UI or implement basic adapters |
| Orchestrator monolith | **Medium** | Refactor before adding more intents/tools |
| No real WhatsApp/Order API | **Medium** | Required for production; currently simulated |
| SQLite single-writer | **Medium** | Document limitation; plan PostgreSQL migration |
| Plaintext secrets in DB | **Medium** | Encrypt sensitive fields |
| No E2E tests | **Medium** | Add Playwright for critical demo journeys |
| Frontend English-only | **Low** | Add i18n framework (react-i18next) |

---

## 5) Recommended Next Steps

1. **Apply webhook validation middleware** to existing telephony routes
2. **Implement Exotel adapter** or remove from factory/docs
3. **Implement Genesys adapter** or remove from factory/docs
4. **Wire real WhatsApp WABA client** (or keep simulated if not needed)
5. **Connect real order API** with fallback to mock data
6. **Refactor orchestrator** into smaller modules
7. **Build admin audit log UI** component
8. **Add E2E tests** for the three demo journeys

---

*Document generated: 2026-09-06*
