'use strict';
'use server';

import { getSession } from '@/lib/auth';
import { cleanRUT, formatRUT } from '@/lib/utils';

export interface DentalinkRequestParams {
  token: string;
  endpoint: string; // e.g., 'agendas' or 'profesionales'
  qParams?: Record<string, any>; // parameters to build the 'q' query
}

export async function getDentalinkEnvTokenAction() {
  const token = process.env.DENTALINK_API_TOKEN;
  return {
    hasToken: !!token,
    maskedToken: token ? `${token.trim().substring(0, 10)}...${token.trim().slice(-10)}` : '',
  };
}

export async function callDentalinkApiAction(params: DentalinkRequestParams) {
  const { token, endpoint, qParams } = params;

  // Fallback to environment variable if token is empty or is the special placeholder
  let apiToken = token;
  if (!apiToken || apiToken === 'ENV_TOKEN') {
    apiToken = process.env.DENTALINK_API_TOKEN || '';
  }

  if (!apiToken) {
    return { success: false, error: 'Token is required (not found in parameters or .env)' };
  }

  // Ensure token starts with 'Token '
  const formattedToken = apiToken.trim().startsWith('Token ') ? apiToken.trim() : `Token ${apiToken.trim()}`;


  // Build target URL
  const baseUrl = `https://api.dentalink.healthatom.com/api/v5/${endpoint}`;
  const url = new URL(baseUrl);

  // If there are qParams, format them as q={"columna":{"eq":"valor"}}
  if (qParams && Object.keys(qParams).length > 0) {
    const qObject: Record<string, any> = {};
    
    Object.entries(qParams).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        // Numeric strings converted to number if applicable
        const numVal = !isNaN(Number(val)) && typeof val !== 'boolean' ? Number(val) : val;
        qObject[key] = { eq: numVal };
      }
    });

    if (Object.keys(qObject).length > 0) {
      url.searchParams.set('q', JSON.stringify(qObject));
    }
  }

  const startTime = Date.now();
  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': formattedToken,
        'Accept': 'application/json',
      },
      cache: 'no-store',
    });

    const duration = Date.now() - startTime;
    const status = response.status;
    const statusText = response.statusText;

    let data = null;
    let errorText = null;

    try {
      data = await response.json();
    } catch (e) {
      errorText = await response.text();
    }

    return {
      success: response.ok,
      status,
      statusText,
      duration,
      url: url.toString(),
      data,
      errorText,
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error('Error calling Dentalink API:', error);
    return {
      success: false,
      status: 500,
      statusText: 'Internal Server Error',
      duration,
      url: url.toString(),
      errorText: error.message || 'Unknown network error',
    };
  }
}

export async function checkDentalinkPatientAction(rut: string) {
  const session = await getSession();
  if (!session) {
    return { success: false, error: 'No autorizado' };
  }

  if (session.role !== 'admin' && session.role !== 'internal') {
    return { success: false, error: 'No autorizado para esta función' };
  }

  const apiToken = process.env.DENTALINK_API_TOKEN || '';
  if (!apiToken) {
    return { success: false, error: 'Token de Dentalink no configurado en el servidor' };
  }

  const formattedToken = apiToken.trim().startsWith('Token ') ? apiToken.trim() : `Token ${apiToken.trim()}`;
  const clean = cleanRUT(rut);
  if (!clean) {
    return { success: false, error: 'RUT inválido' };
  }

  const dv = clean.slice(-1);
  const numbers = clean.slice(0, -1);
  const formatWithDash = `${numbers}-${dv}`;
  const formatWithDotsAndDash = formatRUT(clean);

  // We will check in parallel the three formats to ensure a match
  const formatsToCheck = Array.from(new Set([clean, formatWithDash, formatWithDotsAndDash]));
  
  for (const fmt of formatsToCheck) {
    const qObject = { rut: { eq: fmt } };
    const url = `https://api.dentalink.healthatom.com/api/v1/pacientes?q=${encodeURIComponent(JSON.stringify(qObject))}`;
    
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
        const result = await response.json();
        if (result && Array.isArray(result.data) && result.data.length > 0) {
          return {
            success: true,
            exists: true,
            patient: result.data[0]
          };
        }
      }
    } catch (err: any) {
      console.error(`Error querying Dentalink for RUT variant ${fmt}:`, err);
    }
  }

  return {
    success: true,
    exists: false
  };
}

export async function createDentalinkPatientAction(patientData: {
  rut: string;
  nombre: string;
  apellidos: string;
  email?: string;
  celular?: string;
  telefono?: string;
  fecha_nacimiento?: string;
  comuna?: string;
  ciudad?: string;
  direccion?: string;
  sexo?: string;
}) {
  const session = await getSession();
  if (!session) {
    return { success: false, error: 'No autorizado' };
  }

  if (session.role !== 'admin' && session.role !== 'internal') {
    return { success: false, error: 'No autorizado para esta función' };
  }

  const apiToken = process.env.DENTALINK_API_TOKEN || '';
  if (!apiToken) {
    return { success: false, error: 'Token de Dentalink no configurado en el servidor' };
  }

  const formattedToken = apiToken.trim().startsWith('Token ') ? apiToken.trim() : `Token ${apiToken.trim()}`;
  
  const url = `https://api.dentalink.healthatom.com/api/v1/pacientes`;

  // Standard payload for Dentalink POST /pacientes
  const payload = {
    rut: cleanRUT(patientData.rut),
    nombre: patientData.nombre,
    apellidos: patientData.apellidos,
    email: patientData.email || '',
    celular: patientData.celular || '',
    telefono: patientData.telefono || '',
    fecha_nacimiento: patientData.fecha_nacimiento || '',
    comuna: patientData.comuna || '',
    ciudad: patientData.ciudad || '',
    direccion: patientData.direccion || '',
    sexo: patientData.sexo || 'M',
    tipo_documento: 0,
    habilitado: 1
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': formattedToken,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      cache: 'no-store'
    });

    const result = await response.json();

    if (!response.ok) {
      return { 
        success: false, 
        error: result?.message || `Error del servidor Dentalink: ${response.statusText}` 
      };
    }

    return {
      success: true,
      patient: result.data || result
    };
  } catch (error: any) {
    console.error('Error creating Dentalink patient:', error);
    return { success: false, error: error.message || 'Error de red' };
  }
}

export async function getDentalinkPatientTreatmentsAction(idPaciente: number | string) {
  const session = await getSession();
  if (!session) {
    return { success: false, error: 'No autorizado' };
  }

  if (session.role !== 'admin' && session.role !== 'internal') {
    return { success: false, error: 'No autorizado para esta función' };
  }

  const apiToken = process.env.DENTALINK_API_TOKEN || '';
  if (!apiToken) {
    return { success: false, error: 'Token de Dentalink no configurado en el servidor' };
  }

  const formattedToken = apiToken.trim().startsWith('Token ') ? apiToken.trim() : `Token ${apiToken.trim()}`;
  const url = `https://api.dentalink.healthatom.com/api/v1/pacientes/${idPaciente}/tratamientos`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': formattedToken,
        'Accept': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `Error del servidor Dentalink: ${response.statusText}`, details: errorText };
    }

    const result = await response.json();
    return {
      success: true,
      treatments: result.data || []
    };
  } catch (error: any) {
    console.error('Error fetching Dentalink patient treatments:', error);
    return { success: false, error: error.message || 'Error de red' };
  }
}

export async function createDentalinkPatientTreatmentAction(
  idPaciente: number | string, 
  treatmentData: { 
    nombre: string; 
    id_sucursal: number;
    id_dentista: number;
    comentario?: string;
    finalizado?: number;
    id_convenio?: number;
  }
) {
  const session = await getSession();
  if (!session) {
    return { success: false, error: 'No autorizado' };
  }

  if (session.role !== 'admin' && session.role !== 'internal') {
    return { success: false, error: 'No autorizado para esta función' };
  }

  const apiToken = process.env.DENTALINK_API_TOKEN || '';
  if (!apiToken) {
    return { success: false, error: 'Token de Dentalink no configurado en el servidor' };
  }

  const formattedToken = apiToken.trim().startsWith('Token ') ? apiToken.trim() : `Token ${apiToken.trim()}`;
  const url = `https://api.dentalink.healthatom.com/api/v1/tratamientos`;

  const payload = {
    id_paciente: Number(idPaciente),
    id_sucursal: Number(treatmentData.id_sucursal),
    id_dentista: Number(treatmentData.id_dentista),
    nombre: treatmentData.nombre,
    comentario: treatmentData.comentario || '',
    finalizado: treatmentData.finalizado !== undefined ? treatmentData.finalizado : 0,
    ...(treatmentData.id_convenio !== undefined && treatmentData.id_convenio !== 0 ? { id_convenio: treatmentData.id_convenio } : {})
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': formattedToken,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      cache: 'no-store'
    });

    const result = await response.json();

    if (!response.ok) {
      return { 
        success: false, 
        error: result?.message || `Error del servidor Dentalink: ${response.statusText}` 
      };
    }

    return {
      success: true,
      treatment: result.data || result
    };
  } catch (error: any) {
    console.error('Error creating Dentalink patient treatment:', error);
    return { success: false, error: error.message || 'Error de red' };
  }
}

export async function addDentalinkTreatmentDetailAction(id_tratamiento: number, id_prestacion: number, precio: number = 0) {
  const session = await getSession();
  if (!session) {
    return { success: false, error: 'No autorizado' };
  }

  if (session.role !== 'admin' && session.role !== 'internal') {
    return { success: false, error: 'No autorizado para esta función' };
  }

  const apiToken = process.env.DENTALINK_API_TOKEN || '';
  if (!apiToken) {
    return { success: false, error: 'Token de Dentalink no configurado en el servidor' };
  }

  const formattedToken = apiToken.trim().startsWith('Token ') ? apiToken.trim() : `Token ${apiToken.trim()}`;
  const url = `https://api.dentalink.healthatom.com/api/v1/tratamientos/${id_tratamiento}/detalles`;

  const payload = {
    id_prestacion,
    precio,
    descuento: 100
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': formattedToken,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      cache: 'no-store'
    });

    const result = await response.json();

    if (!response.ok) {
      let detailedError = result?.message;
      if (!detailedError && result) detailedError = JSON.stringify(result);
      return { 
        success: false, 
        error: detailedError || `Error del servidor Dentalink: ${response.statusText}` 
      };
    }

    return {
      success: true,
      detail: result.data || result
    };
  } catch (error: any) {
    console.error('Error adding Dentalink treatment detail:', error);
    return { success: false, error: error.message || 'Error de red' };
  }
}

export async function getDentalinkPatientEvolutionsAction(idPaciente: number | string) {
  const session = await getSession();
  if (!session) {
    return { success: false, error: 'No autorizado' };
  }

  if (session.role !== 'admin' && session.role !== 'internal') {
    return { success: false, error: 'No autorizado para esta función' };
  }

  const apiToken = process.env.DENTALINK_API_TOKEN || '';
  if (!apiToken) {
    return { success: false, error: 'Token de Dentalink no configurado en el servidor' };
  }

  const formattedToken = apiToken.trim().startsWith('Token ') ? apiToken.trim() : `Token ${apiToken.trim()}`;
  const url = `https://api.dentalink.healthatom.com/api/v1/pacientes/${idPaciente}/evoluciones`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': formattedToken,
        'Accept': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `Error del servidor Dentalink: ${response.statusText}`, details: errorText };
    }

    const result = await response.json();
    return {
      success: true,
      evolutions: result.data || []
    };
  } catch (error: any) {
    console.error('Error fetching Dentalink patient evolutions:', error);
    return { success: false, error: error.message || 'Error de red' };
  }
}

export async function getDentalinkTreatmentDetailsAction(idTratamiento: number | string) {
  const session = await getSession();
  if (!session) {
    return { success: false, error: 'No autorizado' };
  }

  if (session.role !== 'admin' && session.role !== 'internal') {
    return { success: false, error: 'No autorizado para esta función' };
  }

  const apiToken = process.env.DENTALINK_API_TOKEN || '';
  if (!apiToken) {
    return { success: false, error: 'Token de Dentalink no configurado en el servidor' };
  }

  const formattedToken = apiToken.trim().startsWith('Token ') ? apiToken.trim() : `Token ${apiToken.trim()}`;
  const url = `https://api.dentalink.healthatom.com/api/v1/tratamientos/${idTratamiento}/detalles`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': formattedToken,
        'Accept': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `Error del servidor Dentalink: ${response.statusText}`, details: errorText };
    }

    const result = await response.json();
    return {
      success: true,
      details: result.data || []
    };
  } catch (error: any) {
    console.error('Error fetching Dentalink treatment details:', error);
    return { success: false, error: error.message || 'Error de red' };
  }
}

export async function getDentalinkTreatmentEvolutionsAction(idTratamiento: number | string) {
  const session = await getSession();
  if (!session) {
    return { success: false, error: 'No autorizado' };
  }

  if (session.role !== 'admin' && session.role !== 'internal') {
    return { success: false, error: 'No autorizado para esta función' };
  }

  const apiToken = process.env.DENTALINK_API_TOKEN || '';
  if (!apiToken) {
    return { success: false, error: 'Token de Dentalink no configurado en el servidor' };
  }

  const formattedToken = apiToken.trim().startsWith('Token ') ? apiToken.trim() : `Token ${apiToken.trim()}`;
  const url = `https://api.dentalink.healthatom.com/api/v1/tratamientos/${idTratamiento}/evoluciones`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': formattedToken,
        'Accept': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `Error del servidor Dentalink: ${response.statusText}`, details: errorText };
    }

    const result = await response.json();
    return {
      success: true,
      evolutions: result.data || []
    };
  } catch (error: any) {
    console.error('Error fetching Dentalink treatment evolutions:', error);
    return { success: false, error: error.message || 'Error de red' };
  }
}

export async function getDentalinkConveniosAction() {
  const session = await getSession();
  if (!session) {
    return { success: false, error: 'No autorizado' };
  }

  const apiToken = process.env.DENTALINK_API_TOKEN || '';
  if (!apiToken) {
    return { success: false, error: 'Token de Dentalink no configurado en el servidor' };
  }

  const formattedToken = apiToken.trim().startsWith('Token ') ? apiToken.trim() : `Token ${apiToken.trim()}`;
  
  const qObject = { habilitado: { eq: 1 } };
  const url = `https://api.dentalink.healthatom.com/api/v1/convenios?q=${encodeURIComponent(JSON.stringify(qObject))}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': formattedToken,
        'Accept': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `Error del servidor Dentalink: ${response.statusText}`, details: errorText };
    }

    const result = await response.json();
    return {
      success: true,
      convenios: result.data || []
    };
  } catch (error: any) {
    console.error('Error fetching Dentalink convenios:', error);
    return { success: false, error: error.message || 'Error de red' };
  }
}

export async function getDentalinkDentistasAction() {
  const session = await getSession();
  if (!session) {
    return { success: false, error: 'No autorizado' };
  }

  const apiToken = process.env.DENTALINK_API_TOKEN || '';
  if (!apiToken) {
    return { success: false, error: 'Token de Dentalink no configurado en el servidor' };
  }

  const formattedToken = apiToken.trim().startsWith('Token ') ? apiToken.trim() : `Token ${apiToken.trim()}`;
  
  const qObject = { habilitado: { eq: 1 } };
  const url = `https://api.dentalink.healthatom.com/api/v1/dentistas?q=${encodeURIComponent(JSON.stringify(qObject))}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': formattedToken,
        'Accept': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `Error del servidor Dentalink: ${response.statusText}`, details: errorText };
    }

    const result = await response.json();
    return {
      success: true,
      dentistas: result.data || []
    };
  } catch (error: any) {
    console.error('Error fetching Dentalink dentistas:', error);
    return { success: false, error: error.message || 'Error de red' };
  }
}




