'use client';

import React, { useState } from 'react';
import { formatRUT, validateRUT, cleanRUT } from '@/lib/utils';
import { registerPersonAndCaseAction } from '@/app/actions/caseActions';
import { useRouter } from 'next/navigation';

export default function RegisterCasePage() {
  const router = useRouter();
  const [rut, setRut] = useState('');
  const [rutError, setRutError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleRutChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    setRut(raw);
    if (rutError) setRutError(null);
  }

  function handleRutBlur() {
    if (!rut) return;
    const formatted = formatRUT(rut);
    const cleaned = cleanRUT(rut);
    
    setRut(formatted);
    
    if (!validateRUT(cleaned)) {
      setRutError('RUT inválido. Verifique el dígito verificador.');
    } else {
      setRutError(null);
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formElement = e.currentTarget;
    setError(null);
    setSuccess(null);
    
    // Final RUT validation check
    const cleaned = cleanRUT(rut);
    if (!validateRUT(cleaned)) {
      setRutError('Por favor ingrese un RUT válido antes de enviar.');
      return;
    }

    setLoading(true);
    const formData = new FormData(formElement);
    formData.set('rut', cleaned); // Send cleaned RUT to server

    try {
      const result = await registerPersonAndCaseAction(formData);
      
      if (result.success) {
        setSuccess('¡Caso social e inscripción registrados exitosamente! Redireccionando...');
        formElement.reset();
        setRut('');
        
        setTimeout(() => {
          router.push('/dashboard/cases');
        }, 2000);
      } else {
        setError(result.error || 'Error al guardar los datos');
      }
    } catch (err) {
      setError('Error en el servidor al procesar la solicitud.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Page Title */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <h2 style={{ fontSize: '1.75rem', fontFamily: 'var(--font-display)', fontWeight: 800, margin: 0 }}>
          Inscribir Persona y Caso Social
        </h2>
        <p style={{ opacity: 0.7, margin: 0, fontSize: '0.9rem' }}>
          Ingrese los datos personales del postulante y el detalle del convenio o caso de ayuda solicitado.
        </p>
      </div>

      {/* Main Glassmorphic Form Container */}
      <div className="glass-panel" style={{ padding: '40px' }}>
        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          {error && (
            <div className="badge-rechazado" style={{ padding: '14px', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem', fontWeight: 600 }}>
              {error}
            </div>
          )}

          {success && (
            <div className="badge-aprobado" style={{ padding: '14px', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem', fontWeight: 600 }}>
              {success}
            </div>
          )}

          {/* Section 1: Personal Data */}
          <div>
            <h3 style={{ 
              fontSize: '1.1rem', 
              fontFamily: 'var(--font-display)', 
              fontWeight: 700, 
              borderBottom: '1px solid var(--glass-border)',
              paddingBottom: '10px',
              marginBottom: '20px',
              color: 'hsl(var(--accent-hsl))',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              1. Datos Personales
            </h3>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '20px'
            }}>
              
              {/* RUT field */}
              <div className="form-group">
                <label className="form-label" htmlFor="rut">RUT del Beneficiario *</label>
                <input 
                  className="form-input" 
                  type="text" 
                  id="rut" 
                  name="rut" 
                  required 
                  value={rut}
                  onChange={handleRutChange}
                  onBlur={handleRutBlur}
                  placeholder="Ej: 12.345.678-K" 
                  disabled={loading}
                  style={{
                    borderColor: rutError ? 'hsl(var(--danger-hsl))' : 'var(--glass-border)'
                  }}
                />
                {rutError && (
                  <span style={{ fontSize: '0.75rem', color: 'hsl(var(--danger-hsl))', fontWeight: 600, marginTop: '4px' }}>
                    {rutError}
                  </span>
                )}
              </div>

              {/* First Names */}
              <div className="form-group">
                <label className="form-label" htmlFor="first_names">Nombres *</label>
                <input 
                  className="form-input" 
                  type="text" 
                  id="first_names" 
                  name="first_names" 
                  required 
                  placeholder="Nombres completos" 
                  disabled={loading} 
                />
              </div>

              {/* Last Names */}
              <div className="form-group">
                <label className="form-label" htmlFor="last_names">Apellidos *</label>
                <input 
                  className="form-input" 
                  type="text" 
                  id="last_names" 
                  name="last_names" 
                  required 
                  placeholder="Apellidos paterno y materno" 
                  disabled={loading} 
                />
              </div>

              {/* Nationality */}
              <div className="form-group">
                <label className="form-label" htmlFor="nationality">Nacionalidad *</label>
                <select 
                  className="form-select" 
                  id="nationality" 
                  name="nationality" 
                  required 
                  disabled={loading}
                  style={{ backgroundColor: 'hsl(var(--card-hsl))' }}
                >
                  <option value="Chilena">Chilena</option>
                  <option value="Venezolana">Venezolana</option>
                  <option value="Colombiana">Colombiana</option>
                  <option value="Peruana">Peruana</option>
                  <option value="Haitiana">Haitiana</option>
                  <option value="Ecuatoriana">Ecuatoriana</option>
                  <option value="Boliviana">Boliviana</option>
                  <option value="Otra">Otra nacionalidad</option>
                </select>
              </div>

              {/* Birth Date */}
              <div className="form-group">
                <label className="form-label" htmlFor="birth_date">Fecha de Nacimiento *</label>
                <input 
                  className="form-input" 
                  type="date" 
                  id="birth_date" 
                  name="birth_date" 
                  required 
                  disabled={loading} 
                  style={{ backgroundColor: 'hsl(var(--card-hsl))' }}
                />
              </div>

              {/* Commune */}
              <div className="form-group">
                <label className="form-label" htmlFor="commune">Comuna de Residencia *</label>
                <select 
                  className="form-select" 
                  id="commune" 
                  name="commune" 
                  required 
                  disabled={loading}
                  style={{ backgroundColor: 'hsl(var(--card-hsl))' }}
                >
                  <option value="Vitacura">Vitacura</option>
                  <option value="Las Condes">Las Condes</option>
                  <option value="Lo Barnechea">Lo Barnechea</option>
                  <option value="Providencia">Providencia</option>
                  <option value="Santiago">Santiago</option>
                  <option value="Ñuñoa">Ñuñoa</option>
                  <option value="Macul">Macul</option>
                  <option value="Recoleta">Recoleta</option>
                  <option value="Independencia">Independencia</option>
                  <option value="Estación Central">Estación Central</option>
                  <option value="La Florida">La Florida</option>
                  <option value="Maipú">Maipú</option>
                  <option value="Otra Comuna">Otra Comuna</option>
                </select>
              </div>

              {/* Email */}
              <div className="form-group">
                <label className="form-label" htmlFor="email">Correo Electrónico</label>
                <input 
                  className="form-input" 
                  type="email" 
                  id="email" 
                  name="email" 
                  placeholder="ejemplo@correo.com (Opcional)" 
                  disabled={loading} 
                />
              </div>

              {/* Mobile Phone */}
              <div className="form-group">
                <label className="form-label" htmlFor="mobile">Celular de Contacto *</label>
                <input 
                  className="form-input" 
                  type="tel" 
                  id="mobile" 
                  name="mobile" 
                  required 
                  placeholder="+56 9 1234 5678" 
                  disabled={loading} 
                />
              </div>

            </div>
          </div>

          {/* Section 2: Case Details */}
          <div>
            <h3 style={{ 
              fontSize: '1.1rem', 
              fontFamily: 'var(--font-display)', 
              fontWeight: 700, 
              borderBottom: '1px solid var(--glass-border)',
              paddingBottom: '10px',
              marginBottom: '20px',
              color: 'hsl(var(--accent-hsl))',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
              2. Detalle del Caso o Convenio
            </h3>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '20px'
            }}>
              
              {/* Medical Center */}
              <div className="form-group">
                <label className="form-label" htmlFor="medical_center">Centro Médico de Origen *</label>
                <select 
                  className="form-select" 
                  id="medical_center" 
                  name="medical_center" 
                  required 
                  disabled={loading}
                  style={{ backgroundColor: 'hsl(var(--card-hsl))' }}
                >
                  <option value="">Seleccione un Centro</option>
                  <option value="CESFAM Vitacura">CESFAM Vitacura</option>
                  <option value="CESFAM Lo Barnechea">CESFAM Lo Barnechea</option>
                  <option value="Consultorio Dr. Aníbal Ariztía">Consultorio Dr. Aníbal Ariztía</option>
                  <option value="Otro">Otro Centro de Salud Familiar</option>
                </select>
              </div>

              {/* Agreement Type */}
              <div className="form-group">
                <label className="form-label" htmlFor="agreement_type">Convenio sin Costo de *</label>
                <select 
                  className="form-select" 
                  id="agreement_type" 
                  name="agreement_type" 
                  required 
                  disabled={loading}
                  style={{ backgroundColor: 'hsl(var(--card-hsl))' }}
                >
                  <option value="">Seleccione el tipo de convenio</option>
                  <option value="Confección de Prótesis Removibles">Confección de Prótesis Removibles</option>
                  <option value="Atención Dental Básica">Atención Dental Básica</option>
                  <option value="Tratamiento de Endodoncia">Tratamiento de Endodoncia</option>
                  <option value="Implantes Dentales">Implantes Dentales</option>
                  <option value="Otro">Otro Convenio</option>
                </select>
              </div>
            </div>

            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="dental_diagnosis">
                  Diagnóstico Odontológico *
                </label>
                <textarea 
                  className="form-textarea" 
                  id="dental_diagnosis" 
                  name="dental_diagnosis" 
                  required 
                  rows={2}
                  placeholder="Ej: Desdentado parcial superior e inferior..." 
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="treatment_needed">
                  Por favor, realizar (Prestación a realizar) *
                </label>
                <textarea 
                  className="form-textarea" 
                  id="treatment_needed" 
                  name="treatment_needed" 
                  required 
                  rows={2}
                  placeholder="Ej: Prótesis parcial superior e inferior..." 
                  disabled={loading}
                />
              </div>
            </div>

            <div style={{ marginTop: '20px' }}>
              <label className="form-label" htmlFor="description">
                Observaciones Generales de la Derivación (Opcional)
              </label>
              <textarea 
                className="form-textarea" 
                id="description" 
                name="description" 
                rows={3}
                placeholder="Detalles adicionales relevantes sobre el paciente o el caso..." 
                disabled={loading}
              />
            </div>

            {/* Section 3: Professional Details */}
            <h3 style={{ 
              fontSize: '1.1rem', 
              fontFamily: 'var(--font-display)', 
              fontWeight: 700, 
              borderBottom: '1px solid var(--glass-border)',
              paddingBottom: '10px',
              marginTop: '40px',
              marginBottom: '20px',
              color: 'hsl(var(--accent-hsl))',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              3. Firma del Profesional Derivador
            </h3>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '20px'
            }}>
              <div className="form-group">
                <label className="form-label" htmlFor="professional_name">Nombre del Profesional *</label>
                <input className="form-input" type="text" id="professional_name" name="professional_name" required placeholder="Dr. Juan Manuel Casals" disabled={loading} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="professional_title">Profesión *</label>
                <input className="form-input" type="text" id="professional_title" name="professional_title" required placeholder="Cirujano dentista" disabled={loading} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="professional_position">Cargo *</label>
                <input className="form-input" type="text" id="professional_position" name="professional_position" required placeholder="Encargado del Programa Odontológico." disabled={loading} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="professional_email">Correo de Contacto *</label>
                <input className="form-input" type="email" id="professional_email" name="professional_email" required placeholder="jcasals@vitacura.cl" disabled={loading} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="professional_address">Dirección del Centro *</label>
                <input className="form-input" type="text" id="professional_address" name="professional_address" required placeholder="Indiana Nº 1195, Vitacura" disabled={loading} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="professional_website">Sitio Web (Opcional)</label>
                <input className="form-input" type="text" id="professional_website" name="professional_website" placeholder="www.vitacura.cl" disabled={loading} />
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'flex-end', 
            gap: '15px', 
            borderTop: '1px solid var(--glass-border)',
            paddingTop: '25px',
            marginTop: '10px'
          }}>
            <button 
              type="button" 
              onClick={() => router.back()} 
              className="btn-secondary" 
              disabled={loading}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="btn-primary" 
              style={{ padding: '12px 28px' }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid rgba(255, 255, 255, 0.2)',
                    borderTop: '2px solid white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    marginRight: '8px'
                  }} />
                  Registrando...
                </>
              ) : (
                'Completar Inscripción'
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
