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
  console.log('Starting Migration: Creating institutions table and linking to users...');
  const client = new Client(clientConfig);

  try {
    await client.connect();
    console.log('Connected successfully!');

    // 1. Create institutions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS institutions (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        quota_dental INT DEFAULT 0,
        quota_xray INT DEFAULT 0,
        used_dental INT DEFAULT 0,
        used_xray INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('Table "institutions" verified/created.');

    // 2. Add institution_id column to users table
    await client.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS institution_id INT REFERENCES institutions(id) ON DELETE SET NULL;
    `);
    console.log('Column "institution_id" verified/added to users table.');

    // 3. Migrate existing unique medical_centers to institutions table
    const centers = await client.query(`
      SELECT DISTINCT medical_center 
      FROM users 
      WHERE medical_center IS NOT NULL AND medical_center != ''
    `);

    console.log(`Found ${centers.rows.length} unique medical center(s) to migrate.`);

    for (const row of centers.rows) {
      const name = row.medical_center;
      // Get the maximum individual quotas assigned to any professional in this center to use as the base institution quota
      const quotasRes = await client.query(`
        SELECT COALESCE(SUM(quota_dental), 150) as sum_dental, COALESCE(SUM(quota_xray), 150) as sum_xray
        FROM users
        WHERE medical_center = $1
      `, [name]);

      const quotaDental = parseInt(quotasRes.rows[0].sum_dental) || 150;
      const quotaXray = parseInt(quotasRes.rows[0].sum_xray) || 150;

      // Insert institution
      const instInsert = await client.query(`
        INSERT INTO institutions (name, quota_dental, quota_xray) 
        VALUES ($1, $2, $3)
        ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
        RETURNING id
      `, [name, quotaDental, quotaXray]);

      const instId = instInsert.rows[0].id;
      console.log(`Created institution "${name}" (ID: ${instId}) with quotas Dental: ${quotaDental}, Xray: ${quotaXray}`);

      // Link users belonging to this medical center to the new institution
      const linkRes = await client.query(`
        UPDATE users 
        SET institution_id = $1 
        WHERE medical_center = $2
      `, [instId, name]);
      
      console.log(`Linked ${linkRes.rowCount} user(s) to institution "${name}".`);
    }

    console.log('Migration completed successfully! 🎉');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await client.end();
  }
}

migrate();
