# Telephony Adapters — Enterprise MVP

## 1) Purpose
Define the pluggable telephony adapter interface and provider-specific implementation guides for the enterprise MVP. This enables the orchestrator to remain telephony-agnostic while supporting multiple providers.

## 2) Adapter Interface
All adapters implement the `TelephonyAdapter` interface defined in `api/services/telephony/adapter.ts`:

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

### Types
```typescript
type SessionHandle = {
  sessionId: string;
  channel: TelephonyChannel;
  metadata: Record<string, unknown>;
};

type AssistantOutput = {
  text: string;
  audioRef?: string;
  suggestedActions?: SuggestedAction[];
};

type UserInput = {
  type: "text" | "dtmf" | "audio";
  text?: string;
  dtmf?: string;
  audioRef?: string;
};

type AdapterEvent = {
  type: "session_started" | "session_ended" | "input_received" | "output_sent" | "error";
  detail?: string;
};
```

## 3) Built-in Adapters

### 3.1 Simulator Adapter (Default)
- **Transport**: HTTP + WebSocket (for real-time UI updates)
- **Auth**: None (internal use)
- **Use case**: Demos, testing, development
- **Implementation**: `api/services/telephony/simulator.ts`
- **Validation**: Always passes (no external dependency)

### 3.2 Twilio Adapter
- **Transport**: TwiML (TwiML Bin or dynamic), Webhooks
- **Auth**: Twilio Account SID + Auth Token
- **Use case**: Production PSTN calls via Twilio
- **Config**:
  - `TWILIO_ACCOUNT_SID`
  - `TWILIO_AUTH_TOKEN`
  - `TWILIO_PHONE_NUMBER`
  - `TWILIO_VOICE_WEBHOOK_URL` (public URL for webhooks)
- **Implementation**: `api/services/telephony/twilio.ts`
- **Validation**: `POST /api/admin/telephony/validate` checks Twilio Account SID/Auth Token via REST API

### 3.3 Exotel Adapter
- **Transport**: REST API + Webhooks
- **Auth**: API Key + API Token
- **Use case**: India-focused cloud telephony
- **Config**:
  - `EXOTEL_API_KEY`
  - `EXOTEL_API_TOKEN`
  - `EXOTEL_SID`
  - `EXOTEL_VOICE_WEBHOOK_URL`
- **Implementation**: `api/services/telephony/exotel.ts`

### 3.4 Yeastar Adapter
- **Transport**: REST API + Webhooks
- **Auth**: API Key
- **Use case**: Yeastar PBX / cloud telephony (MyPBX, S-Series, P-Series)
- **Config**:
  - `YEASTAR_API_URL` (default: `http://localhost:8088`)
  - `YEASTAR_API_KEY`
  - `YEASTAR_WEBHOOK_URL` (public URL for webhooks)
- **Endpoints**:
  - `POST /api/telephony/yeastar/call` — Create session from Yeastar call
  - `POST /api/telephony/yeastar/events` — Handle Yeastar events (DTMF, speech)
  - `POST /api/telephony/yeastar/answer` — Mark call as answered
  - `POST /api/telephony/yeastar/hangup` — End session on hangup
- **Implementation**: `api/services/telephony/yeastar.ts`

### 3.4 Yeastar Adapter
- **Transport**: REST API + Webhooks
- **Auth**: API Key
- **Use case**: Yeastar PBX / cloud telephony (MyPBX, S-Series, P-Series) — webhook-only mode
- **Config**:
  - `YEASTAR_API_URL`
  - `YEASTAR_API_KEY`
  - `YEASTAR_WEBHOOK_URL` (public URL for webhooks)
- **Endpoints**:
  - `POST /api/telephony/yeastar/call` — Create session from Yeastar call
  - `POST /api/telephony/yeastar/events` — Handle Yeastar events (DTMF, speech)
  - `POST /api/telephony/yeastar/answer` — Mark call as answered
  - `POST /api/telephony/yeastar/hangup` — End session on hangup
- **Implementation**: `api/services/telephony/yeastar.ts`
- **Validation**: `POST /api/admin/telephony/validate` checks API URL reachability

### 3.5 Asterisk Adapter (SIP Bridge)
- **Transport**: SIP signaling + ARI (Asterisk REST Interface)
- **Auth**: ARI API Key / Basic Auth
- **Use case**: On-premise or self-hosted PBX (Asterisk, FreeSWITCH) acting as SIP bridge to cloud trunks like Yeastar Cloud
- **Config**:
  - `ASTERISK_ARI_URL` — ARI endpoint (e.g. `http://localhost:8088/ari`)
  - `ASTERISK_ARI_APP` — ARI application name (e.g. `ivr-ai`)
  - `ASTERISK_ARI_USER` — ARI username
  - `ASTERISK_ARI_PASSWORD` — ARI password
  - `SIP_TRUNK_HOST` — Cloud SIP trunk host (e.g. `thenodeitdxb.ras.yeastar.com`)
  - `SIP_TRUNK_PORT` — Cloud SIP trunk port (e.g. `5061`)
  - `SIP_USERNAME` / `SIP_PASSWORD` — SIP trunk credentials
- **Channel mapping**: The `sip` session channel is aliased to the Asterisk adapter
- **Implementation**: `api/services/telephony/asterisk.ts`
- **Validation**: `POST /api/admin/telephony/validate` checks ARI `/applications` endpoint with Basic Auth
- **Deployment pattern**: 
  1. Asterisk registers the Yeastar Cloud SIP trunk via `pjsip.conf`
  2. Yeastar Cloud routes inbound/outbound calls to Asterisk via SIP/TLS
  3. Asterisk sends ARI events (`channels/create`, `channelDtmfReceived`, etc.) to this app
  4. This app orchestrates LLM/tools and returns responses; Asterisk plays audio prompts or bridges media

### 3.6 Genesys Adapter
- **Transport**: Genesys Cloud REST API / WebSocket
- **Auth**: OAuth 2.0 / API Key
- **Use case**: Enterprise contact center integration
- **Config**:
  - `GENESYS_CLIENT_ID`
  - `GENESYS_CLIENT_SECRET`
  - `GENESYS_BASE_URL`
  - `GENESYS_DEPLOYMENT_ID`
- **Implementation**: `api/services/telephony/genesys.ts`

## 4) Adapter Configuration
Adapters are selected via the `TELEPHONY_ADAPTER` environment variable:

```bash
# Use Simulator (default)
TELEPHONY_ADAPTER=simulator

# Use Twilio
TELEPHONY_ADAPTER=twilio
TWILIO_ACCOUNT_SID=ACxxxx
TWILIO_AUTH_TOKEN=xxxx
TWILIO_PHONE_NUMBER=+1234567890

# Use Asterisk as SIP Bridge (Option A)
TELEPHONY_ADAPTER=asterisk
ASTERISK_ARI_URL=http://localhost:8088/ari
ASTERISK_ARI_APP=ivr-ai
ASTERISK_ARI_USER=ari
ASTERISK_ARI_PASSWORD=ari
# SIP trunk fields are for Asterisk pjsip.conf registration:
# [yeastar-cloud]
# type=endpoint
# transport=transport-tls
# context=default
# disallow=all
# allow=ulaw,alaw
# aors=yeastar-cloud
# outbound_auth=yeastar-cloud-auth
# [yeastar-cloud-auth]
# auth_type=userpass
# username=6703
# password=4BFfmpq8zt
# [yeastar-cloud]
# type=aor
# contact=thenodeitdxb.ras.yeastar.com:5061

# Use Yeastar (webhook-only, no SIP bridge)
TELEPHONY_ADAPTER=yeastar
YEASTAR_API_URL=https://your-pbx.example.com
YEASTAR_API_KEY=xxxx
YEASTAR_WEBHOOK_URL=https://your-domain.com/api/telephony/yeastar/events
```

## 5) Adapter Lifecycle
1. **Startup**: Orchestrator loads adapter based on config
2. **Session Start**: Adapter creates session, returns handle to orchestrator
3. **Input Handling**: Adapter receives user input, normalizes to `UserInput`, passes to orchestrator
4. **Output Delivery**: Orchestrator returns `AssistantOutput`, adapter delivers to user via provider
5. **Session End**: Adapter cleans up provider resources

## 6) Error Handling
- Adapter errors must not crash the orchestrator
- If an adapter fails, the orchestrator should:
  - Log the error with telemetry
  - Offer escalation or callback to the user
  - Continue operating with degraded functionality if possible
