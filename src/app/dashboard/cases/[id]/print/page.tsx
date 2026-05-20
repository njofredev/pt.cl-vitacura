import { getSession } from '@/lib/auth';
import pool from '@/lib/db';
import { redirect } from 'next/navigation';
import { formatDate } from '@/lib/utils';

export default async function PrintCasePage({ params }: { params: { id: string } }) {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  const { id } = await params;

  let caseData;
  try {
    const res = await pool.query(`
      SELECT 
        c.*, 
        p.rut, p.first_names, p.last_names, p.nationality, p.birth_date, p.commune, p.email as person_email, p.mobile,
        u.name as registered_by_name
      FROM cases c
      JOIN persons p ON c.person_id = p.id
      LEFT JOIN users u ON p.registered_by = u.id
      WHERE c.id = $1
    `, [id]);

    if (res.rows.length === 0) {
      return <div>Caso no encontrado</div>;
    }
    caseData = res.rows[0];

    // Additional security check: external users can only see their own registrations
    if (session.role === 'external' && caseData.registered_by !== session.id) {
      return <div>No autorizado para ver este caso</div>;
    }
  } catch (error) {
    console.error('Error fetching case:', error);
    return <div>Error al cargar los datos del caso.</div>;
  }

  // Handle case number format (e.g. N° 31)
  // In a real system, you might have a sequential sequence. 
  // Here we can use the short part of the UUID or assume the ID is just the internal reference.
  const caseNumber = caseData.id.split('-')[0].toUpperCase();
  const currentDate = new Date().toLocaleDateString('es-CL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="print-container">
      {/* Print Action Button (Hidden on Print) */}
      <div className="no-print" style={{ padding: '20px', backgroundColor: 'var(--glass-bg)', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.2rem', fontFamily: 'var(--font-display)' }}>Vista de Impresión</h2>
          <p style={{ margin: 0, opacity: 0.7, fontSize: '0.85rem' }}>Presiona Imprimir para generar el PDF.</p>
        </div>
        <button 
          onClick={() => window.print()}
          className="btn-primary"
          style={{ padding: '10px 20px' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
          Imprimir / Guardar PDF
        </button>
      </div>

      {/* Actual A4 Print Document */}
      <div className="a4-document">
        
        {/* Header with Logo */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {/* V Vitacura Logo Text Replica */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '2.5rem', fontWeight: 900, fontFamily: 'Arial, sans-serif', color: '#666' }}>V</span>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'Arial, sans-serif', letterSpacing: '-0.03em', lineHeight: 1 }}>vitacura</span>
                <span style={{ fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.05em', color: '#666' }}>EL MEJOR LUGAR PARA VIVIR</span>
              </div>
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#444', marginTop: '4px' }}>ILUSTRE MUNICIPALIDAD DE VITACURA</span>
          </div>

          <div style={{ paddingTop: '50px' }}>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#333' }}>Número de Derivación: N° {caseNumber}</p>
          </div>
        </div>

        {/* Title */}
        <div style={{ textAlign: 'center', margin: '60px 0', padding: '0 40px' }}>
          <h1 style={{ 
            fontSize: '1rem', 
            fontWeight: 700, 
            fontFamily: 'Arial, sans-serif', 
            textTransform: 'uppercase',
            margin: 0,
            lineHeight: 1.5,
            color: '#111'
          }}>
            {caseData.medical_center ? caseData.medical_center.toUpperCase() + '.' : 'CENTRO DE SALUD FAMILIAR.'}<br/>
            DERIVACIÓN A CONVENIO POLICLÍNICO TABANCURA SIN COSTO.
          </h1>
        </div>

        {/* Body Content */}
        <div style={{ fontSize: '1rem', lineHeight: 1.6, color: '#222', fontFamily: 'Arial, sans-serif' }}>
          <p style={{ marginBottom: '20px' }}>Estimados:</p>
          
          <p style={{ textAlign: 'justify', marginBottom: '20px' }}>
            Junto con saludarlos y esperando que se encuentren bien, les enviamos el presente 
            documento como derivación <strong>{caseData.first_names} {caseData.last_names}</strong> RUT: <strong>{caseData.rut}</strong> quien es usuario de 
            nuestro Centro de Salud Familiar, para el Convenio Sin Costo de {caseData.agreement_type || 'Atención Odontológica'}.
          </p>

          <p style={{ marginBottom: '20px' }}>
            Diagnóstico Odontológico: {caseData.dental_diagnosis || 'No especificado.'}
          </p>

          <p style={{ marginBottom: '40px', fontWeight: 600 }}>
            Por favor, realizar {caseData.treatment_needed || 'Atención según diagnóstico.'}
          </p>
        </div>

        {/* Signature Area */}
        <div style={{ marginTop: '60px', fontFamily: 'Arial, sans-serif' }}>
          <p style={{ marginBottom: '40px' }}>Saluda Atte.</p>
          
          {/* Fake Signature Image - Using a squiggly line SVG to simulate a signature */}
          <div style={{ marginBottom: '10px' }}>
            <svg width="180" height="40" viewBox="0 0 200 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 30 Q 30 10 50 25 T 90 15 T 130 25 T 160 10 T 190 20" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M40 35 L 180 35" stroke="#0f172a" strokeWidth="1" strokeDasharray="4 4" />
            </svg>
          </div>

          <div style={{ fontSize: '0.9rem', lineHeight: 1.4, color: '#333' }}>
            <p style={{ margin: 0, fontWeight: 700 }}>{caseData.professional_name || 'Dr. Profesional'}</p>
            <p style={{ margin: 0 }}>{caseData.professional_title || 'Cirujano Dentista'}</p>
            <p style={{ margin: 0 }}>{caseData.professional_position || 'Programa Odontológico'}</p>
            <p style={{ margin: 0 }}>{caseData.medical_center || 'CESFAM'}</p>
            <p style={{ margin: 0, textDecoration: 'underline' }}>{caseData.professional_email || 'correo@centro.cl'}</p>
            <p style={{ margin: 0 }}>{caseData.professional_address || 'Dirección no registrada'}</p>
            {caseData.professional_website && (
              <p style={{ margin: 0, fontWeight: 700 }}><u>{caseData.professional_website}</u></p>
            )}
          </div>
        </div>

        {/* Date Footer */}
        <div style={{ marginTop: '80px', textAlign: 'right', fontSize: '0.9rem', fontFamily: 'Arial, sans-serif' }}>
          <p style={{ margin: 0 }}>Vitacura, {currentDate}</p>
        </div>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .print-container {
          background-color: #f1f5f9;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .a4-document {
          background-color: white;
          width: 210mm;
          min-height: 297mm;
          padding: 25mm;
          margin: 40px auto;
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
          box-sizing: border-box;
        }
        @media print {
          body * {
            visibility: hidden;
          }
          .a4-document, .a4-document * {
            visibility: visible;
          }
          .a4-document {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 25mm;
            box-shadow: none;
          }
          .no-print {
            display: none !important;
          }
          body {
            background-color: white;
            margin: 0;
            padding: 0;
          }
        }
      `}} />
    </div>
  );
}
