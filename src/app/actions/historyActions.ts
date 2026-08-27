'use strict';
'use server';

import pool from '@/lib/db';
import { getSession } from '@/lib/auth';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { cleanRUT } from '@/lib/utils';

export interface StatusHistoryRecord {
  id: string;
  case_id: string;
  person_id: string | null;
  rut: string;
  patient_name: string;
  previous_status: string | null;
  new_status: string;
  user_id: string | null;
  user_name: string | null;
  user_email: string | null;
  ip_address: string | null;
  observations: string | null;
  metadata: any;
  created_at: string;
}

/**
 * Registra un cambio de estado de manera inmutable en la tabla case_status_history_records
 */
export async function logStatusHistoryRecordAction(params: {
  caseId: string;
  previousStatus: string | null;
  newStatus: string;
  observations?: string | null;
  userId?: string | null;
  userName?: string | null;
  userEmail?: string | null;
  ipAddress?: string | null;
  metadata?: any;
}) {
  try {
    const session = await getSession();
    let clientIp = params.ipAddress || 'unknown';

    try {
      const reqHeaders = await headers();
      clientIp = reqHeaders.get('x-forwarded-for') || reqHeaders.get('x-real-ip') || clientIp;
    } catch (e) {
      // Ignore outside request context
    }

    // Get patient details from case
    const caseRes = await pool.query(`
      SELECT c.person_id, p.rut, p.first_names || ' ' || p.last_names as patient_name
      FROM cases c
      JOIN persons p ON c.person_id = p.id
      WHERE c.id = $1
    `, [params.caseId]);

    if (caseRes.rows.length === 0) {
      return { success: false, error: 'Caso no encontrado' };
    }

    const { person_id, rut, patient_name } = caseRes.rows[0];

    const userId = params.userId !== undefined ? params.userId : (session?.id || null);
    const userName = params.userName || session?.name || (session ? `${session.email}` : 'Sistema / Sincronización Automática');
    const userEmail = params.userEmail || session?.email || null;

    const res = await pool.query(`
      INSERT INTO case_status_history_records (
        case_id, person_id, rut, patient_name, previous_status, new_status, user_id, user_name, user_email, ip_address, observations, metadata, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
      RETURNING *
    `, [
      params.caseId,
      person_id,
      rut,
      patient_name,
      params.previousStatus,
      params.newStatus,
      userId,
      userName,
      userEmail,
      clientIp,
      params.observations || 'Actualización de estado',
      params.metadata || {}
    ]);

    return { success: true, record: res.rows[0] };
  } catch (error: any) {
    console.error('Error logging status history record:', error);
    return { success: false, error: error.message || 'Error del servidor' };
  }
}

/**
 * Obtiene los registros históricos paginados con filtros
 */
export async function getStatusHistoryLogsAction(
  page: number = 1,
  limit: number = 15,
  search: string = '',
  statusFilter: string = 'all'
) {
  const session = await getSession();
  if (!session || (session.role !== 'admin' && session.role !== 'internal')) {
    return { success: false, error: 'No autorizado para consultar el histórico de estados' };
  }

  const offset = (page - 1) * limit;
  const whereClauses: string[] = [];
  const queryParams: any[] = [];

  if (search.trim()) {
    const searchClean = cleanRUT(search.trim()) || search.trim();
    queryParams.push(`%${search.trim()}%`, `%${searchClean}%`);
    whereClauses.push(`(
      patient_name ILIKE $${queryParams.length - 1} 
      OR rut ILIKE $${queryParams.length} 
      OR user_name ILIKE $${queryParams.length - 1} 
      OR user_email ILIKE $${queryParams.length - 1}
      OR observations ILIKE $${queryParams.length - 1}
    )`);
  }

  if (statusFilter && statusFilter !== 'all') {
    queryParams.push(statusFilter);
    whereClauses.push(`new_status = $${queryParams.length}`);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  try {
    const countRes = await pool.query(`
      SELECT COUNT(*) as total FROM case_status_history_records ${whereSql}
    `, queryParams);

    const total = parseInt(countRes.rows[0]?.total || '0', 10);

    const dataParams = [...queryParams, limit, offset];
    const dataRes = await pool.query(`
      SELECT * FROM case_status_history_records
      ${whereSql}
      ORDER BY created_at DESC
      LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}
    `, dataParams);

    return {
      success: true,
      data: dataRes.rows as StatusHistoryRecord[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  } catch (error: any) {
    console.error('Error fetching status history records:', error);
    return { success: false, error: error.message || 'Error del servidor al obtener histórico' };
  }
}

/**
 * Obtiene la trazabilidad histórica de un caso específico
 */
export async function getCaseStatusTimelineAction(caseId: string) {
  const session = await getSession();
  if (!session) {
    return { success: false, error: 'No autorizado' };
  }

  try {
    const res = await pool.query(`
      SELECT * FROM case_status_history_records
      WHERE case_id = $1
      ORDER BY created_at ASC
    `, [caseId]);

    return {
      success: true,
      records: res.rows as StatusHistoryRecord[]
    };
  } catch (error: any) {
    console.error(`Error fetching timeline for case ${caseId}:`, error);
    return { success: false, error: error.message || 'Error al obtener la trazabilidad del caso' };
  }
}

/**
 * Restaura el estado de un caso a un estado previo registrado en el histórico
 */
export async function restoreCaseStatusFromHistoryAction(caseId: string, targetStatus: string, reason: string) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return { success: false, error: 'Solo los administradores pueden restaurar estados desde el histórico' };
  }

  try {
    const currentCase = await pool.query('SELECT status, observations FROM cases WHERE id = $1', [caseId]);
    if (currentCase.rows.length === 0) {
      return { success: false, error: 'Caso no encontrado' };
    }

    const prevStatus = currentCase.rows[0].status;
    const restoreObs = `[RESTAURACIÓN MANUAL] Estado restaurado a '${targetStatus}'. Motivo: ${reason}`;

    await pool.query(`
      UPDATE cases
      SET status = $1, observations = $2, updated_by = $3, updated_at = NOW()
      WHERE id = $4
    `, [targetStatus, restoreObs, session.id, caseId]);

    // Log the restoration in history
    await logStatusHistoryRecordAction({
      caseId,
      previousStatus: prevStatus,
      newStatus: targetStatus,
      observations: restoreObs,
      userName: `${session.name} (Restauración Manual)`,
      userEmail: session.email,
      metadata: { restored_by: session.id, reason }
    });

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/cases');
    revalidatePath('/dashboard/history');

    return { success: true, message: `Caso restaurado exitosamente a estado '${targetStatus}'` };
  } catch (error: any) {
    console.error(`Error restoring case ${caseId} from history:`, error);
    return { success: false, error: error.message || 'Error al restaurar estado del caso' };
  }
}
