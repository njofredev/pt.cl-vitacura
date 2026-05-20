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
  console.log('Starting Migration: Adding referral fields to cases table...');
  const client = new Client(clientConfig);

  try {
    await client.connect();
    console.log('Connected successfully!');

    await client.query(`
      ALTER TABLE cases
      ADD COLUMN IF NOT EXISTS medical_center VARCHAR(255),
      ADD COLUMN IF NOT EXISTS agreement_type VARCHAR(255),
      ADD COLUMN IF NOT EXISTS dental_diagnosis TEXT,
      ADD COLUMN IF NOT EXISTS treatment_needed TEXT,
      ADD COLUMN IF NOT EXISTS professional_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS professional_title VARCHAR(255),
      ADD COLUMN IF NOT EXISTS professional_position VARCHAR(255),
      ADD COLUMN IF NOT EXISTS professional_email VARCHAR(255),
      ADD COLUMN IF NOT EXISTS professional_phone VARCHAR(255),
      ADD COLUMN IF NOT EXISTS professional_website VARCHAR(255),
      ADD COLUMN IF NOT EXISTS professional_address VARCHAR(255);
    `);

    console.log('Migration completed successfully! 🎉');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await client.end();
  }
}

migrate();
