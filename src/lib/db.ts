import { Pool, types } from 'pg';

// Parse TIMESTAMP without timezone (OID 1114) as UTC Date objects instead of Node server local time
types.setTypeParser(1114, function(stringValue) {
  return new Date(stringValue.replace(' ', 'T') + 'Z');
});

let pool: Pool;

if (process.env.NODE_ENV === 'production') {
  pool = new Pool({
    host: process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DATABASE,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    ssl: false, // If the remote server requires SSL, change to true or configuration
    max: 20, // Max 20 connections in pool for production
    idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
    connectionTimeoutMillis: 2000, // Return an error if connection takes more than 2 seconds
    maxUses: 7500, // Recreate connection after 7500 uses to prevent memory leaks
  });
} else {
  // Prevent multiple instances of Pool in development hot-reloading
  const globalWithPool = global as typeof globalThis & {
    _postgresPool?: Pool;
  };

  if (!globalWithPool._postgresPool) {
    globalWithPool._postgresPool = new Pool({
      host: process.env.POSTGRES_HOST,
      database: process.env.POSTGRES_DATABASE,
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      port: parseInt(process.env.POSTGRES_PORT || '5432'),
      ssl: false,
      max: 5, // Keep it low in development
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 2000,
    });
  }
  pool = globalWithPool._postgresPool;
}

export default pool;

export async function query(text: string, params?: any[]) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    // Simple log for dev
    if (process.env.NODE_ENV !== 'production') {
      console.log('Executed query', { text, duration, rows: res.rowCount });
    }
    return res;
  } catch (error) {
    console.error('Error executing query', { text, error });
    throw error;
  }
}
