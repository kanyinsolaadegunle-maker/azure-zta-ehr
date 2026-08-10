import { db } from '../db/index';
import * as schema from '../db/schema';
import { eq, and, gt } from 'drizzle-orm';

export interface RoleActivationResult {
  success: boolean;
  activationId?: string;
  expiresAt?: string;
  error?: string;
}

export async function activateJitRole(
  userId: string,
  roleName: string,
  justification: string,
  durationMinutes: number = 60
): Promise<RoleActivationResult> {
  if (!justification || justification.trim().length < 10) {
    return {
      success: false,
      error: 'Just In Time (JIT) role activation requires a documented justification string (minimum 10 characters).',
    };
  }

  try {
    const now = new Date();
    const expires = new Date(now.getTime() + durationMinutes * 60 * 1000);
    const id = `jit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    await db.insert(schema.roleActivations).values({
      id,
      userId,
      roleName,
      justification,
      activatedAt: now.toISOString(),
      expiresAt: expires.toISOString(),
      status: 'ACTIVE',
    });

    return {
      success: true,
      activationId: id,
      expiresAt: expires.toISOString(),
    };
  } catch (err: any) {
    console.error('Failed to activate JIT role:', err);
    return {
      success: false,
      error: err.message || 'Database error during PIM role activation.',
    };
  }
}

export async function getActiveRoleActivations(userId: string) {
  try {
    const nowIso = new Date().toISOString();
    const active = await db
      .select()
      .from(schema.roleActivations)
      .where(
        and(
          eq(schema.roleActivations.userId, userId),
          eq(schema.roleActivations.status, 'ACTIVE'),
          gt(schema.roleActivations.expiresAt, nowIso)
        )
      );
    return active;
  } catch (err) {
    console.error('Error fetching active PIM role activations:', err);
    return [];
  }
}
