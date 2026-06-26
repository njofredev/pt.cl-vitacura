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

async function resetCases() {
  console.log('Iniciando el reinicio de casos sociales y logs de auditoría...');
  console.log('Conectándose a la base de datos:', clientConfig.host);

  const client = new Client(clientConfig);

  try {
    await client.connect();
    console.log('Conectado con éxito a la base de datos.');

    // 1. Truncar tablas de casos, personas y logs de auditoría
    console.log('Vaciando tablas: cases, persons, audit_logs...');
    await client.query('TRUNCATE TABLE cases, persons, audit_logs RESTART IDENTITY CASCADE;');
    console.log('Tablas vaciadas con éxito.');

    // 2. Reiniciar los contadores de cuotas usadas en instituciones y usuarios
    console.log('Reiniciando contadores de cuotas en institutions...');
    await client.query('UPDATE institutions SET used_dental = 0, used_xray = 0;');
    
    console.log('Reiniciando contadores de cuotas en users...');
    await client.query('UPDATE users SET used_dental = 0, used_xray = 0;');

    console.log('¡Base de datos reiniciada con éxito para una nueva prueba limpia! 🎉');
  } catch (error) {
    console.error('Error al reiniciar la base de datos:', error);
  } finally {
    await client.end();
  }
}

resetCases();
