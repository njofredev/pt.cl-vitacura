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
  console.log('Starting Migration: Creating convenios table and seeding data...');
  const client = new Client(clientConfig);

  try {
    await client.connect();
    console.log('Connected successfully!');

    // 1. Create table
    await client.query(`
      CREATE TABLE IF NOT EXISTS convenios (
        id SERIAL PRIMARY KEY,
        empresa VARCHAR(255) NOT NULL,
        fecha_afiliacion DATE NOT NULL,
        descuento VARCHAR(50) NOT NULL,
        medical_center VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('Table "convenios" created or already exists.');

    // 2. Clear existing entries to prevent duplicates if run twice
    await client.query('TRUNCATE TABLE convenios RESTART IDENTITY;');

    // 3. Seed data
    const seedConvenios = [
      { empresa: 'ALUMNOS UNIVERSIDAD FEDERICO SANTA MARÍA', fecha: '2026-03-26', descuento: '0%', center: 'CESFAM Vitacura' },
      { empresa: 'CESFAM VITACURA', fecha: '2026-01-19', descuento: '0%', center: 'CESFAM Vitacura' },
      { empresa: 'CLUB DE POLO', fecha: '2026-03-19', descuento: '0%', center: 'CESFAM Vitacura' },
      { empresa: 'CLUB SIRIO', fecha: '2026-02-03', descuento: '0%', center: 'CESFAM Vitacura' },
      { empresa: 'Colegio Betterland School', fecha: '2026-03-03', descuento: '0%', center: 'CESFAM Vitacura' },
      { empresa: 'COLEGIO EVEREST', fecha: '2026-03-10', descuento: '0%', center: 'CESFAM Vitacura' },
      { empresa: 'COLEGIO SANTA ÚRSULA', fecha: '2025-11-06', descuento: '0%', center: 'CESFAM Vitacura' },
      { empresa: 'Fundación Colegio de los Sagrados Corazones de Manquehue', fecha: '2026-04-21', descuento: '0%', center: 'CESFAM Vitacura' },
      { empresa: 'FUNDACIÓN EDUCACIONAL LO BARNECHEA', fecha: '2025-10-22', descuento: '0%', center: 'CESFAM Vitacura' },
      { empresa: 'FUNDACIÓN MARÍA LUISA BOMBAL', fecha: '2025-10-06', descuento: '0%', center: 'CESFAM Vitacura' },
      { empresa: 'Junta de Vecinos a-2 Las Hualtatas', fecha: '2026-01-19', descuento: '0%', center: 'CESFAM Vitacura' },
      { empresa: 'Liceo Bicentenario Amanda Labarca', fecha: '2025-10-27', descuento: '0%', center: 'CESFAM Vitacura' },
      { empresa: 'Mater Filius', fecha: '2025-09-22', descuento: '0%', center: 'CESFAM Vitacura' },
      { empresa: 'MUNICIPALIDAD DE VITACURA: TARJETA MI VITA', fecha: '2024-10-31', descuento: '0%', center: 'CESFAM Vitacura' },
      { empresa: 'MUNICIPALIDAD DE VITACURA: PROTESIS REMOVIBLES VITACURA', fecha: '2016-03-24', descuento: '0%', center: 'CESFAM Vitacura' },
      { empresa: 'Municipalidad Las Condes: CESFAM Dr. Aníbal Ariztía', fecha: '2025-01-21', descuento: '15%', center: 'CESFAM Vitacura' },
      { empresa: 'Policlinico Tabancura: Convenio colaboradores Policlinico Tabancura', fecha: '2025-10-30', descuento: '0%', center: 'CESFAM Vitacura' },
      { empresa: 'POLICLINICO TABANCURA: PACIENTE-HISTÓRICO', fecha: '2024-11-02', descuento: '0%', center: 'CESFAM Vitacura' },
      { empresa: 'POLICLINICO TABANCURA: BENEFICIARIOS', fecha: '2022-09-28', descuento: '0%', center: 'CESFAM Vitacura' },
      { empresa: 'UNIVERSIDAD TÉCNICA FEDERICO SANTA MARÍA', fecha: '2025-11-26', descuento: '0%', center: 'CESFAM Vitacura' },
    ];

    for (const item of seedConvenios) {
      await client.query(
        `INSERT INTO convenios (empresa, fecha_afiliacion, descuento, medical_center) VALUES ($1, $2, $3, $4)`,
        [item.empresa, item.fecha, item.descuento, item.center]
      );
    }
    console.log(`Seeded ${seedConvenios.length} agreements successfully.`);
    console.log('Migration completed successfully! 🎉');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await client.end();
  }
}

migrate();
