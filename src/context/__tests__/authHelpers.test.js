import { describe, it, expect } from 'vitest';
import {
  toAuthError,
  toUserData,
  restoreStoredUser,
  CONNECTION_ERROR,
  TOO_MANY_ATTEMPTS,
  INVALID_CREDENTIALS
} from '../authHelpers';

const httpError = (status, message) => Object.assign(new Error(message), { status });

describe('toAuthError', () => {
  const opts = { fallback: 'fallback message' };

  it('maps network errors (no status) to connection error', () => {
    expect(toAuthError(new TypeError('Failed to fetch'), opts)).toBe(CONNECTION_ERROR);
  });

  it('maps 5xx to connection error even with a server message', () => {
    expect(toAuthError(httpError(503, 'Service Unavailable detail'), opts)).toBe(CONNECTION_ERROR);
  });

  it('maps body-less 429 to too-many-attempts', () => {
    expect(toAuthError(httpError(429, 'HTTP 429: Too Many Requests'), opts)).toBe(TOO_MANY_ATTEMPTS);
  });

  it('passes BE message through for 401', () => {
    expect(toAuthError(httpError(401, 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'), opts)).toBe('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
  });

  it('uses default unauthorized message when 401 has no body', () => {
    expect(toAuthError(httpError(401, 'HTTP 401: Unauthorized'), opts)).toBe(INVALID_CREDENTIALS);
  });

  it('uses custom unauthorized message when given', () => {
    expect(
      toAuthError(httpError(401, 'HTTP 401: Unauthorized'), { fallback: 'x', unauthorized: 'social failed' })
    ).toBe('social failed');
  });

  it('passes joined BE validation errors through for 400', () => {
    expect(toAuthError(httpError(400, 'Email ซ้ำ, รหัสผ่านสั้นไป'), opts)).toBe('Email ซ้ำ, รหัสผ่านสั้นไป');
  });

  it('uses fallback for body-less 4xx', () => {
    expect(toAuthError(httpError(404, 'HTTP 404: Not Found'), opts)).toBe('fallback message');
  });
});

describe('toUserData', () => {
  it('maps BE auth response', () => {
    expect(
      toUserData({ id: 'u1', email: 'a@b.co', displayName: 'Ann', avatarUrl: 'x.png' }, { loginAt: 't' })
    ).toEqual({ id: 'u1', name: 'Ann', email: 'a@b.co', avatarUrl: 'x.png', isGuest: false, loginAt: 't' });
  });

  it('falls back to email local part for name', () => {
    expect(toUserData({ id: 'u1', email: 'somchai@b.co' }).name).toBe('somchai');
  });
});

describe('restoreStoredUser', () => {
  const real = JSON.stringify({ id: 'u1', name: 'Ann', isGuest: false });
  const guest = JSON.stringify({ name: 'Guest', isGuest: true });

  it('restores a real user who still has a token', () => {
    expect(restoreStoredUser(real, true)).toEqual({ id: 'u1', name: 'Ann', isGuest: false });
  });

  it('drops a non-guest user without a token (legacy offline login)', () => {
    expect(restoreStoredUser(real, false)).toBeNull();
  });

  it('restores a guest without a token', () => {
    expect(restoreStoredUser(guest, false)).toEqual({ name: 'Guest', isGuest: true });
  });

  it('returns null for empty or corrupt storage', () => {
    expect(restoreStoredUser(null, true)).toBeNull();
    expect(restoreStoredUser('{not json', true)).toBeNull();
  });
});
