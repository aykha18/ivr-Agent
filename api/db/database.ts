import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import initSqlJs from "sql.js"

type SqlJsModule = Awaited<ReturnType<typeof initSqlJs>>

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dbFilePath = path.join(__dirname, "demo.db")

let sqlModulePromise: Promise<SqlJsModule> | null = null
let dbPromise: Promise<import("sql.js").Database> | null = null
let writeChain: Promise<void> = Promise.resolve()

function getSqlModule(): Promise<SqlJsModule> {
  if (sqlModulePromise) return sqlModulePromise

  const wasmDir = path.join(process.cwd(), "node_modules", "sql.js", "dist")
  sqlModulePromise = initSqlJs({
    locateFile: (file) => path.join(wasmDir, file),
  })
  return sqlModulePromise
}

async function loadDatabase(): Promise<import("sql.js").Database> {
  const SQL = await getSqlModule()
  if (fs.existsSync(dbFilePath)) {
    const fileBuffer = fs.readFileSync(dbFilePath)
    return new SQL.Database(new Uint8Array(fileBuffer))
  }
  return new SQL.Database()
}

async function initSchema(db: import("sql.js").Database) {
  db.run(`
    create table if not exists sessions (
      session_id text primary key,
      channel text not null,
      language text null,
      outcome text not null,
      context_json text not null,
      started_at text not null,
      ended_at text null
    );

    create table if not exists turns (
      turn_id text primary key,
      session_id text not null,
      user_input_type text not null,
      user_text text null,
      assistant_text text not null,
      tool_calls_json text not null,
      timings_json text not null,
      created_at text not null
    );

    create table if not exists tickets (
      ticket_id text primary key,
      session_id text not null,
      category text not null,
      subcategory text null,
      description text not null,
      order_number text null,
      status text not null,
      created_at text not null,
      updated_at text not null
    );

    create table if not exists callbacks (
      callback_id text primary key,
      session_id text not null,
      phone text null,
      reason text not null,
      preferred_time text null,
      status text not null,
      created_at text not null,
      updated_at text not null
    );

    create table if not exists whatsapp_messages (
      message_id text primary key,
      session_id text not null,
      phone text null,
      message_type text not null,
      template_name text null,
      text text null,
      status text not null,
      created_at text not null
    );

    create table if not exists events (
      event_id text primary key,
      session_id text not null,
      event_type text not null,
      payload_json text not null,
      created_at text not null
    );

    create table if not exists llm_config (
      config_key text primary key,
      provider text not null,
      model text not null,
      api_url text null,
      api_key text null,
      temperature real not null default 0.7,
      max_tokens integer not null default 256,
      enabled integer not null default 1,
      updated_at text not null
    );

    create table if not exists telephony_config (
      config_key text primary key,
      provider text not null default 'yeastar',
      api_url text null,
      api_key text null,
      webhook_secret text null,
      sip_trunk_host text null,
      sip_trunk_port integer not null default 5060,
      sip_username text null,
      sip_password text null,
      outbound_caller_id text null,
      ari_app text null,
      ari_user text null,
      ari_password text null,
      peer_enabled integer not null default 0,
      peer_name text null,
      peer_host text null,
      peer_port integer not null default 5060,
      peer_transport text not null default 'udp',
      peer_codecs text null,
      peer_dtmf text not null default 'rfc4733',
      peer_qualify text null,
      peer_context text not null default 'ivr-ai',
      peer_insecure text null,
      enabled integer not null default 1,
      updated_at text not null
    );

    create table if not exists audit_log (
      log_id text primary key,
      action text not null,
      resource_type text not null,
      resource_id text null,
      old_value text null,
      new_value text null,
      ip_address text null,
      user_agent text null,
      created_at text not null
    );
  `)

  try { db.run('alter table telephony_config add column ari_app text null') } catch {}
  try { db.run('alter table telephony_config add column ari_user text null') } catch {}
  try { db.run('alter table telephony_config add column ari_password text null') } catch {}
  try { db.run('alter table telephony_config add column peer_enabled integer not null default 0') } catch {}
  try { db.run('alter table telephony_config add column peer_name text null') } catch {}
  try { db.run('alter table telephony_config add column peer_host text null') } catch {}
  try { db.run('alter table telephony_config add column peer_port integer not null default 5060') } catch {}
  try { db.run('alter table telephony_config add column peer_transport text not null default \'udp\'') } catch {}
  try { db.run('alter table telephony_config add column peer_codecs text null') } catch {}
  try { db.run('alter table telephony_config add column peer_dtmf text not null default \'rfc4733\'') } catch {}
  try { db.run('alter table telephony_config add column peer_qualify text null') } catch {}
  try { db.run('alter table telephony_config add column peer_context text not null default \'ivr-ai\'') } catch {}
  try { db.run('alter table telephony_config add column peer_insecure text null') } catch {}
}

async function getDbInternal(): Promise<import("sql.js").Database> {
  if (dbPromise) return dbPromise
  dbPromise = (async () => {
    const db = await loadDatabase()
    await initSchema(db)
    await persist(db)
    return db
  })()
  return dbPromise
}

async function persist(db: import("sql.js").Database) {
  const data = db.export()
  await fs.promises.writeFile(dbFilePath, Buffer.from(data))
}

export async function withDb<T>(fn: (db: import("sql.js").Database) => Promise<T> | T): Promise<T> {
  const db = await getDbInternal()
  const result = await fn(db)
  return result
}

export async function withDbWrite<T>(
  fn: (db: import("sql.js").Database) => Promise<T> | T,
): Promise<T> {
  const db = await getDbInternal()
  let out!: T
  writeChain = writeChain.then(async () => {
    out = await fn(db)
    await persist(db)
  })
  await writeChain
  return out
}

