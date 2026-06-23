import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { syncCaseStatusAction } from '@/app/actions/caseActions';
import { cleanRUT } from '@/lib/utils';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('[Dentalink Webhook] Received payload:', JSON.stringify(body, null, 2));

    // Try to extract patient ID or RUT from various possible fields in Dentalink's payload structure
    let patientId: string | number | null = null;
    let rut: string | null = null;

    if (body.id_paciente) {
      patientId = body.id_paciente;
    } else if (body.paciente && body.paciente.id) {
      patientId = body.paciente.id;
    } else if (body.paciente && body.paciente.id_paciente) {
      patientId = body.paciente.id_paciente;
    } else if (body.cita && body.cita.id_paciente) {
      patientId = body.cita.id_paciente;
    } else if (body.cita && body.cita.paciente_id) {
      patientId = body.cita.paciente_id;
    }

    if (body.rut) {
      rut = body.rut;
    } else if (body.paciente && body.paciente.rut) {
      rut = body.paciente.rut;
    }

    // Look up the active cases with this patient's ID or RUT
    let caseLookup = null;
    let resolvedRut = rut;

    // 1. Try lookup by patientId first if we have it
    if (patientId) {
      const dbLookup = await pool.query(`
        SELECT c.id, p.rut FROM cases c
        JOIN persons p ON c.person_id = p.id
        WHERE p.dentalink_patient_id = $1 AND c.status IN ('sincronizado', 'agendado', 'en_tratamiento')
        ORDER BY c.created_at DESC
        LIMIT 1
      `, [patientId]);
      
      if (dbLookup.rows.length > 0) {
        caseLookup = dbLookup;
        resolvedRut = dbLookup.rows[0].rut;
      }
    }

    // 2. If not found by patientId, try lookup by RUT if we have it
    if (!caseLookup && resolvedRut) {
      const clean = cleanRUT(resolvedRut);
      if (clean) {
        const dbLookup = await pool.query(`
          SELECT c.id, p.rut FROM cases c
          JOIN persons p ON c.person_id = p.id
          WHERE p.rut = $1 AND c.status IN ('sincronizado', 'agendado', 'en_tratamiento')
          ORDER BY c.created_at DESC
          LIMIT 1
        `, [clean]);
        
        if (dbLookup.rows.length > 0) {
          caseLookup = dbLookup;
          resolvedRut = clean;
          // Cache the patientId in DB since we found the case and know the patientId
          if (patientId) {
            try {
              await pool.query(
                'UPDATE persons SET dentalink_patient_id = $1 WHERE rut = $2',
                [patientId, clean]
              );
            } catch (cacheErr) {
              console.error('[Dentalink Webhook] Error caching patientId:', cacheErr);
            }
          }
        }
      }
    }

    // 3. Only if we have patientId, but no RUT, and we haven't found a case yet, we must query Dentalink API to resolve RUT
    if (!caseLookup && patientId && !resolvedRut) {
      const apiToken = process.env.DENTALINK_API_TOKEN || '';
      if (apiToken) {
        const formattedToken = apiToken.trim().startsWith('Token ') ? apiToken.trim() : `Token ${apiToken.trim()}`;
        const url = `https://api.dentalink.healthatom.com/api/v1/pacientes/${patientId}`;
        
        try {
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Authorization': formattedToken,
              'Accept': 'application/json',
            },
            cache: 'no-store',
          });
          
          if (response.ok) {
            const patientData = await response.json();
            if (patientData && patientData.data && patientData.data.rut) {
              resolvedRut = patientData.data.rut;
              if (resolvedRut) {
                const clean = cleanRUT(resolvedRut);
                if (clean) {
                  const dbLookup = await pool.query(`
                    SELECT c.id, p.rut FROM cases c
                    JOIN persons p ON c.person_id = p.id
                    WHERE p.rut = $1 AND c.status IN ('sincronizado', 'agendado', 'en_tratamiento')
                    ORDER BY c.created_at DESC
                    LIMIT 1
                  `, [clean]);
                  
                  if (dbLookup.rows.length > 0) {
                    caseLookup = dbLookup;
                    // Cache patientId
                    await pool.query(
                      'UPDATE persons SET dentalink_patient_id = $1 WHERE rut = $2',
                      [patientId, clean]
                    );
                  }
                }
              }
            }
          }
        } catch (fetchErr) {
          console.error('[Dentalink Webhook] Error fetching patient info from Dentalink:', fetchErr);
        }
      }
    }

    if (!caseLookup) {
      return NextResponse.json({ 
        success: true, 
        message: 'No active case found. No sync action needed.' 
      });
    }

    const caseId = caseLookup.rows[0].id;
    console.log(`[Dentalink Webhook] Syncing case ${caseId} for resolved RUT: ${resolvedRut}`);
    const syncRes = await syncCaseStatusAction(caseId);

    return NextResponse.json({ 
      success: true, 
      message: 'Webhook processed and case synced successfully', 
      syncDetails: syncRes 
    });

  } catch (error: any) {
    console.error('[Dentalink Webhook] Error processing webhook request:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Internal Server Error' 
    }, { status: 500 });
  }
}
