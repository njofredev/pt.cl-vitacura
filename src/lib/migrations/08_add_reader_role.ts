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
  console.log('Starting Migration: Adding reader role check constraint...');
  const client = new Client(clientConfig);

  try {
    await client.connect();
    console.log('Connected successfully!');

    // First try dropping the constraint
    await client.query(`
      ALTER TABLE users
      DROP CONSTRAINT IF EXISTS users_role_check;
    `);

    // Add it back with the 'reader' role included
    await client.query(`
      ALTER TABLE users
      ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'internal', 'external', 'reader'));
    `);

    console.log('Migration completed successfully! 🎉');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await client.end();
  }
}

migrate();
