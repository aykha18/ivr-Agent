import type { TelephonyAdapter, UserInput, AssistantOutput, AdapterEvent, SessionHandle } from "./types.js";

interface YeastarCall {
  callId: string;
  state: string;
  caller?: { number: string; name?: string };
}

export class YeastarAdapter implements TelephonyAdapter {
  name = "yeastar";
  private sessions: Map<string, SessionHandle> = new Map();
  private calls: Map<string, YeastarCall> = new Map();
  private inputCallback?: (input: UserInput) => void;
  private eventCallback?: (event: AdapterEvent) => void;
  private apiUrl: string;
  private apiKey: string;
  private webhookSecret?: string;
  private sipTrunkHost?: string;
  private sipTrunkPort: number;
  private sipUsername?: string;
  private sipPassword?: string;
  private outboundCallerId?: string;

  constructor() {
    this.apiUrl = process.env.YEASTAR_API_URL || "http://localhost:8088";
    this.apiKey = process.env.YEASTAR_API_KEY || "";
    this.sipTrunkPort = 5060;
  }

  configure(config: { api_url?: string; api_key?: string; webhook_secret?: string; sip_trunk_host?: string; sip_trunk_port?: number; sip_username?: string; sip_password?: string; outbound_caller_id?: string }): void {
    if (config.api_url) this.apiUrl = config.api_url;
    if (config.api_key) this.apiKey = config.api_key;
    if (config.webhook_secret) this.webhookSecret = config.webhook_secret;
    if (config.sip_trunk_host) this.sipTrunkHost = config.sip_trunk_host;
    if (config.sip_trunk_port) this.sipTrunkPort = config.sip_trunk_port;
    if (config.sip_username) this.sipUsername = config.sip_username;
    if (config.sip_password) this.sipPassword = config.sip_password;
    if (config.outbound_caller_id) this.outboundCallerId = config.outbound_caller_id;
  }

  async startSession(): Promise<SessionHandle> {
    const { randomUUID } = await import("crypto");
    const sessionId = randomUUID();
    const callId = `yeastar-${sessionId.substring(0, 8)}`;

    const handle: SessionHandle = {
      sessionId,
      channel: "yeastar",
      metadata: {
        provider: "yeastar",
        yeastar_call_id: callId,
        api_url: this.apiUrl,
      },
    };

    this.sessions.set(sessionId, handle);
    this.calls.set(sessionId, {
      callId,
      state: "ringing",
    });

    this.eventCallback?.({ type: "session_started", detail: sessionId });
    return handle;
  }

  async endSession(session: SessionHandle): Promise<void> {
    this.sessions.delete(session.sessionId);
    this.calls.delete(session.sessionId);
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

  getCall(sessionId: string): YeastarCall | undefined {
    return this.calls.get(sessionId);
  }

  updateCallState(sessionId: string, state: string): void {
    const call = this.calls.get(sessionId);
    if (call) {
      call.state = state;
    }
  }
}
