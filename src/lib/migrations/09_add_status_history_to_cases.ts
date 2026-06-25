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
  console.log('Starting Migration: Adding status_history JSONB column to cases table...');
  const client = new Client(clientConfig);

  try {
    await client.connect();
    console.log('Connected successfully!');

    // Add status_history column
    await client.query(`
      ALTER TABLE cases
      ADD COLUMN IF NOT EXISTS status_history JSONB DEFAULT '{}'::jsonb;
    `);
    console.log('Column "status_history" added successfully.');

    // Initialize status_history for existing cases using created_at
    await client.query(`
      UPDATE cases
      SET status_history = jsonb_build_object('ingresado', created_at)
      WHERE status_history IS NULL OR status_history = '{}'::jsonb;
    `);
    console.log('Initialized "ingresado" status timestamps.');

    // For cases not in 'ingresado' status, set their current status timestamp to updated_at
    await client.query(`
      UPDATE cases
      SET status_history = status_history || jsonb_build_object(status, updated_at)
      WHERE status <> 'ingresado';
    `);
    console.log('Initialized current status timestamps for progressed cases.');

    console.log('Migration completed successfully! 🎉');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await client.end();
  }
}

migrate();
