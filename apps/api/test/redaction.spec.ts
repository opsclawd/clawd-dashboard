import { describe, it, expect } from 'vitest';
import { redactString, redactValue, redactObject } from '../src/domain/redaction';

describe('redaction utilities', () => {
  it('redacts codes, phones, and emails', () => {
    const raw = 'code 123456 phone 5551234567 email TEST@EXAMPLE.COM';
    const redacted = redactString(raw);
    expect(redacted).toContain('[REDACTED_CODE]');
    expect(redacted).toContain('[REDACTED_PHONE]');
    expect(redacted).toContain('[REDACTED_EMAIL]');
  });

  it('redactValue leaves non-strings untouched', () => {
    expect(redactValue(42)).toBe(42);
    expect(redactValue('5551234567')).toContain('[REDACTED_PHONE]');
  });

  it('redactObject recurses into arrays and nested objects', () => {
    const payload = {
      arr: ['5551234567', 1],
      nested: { email: 'abc@domain.com', code: '654321' }
    };
    const result = redactObject(payload);
    expect(result.arr[0]).toContain('[REDACTED_PHONE]');
    expect(result.nested.email).toContain('[REDACTED_EMAIL]');
  });
});
