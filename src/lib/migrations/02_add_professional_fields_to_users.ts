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
  console.log('Starting Migration: Adding professional fields to users table and fixing emails...');
  const client = new Client(clientConfig);

  try {
    await client.connect();
    console.log('Connected successfully!');

    // 1. Add new columns to users table
    console.log('Adding columns to users table...');
    await client.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS professional_title VARCHAR(255),
      ADD COLUMN IF NOT EXISTS professional_position VARCHAR(255),
      ADD COLUMN IF NOT EXISTS professional_email VARCHAR(255),
      ADD COLUMN IF NOT EXISTS professional_address VARCHAR(255),
      ADD COLUMN IF NOT EXISTS professional_website VARCHAR(255),
      ADD COLUMN IF NOT EXISTS professional_phone VARCHAR(255);
    `);

    // 2. Fix the swapped emails in users table safely
    console.log('Swapping emails for Antonio and Nicolás...');
    await client.query(`
      UPDATE users SET email = 'temp_swap@tabancura.cl' WHERE email = 'aalvear@policlinicotabancura.cl';
      UPDATE users SET email = 'aalvear@policlinicotabancura.cl' WHERE email = 'njofre@policlinicotabancura.cl';
      UPDATE users SET email = 'njofre@policlinicotabancura.cl' WHERE email = 'temp_swap@tabancura.cl';
    `);

    // 3. Populate default professional fields for existing users
    console.log('Populating simulated professional details...');
    
    // For Nicolás Jofré Andrade
    await client.query(`
      UPDATE users 
      SET 
        professional_title = 'Cirujano Dentista',
        professional_position = 'Encargado del Programa Odontológico',
        professional_email = 'njofre@policlinicotabancura.cl',
        professional_address = 'Avenida Vitacura #8620, Vitacura',
        professional_website = 'www.policlinicotabancura.cl',
        professional_phone = '+56957558966'
      WHERE name = 'Nicolás Jofré Andrade';
    `);

    // For Antonio Alvear Muñoz
    await client.query(`
      UPDATE users 
      SET 
        professional_title = 'Cirujano Dentista U. Chile',
        professional_position = 'Director Clínico',
        professional_email = 'aalvear@policlinicotabancura.cl',
        professional_address = 'Indiana Nº 1195, Vitacura',
        professional_website = 'www.policlinicotabancura.cl',
        professional_phone = '+56912345678'
      WHERE name = 'Antonio Alvear Muñoz';
    `);

    // For Administrador General
    await client.query(`
      UPDATE users 
      SET 
        professional_title = 'Administrador de Salud',
        professional_position = 'Administrador General',
        professional_email = 'admin@tabancura.cl',
        professional_address = 'Avenida Vitacura #8620, Vitacura',
        professional_website = 'www.policlinicotabancura.cl',
        professional_phone = '+56987654321'
      WHERE role = 'admin';
    `);

    console.log('Migration completed successfully! 🎉');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await client.end();
  }
}

migrate();
