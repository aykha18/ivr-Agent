import fs from "fs";
import initSqlJs from "sql.js";

const dbPath = "api/db/demo.db";
if (!fs.existsSync(dbPath)) {
  console.log("Database file does not exist");
  process.exit(0);
}

const SQL = await initSqlJs();
const fileBuffer = fs.readFileSync(dbPath);
const db = new SQL.Database(new Uint8Array(fileBuffer));

const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table'");
console.log("Tables:", JSON.stringify(tables, null, 2));

const llmConfig = db.exec("SELECT * FROM llm_config");
console.log("LLM config:", JSON.stringify(llmConfig, null, 2));

db.close();
