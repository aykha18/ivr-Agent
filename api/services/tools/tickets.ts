import type { Database } from "sql.js";
import type { Ticket, LanguageCode } from "../../../shared/types.js";
import { createTicket, addEvent } from "../../repositories/store.js";

export interface TicketCreateInput {
  session_id: string;
  language: LanguageCode;
  category: "delivery_issue" | "returns_refunds" | "order_tracking" | "other";
  subcategory?: string;
  description: string;
  order_number?: string;
  phone?: string;
}

export interface TicketCreateOutput {
  ticket_id: string;
  status: "open" | "pending" | "resolved";
  error?: string;
}

export async function createTicketTool(
  db: Database,
  input: TicketCreateInput,
  forceFail: boolean = false,
): Promise<TicketCreateOutput> {
  addEvent(db, input.session_id, "tool_called", { tool: "ticket_create", input });

  try {
    if (forceFail) {
      throw new Error("Ticketing service unavailable");
    }

    const ticket: Omit<Ticket, "ticket_id" | "created_at" | "updated_at"> = {
      session_id: input.session_id,
      category: input.category,
      subcategory: input.subcategory ?? null,
      description: input.description,
      order_number: input.order_number ?? null,
      status: "open",
    };

    const result = createTicket(db, ticket);
    addEvent(db, input.session_id, "ticket_created", {
      ticket_id: result.ticket_id,
      category: result.category,
    });
    addEvent(db, input.session_id, "tool_succeeded", { tool: "ticket_create", ticket_id: result.ticket_id });

    return {
      ticket_id: result.ticket_id,
      status: result.status,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    addEvent(db, input.session_id, "tool_failed", { tool: "ticket_create", error: errorMsg });
    return { ticket_id: "", status: "open", error: errorMsg };
  }
}
