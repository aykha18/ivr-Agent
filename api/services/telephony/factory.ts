import type { TelephonyAdapter, TelephonyChannel } from "./types.js";
import { SimulatorAdapter } from "./simulator.js";
import { TwilioAdapter } from "./twilio.js";
import { AsteriskAdapter } from "./asterisk.js";
import { YeastarAdapter } from "./yeastar.js";
import { withDb } from "../../db/database.js";
import { getTelephonyConfig, upsertTelephonyConfig } from "../../repositories/store.js";

export type TelephonyConfig = {
  provider: "simulator" | "twilio" | "asterisk" | "yeastar";
  api_url?: string;
  api_key?: string;
  webhook_secret?: string;
  sip_trunk_host?: string;
  sip_trunk_port: number;
  sip_username?: string;
  sip_password?: string;
  outbound_caller_id?: string;
  ari_app?: string;
  ari_user?: string;
  ari_password?: string;
  peer_enabled: boolean;
  peer_name?: string;
  peer_host?: string;
  peer_port: number;
  peer_transport: string;
  peer_codecs?: string;
  peer_dtmf: string;
  peer_qualify?: string;
  peer_context: string;
  peer_insecure?: string;
  enabled: boolean;
};

const ADAPTERS: Record<TelephonyChannel, TelephonyAdapter> = {
  simulator: new SimulatorAdapter(),
  twilio: new TwilioAdapter(),
  exotel: null as unknown as TelephonyAdapter,
  sip: new AsteriskAdapter(),
  genesys: null as unknown as TelephonyAdapter,
  asterisk: new AsteriskAdapter(),
  yeastar: new YeastarAdapter(),
};

let currentAdapter: TelephonyAdapter | null = null;

export function getAdapter(channel: TelephonyChannel): TelephonyAdapter {
  if (!ADAPTERS[channel]) {
    throw new Error(`Unsupported telephony channel: ${channel}`);
  }
  if (!currentAdapter) {
    currentAdapter = ADAPTERS[channel];
  }
  return currentAdapter;
}

export function setAdapter(channel: TelephonyChannel, adapter: TelephonyAdapter): void {
  ADAPTERS[channel] = adapter;
  currentAdapter = adapter;
}

export function getCurrentAdapter(): TelephonyAdapter {
  if (!currentAdapter) {
    currentAdapter = ADAPTERS.simulator;
  }
  return currentAdapter;
}

export function getConfiguredAdapter(): TelephonyAdapter {
  return getCurrentAdapter();
}

export function resetAdapter(): void {
  currentAdapter = null;
}

export async function reloadAdaptersFromDb(): Promise<void> {
  try {
    const config = await loadTelephonyConfig();
    const adapter = getAdapter(config.provider);
    if (adapter && typeof (adapter as unknown as { configure?: (c: unknown) => void }).configure === "function") {
      (adapter as unknown as { configure: (c: unknown) => void }).configure(config);
    }
    currentAdapter = adapter;
  } catch {
    // keep existing adapters if DB read fails
  }
}

export async function loadTelephonyConfig(): Promise<TelephonyConfig> {
  return withDb(async (db) => {
    return getTelephonyConfig(db);
  });
}

export async function saveTelephonyConfig(config: TelephonyConfig): Promise<TelephonyConfig> {
  return withDb(async (db) => {
    upsertTelephonyConfig(db, config);
    return getTelephonyConfig(db);
  });
}
