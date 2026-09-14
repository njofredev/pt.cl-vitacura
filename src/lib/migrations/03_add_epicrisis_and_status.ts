import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const clientConfig = {
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DATABASE,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
};

async function migrate() {
  const client = new Client(clientConfig);
  try {
    await client.connect();
    console.log('Connected to database for epicrisis migration...');

    // 1. Drop existing CHECK constraints on cases.status
    const res = await client.query(`
      SELECT conname 
      FROM pg_constraint 
      WHERE conrelid = 'cases'::regclass AND contype = 'c';
    `);

    for (const row of res.rows) {
      if (row.conname.includes('status')) {
        console.log(`Dropping constraint: ${row.conname}`);
        await client.query(`ALTER TABLE cases DROP CONSTRAINT IF EXISTS "${row.conname}"`);
      }
    }

    // 2. Adjust VARCHAR length if needed and apply new CHECK constraint with 'epicrisis_pendiente'
    await client.query(`
      ALTER TABLE cases ALTER COLUMN status TYPE VARCHAR(30);
      ALTER TABLE cases ADD CONSTRAINT cases_status_check 
      CHECK (status IN ('ingresado', 'agendado', 'en_tratamiento', 'epicrisis_pendiente', 'finalizado', 'sincronizado'));
    `);

    // 3. Add epicrisis columns if not existing
    console.log('Adding epicrisis columns to cases table...');
    await client.query(`
      ALTER TABLE cases 
      ADD COLUMN IF NOT EXISTS epicrisis_diagnosis TEXT,
      ADD COLUMN IF NOT EXISTS epicrisis_indications TEXT,
      ADD COLUMN IF NOT EXISTS epicrisis_by UUID REFERENCES users(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS epicrisis_at TIMESTAMP;
    `);

    console.log('Migration 03_add_epicrisis_and_status completed successfully! 🎉');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();
