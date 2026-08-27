const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function createBackup() {
  const pool = new Pool({
    host: process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DATABASE,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
  });

  const desktopPath = path.join('C:', 'Users', 'EQUIPO', 'Desktop');
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const backupFileName = `backup_db_casos_${timestamp}.json`;
  const backupSqlName = `backup_db_casos_${timestamp}.sql`;
  const fullJsonPath = path.join(desktopPath, backupFileName);
  const fullSqlPath = path.join(desktopPath, backupSqlName);

  console.log('Generating JSON & SQL backup on Desktop...');

  const tables = ['users', 'institutions', 'persons', 'cases', 'arancel', 'hidden_categories', 'convenios', 'audit_logs'];
  const fullDump = {};
  let sqlDump = `-- BACKUP DATABASE db_casos GENERATED AT ${now.toISOString()}\n\n`;

  for (const table of tables) {
    try {
      const res = await pool.query(`SELECT * FROM "${table}"`);
      fullDump[table] = res.rows;
      console.log(`Dumped table ${table}: ${res.rows.length} rows`);

      if (res.rows.length > 0) {
        sqlDump += `-- Data for table: ${table}\n`;
        for (const row of res.rows) {
          const keys = Object.keys(row);
          const cols = keys.map(k => `"${k}"`).join(', ');
          const values = keys.map(k => {
            const val = row[k];
            if (val === null || val === undefined) return 'NULL';
            if (typeof val === 'number' || typeof val === 'boolean') return val;
            if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
            return `'${String(val).replace(/'/g, "''")}'`;
          }).join(', ');
          sqlDump += `INSERT INTO "${table}" (${cols}) VALUES (${values}) ON CONFLICT DO NOTHING;\n`;
        }
        sqlDump += '\n';
      }
    } catch (err) {
      console.warn(`Could not dump table ${table}: ${err.message}`);
    }
  }

  fs.writeFileSync(fullJsonPath, JSON.stringify(fullDump, null, 2), 'utf-8');
  fs.writeFileSync(fullSqlPath, sqlDump, 'utf-8');

  console.log('BACKUP JSON CREATED AT:', fullJsonPath);
  console.log('BACKUP SQL CREATED AT:', fullSqlPath);

  await pool.end();
}

createBackup().catch(err => {
  console.error('Error creating backup:', err);
  process.exit(1);
});
