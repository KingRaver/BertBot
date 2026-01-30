import pino from "pino";

const isDevelopment = process.env.NODE_ENV !== "production";
const isDebug = process.env.DEBUG === "true";

const pinoLogger = pino({
  level: isDebug ? "debug" : isDevelopment ? "info" : "warn",
  transport: isDevelopment
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "HH:MM:ss.l",
          ignore: "pid,hostname",
          singleLine: false,
          messageFormat: "{msg}"
        }
      }
    : undefined,
  formatters: {
    level: (label) => {
      return { level: label };
    }
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  base: {
    env: process.env.NODE_ENV || "development"
  }
});

// Compatibility wrapper for existing console-style logging
export const logger = {
  info: (message: string, ...args: unknown[]) => {
    if (args.length > 0) {
      pinoLogger.info({ data: args }, message);
    } else {
      pinoLogger.info(message);
    }
  },
  warn: (message: string, ...args: unknown[]) => {
    if (args.length > 0 && args[0] instanceof Error) {
      pinoLogger.warn({ err: args[0], data: args.slice(1) }, message);
    } else if (args.length > 0) {
      pinoLogger.warn({ data: args }, message);
    } else {
      pinoLogger.warn(message);
    }
  },
  error: (message: string, ...args: unknown[]) => {
    if (args.length > 0 && args[0] instanceof Error) {
      pinoLogger.error({ err: args[0], data: args.slice(1) }, message);
    } else if (args.length > 0) {
      pinoLogger.error({ data: args }, message);
    } else {
      pinoLogger.error(message);
    }
  },
  debug: (message: string, ...args: unknown[]) => {
    if (args.length > 0) {
      pinoLogger.debug({ data: args }, message);
    } else {
      pinoLogger.debug(message);
    }
  }
};

// Helper to create child loggers with context
export function createLogger(context: Record<string, unknown>) {
  return pinoLogger.child(context);
}

// Export the raw pino instance for advanced usage
export { pinoLogger };
