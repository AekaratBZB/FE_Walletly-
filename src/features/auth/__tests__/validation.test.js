import { describe, it, expect } from 'vitest';
import { validateLogin, validateRegister, passwordStrength } from '../validation';

describe('validateLogin', () => {
  it('requires email and password', () => {
    expect(validateLogin({ email: '', password: '' })).toEqual({
      email: 'กรุณากรอกอีเมล',
      password: 'กรุณากรอกรหัสผ่าน'
    });
  });

  it('rejects malformed email', () => {
    expect(validateLogin({ email: 'not-an-email', password: 'x' }).email).toBe('รูปแบบอีเมลไม่ถูกต้อง');
  });

  it('accepts email with surrounding spaces', () => {
    expect(validateLogin({ email: '  user@example.com  ', password: 'secret' })).toEqual({});
  });

  it('treats whitespace-only email as empty', () => {
    expect(validateLogin({ email: '   ', password: 'x' }).email).toBe('กรุณากรอกอีเมล');
  });
});

describe('validateRegister', () => {
  const valid = { fullName: 'สมชาย ใจดี', email: 'a@b.co', password: 'abcd1234' };

  it('accepts valid input', () => {
    expect(validateRegister(valid)).toEqual({});
  });

  it('requires full name', () => {
    expect(validateRegister({ ...valid, fullName: '  ' }).fullName).toBe('กรุณาระบุชื่อเต็ม');
  });

  it('requires at least 8 characters', () => {
    expect(validateRegister({ ...valid, password: 'abc123' }).password).toBe(
      'รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร'
    );
  });

  it('requires a letter and a digit', () => {
    const message = 'รหัสผ่านต้องมีตัวอักษรภาษาอังกฤษและตัวเลขอย่างน้อยอย่างละ 1 ตัว';
    expect(validateRegister({ ...valid, password: 'abcdefgh' }).password).toBe(message);
    expect(validateRegister({ ...valid, password: '12345678' }).password).toBe(message);
  });

  it('rejects passwords over 72 UTF-8 bytes even when under 72 characters', () => {
    const thaiHeavy = 'ก'.repeat(24) + 'a1'; // 26 chars, 74 bytes
    expect(thaiHeavy.length).toBeLessThan(72);
    expect(validateRegister({ ...valid, password: thaiHeavy }).password).toBe('รหัสผ่านยาวเกินไป');
  });
});

describe('passwordStrength', () => {
  it('returns 0 for empty password', () => {
    expect(passwordStrength('')).toEqual({ score: 0, label: 'ยังไม่ได้ระบุ' });
  });

  it('scores a long mixed password as 4', () => {
    expect(passwordStrength('Abcdefgh12!').score).toBe(4);
  });

  it('scores a short lowercase password low', () => {
    expect(passwordStrength('abcdef').score).toBe(1);
  });
});
