// Minimal structured logger. Vercel captures stdout/stderr per invocation,
// so one JSON line per event is searchable in the runtime logs. Pass ids and
// flags only — never names, emails, phone numbers or payment details.
type LogFields = Record<string, unknown>;
type LogLevel = "info" | "warn" | "error";

function serializeError(error: unknown): LogFields {
  if (error instanceof Error) {
    const code = (error as { code?: unknown }).code;
    return {
      errorName: error.name,
      errorMessage: error.message,
      errorCode: code,
    };
  }
  return { errorMessage: String(error) };
}

function write(level: LogLevel, message: string, fields: LogFields = {}): void {
  const { error, ...rest } = fields;
  const line = JSON.stringify({
    level,
    message,
    time: new Date().toISOString(),
    ...rest,
    ...(error === undefined ? {} : serializeError(error)),
  });
  // oxlint-disable-next-line no-console -- this is the logging sink
  console[level](line);
}

export const logger = {
  info: (message: string, fields?: LogFields) => write("info", message, fields),
  warn: (message: string, fields?: LogFields) => write("warn", message, fields),
  error: (message: string, fields?: LogFields) =>
    write("error", message, fields),
};
