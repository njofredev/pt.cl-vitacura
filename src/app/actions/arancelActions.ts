'use strict';
'use server';

import pool from '@/lib/db';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export interface Arancel {
  id: number;
  name: string;
  category: string;
  source: string;
  price_base: number;
  price_pref: number;
  show_in_odontogram: boolean;
  id_prestacion?: number;
  created_at: Date;
  updated_at: Date;
}

// 1. Get aranceles for the administrator panel (paginated & filtered)
export async function getArancelesAction(
  search = '',
  category = '',
  page = 1,
  limit = 20
): Promise<{ success: boolean; data?: Arancel[]; total?: number; categories?: string[]; hiddenCategories?: string[]; error?: string }> {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return { success: false, error: 'No autorizado' };
    }

    // Ensure hidden_categories table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS hidden_categories (
        category TEXT PRIMARY KEY,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    const offset = (page - 1) * limit;
    const queryParams: any[] = [];
    let queryConditions: string[] = [];

    // Filter by search text
    if (search.trim()) {
      queryParams.push(`%${search.trim()}%`);
      queryConditions.push(`name ILIKE $${queryParams.length}`);
    }

    // Filter by category
    if (category && category !== 'all') {
      queryParams.push(category);
      queryConditions.push(`category = $${queryParams.length}`);
    }

    // Exclude hidden categories from the administrator table
    queryConditions.push(`category NOT IN (SELECT category FROM hidden_categories)`);
    queryConditions.push(`name NOT ILIKE '%mivita%'`);
    queryConditions.push(`name NOT ILIKE '%mi vita%'`);

    const whereClause = queryConditions.length > 0 ? `WHERE ${queryConditions.join(' AND ')}` : '';

    // Get matching rows
    const dataQuery = `
      SELECT id, name, category, source, price_base, price_pref, show_in_odontogram, id_prestacion, created_at, updated_at
      FROM (
        SELECT DISTINCT ON (name) id, name, category, source, price_base, price_pref, show_in_odontogram, id_prestacion, created_at, updated_at
        FROM arancel
        ${whereClause}
        ORDER BY name ASC, price_base DESC NULLS LAST
      ) as sub
      ORDER BY category ASC, name ASC
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `;
    
    // Get total count
    const countQuery = `
      SELECT COUNT(DISTINCT name) as total FROM arancel ${whereClause}
    `;

    const dataParams = [...queryParams, limit, offset];
    
    const [dataRes, countRes, categoriesRes, hiddenRes] = await Promise.all([
      pool.query(dataQuery, dataParams),
      pool.query(countQuery, queryParams),
      pool.query(`SELECT DISTINCT category FROM arancel ORDER BY category ASC`),
      pool.query(`SELECT category FROM hidden_categories`)
    ]);

    const total = parseInt(countRes.rows[0].total, 10);
    const categories = categoriesRes.rows.map(r => r.category);
    const hiddenCategories = hiddenRes.rows.map(r => r.category);

    return {
      success: true,
      data: dataRes.rows as Arancel[],
      total,
      categories,
      hiddenCategories
    };
  } catch (error) {
    console.error('Error fetching aranceles:', error);
    return { success: false, error: 'Error del servidor al obtener aranceles' };
  }
}

// 2. Toggle visibility of a specific arancel in the odontograma
export async function toggleArancelOdontogramAction(
  id: number,
  show: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return { success: false, error: 'No autorizado' };
    }

    await pool.query(
      `UPDATE arancel SET show_in_odontogram = $1, updated_at = NOW() WHERE id = $2`,
      [show, id]
    );

    revalidatePath('/dashboard/aranceles');
    return { success: true };
  } catch (error) {
    console.error('Error toggling arancel visibility:', error);
    return { success: false, error: 'Error al actualizar visibilidad' };
  }
}

// 2.5 Toggle visibility of an entire category in the odontograma
export async function toggleCategoryVisibilityAction(
  category: string,
  hide: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return { success: false, error: 'No autorizado' };
    }

    // Ensure table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS hidden_categories (
        category TEXT PRIMARY KEY,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    if (hide) {
      await pool.query(
        'INSERT INTO hidden_categories (category) VALUES ($1) ON CONFLICT DO NOTHING',
        [category]
      );
    } else {
      await pool.query(
        'DELETE FROM hidden_categories WHERE category = $1',
        [category]
      );
    }

    revalidatePath('/dashboard/aranceles');
    revalidatePath('/dashboard/register');
    return { success: true };
  } catch (error) {
    console.error('Error toggling category visibility:', error);
    return { success: false, error: 'Error al actualizar visibilidad de categoría' };
  }
}

// 3. Get only active aranceles for the interactive odontograma
export async function getOdontogramPrestacionesAction(): Promise<{ success: boolean; data?: Arancel[]; error?: string }> {
  try {
    // Session is checked to ensure user is logged in
    const session = await getSession();
    if (!session) {
      return { success: false, error: 'No autenticado' };
    }

    // Ensure table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS hidden_categories (
        category TEXT PRIMARY KEY,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    const res = await pool.query(`
      SELECT id, name, category, source, price_base, price_pref, show_in_odontogram, id_prestacion
      FROM (
        SELECT DISTINCT ON (name) id, name, category, source, price_base, price_pref, show_in_odontogram, id_prestacion
        FROM arancel
        WHERE show_in_odontogram = TRUE
          AND category NOT IN (SELECT category FROM hidden_categories)
          AND name NOT ILIKE '%mivita%'
          AND name NOT ILIKE '%mi vita%'
        ORDER BY name ASC, price_base DESC NULLS LAST
      ) as sub
      ORDER BY category ASC, name ASC
    `);

    return {
      success: true,
      data: res.rows as Arancel[]
    };
  } catch (error) {
    console.error('Error fetching odontogram prestaciones:', error);
    return { success: false, error: 'Error al cargar prestaciones del odontograma' };
  }
}
