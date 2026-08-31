import type { Database } from "sql.js";
import { createWhatsAppMessage, addEvent } from "../../repositories/store.js";

export interface WhatsAppSendInput {
  phone: string;
  message_type: "template" | "text";
  template_name?: string;
  parameters?: Record<string, unknown>;
  text?: string;
  context: {
    session_id: string;
    ticket_id?: string;
    order_number?: string;
  };
}

export interface WhatsAppSendOutput {
  message_id: string;
  status: "queued" | "sent" | "failed";
  error?: string;
}

export async function sendWhatsApp(
  db: Database,
  input: WhatsAppSendInput,
  forceFail: boolean = false,
): Promise<WhatsAppSendOutput> {
  addEvent(db, input.context.session_id, "tool_called", { tool: "whatsapp_send", phone: input.phone });

  try {
    if (forceFail) {
      throw new Error("WhatsApp API unavailable");
    }

    const message = createWhatsAppMessage(db, {
      session_id: input.context.session_id,
      phone: input.phone,
      message_type: input.message_type,
      template_name: input.template_name ?? null,
      text: input.text ?? null,
      status: "sent",
    });

    addEvent(db, input.context.session_id, "whatsapp_sent", {
      message_id: message.message_id,
      phone: input.phone,
    });
    addEvent(db, input.context.session_id, "tool_succeeded", { tool: "whatsapp_send", message_id: message.message_id });

    return {
      message_id: message.message_id,
      status: message.status,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    addEvent(db, input.context.session_id, "tool_failed", { tool: "whatsapp_send", error: errorMsg });

    createWhatsAppMessage(db, {
      session_id: input.context.session_id,
      phone: input.phone,
      message_type: input.message_type,
      template_name: input.template_name ?? null,
      text: input.text ?? null,
      status: "failed",
    });

    return { message_id: "", status: "failed", error: errorMsg };
  }
}
