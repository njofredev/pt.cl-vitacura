import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const clientConfig = {
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DATABASE,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
};

async function runMigration() {
  console.log('Running migration to add plain password support...');
  const client = new Client(clientConfig);

  try {
    await client.connect();
    console.log('Connected to database successfully!');

    // Alter table to add column password_plain if it does not exist
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS password_plain VARCHAR(255);
    `);
    console.log('Column "password_plain" added or already exists!');

    // Update existing admin@tabancura.cl user to have process.env.INITIAL_ADMIN_PASSWORD or default "admin123"
    const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || 'admin123';
    await client.query(`
      UPDATE users 
      SET password_plain = $1 
      WHERE email = 'admin@tabancura.cl' AND (password_plain IS NULL OR password_plain = '');
    `, [adminPassword]);
    console.log(`Updated admin user with plain password "${adminPassword}"!`);

    console.log('Migration completed successfully! 🎉');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await client.end();
  }
}

runMigration();
