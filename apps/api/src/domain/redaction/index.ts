const CODE_REGEX = /\b\d{6}\b/g;
const PHONE_REGEX = /\b\d{10}\b/g;
const EMAIL_REGEX = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;

const redactString = (value: string) => {
  let sat = value;
  sat = sat.replace(CODE_REGEX, '[REDACTED_CODE]');
  sat = sat.replace(PHONE_REGEX, '[REDACTED_PHONE]');
  sat = sat.replace(EMAIL_REGEX, '[REDACTED_EMAIL]');
  return sat;
};

export const redactValue = (value: unknown): unknown => {
  if (typeof value !== 'string') return value;
  return redactString(value);
};

export const redactObject = (obj: Record<string, unknown>) => {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (Array.isArray(value)) {
      out[key] = value.map((item) => (typeof item === 'string' ? redactString(item) : item));
    } else if (value && typeof value === 'object') {
      out[key] = redactObject(value as Record<string, unknown>);
    } else {
      out[key] = redactValue(value);
    }
  }
  return out;
};
