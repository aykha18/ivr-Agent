import type { TelephonyAdapter, UserInput, AssistantOutput, AdapterEvent, SessionHandle } from "./types.js";

interface AsteriskChannel {
  id: string;
  state: string;
  caller?: { number: string; name?: string };
}

export class AsteriskAdapter implements TelephonyAdapter {
  name = "asterisk";
  private sessions: Map<string, SessionHandle> = new Map();
  private channels: Map<string, AsteriskChannel> = new Map();
  private inputCallback?: (input: UserInput) => void;
  private eventCallback?: (event: AdapterEvent) => void;
  private baseUrl: string;
  private appName: string;
  private webhookSecret?: string;
  private ariUser?: string;
  private ariPassword?: string;

  constructor() {
    this.baseUrl = process.env.ASTERISK_ARI_URL || "http://localhost:8088/ari";
    this.appName = process.env.ASTERISK_ARI_APP || "ivr-ai";
    this.ariUser = process.env.ASTERISK_ARI_USER || undefined;
    this.ariPassword = process.env.ASTERISK_ARI_PASSWORD || undefined;
  }

  configure(config: { api_url?: string; webhook_secret?: string; ari_app?: string; ari_user?: string; ari_password?: string }): void {
    if (config.api_url) this.baseUrl = config.api_url;
    if (config.webhook_secret) this.webhookSecret = config.webhook_secret;
    if (config.ari_app) this.appName = config.ari_app;
    if (config.ari_user) this.ariUser = config.ari_user;
    if (config.ari_password) this.ariPassword = config.ari_password;
  }

  async startSession(): Promise<SessionHandle> {
    const { randomUUID } = await import("crypto");
    const sessionId = randomUUID();
    const channelId = `${this.appName}-${sessionId.substring(0, 8)}`;
    
    const handle: SessionHandle = {
      sessionId,
      channel: "asterisk",
      metadata: {
        provider: "asterisk",
        asterisk_channel_id: channelId,
        ari_base_url: this.baseUrl,
      },
    };

    this.sessions.set(sessionId, handle);
    this.channels.set(sessionId, {
      id: channelId,
      state: "ringing",
    });

    this.eventCallback?.({ type: "session_started", detail: sessionId });
    return handle;
  }

  async endSession(session: SessionHandle): Promise<void> {
    this.sessions.delete(session.sessionId);
    this.channels.delete(session.sessionId);
    this.eventCallback?.({ type: "session_ended", detail: session.sessionId });
  }

  async sendOutput(session: SessionHandle, output: AssistantOutput): Promise<void> {
    this.eventCallback?.({ type: "output_sent", detail: output.text.substring(0, 50) });
  }

  onInput(callback: (input: UserInput) => void): void {
    this.inputCallback = callback;
  }

  onEvent(callback: (event: AdapterEvent) => void): void {
    this.eventCallback = callback;
  }

  receiveInput(sessionId: string, input: UserInput): void {
    this.inputCallback?.(input);
  }

  getChannel(sessionId: string): AsteriskChannel | undefined {
    return this.channels.get(sessionId);
  }

  updateChannelState(sessionId: string, state: string): void {
    const channel = this.channels.get(sessionId);
    if (channel) {
      channel.state = state;
    }
  }
}
