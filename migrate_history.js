const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function createTableAndMigrate() {
  const pool = new Pool({
    host: process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DATABASE,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
  });

  try {
    console.log('Creating table case_status_history_records...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS case_status_history_records (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
        person_id UUID REFERENCES persons(id) ON DELETE SET NULL,
        rut VARCHAR(20) NOT NULL,
        patient_name VARCHAR(255) NOT NULL,
        previous_status VARCHAR(50),
        new_status VARCHAR(50) NOT NULL,
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        user_name VARCHAR(255) DEFAULT 'Sistema / Sincronización Automática',
        user_email VARCHAR(255),
        ip_address VARCHAR(100),
        observations TEXT,
        metadata JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_csh_case_id ON case_status_history_records(case_id);
      CREATE INDEX IF NOT EXISTS idx_csh_rut ON case_status_history_records(rut);
      CREATE INDEX IF NOT EXISTS idx_csh_created_at ON case_status_history_records(created_at DESC);
    `);

    console.log('Populating retrospective history from audit_logs and existing cases...');
    
    // 1. Get creation records from audit_logs
    const auditCreations = await pool.query(`
      SELECT 
        a.created_at, 
        a.user_id, 
        a.user_name, 
        a.user_email, 
        a.ip_address, 
        a.details,
        c.id as case_id,
        p.id as person_id,
        p.rut,
        p.first_names || ' ' || p.last_names as patient_name
      FROM audit_logs a
      JOIN persons p ON (a.details->>'rut' = p.rut OR a.details->>'rut' = REPLACE(REPLACE(p.rut, '.', ''), '-', ''))
      JOIN cases c ON c.person_id = p.id
      WHERE a.action = 'CASE_CREATED'
    `);

    // 2. Get status update records from audit_logs
    const auditUpdates = await pool.query(`
      SELECT 
        a.created_at, 
        a.user_id, 
        a.user_name, 
        a.user_email, 
        a.ip_address, 
        a.details,
        c.id as case_id,
        p.id as person_id,
        p.rut,
        p.first_names || ' ' || p.last_names as patient_name
      FROM audit_logs a
      JOIN cases c ON (a.details->>'caseId' = c.id::text)
      JOIN persons p ON c.person_id = p.id
      WHERE a.action = 'CASE_STATUS_UPDATED'
      ORDER BY a.created_at ASC
    `);

    console.log(`Found ${auditCreations.rows.length} creation audits and ${auditUpdates.rows.length} status update audits.`);

    for (const row of auditCreations.rows) {
      await pool.query(`
        INSERT INTO case_status_history_records (
          case_id, person_id, rut, patient_name, previous_status, new_status, user_id, user_name, user_email, ip_address, observations, metadata, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      `, [
        row.case_id,
        row.person_id,
        row.rut,
        row.patient_name,
        null,
        'ingresado',
        row.user_id,
        row.user_name || 'Profesional Derivador',
        row.user_email,
        row.ip_address,
        'Creación inicial del caso derivado',
        row.details || {},
        row.created_at
      ]);
    }

    let lastStatusMap = {};
    for (const row of auditUpdates.rows) {
      const newStatus = row.details?.status || 'desconocido';
      const prevStatus = lastStatusMap[row.case_id] || 'ingresado';
      const obs = row.details?.observations || 'Actualización de estado';
      
      await pool.query(`
        INSERT INTO case_status_history_records (
          case_id, person_id, rut, patient_name, previous_status, new_status, user_id, user_name, user_email, ip_address, observations, metadata, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      `, [
        row.case_id,
        row.person_id,
        row.rut,
        row.patient_name,
        prevStatus,
        newStatus,
        row.user_id,
        row.user_name || 'Sistema / Sincronización Automática',
        row.user_email,
        row.ip_address,
        obs,
        row.details || {},
        row.created_at
      ]);
      lastStatusMap[row.case_id] = newStatus;
    }

    console.log('Retrospective migration completed successfully!');

  } catch (err) {
    console.error('Error during migration:', err);
  } finally {
    await pool.end();
  }
}

createTableAndMigrate();
