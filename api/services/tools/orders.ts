import type { LanguageCode } from "../../../shared/types.js";
import type { Database } from "sql.js";
import { addEvent } from "../../repositories/store.js";

export interface OrderLookupInput {
  order_number?: string;
  phone?: string;
  language: LanguageCode;
}

export interface OrderLookupOutput {
  found: boolean;
  order?: {
    order_number: string;
    status: "processing" | "shipped" | "delivered" | "unknown";
    carrier?: string;
    tracking_url?: string;
    eta?: string;
    phone?: string;
  };
  error?: string;
}

interface DemoOrder {
  order_number: string;
  status: "processing" | "shipped" | "delivered";
  carrier: string;
  tracking_url: string;
  eta: string;
  phone: string;
}

const DEMO_ORDERS: Record<string, DemoOrder> = {
  "ORD-10001": {
    order_number: "ORD-10001",
    status: "shipped",
    carrier: "FedEx",
    tracking_url: "https://track.example.com/ORD-10001",
    eta: "2026-08-08",
    phone: "+15550123",
  },
  "ORD-10002": {
    order_number: "ORD-10002",
    status: "delivered",
    carrier: "DHL",
    tracking_url: "https://track.example.com/ORD-10002",
    eta: "2026-08-01",
    phone: "+15550456",
  },
  "ORD-10003": {
    order_number: "ORD-10003",
    status: "processing",
    carrier: "UPS",
    tracking_url: "https://track.example.com/ORD-10003",
    eta: "2026-08-12",
    phone: "+15550789",
  },
};

export async function orderLookup(
  db: Database,
  input: OrderLookupInput,
  sessionId: string,
  forceFail: boolean = false,
): Promise<OrderLookupOutput> {
  addEvent(db, sessionId, "tool_called", { tool: "order_lookup", input });

  try {
    if (process.env.ORDER_API_FORCE_FAIL === "true" || forceFail) {
      throw new Error("API timeout");
    }

    if (!input.order_number && !input.phone) {
      addEvent(db, sessionId, "tool_failed", { tool: "order_lookup", error: "No order number or phone provided" });
      return { found: false, error: "No order identifier provided" };
    }

    let order: DemoOrder | undefined;

    if (input.order_number) {
      order = DEMO_ORDERS[input.order_number.toUpperCase()];
    }

    if (!order && input.phone) {
      const normalizedPhone = input.phone.replace(/\s+/g, "");
      order = Object.values(DEMO_ORDERS).find((o) => o.phone.replace(/\s+/g, "") === normalizedPhone);
    }

    if (!order) {
      addEvent(db, sessionId, "tool_succeeded", { tool: "order_lookup", found: false });
      return { found: false };
    }

    addEvent(db, sessionId, "tool_succeeded", { tool: "order_lookup", found: true, order_number: order.order_number });

    return {
      found: true,
      order: {
        order_number: order.order_number,
        status: order.status,
        carrier: order.carrier,
        tracking_url: order.tracking_url,
        eta: order.eta,
        phone: order.phone,
      },
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    addEvent(db, sessionId, "tool_failed", { tool: "order_lookup", error: errorMsg });
    return { found: false, error: errorMsg };
  }
}
