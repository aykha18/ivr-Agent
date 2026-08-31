# MVP Improvement Roadmap

## 1) Executive Summary
The current MVP is functional but has critical gaps in security, testing, and production readiness. This document prioritizes improvements to make the system demo-ready, secure, and maintainable.

---

## 2) Critical Issues (P0 — Fix Before Any Demo)

### 2.1 No Authentication/Authorization
- **Issue**: All API endpoints are completely open. Anyone can access admin endpoints, create sessions, modify LLM config.
- **Impact**: Complete security bypass possible.
- **Fix**: Add simple API key or JWT for admin endpoints. Protect `/api/llm`, `/api/admin/*`.
- **Effort**: Low (1-2 hours)

### 2.2 No Webhook Signature Validation
- **Issue**: Twilio/Asterisk/Yeastar webhooks accept any request without signature verification.
- **Impact**: Spoofed webhooks can manipulate sessions.
- **Fix**: 
  - Twilio: Verify `X-Twilio-Signature` using `twilio` npm package
  - Asterisk/Yeastar: Add shared secret validation
- **Effort**: Low (2-3 hours)

### 2.3 No Input Validation
- **Issue**: `req.body.text` used directly without sanitization. No length limits, no injection prevention.
- **Impact**: Potential XSS, SQL injection (though parameterized queries help), DoS via large payloads.
- **Fix**: Add Zod or similar schema validation for all request bodies. Add text length limits.
- **Effort**: Low (2-3 hours)

### 2.4 No Error Logging
- **Issue**: No structured logging. Errors are caught and swallowed with generic messages.
- **Impact**: Impossible to debug production issues.
- **Fix**: Add Winston or Pino logger. Log errors with context, stack traces, request IDs.
- **Effort**: Low (1-2 hours)

### 2.5 Zero Automated Tests
- **Issue**: No unit tests, integration tests, or E2E tests. `05_test_plan.md` exists but no test files.
- **Impact**: No regression safety net; changes break things silently.
- **Fix**: Add 10+ unit tests covering:
  - Intent classification
  - Tool adapters (order lookup, ticket creation)
  - Orchestrator state machine
  - LLM provider factory
- **Effort**: Medium (4-6 hours)

---

## 3) High Priority (P1 — Before First Real Customer)

### 3.1 Implement Real LLM Response Generation
- **Issue**: `generateResponseWithLlm()` exists but is never called. All responses are hardcoded templates.
- **Impact**: The "AI" in IVR-AI is mostly cosmetic.
- **Fix**: Wire `generateResponseWithLlm()` into orchestrator with template fallback.
- **Effort**: Medium (3-4 hours)

### 3.2 Add Database Migrations
- **Issue**: Schema changes require manual DB deletion. No versioned migrations.
- **Impact**: Data loss on schema changes, no rollback capability.
- **Fix**: Use `umzug` or custom migration system for SQLite.
- **Effort**: Medium (3-4 hours)

### 3.3 Add Docker & Docker Compose
- **Issue**: No containerization. Deployment is manual.
- **Impact**: Inconsistent environments, hard to scale.
- **Fix**: Create `Dockerfile` + `docker-compose.yml` with backend, frontend, and DB.
- **Effort**: Low (2-3 hours)

### 3.4 Add Frontend Error Boundaries
- **Issue**: No React error boundaries. Crashes show white screen.
- **Impact**: Poor user experience, hard to debug.
- **Fix**: Add error boundaries to Simulator, Agent Desk, Admin Dashboard.
- **Effort**: Low (1-2 hours)

### 3.5 Add Rate Limiting
- **Issue**: No rate limiting on any endpoint.
- **Impact**: API abuse, DoS vulnerability.
- **Fix**: Add `express-rate-limit` with appropriate limits per endpoint.
- **Effort**: Low (1 hour)

---

## 4) Medium Priority (P2 — Before Scale)

### 4.1 Refactor Orchestrator
- **Issue**: `handleIntent()` is 300+ lines with deeply nested state machines.
- **Impact**: Hard to test, maintain, or extend with new intents.
- **Fix**: Extract dialog manager, tool executor, response builder into separate modules.
- **Effort**: High (1-2 days)

### 4.2 Add WebSocket for Real-time Updates
- **Issue**: Admin dashboard polls every 5 seconds regardless of changes.
- **Impact**: Wasted resources, delayed updates.
- **Fix**: Add WebSocket (Socket.io or native) for real-time session events.
- **Effort**: Medium (4-6 hours)

### 4.3 Add Metrics Export
- **Issue**: No Prometheus/metrics endpoint. Per-turn timings captured but not analyzed.
- **Impact**: No visibility into system performance.
- **Fix**: Add `/metrics` endpoint with turn latencies, error rates, adapter stats.
- **Effort**: Medium (3-4 hours)

### 4.4 Add Session State Recovery
- **Issue**: Refresh loses session state. No URL-based session sharing.
- **Impact**: Poor UX for testing/demos.
- **Fix**: Store session state in localStorage + URL params for sharing.
- **Effort**: Medium (2-3 hours)

---

## 5) Low Priority (P3 — Nice to Have)

### 5.1 Add E2E Tests
- Playwright or Cypress for full user journeys
- **Effort**: High (2-3 days)

### 5.2 Add Feature Flags
- Gradual rollout of LLM features, A/B testing capability
- **Effort**: Medium (1 day)

### 5.3 Add Admin Audit Log
- Track who changed what config when
- **Effort**: Medium (3-4 hours)

### 5.4 Add Frontend i18n
- Currently only backend responses are multilingual. UI itself is English-only.
- **Effort**: High (1-2 days)

---

## 6) Quick Wins (< 1 Day Each)

| Improvement | Effort | Impact | Priority |
|-------------|--------|--------|----------|
| Add `npm run test` script + 10 unit tests | Low | High | P0 |
| Add `.env.example` with all config vars | Low | High | P1 |
| Add API key auth for admin routes | Low | High | P0 |
| Add Zod validation for request bodies | Low | Medium | P0 |
| Add Dockerfile + docker-compose.yml | Low | High | P1 |
| Replace console.log with Pino logger | Low | Medium | P0 |
| Add frontend error boundaries | Low | Medium | P1 |
| Add loading states to Simulator UI | Low | Medium | P2 |

---

## 7) Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| No auth on admin endpoints | **Critical** | Add API key auth immediately |
| No webhook validation | **Critical** | Add signature verification |
| No automated tests | **High** | Add 10+ unit tests this week |
| LLM integration is cosmetic | **Medium** | Wire response generation or remove feature |
| SQLite single-writer bottleneck | **Medium** | Document limitation; plan PostgreSQL |
| Plaintext secrets in DB | **Medium** | Encrypt `api_key` field at minimum |
| No error handling strategy | **Medium** | Add structured logging + error tracking |
| Frontend polling inefficiency | **Low** | Replace with WebSocket when scaling |

---

## 8) Recommended Action Plan

### Week 1 (P0)
1. Day 1: Add API key auth for admin endpoints
2. Day 2: Add webhook signature validation (Twilio + shared secret)
3. Day 3: Add Zod input validation + `.env.example`
4. Day 4: Add Pino logger + error tracking
5. Day 5: Add 10 unit tests

### Week 2 (P1)
1. Day 1: Wire LLM response generation into orchestrator
2. Day 2: Add database migrations
3. Day 3: Add Dockerfile + docker-compose
4. Day 4: Add frontend error boundaries
5. Day 5: Add rate limiting

### Week 3 (P2)
1. Start orchestrator refactor
2. Add WebSocket for real-time updates
3. Add metrics export

### Week 4 (P3)
1. Add E2E tests
2. Add feature flags
3. Add audit log
4. Add frontend i18n

---

## 9) Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Test coverage | 0% | >70% |
| API endpoint auth coverage | 0% | 100% |
| Webhook validation | 0% | 100% |
| Error logging coverage | ~20% | 100% |
| LLM feature utilization | 50% (intent only) | 100% (intent + response) |
| Frontend error boundaries | 0% | 100% |
| Build time | ~3s | <5s |
| Turn latency (p95) | Unknown | <2s |

---

## 10) Appendix: Current State Assessment

### What Works Well
- Clean adapter pattern for telephony providers
- Tool-first truth enforcement for order/ticket data
- Multilingual i18n templates
- Admin dashboard with metrics visualization
- SQLite persistence with export

### What Needs Immediate Attention
- Security: auth, webhook validation, input sanitization
- Testing: zero automated tests
- Observability: no structured logging
- LLM: only 50% integrated (intent only, no response generation)

---

*Document generated: 2026-08-10*
