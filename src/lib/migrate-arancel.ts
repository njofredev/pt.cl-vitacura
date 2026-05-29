import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const configSST = {
  host: process.env.POSTGRES_HOST,
  database: 'db_sst',
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
};

const configCasos = {
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DATABASE || 'db_casos',
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
};

async function migrate() {
  console.log('Starting migration from db_sst."Arancel" to db_casos.arancel...');
  
  const clientSST = new Client(configSST);
  const clientCasos = new Client(configCasos);

  try {
    await clientSST.connect();
    console.log('Connected to source database: db_sst');

    await clientCasos.connect();
    console.log('Connected to target database:', configCasos.database);

    // 1. Create target table inside db_casos
    console.log('Creating "arancel" table in target database...');
    await clientCasos.query(`
      CREATE TABLE IF NOT EXISTS arancel (
        id INT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        source TEXT NOT NULL,
        price_base INT,
        price_pref INT,
        show_in_odontogram BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 2. Fetch all Dentalink items from db_sst."Arancel"
    console.log('Fetching Dentalink aranceles from db_sst...');
    const selectRes = await clientSST.query(`
      SELECT "id", "name", "category", "source", "priceBase", "pricePref", "createdAt", "updatedAt"
      FROM "Arancel"
      WHERE "source" = 'dentalink'
    `);
    
    console.log(`Found ${selectRes.rows.length} rows to migrate.`);

    // 3. Insert rows into target database
    let insertedCount = 0;
    for (const row of selectRes.rows) {
      await clientCasos.query(`
        INSERT INTO arancel (id, name, category, source, price_base, price_pref, show_in_odontogram, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          category = EXCLUDED.category,
          source = EXCLUDED.source,
          price_base = EXCLUDED.price_base,
          price_pref = EXCLUDED.price_pref,
          updated_at = NOW()
      `, [
        row.id,
        row.name,
        row.category,
        row.source,
        row.priceBase,
        row.pricePref,
        true, // show_in_odontogram defaults to true
        row.createdAt || new Date(),
        row.updatedAt || new Date()
      ]);
      insertedCount++;
    }

    console.log(`Successfully migrated ${insertedCount} arancel entries to ${configCasos.database}! 🎉`);

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await clientSST.end();
    await clientCasos.end();
  }
}

migrate();
