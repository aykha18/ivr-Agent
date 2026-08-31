/**
 * This is a API server
 */

import express, {
  type Request,
  type Response,
} from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './routes/auth.js'
import sessionRoutes from './routes/sessions.js'
import conversationRoutes from './routes/conversation.js'
import adminRoutes from './routes/admin.js'
import llmRoutes from './routes/llm.js'
import twilioRoutes from './routes/telephony/twilio.js'
import asteriskRoutes from './routes/telephony/asterisk.js'
import yeastarRoutes from './routes/telephony/yeastar.js'
import { requireApiKey } from './middleware/auth.js'
import rateLimit from 'express-rate-limit'
import { reloadAdaptersFromDb } from './services/telephony/factory.js'
import { createLoggerMiddleware } from './utils/logger.js'

dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(createLoggerMiddleware())

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path.startsWith('/api/admin'),
})

app.use('/api', apiLimiter)

app.use('/api/auth', authRoutes)
app.use('/api/sessions', sessionRoutes)
app.use('/api/sessions', conversationRoutes)
app.use('/api/admin', requireApiKey, adminRoutes)
app.use('/api/llm', requireApiKey, llmRoutes)
app.use('/api/telephony/twilio', twilioRoutes)
app.use('/api/telephony/asterisk', asteriskRoutes)
app.use('/api/telephony/yeastar', yeastarRoutes)

reloadAdaptersFromDb().catch(() => {})

app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'ok',
  })
})

app.use((error: Error, _req: Request, res: Response) => {
  void error
  res.status(500).json({
    success: false,
    error: 'Server internal error',
  })
})

app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

export default app
