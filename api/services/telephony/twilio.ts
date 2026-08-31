import type { TelephonyAdapter, UserInput, AssistantOutput, AdapterEvent, SessionHandle } from "./types.js";

export class TwilioAdapter implements TelephonyAdapter {
  name = "twilio";
  private sessions: Map<string, SessionHandle> = new Map();
  private inputCallback?: (input: UserInput) => void;
  private eventCallback?: (event: AdapterEvent) => void;
  private apiKey?: string;
  private webhookSecret?: string;

  configure(config: { api_key?: string; webhook_secret?: string }): void {
    if (config.api_key) this.apiKey = config.api_key;
    if (config.webhook_secret) this.webhookSecret = config.webhook_secret;
  }

  async startSession(): Promise<SessionHandle> {
    const { randomUUID } = await import("crypto");
    const sessionId = randomUUID();
    const handle: SessionHandle = {
      sessionId,
      channel: "twilio",
      metadata: {
        provider: "twilio",
        twilio_call_sid: null,
      },
    };
    this.sessions.set(sessionId, handle);
    this.eventCallback?.({ type: "session_started", detail: sessionId });
    return handle;
  }

  async endSession(session: SessionHandle): Promise<void> {
    this.sessions.delete(session.sessionId);
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

  receiveInput(_sessionId: string, _input: UserInput): void {
    // Twilio uses webhooks, not direct input
  }
}
