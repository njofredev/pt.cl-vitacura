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

    // Create USERS Table
    console.log('Creating "users" table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'internal', 'external')),
        active BOOLEAN DEFAULT TRUE,
        password_plain VARCHAR(255),
        professional_title VARCHAR(255),
        professional_position VARCHAR(255),
        professional_email VARCHAR(255),
        professional_address VARCHAR(255),
        professional_website VARCHAR(255),
        professional_phone VARCHAR(255),
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
        status VARCHAR(20) DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'en_revision', 'aprobado', 'rechazado')),
        observations TEXT,
        registered_by UUID REFERENCES users(id) ON DELETE SET NULL,
        updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create Seed Super Admin User
    console.log('Checking for existing admin user...');
    const adminCheck = await client.query(`SELECT id FROM users WHERE email = $1`, ['admin@tabancura.cl']);
    
    if (adminCheck.rows.length === 0) {
      console.log('Seeding initial admin user (admin@tabancura.cl)...');
      const salt = await bcrypt.genSalt(10);
      const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || 'admin123';
      const passwordHash = await bcrypt.hash(adminPassword, salt);
      
      await client.query(`
        INSERT INTO users (name, email, password_hash, role, active)
        VALUES ($1, $2, $3, $4, $5)
      `, ['Administrador General', 'admin@tabancura.cl', passwordHash, 'admin', true]);
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
