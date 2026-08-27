const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function testWithRut8() {
  const pool = new Pool({
    host: process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DATABASE,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
  });

  const personRes = await pool.query("SELECT * FROM persons WHERE rut LIKE '%88888888%' OR rut LIKE '%88.888.888%'");
  console.log('Person 88.888.888-8 count:', personRes.rows.length);

  const person = personRes.rows[0];
  console.log('Person:', person);

  let caseRes = await pool.query("SELECT * FROM cases WHERE person_id = $1", [person.id]);
  let caseObj;
  if (caseRes.rows.length === 0) {
    const ins = await pool.query(
      "INSERT INTO cases (person_id, description, status, observations, dental_count, xray_count, medical_center, agreement_type) VALUES ($1, 'Caso de prueba para validación de histórico', 'ingresado', 'Creación de prueba', 1, 0, 'CESFAM VITACURA', 'Convenio Prueba') RETURNING *",
      [person.id]
    );
    caseObj = ins.rows[0];
  } else {
    caseObj = caseRes.rows[0];
  }

  console.log('Case:', caseObj);

  // Insert mock test history records
  await pool.query(
    "INSERT INTO case_status_history_records (case_id, person_id, rut, patient_name, previous_status, new_status, user_name, observations) VALUES ($1, $2, $3, $4, 'ingresado', 'sincronizado', 'Usuario Pruebas', 'Sincronización simulada exitosa')",
    [caseObj.id, person.id, person.rut, `${person.first_names} ${person.last_names}`]
  );
  
  await pool.query(
    "INSERT INTO case_status_history_records (case_id, person_id, rut, patient_name, previous_status, new_status, user_name, observations) VALUES ($1, $2, $3, $4, 'sincronizado', 'agendado', 'Sistema / Sincronización Automática', 'Cita agendada registrada en Dentalink')",
    [caseObj.id, person.id, person.rut, `${person.first_names} ${person.last_names}`]
  );

  const historyVerify = await pool.query("SELECT id, patient_name, rut, previous_status, new_status, user_name, observations, created_at FROM case_status_history_records WHERE rut LIKE '%88888888%' ORDER BY created_at DESC");
  console.log('History records for RUT 88.888.888-8:');
  console.log(JSON.stringify(historyVerify.rows, null, 2));

  await pool.end();
}

testWithRut8().catch(err => {
  console.error('Error testing with RUT 8:', err);
  process.exit(1);
});
