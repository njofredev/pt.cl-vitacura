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
    console.log('Connected to database for status migration...');

    // Find check constraint names for the cases table
    const res = await client.query(`
      SELECT conname 
      FROM pg_constraint 
      WHERE conrelid = 'cases'::regclass AND contype = 'c';
    `);

    for (const row of res.rows) {
      console.log(`Dropping constraint: ${row.conname}`);
      await client.query(`ALTER TABLE cases DROP CONSTRAINT IF EXISTS "${row.conname}"`);
    }

    // Now update existing statuses
    console.log('Updating existing statuses...');
    await client.query(`
      UPDATE cases SET status = 'ingresado' WHERE status = 'pendiente';
      UPDATE cases SET status = 'agendado' WHERE status = 'en_revision';
      UPDATE cases SET status = 'en_tratamiento' WHERE status = 'aprobado';
      UPDATE cases SET status = 'finalizado' WHERE status = 'rechazado';
    `);

    // Set new default status
    console.log('Changing default status on cases table...');
    await client.query(`ALTER TABLE cases ALTER COLUMN status SET DEFAULT 'ingresado';`);

    // Add new check constraint
    console.log('Adding new CHECK constraint to cases table...');
    await client.query(`
      ALTER TABLE cases ADD CONSTRAINT cases_status_check 
      CHECK (status IN ('ingresado', 'agendado', 'en_tratamiento', 'finalizado', 'sincronizado'));
    `);

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await client.end();
  }
}

migrate();
