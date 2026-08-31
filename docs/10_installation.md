# IVR AI - Installation Guide

## Prerequisites

- **Node.js** >= 18.x (recommended: 20.x LTS)
- **npm** >= 9.x
- **Git**
- (Optional) **Docker** >= 24.x and **Docker Compose** >= 2.x for containerized deployment

## 1. Clone the Repository

```bash
git clone https://github.com/aykha18/ivr-Agent.git
cd ivr-Agent
```

## 2. Install Dependencies

```bash
npm install
```

## 3. Configure Environment

Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

### Required Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Backend server port | `3001` |
| `ADMIN_API_KEY` | API key for admin endpoints | `admin-secret-key` |
| `TELEPHONY_ADAPTER` | Telephony provider | `simulator` |
| `LLM_PROVIDER` | LLM provider | `mock` |
| `LLM_MODEL` | Model name | `mock-model` |
| `LLM_ENABLED` | Enable LLM responses | `true` |
| `LOG_LEVEL` | Logging verbosity | `info` |

### Telephony Provider Configuration

Choose one provider by setting `TELEPHONY_ADAPTER`:

#### Simulator (default, no external setup)
```env
TELEPHONY_ADAPTER=simulator
```

#### Twilio
```env
TELEPHONY_ADAPTER=twilio
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890
```

#### Asterisk (SIP Bridge)
```env
TELEPHONY_ADAPTER=asterisk
ASTERISK_ARI_URL=http://localhost:8088/ari
ASTERISK_ARI_APP=ivr-ai
ASTERISK_ARI_USER=ari
ASTERISK_ARI_PASSWORD=ari
```

#### Yeastar
```env
TELEPHONY_ADAPTER=yeastar
YEASTAR_API_URL=http://localhost:8088
YEASTAR_API_KEY=your-api-key
YEASTAR_WEBHOOK_URL=https://your-domain.com/api/webhooks/yeastar
```

### LLM Provider Configuration

```env
# Supported: mock | openai | anthropic | ollama | gemini | groq
LLM_PROVIDER=mock
LLM_MODEL=mock-model
LLM_API_URL=https://api.openai.com/v1
LLM_API_KEY=sk-your-api-key
LLM_TEMPERATURE=0.7
LLM_MAX_TOKENS=256
LLM_ENABLED=true
```

## 4. Run the Application

### Development Mode (Frontend + Backend)

```bash
npm run dev
```

This starts:
- **Frontend** (Vite) at `http://localhost:5173`
- **Backend** (Express) at `http://localhost:3001`

### Backend Only

```bash
npm run server:dev
```

### Frontend Only

```bash
npm run client:dev
```

### Production Build

```bash
npm run build
npm run preview
```

## 5. Verify Installation

1. Open `http://localhost:5173` in your browser
2. Navigate to **Admin Dashboard**
3. Check **Connection Status** to verify telephony adapter connectivity
4. Use **Simulator** page to test IVR flows without a real phone line

## 6. Run Tests

```bash
npm test
```

For watch mode:
```bash
npm run test:watch
```

## 7. Docker Deployment (Optional)

### Build and Start

```bash
docker-compose up --build
```

### Access Points

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3001`

### Environment Variables for Docker

Set via `.env` file or environment:

```bash
ADMIN_API_KEY=your-secure-key
TELEPHONY_ADAPTER=simulator
LLM_PROVIDER=mock
```

## 8. Project Structure

```
ivr-Agent/
├── api/                    # Backend (Express + TypeScript)
│   ├── routes/             # API route handlers
│   ├── services/           # Business logic, adapters, tools
│   ├── middleware/         # Auth, validation, webhooks
│   ├── db/                 # SQLite database layer
│   └── server.ts           # Entry point
├── src/                    # Frontend (React + TypeScript)
│   ├── pages/              # Page components
│   ├── stores/             # Zustand state management
│   └── lib/                # Utilities, i18n, LLM config
├── shared/                 # Shared TypeScript types
├── tests/                  # Vitest test suite
├── docs/                   # Documentation
├── Dockerfile              # Backend production image
├── Dockerfile.frontend     # Frontend production image
└── docker-compose.yml      # Multi-service orchestration
```

## 9. Common Issues

### Port Already in Use

```bash
# Change PORT in .env
PORT=3002 npm run server:dev
```

### Database Locked

Delete `api/db/demo.db` and restart the server. The database will be recreated automatically.

### TypeScript Errors

```bash
npm run check
```

### Frontend Not Connecting to Backend

Ensure `VITE_API_URL` is set correctly in `.env` if using a custom backend URL.

## 10. Next Steps

1. Configure your telephony provider in the **Admin Dashboard**
2. Set up webhook endpoints for Twilio/Asterisk/Yeastar
3. Test IVR flows using the **Simulator** page
4. Review `docs/08_telephony_adapters.md` for provider-specific setup

## Support

For issues and questions, visit: https://github.com/aykha18/ivr-Agent
