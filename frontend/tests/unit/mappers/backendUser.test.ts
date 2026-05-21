import { describe, it, expect } from 'vitest';
import { coerceBackendUser } from '@/services/mappers/backendUser';

describe('coerceBackendUser', () => {
  it('should fall back to safe default values when an empty object is provided', () => {
    const coerced = coerceBackendUser({});
    
    expect(coerced.username).toBe('learner');
    expect(coerced.id).toBe('learner');
    expect(coerced.email).toBe('');
    expect(coerced.first_name).toBe('');
    expect(coerced.last_name).toBe('');
    expect(coerced.role).toBe('learner');
    expect(coerced.is_staff).toBe(false);
    expect(coerced.date_joined).toBeDefined();
    expect(coerced.joined_at).toBeUndefined();
  });

  it('should preserve provided user details', () => {
    const coerced = coerceBackendUser({
      id: 'user-123',
      username: 'alice',
      email: 'alice@example.com',
      first_name: 'Alice',
      last_name: 'Smith',
      joined_at: '2026-05-20T12:00:00Z',
    });

    expect(coerced.id).toBe('user-123');
    expect(coerced.username).toBe('alice');
    expect(coerced.email).toBe('alice@example.com');
    expect(coerced.first_name).toBe('Alice');
    expect(coerced.last_name).toBe('Smith');
    expect(coerced.joined_at).toBe('2026-05-20T12:00:00Z');
    expect(coerced.date_joined).toBe('2026-05-20T12:00:00Z');
  });

  it('should derive username from email when username is missing', () => {
    const coerced = coerceBackendUser({
      email: 'bob.developer@example.com',
    });

    expect(coerced.username).toBe('bob.developer');
    expect(coerced.id).toBe('bob.developer');
  });

  it('should derive role from is_staff if role is missing', () => {
    const adminCoerced = coerceBackendUser({
      is_staff: true,
    });
    expect(adminCoerced.role).toBe('admin');
    expect(adminCoerced.is_staff).toBe(true);

    const learnerCoerced = coerceBackendUser({
      is_staff: false,
    });
    expect(learnerCoerced.role).toBe('learner');
    expect(learnerCoerced.is_staff).toBe(false);
  });

  it('should derive is_staff from role if is_staff is missing', () => {
    const adminCoerced = coerceBackendUser({
      role: 'admin',
    });
    expect(adminCoerced.is_staff).toBe(true);
    expect(adminCoerced.role).toBe('admin');

    const customRoleCoerced = coerceBackendUser({
      role: 'tutor',
    });
    expect(customRoleCoerced.is_staff).toBe(false);
    expect(customRoleCoerced.role).toBe('tutor');
  });

  it('should prioritize date_joined over joined_at if both are provided', () => {
    const coerced = coerceBackendUser({
      date_joined: '2026-05-21T09:00:00Z',
      joined_at: '2026-05-20T12:00:00Z',
    });

    expect(coerced.date_joined).toBe('2026-05-21T09:00:00Z');
    expect(coerced.joined_at).toBe('2026-05-20T12:00:00Z');
  });
});
