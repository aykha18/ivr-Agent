import type { TelephonyAdapter, UserInput, AssistantOutput, AdapterEvent, SessionHandle } from "./types.js";

export class SimulatorAdapter implements TelephonyAdapter {
  name = "simulator";
  private sessions: Map<string, SessionHandle> = new Map();
  private inputCallback?: (input: UserInput) => void;
  private eventCallback?: (event: AdapterEvent) => void;

  async startSession(): Promise<SessionHandle> {
    const { randomUUID } = await import("crypto");
    const sessionId = randomUUID();
    const handle: SessionHandle = {
      sessionId,
      channel: "simulator",
      metadata: {},
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

  receiveInput(sessionId: string, input: UserInput): void {
    this.inputCallback?.(input);
  }
}
