export type TelephonyChannel = "simulator" | "twilio" | "exotel" | "sip" | "genesys" | "asterisk" | "yeastar";

export type InputType = "text" | "dtmf" | "audio";

export interface UserInput {
  type: InputType;
  text?: string;
  dtmf?: string;
  audioRef?: string;
}

export interface AssistantOutput {
  text: string;
  audioRef?: string;
  suggestedActions?: SuggestedAction[];
}

export interface SuggestedAction {
  type: "continue_on_whatsapp" | "request_callback";
  label: string;
}

export type AdapterEventType = "session_started" | "session_ended" | "input_received" | "output_sent" | "error";

export interface AdapterEvent {
  type: AdapterEventType;
  detail?: string;
}

export interface SessionHandle {
  sessionId: string;
  channel: TelephonyChannel;
  metadata: Record<string, unknown>;
}

export interface TelephonyAdapter {
  name: string;
  startSession(): Promise<SessionHandle>;
  endSession(session: SessionHandle): Promise<void>;
  sendOutput(session: SessionHandle, output: AssistantOutput): Promise<void>;
  onInput(callback: (input: UserInput) => void): void;
  onEvent(callback: (event: AdapterEvent) => void): void;
  receiveInput(sessionId: string, input: UserInput): void;
  updateChannelState?(channelId: string, state: string): void;
  updateCallState?(callId: string, state: string): void;
  getChannel?(sessionId: string): { id: string; state: string; caller?: { number: string; name?: string } } | undefined;
  getCall?(sessionId: string): { callId: string; state: string; caller?: { number: string; name?: string } } | undefined;
}
