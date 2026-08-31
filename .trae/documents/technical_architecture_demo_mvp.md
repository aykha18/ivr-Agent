## 1. Architecture Design
```mermaid
flowchart LR
  U["User"] --> S["Call Simulator (Web UI)"]
  S --> O["Orchestrator API"]
  O --> L["LLM Inference Service"]
  O --> T["Tool Layer"]
  T --> D["Database (Sessions/Tickets/Callbacks/Events)"]
  T --> W["WhatsApp Business API (Customer-owned)"]
  T --> X["Orders/Returns APIs (Customer-owned)"]
```

## 2. Technology Description
- Frontend: React@18 + tailwindcss@3 + vite
- Initialization Tool: vite-init
- Backend: Express@4 (TypeScript, ESM)
- Database: SQLite for MVP demo (upgrade path to PostgreSQL)
- State: zustand for UI state where needed

## 3. Route Definitions
| Route | Purpose |
|-------|---------|
| / | Call Simulator |
| /agent | Agent Desk (minimal) |
| /admin | Admin Dashboard |

## 4. API Definitions
### 4.1 Sessions
- POST /api/sessions
  - Response: { session_id, next_prompt }
- POST /api/sessions/:sessionId/language
  - Body: { language: "en" | "ar" | "ur" }
- POST /api/sessions/:sessionId/turns
  - Body: { input_type: "text" | "dtmf" | "audio", text?: string, dtmf?: string }
  - Response: { assistant_text, events, suggested_actions }

### 4.2 Actions
- POST /api/sessions/:sessionId/callback
  - Body: { phone?: string, reason: string, preferred_time?: string }

### 4.3 Admin
- GET /api/admin/metrics
- GET /api/admin/records

## 5. Server Architecture Diagram
```mermaid
flowchart TD
  C["API Controllers"] --> S["Services (Orchestrator)"]
  S --> R["Repositories"]
  R --> DB["SQLite DB"]
  S --> LLM["LLM Client"]
  S --> TOOLS["Tools (Orders/Tickets/WhatsApp/Callback)"]
```

## 6. Data Model
### 6.1 Data Model Definition
```mermaid
erDiagram
  SESSION ||--o{ TURN : has
  SESSION ||--o{ TICKET : creates
  SESSION ||--o{ CALLBACK : requests
  SESSION ||--o{ WHATSAPP_MESSAGE : sends
  SESSION ||--o{ EVENT : emits

  SESSION {
    string session_id
    string channel
    string language
    string outcome
    datetime started_at
    datetime ended_at
  }
  TURN {
    string turn_id
    string session_id
    string user_input_type
    string user_text
    string assistant_text
    datetime created_at
  }
  TICKET {
    string ticket_id
    string session_id
    string category
    string description
    string status
    datetime created_at
    datetime updated_at
  }
  CALLBACK {
    string callback_id
    string session_id
    string reason
    string status
    datetime created_at
    datetime updated_at
  }
  WHATSAPP_MESSAGE {
    string message_id
    string session_id
    string message_type
    string status
    datetime created_at
  }
  EVENT {
    string event_id
    string session_id
    string event_type
    datetime created_at
  }
```

### 6.2 Data Definition Language
For MVP, use SQLite migrations that create:
- sessions
- turns
- tickets
- callbacks
- whatsapp_messages
- events

