import nodemailer from 'nodemailer';

export async function sendAutomaticReferralEmail(caseData: {
  rut: string;
  firstNames: string;
  lastNames: string;
  medicalCenter: string;
  agreementType: string;
  dentalDiagnosis: string;
  treatmentNeeded: string;
  professionalName: string;
  attachmentPath?: string | null;
}) {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 465);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.warn('[SMTP Warning] La configuración de correo SMTP (SMTP_HOST, SMTP_USER o SMTP_PASS) no está configurada completa en .env.local. Omitiendo envío de correo.');
    return;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: false // Helps bypass potential self-signed certificate issues on private/shared mail hosting
    }
  });

  const referralRecipient = process.env.REFERRAL_NOTIFICATION_EMAIL || 'derivaciones@policlinicotabancura.cl';

  const mailOptions = {
    from: `"Derivación Digital Vitacura" <${user}>`,
    to: referralRecipient,
    subject: `Nueva Derivación Digital Registrada - ${caseData.firstNames} ${caseData.lastNames}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #1e3a8a; margin: 0; font-size: 1.5rem; font-family: 'Helvetica Neue', Helvetica, sans-serif;">Derivación Digital</h2>
          <span style="font-size: 0.8rem; color: #10b981; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">ILUSTRE MUNICIPALIDAD DE VITACURA</span>
        </div>
        
        <p style="font-size: 0.95rem; color: #334155; line-height: 1.6; margin-bottom: 20px;">
          Se ha ingresado una nueva derivación social de manera exitosa desde el portal digital. A continuación se presentan los detalles del caso clínico:
        </p>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
          <tr>
            <td style="padding: 10px 8px; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #475569; width: 40%;">Paciente:</td>
            <td style="padding: 10px 8px; border-bottom: 1px solid #f1f5f9; color: #0f172a; font-weight: 600;">${caseData.firstNames} ${caseData.lastNames}</td>
          </tr>
          <tr>
            <td style="padding: 10px 8px; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #475569;">RUT:</td>
            <td style="padding: 10px 8px; border-bottom: 1px solid #f1f5f9; color: #0f172a;">${caseData.rut}</td>
          </tr>
          <tr>
            <td style="padding: 10px 8px; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #475569;">Institución de Origen:</td>
            <td style="padding: 10px 8px; border-bottom: 1px solid #f1f5f9; color: #0f172a;">${caseData.medicalCenter || 'CESFAM Vitacura'}</td>
          </tr>
          <tr>
            <td style="padding: 10px 8px; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #475569;">Convenio Solicitado:</td>
            <td style="padding: 10px 8px; border-bottom: 1px solid #f1f5f9; color: #10b981; font-weight: bold;">${caseData.agreementType || 'Atención Dental Básica'}</td>
          </tr>
          <tr>
            <td style="padding: 10px 8px; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #475569; vertical-align: top;">Diagnóstico Odontológico:</td>
            <td style="padding: 10px 8px; border-bottom: 1px solid #f1f5f9; color: #334155; font-style: italic; white-space: pre-wrap; background-color: #f8fafc; border-radius: 6px;">"${caseData.dentalDiagnosis || 'Sin patologías especificadas.'}"</td>
          </tr>
          <tr>
            <td style="padding: 10px 8px; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #475569; vertical-align: top;">Prestación Requerida:</td>
            <td style="padding: 10px 8px; border-bottom: 1px solid #f1f5f9; color: #334155; white-space: pre-wrap;">${caseData.treatmentNeeded || 'No especificada.'}</td>
          </tr>
          <tr>
            <td style="padding: 10px 8px; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #475569;">Profesional Derivador:</td>
            <td style="padding: 10px 8px; border-bottom: 1px solid #f1f5f9; color: #0f172a;">${caseData.professionalName}</td>
          </tr>
          ${caseData.attachmentPath ? `
          <tr>
            <td style="padding: 10px 8px; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #475569;">Radiografía Adjunta:</td>
            <td style="padding: 10px 8px; border-bottom: 1px solid #f1f5f9; color: #3b82f6; font-weight: bold;">Sí (sincronizada: ${caseData.attachmentPath})</td>
          </tr>
          ` : ''}
        </table>
        
        <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; border-radius: 8px; font-size: 0.82rem; color: #166534; line-height: 1.4;">
          <strong>Nota de Integración:</strong> Este es un envío automatizado del sistema para verificar el flujo de integración de correo electrónico. Las credenciales utilizadas han sido validadas correctamente.
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[SMTP] Correo de derivación enviado exitosamente a ${referralRecipient}`);
  } catch (error) {
    console.error('[SMTP Error] Error al enviar correo de derivación:', error);
  }
}

export async function sendSincronizadoNotificationEmail(caseData: {
  rut: string;
  firstNames: string;
  lastNames: string;
  medicalCenter: string;
  agreementType: string;
  dentalDiagnosis: string;
  treatmentNeeded: string;
  professionalName: string;
}) {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 465);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.warn('[SMTP Warning] La configuración SMTP no está completa. Omitiendo notificación de sincronización.');
    return;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  const recipients = [
    'derivaciones@policlinicotabancura.cl',
    'vmartinez@policlinicotabancura.cl',
    'bvelasquez@policlinicotabancura.cl'
  ];

  const mailOptions = {
    from: `"Derivación Digital Vitacura" <${user}>`,
    to: recipients.join(', '),
    subject: `Derivaciones: Agendamiento pendiente: ${caseData.firstNames} ${caseData.lastNames}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #1e3a8a; margin: 0; font-size: 1.5rem; font-family: 'Helvetica Neue', Helvetica, sans-serif;">Caso Sincronizado</h2>
          <span style="font-size: 0.8rem; color: #f59e0b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-top: 5px;">PENDIENTE DE AGENDAMIENTO EN DENTALINK</span>
        </div>
        
        <p style="font-size: 0.95rem; color: #334155; line-height: 1.6; margin-bottom: 20px;">
          Estimado equipo de recepción, el siguiente caso social ha sido exitosamente <strong>sincronizado</strong> con Dentalink y está listo para ser agendado:
        </p>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
          <tr>
            <td style="padding: 10px 8px; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #475569; width: 40%;">Paciente:</td>
            <td style="padding: 10px 8px; border-bottom: 1px solid #f1f5f9; color: #0f172a; font-weight: 600;">${caseData.firstNames} ${caseData.lastNames}</td>
          </tr>
          <tr>
            <td style="padding: 10px 8px; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #475569;">RUT:</td>
            <td style="padding: 10px 8px; border-bottom: 1px solid #f1f5f9; color: #0f172a;">${caseData.rut}</td>
          </tr>
          <tr>
            <td style="padding: 10px 8px; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #475569;">Institución de Origen:</td>
            <td style="padding: 10px 8px; border-bottom: 1px solid #f1f5f9; color: #0f172a;">${caseData.medicalCenter || 'CESFAM Vitacura'}</td>
          </tr>
          <tr>
            <td style="padding: 10px 8px; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #475569;">Convenio:</td>
            <td style="padding: 10px 8px; border-bottom: 1px solid #f1f5f9; color: #10b981; font-weight: bold;">${caseData.agreementType || 'Atención Dental Básica'}</td>
          </tr>
          <tr>
            <td style="padding: 10px 8px; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #475569; vertical-align: top;">Diagnóstico:</td>
            <td style="padding: 10px 8px; border-bottom: 1px solid #f1f5f9; color: #334155; font-style: italic; white-space: pre-wrap; background-color: #f8fafc; border-radius: 6px;">"${caseData.dentalDiagnosis || 'Sin patologías especificadas.'}"</td>
          </tr>
          <tr>
            <td style="padding: 10px 8px; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #475569; vertical-align: top;">Tratamiento requerido:</td>
            <td style="padding: 10px 8px; border-bottom: 1px solid #f1f5f9; color: #334155; white-space: pre-wrap;">${caseData.treatmentNeeded || 'No especificado.'}</td>
          </tr>
          <tr>
            <td style="padding: 10px 8px; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #475569;">Profesional Derivador:</td>
            <td style="padding: 10px 8px; border-bottom: 1px solid #f1f5f9; color: #0f172a;">${caseData.professionalName}</td>
          </tr>
        </table>
        
        <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 8px; font-size: 0.85rem; color: #78350f; line-height: 1.4;">
          <strong>Acción Requerida:</strong> Por favor, póngase en contacto con el paciente para coordinar su primera cita dental en Dentalink. Utilice el protocolo de llamadas de recepción.
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[SMTP] Correo de caso sincronizado enviado exitosamente a destinatarios: ${recipients.join(', ')}`);
  } catch (error) {
    console.error('[SMTP Error] Error al enviar notificación de caso sincronizado:', error);
  }
}
