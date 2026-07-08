import { Client } from 'pg';
import * as bcrypt from 'bcryptjs';
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

async function setup() {
  console.log('Starting Database setup...');
  console.log('Connecting to PostgreSQL database:', clientConfig.host);

  const client = new Client(clientConfig);

  try {
    await client.connect();
    console.log('Connected successfully!');

    // Enable pgcrypto for UUID generation if needed, though we can use gen_random_uuid() natively in PG 13+
    await client.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);

    // Create INSTITUTIONS Table
    console.log('Creating "institutions" table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS institutions (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        quota_dental INT DEFAULT 0,
        quota_xray INT DEFAULT 0,
        used_dental INT DEFAULT 0,
        used_xray INT DEFAULT 0,
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create USERS Table
    console.log('Creating "users" table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'internal', 'external', 'reader')),
        active BOOLEAN DEFAULT TRUE,
        password_plain VARCHAR(255),
        professional_title VARCHAR(255),
        professional_position VARCHAR(255),
        professional_email VARCHAR(255),
        professional_address VARCHAR(255),
        professional_website VARCHAR(255),
        professional_phone VARCHAR(255),
        operator_email VARCHAR(255),
        operator_phone VARCHAR(255),
        medical_center VARCHAR(255),
        agreement_type VARCHAR(255),
        quota_dental INT DEFAULT 0,
        quota_xray INT DEFAULT 0,
        used_dental INT DEFAULT 0,
        used_xray INT DEFAULT 0,
        institution_id INT REFERENCES institutions(id) ON DELETE SET NULL,
        institution_ids INTEGER[] DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create PERSONS Table with the requested Chilean fields
    console.log('Creating "persons" table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS persons (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        rut VARCHAR(20) UNIQUE NOT NULL,
        first_names VARCHAR(100) NOT NULL,
        last_names VARCHAR(100) NOT NULL,
        nationality VARCHAR(100) NOT NULL,
        birth_date DATE NOT NULL,
        commune VARCHAR(100) NOT NULL,
        email VARCHAR(100),
        mobile VARCHAR(20) NOT NULL,
        registered_by UUID REFERENCES users(id) ON DELETE SET NULL,
        dentalink_patient_id INT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create CASES Table
    console.log('Creating "cases" table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS cases (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
        description TEXT NOT NULL,
        medical_center VARCHAR(255),
        agreement_type VARCHAR(255),
        dental_diagnosis TEXT,
        treatment_needed TEXT,
        professional_name VARCHAR(255),
        professional_title VARCHAR(255),
        professional_position VARCHAR(255),
        professional_email VARCHAR(255),
        professional_phone VARCHAR(255),
        professional_website VARCHAR(255),
        professional_address VARCHAR(255),
        status VARCHAR(20) DEFAULT 'ingresado' CHECK (status IN ('ingresado', 'agendado', 'en_tratamiento', 'finalizado', 'sincronizado')),
        observations TEXT,
        registered_by UUID REFERENCES users(id) ON DELETE SET NULL,
        updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
        dental_count INT DEFAULT 0,
        xray_count INT DEFAULT 0,
        status_history JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create ARANCEL Table
    console.log('Creating "arancel" table...');
    await client.query(`
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

    // Create HIDDEN_CATEGORIES Table
    console.log('Creating "hidden_categories" table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS hidden_categories (
        category TEXT PRIMARY KEY,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create CONVENIOS Table
    console.log('Creating "convenios" table...');
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

    // Create AUDIT_LOGS Table
    console.log('Creating "audit_logs" table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        action VARCHAR(100) NOT NULL,
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        user_name VARCHAR(255),
        user_email VARCHAR(255),
        ip_address VARCHAR(100),
        details JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Seed CONVENIOS if empty
    const conveniosCheck = await client.query('SELECT COUNT(*) FROM convenios');
    if (parseInt(conveniosCheck.rows[0].count) === 0) {
      console.log('Seeding initial convenios...');
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
      console.log(`Seeded ${seedConvenios.length} convenios.`);
    }

    // Create Seed Super Admin User
    console.log('Checking for existing admin user...');
    const adminCheck = await client.query(`SELECT id FROM users WHERE email = $1`, ['admin@policlinicotabancura.cl']);
    
    if (adminCheck.rows.length === 0) {
      console.log('Seeding initial admin user (admin@policlinicotabancura.cl)...');
      const salt = await bcrypt.genSalt(10);
      const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || 'admin123';
      const passwordHash = await bcrypt.hash(adminPassword, salt);
      
      await client.query(`
        INSERT INTO users (name, email, password_hash, role, active)
        VALUES ($1, $2, $3, $4, $5)
      `, ['Administrador General', 'admin@policlinicotabancura.cl', passwordHash, 'admin', true]);
      console.log(`Admin user seeded successfully with password "${adminPassword}"!`);
    } else {
      console.log('Admin user already exists.');
    }

    console.log('Database setup completed successfully! 🎉');
  } catch (error) {
    console.error('Database setup failed:', error);
  } finally {
    await client.end();
  }
}

setup();
