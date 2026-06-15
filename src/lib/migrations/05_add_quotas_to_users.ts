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
  console.log('Starting Migration: Adding quota and usage fields to users table...');
  const client = new Client(clientConfig);

  try {
    await client.connect();
    console.log('Connected successfully!');

    await client.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS quota_dental INT DEFAULT 0,
      ADD COLUMN IF NOT EXISTS quota_xray INT DEFAULT 0,
      ADD COLUMN IF NOT EXISTS used_dental INT DEFAULT 0,
      ADD COLUMN IF NOT EXISTS used_xray INT DEFAULT 0;
    `);

    console.log('Migration completed successfully! 🎉');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await client.end();
  }
}

migrate();
