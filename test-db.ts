import initSqlJs from "sql.js";

const SQL = await initSqlJs();
const db = new SQL.Database();

db.run(`create table if not exists llm_config (
  config_key text primary key,
  provider text not null,
  model text not null,
  api_url text null,
  api_key text null,
  temperature real not null default 0.7,
  max_tokens integer not null default 256,
  enabled integer not null default 1,
  updated_at text not null
)`);

db.run(
  `insert into llm_config (config_key, provider, model, api_url, api_key, temperature, max_tokens, enabled, updated_at)
   values ('active', :provider, :model, :api_url, :api_key, :temperature, :max_tokens, :enabled, :updated_at)`,
  {
    provider: "gemini",
    model: "gemini-1.5-flash",
    api_url: null,
    api_key: null,
    temperature: 0.7,
    max_tokens: 256,
    enabled: 1,
    updated_at: new Date().toISOString(),
  }
);

const stmt = db.prepare("select * from llm_config");
stmt.step();
const row = stmt.getAsObject();
console.log("DB row:", JSON.stringify(row, null, 2));
stmt.free();
