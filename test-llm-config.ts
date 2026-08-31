import { withDbWrite } from "./api/db/database.ts";
import { upsertLlmConfig, getLlmConfig } from "./api/repositories/store.ts";

withDbWrite(async (db) => {
  upsertLlmConfig(db, {
    provider: "gemini",
    model: "gemini-3.5-flash",
    api_url: "https://example.com",
    api_key: "test-key",
    temperature: 0.5,
    maxTokens: 1024,
    enabled: true,
  });
  const config = getLlmConfig(db);
  console.log("Saved config:", JSON.stringify(config, null, 2));
});
