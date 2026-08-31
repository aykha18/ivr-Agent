import type { Request, Response, NextFunction } from "express";

const isTest = process.env.NODE_ENV === "test" || process.env.VITEST === "true";

let logger: any;
try {
  const pino = (await import("pino")).default;
  logger = pino({
    level: process.env.LOG_LEVEL || "info",
    transport: isTest ? undefined : (process.env.NODE_ENV === "development" ? {
      target: "pino-pretty",
      options: { colorize: true, translateTime: "SYS:standard", ignore: "pid,hostname" },
    } : undefined),
    redact: ["api_key", "webhook_secret", "sip_password", "password", "authorization"],
  });
} catch {
  logger = {
    info: () => {},
    error: () => {},
    warn: () => {},
    debug: () => {},
    trace: () => {},
    fatal: () => {},
  };
}

export { logger };

export function createLoggerMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on("finish", () => {
      const duration = Date.now() - start;
      logger.info({
        method: req.method,
        url: req.url,
        status: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip,
      }, "HTTP request");
    });
    next();
  };
}
