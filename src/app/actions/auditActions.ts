'use strict';
'use server';

import pool from '@/lib/db';
import { getSession } from '@/lib/auth';
import { headers } from 'next/headers';

export interface AuditLog {
  id: string;
  action: string;
  user_id: string | null;
  user_name: string | null;
  user_email: string | null;
  ip_address: string | null;
  details: any;
  created_at: Date | string;
}

export async function logAuditAction(action: string, details?: any, actor?: { id: string; name: string; email: string }) {
  let userId: string | null = actor?.id || null;
  let userName: string | null = actor?.name || 'Anónimo / Sistema';
  let userEmail: string | null = actor?.email || null;
  let ipAddress: string | null = 'unknown';

  if (!actor) {
    try {
      const session = await getSession();
      if (session) {
        userId = session.id;
        userName = session.name;
        userEmail = session.email;
      }
    } catch (e) {
      // getSession might fail if outside HTTP request context (e.g. scripts)
    }
  }

  try {
    const reqHeaders = await headers();
    ipAddress = reqHeaders.get('x-forwarded-for') || reqHeaders.get('x-real-ip') || 'unknown';
    // Clean up proxy addresses if multiple
    if (ipAddress && ipAddress.includes(',')) {
      ipAddress = ipAddress.split(',')[0].trim();
    }
  } catch (e) {
    // headers() might error outside HTTP request context
  }

  try {
    await pool.query(
      `INSERT INTO audit_logs (action, user_id, user_name, user_email, ip_address, details)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [action, userId, userName, userEmail, ipAddress, details ? JSON.stringify(details) : null]
    );
    return { success: true };
  } catch (error) {
    console.error('Failed to write audit log:', error);
    return { success: false, error: 'Database logging error' };
  }
}

export async function getAuditLogsAction(
  page = 1,
  limit = 20,
  search = '',
  actionFilter = ''
): Promise<{ success: boolean; data?: AuditLog[]; total?: number; error?: string }> {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return { success: false, error: 'No autorizado' };
    }

    const offset = (page - 1) * limit;
    const queryParams: any[] = [];
    let queryConditions: string[] = [];

    // Filter by search text (covers user name, email, action, and details text)
    if (search.trim()) {
      queryParams.push(`%${search.trim()}%`);
      queryConditions.push(
        `(user_name ILIKE $${queryParams.length} OR user_email ILIKE $${queryParams.length} OR action ILIKE $${queryParams.length} OR CAST(details AS TEXT) ILIKE $${queryParams.length})`
      );
    }

    // Filter by action
    if (actionFilter && actionFilter !== 'all') {
      queryParams.push(actionFilter);
      queryConditions.push(`action = $${queryParams.length}`);
    }

    const whereClause = queryConditions.length > 0 ? `WHERE ${queryConditions.join(' AND ')}` : '';

    // Get audit rows ordered by newest first
    const dataQuery = `
      SELECT id, action, user_id, user_name, user_email, ip_address, details, created_at
      FROM audit_logs
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `;

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total FROM audit_logs ${whereClause}
    `;

    const dataParams = [...queryParams, limit, offset];

    const [dataRes, countRes] = await Promise.all([
      pool.query(dataQuery, dataParams),
      pool.query(countQuery, queryParams)
    ]);

    const total = parseInt(countRes.rows[0].total, 10);

    return {
      success: true,
      data: dataRes.rows as AuditLog[],
      total
    };
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return { success: false, error: 'Error del servidor al obtener registros de auditoría' };
  }
}
