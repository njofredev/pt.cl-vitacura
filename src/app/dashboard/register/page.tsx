'use client';

import React, { useState, useEffect } from 'react';
import { formatRUT, validateRUT, cleanRUT } from '@/lib/utils';
import { registerPersonAndCaseAction } from '@/app/actions/caseActions';
import { getCurrentUserAction } from '@/app/actions/userActions';
import { useRouter } from 'next/navigation';

export default function RegisterCasePage() {
  const router = useRouter();
  const [rut, setRut] = useState('');
  const [rutError, setRutError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // States for professional defaults
  const [profName, setProfName] = useState('');
  const [profTitle, setProfTitle] = useState('');
  const [profPosition, setProfPosition] = useState('');
  const [profEmail, setProfEmail] = useState('');
  const [profAddress, setProfAddress] = useState('');
  const [profWebsite, setProfWebsite] = useState('');

  // State and mask for Birth Date text input optimization
  const [birthDateInput, setBirthDateInput] = useState('');

  // States for dynamic "Other" selects
  const [selectedNationality, setSelectedNationality] = useState('Chilena');
  const [customNationality, setCustomNationality] = useState('');
  
  const [selectedCommune, setSelectedCommune] = useState('Vitacura');
  const [customCommune, setCustomCommune] = useState('');
  
  const [selectedMedicalCenter, setSelectedMedicalCenter] = useState('');
  const [customMedicalCenter, setCustomMedicalCenter] = useState('');
  
  const [selectedAgreementType, setSelectedAgreementType] = useState('');
  const [customAgreementType, setCustomAgreementType] = useState('');

  function handleBirthDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    let value = e.target.value.replace(/\D/g, ''); // keep digits only
    if (value.length > 8) value = value.slice(0, 8);
    
    let formatted = '';
    if (value.length > 0) {
      formatted += value.slice(0, 2);
    }
    if (value.length > 2) {
      formatted += '/' + value.slice(2, 4);
    }
    if (value.length > 4) {
      formatted += '/' + value.slice(4, 8);
    }
    setBirthDateInput(formatted);
  }

  useEffect(() => {
    async function loadDefaults() {
      try {
        const res = await getCurrentUserAction();
        if (res.success && res.user) {
          const u = res.user;
          setProfName(u.name || '');
          setProfTitle(u.professional_title || '');
          setProfPosition(u.professional_position || '');
          setProfEmail(u.professional_email || u.email || '');
          setProfAddress(u.professional_address || '');
          setProfWebsite(u.professional_website || '');
        }
      } catch (err) {
        console.error('Failed to load professional defaults:', err);
      }
    }
    loadDefaults();
  }, []);

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

    // Birth date validation check
    const dateParts = birthDateInput.split('/');
    if (dateParts.length !== 3 || dateParts[2].length !== 4 || dateParts[1].length !== 2 || dateParts[0].length !== 2) {
      setError('Por favor ingrese una fecha de nacimiento válida en formato DD/MM/AAAA.');
      return;
    }
    const day = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10);
    const year = parseInt(dateParts[2], 10);
    
    if (isNaN(day) || isNaN(month) || isNaN(year) || month < 1 || month > 12 || day < 1 || day > 31 || year < 1900 || year > new Date().getFullYear()) {
      setError('Por favor ingrese una fecha de nacimiento válida.');
      return;
    }

    // Custom select validation checks
    if (selectedNationality === 'Otra' && !customNationality.trim()) {
      setError('Por favor especifique su nacionalidad.');
      return;
    }
    if (selectedCommune === 'Otra Comuna' && !customCommune.trim()) {
      setError('Por favor especifique su comuna de residencia.');
      return;
    }
    if (selectedMedicalCenter === 'Otro' && !customMedicalCenter.trim()) {
      setError('Por favor especifique el centro médico de origen.');
      return;
    }
    if (selectedAgreementType === 'Otro' && !customAgreementType.trim()) {
      setError('Por favor especifique el tipo de convenio.');
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
      
      {/* Page Title with Glowing Lucide Icon Container */}
      <div
        className="glass-panel"
        style={{
          padding: '24px 30px',
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.04) 0%, rgba(20, 184, 166, 0.01) 100%), var(--glass-bg)',
          borderLeft: '4px solid #10b981',
          borderRadius: 'var(--radius-md)'
        }}
      >
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#10b981',
          boxShadow: '0 0 20px rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          flexShrink: 0
        }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <h2 style={{ fontSize: '1.75rem', fontFamily: 'var(--font-display)', fontWeight: 800, margin: 0 }}>
            Inscribir Persona y Caso Social
          </h2>
          <p style={{ opacity: 0.7, margin: 0, fontSize: '0.9rem' }}>
            Ingrese los datos personales del postulante y el detalle del convenio o caso de ayuda solicitado.
          </p>
        </div>
      </div>

      {/* Premium Amber/Orange Warning Banner */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '16px',
        padding: '16px 20px',
        backgroundColor: 'rgba(245, 158, 11, 0.05)',
        border: '1px solid rgba(245, 158, 11, 0.25)',
        borderRadius: 'var(--radius-md)',
        color: '#f59e0b',
        boxShadow: '0 4px 15px rgba(245, 158, 11, 0.02)'
      }}>
        <div style={{ flexShrink: 0, marginTop: '2px' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.88rem', lineHeight: '1.45' }}>
          <strong style={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: '0.78rem' }}>Información Importante</strong>
          <span style={{ fontWeight: 500, opacity: 0.95 }}>
            Una vez ingresado el caso, el registro quedará bloqueado para edición. Si necesitas corregir o modificar algún dato posterior al envío, por favor escribe directamente a <a href="mailto:soporte@policlinicotabancura.cl" style={{ color: '#fff', textDecoration: 'underline', fontWeight: 700 }}>soporte@policlinicotabancura.cl</a>.
          </span>
        </div>
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
                <label className="form-label" htmlFor="nationality_select">Nacionalidad *</label>
                <select 
                  className="form-select" 
                  id="nationality_select" 
                  value={selectedNationality}
                  onChange={(e) => setSelectedNationality(e.target.value)}
                  required 
                  disabled={loading}
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

                {selectedNationality === 'Otra' && (
                  <div className="animate-fade-in" style={{ marginTop: '10px' }}>
                    <label className="form-label" htmlFor="custom_nationality" style={{ fontSize: '0.78rem', opacity: 0.8 }}>Especifique la Nacionalidad *</label>
                    <input
                      className="form-input"
                      type="text"
                      id="custom_nationality"
                      placeholder="Escriba la nacionalidad"
                      value={customNationality}
                      onChange={(e) => setCustomNationality(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                )}

                <input 
                  type="hidden" 
                  name="nationality" 
                  value={selectedNationality === 'Otra' ? customNationality : selectedNationality} 
                />
              </div>

              {/* Birth Date */}
              <div className="form-group">
                <label className="form-label" htmlFor="birth_date_input">Fecha de Nacimiento *</label>
                <input 
                  className="form-input" 
                  type="text" 
                  id="birth_date_input" 
                  value={birthDateInput}
                  onChange={handleBirthDateChange}
                  placeholder="DD/MM/AAAA"
                  required
                  disabled={loading}
                  maxLength={10}
                />
                <input type="hidden" name="birth_date" value={(() => {
                  const parts = birthDateInput.split('/');
                  return parts.length === 3 && parts[2].length === 4 
                    ? `${parts[2]}-${parts[1]}-${parts[0]}` 
                    : '';
                })()} />
              </div>

              {/* Commune */}
              <div className="form-group">
                <label className="form-label" htmlFor="commune_select">Comuna de Residencia *</label>
                <select 
                  className="form-select" 
                  id="commune_select" 
                  value={selectedCommune}
                  onChange={(e) => setSelectedCommune(e.target.value)}
                  required 
                  disabled={loading}
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
                
                {selectedCommune === 'Otra Comuna' && (
                  <div className="animate-fade-in" style={{ marginTop: '10px' }}>
                    <label className="form-label" htmlFor="custom_commune" style={{ fontSize: '0.78rem', opacity: 0.8 }}>Especifique la Comuna *</label>
                    <input
                      className="form-input"
                      type="text"
                      id="custom_commune"
                      placeholder="Escriba el nombre de la comuna"
                      value={customCommune}
                      onChange={(e) => setCustomCommune(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                )}
                
                <input 
                  type="hidden" 
                  name="commune" 
                  value={selectedCommune === 'Otra Comuna' ? customCommune : selectedCommune} 
                />
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
                <label className="form-label" htmlFor="medical_center_select">Centro Médico de Origen *</label>
                <select 
                  className="form-select" 
                  id="medical_center_select" 
                  value={selectedMedicalCenter}
                  onChange={(e) => setSelectedMedicalCenter(e.target.value)}
                  required 
                  disabled={loading}
                >
                  <option value="">Seleccione un Centro</option>
                  <option value="CESFAM Vitacura">CESFAM Vitacura</option>
                  <option value="CESFAM Lo Barnechea">CESFAM Lo Barnechea</option>
                  <option value="Consultorio Dr. Aníbal Ariztía">Consultorio Dr. Aníbal Ariztía</option>
                  <option value="Otro">Otro Centro de Salud Familiar</option>
                </select>

                {selectedMedicalCenter === 'Otro' && (
                  <div className="animate-fade-in" style={{ marginTop: '10px' }}>
                    <label className="form-label" htmlFor="custom_medical_center" style={{ fontSize: '0.78rem', opacity: 0.8 }}>Especifique el Centro Médico *</label>
                    <input
                      className="form-input"
                      type="text"
                      id="custom_medical_center"
                      placeholder="Escriba el nombre del centro médico"
                      value={customMedicalCenter}
                      onChange={(e) => setCustomMedicalCenter(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                )}

                <input 
                  type="hidden" 
                  name="medical_center" 
                  value={selectedMedicalCenter === 'Otro' ? customMedicalCenter : selectedMedicalCenter} 
                />
              </div>

              {/* Agreement Type */}
              <div className="form-group">
                <label className="form-label" htmlFor="agreement_type_select">Convenio sin Costo de *</label>
                <select 
                  className="form-select" 
                  id="agreement_type_select" 
                  value={selectedAgreementType}
                  onChange={(e) => setSelectedAgreementType(e.target.value)}
                  required 
                  disabled={loading}
                >
                  <option value="">Seleccione el tipo de convenio</option>
                  <option value="Confección de Prótesis Removibles">Confección de Prótesis Removibles</option>
                  <option value="Atención Dental Básica">Atención Dental Básica</option>
                  <option value="Tratamiento de Endodoncia">Tratamiento de Endodoncia</option>
                  <option value="Implantes Dentales">Implantes Dentales</option>
                  <option value="Otro">Otro Convenio</option>
                </select>

                {selectedAgreementType === 'Otro' && (
                  <div className="animate-fade-in" style={{ marginTop: '10px' }}>
                    <label className="form-label" htmlFor="custom_agreement_type" style={{ fontSize: '0.78rem', opacity: 0.8 }}>Especifique el Convenio *</label>
                    <input
                      className="form-input"
                      type="text"
                      id="custom_agreement_type"
                      placeholder="Escriba el tipo de convenio"
                      value={customAgreementType}
                      onChange={(e) => setCustomAgreementType(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                )}

                <input 
                  type="hidden" 
                  name="agreement_type" 
                  value={selectedAgreementType === 'Otro' ? customAgreementType : selectedAgreementType} 
                />
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

            <div className="form-group" style={{ marginTop: '20px' }}>
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
                <input className="form-input" type="text" id="professional_name" name="professional_name" required readOnly={true} value={profName} style={{ opacity: 0.65, cursor: 'not-allowed', backgroundColor: 'rgba(255, 255, 255, 0.02)' }} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="professional_title">Profesión *</label>
                <input className="form-input" type="text" id="professional_title" name="professional_title" required readOnly={true} value={profTitle} style={{ opacity: 0.65, cursor: 'not-allowed', backgroundColor: 'rgba(255, 255, 255, 0.02)' }} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="professional_position">Cargo *</label>
                <input className="form-input" type="text" id="professional_position" name="professional_position" required readOnly={true} value={profPosition} style={{ opacity: 0.65, cursor: 'not-allowed', backgroundColor: 'rgba(255, 255, 255, 0.02)' }} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="professional_email">Correo de Contacto *</label>
                <input className="form-input" type="email" id="professional_email" name="professional_email" required readOnly={true} value={profEmail} style={{ opacity: 0.65, cursor: 'not-allowed', backgroundColor: 'rgba(255, 255, 255, 0.02)' }} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="professional_address">Dirección del Centro *</label>
                <input className="form-input" type="text" id="professional_address" name="professional_address" required readOnly={true} value={profAddress} style={{ opacity: 0.65, cursor: 'not-allowed', backgroundColor: 'rgba(255, 255, 255, 0.02)' }} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="professional_website">Sitio Web (Opcional)</label>
                <input className="form-input" type="text" id="professional_website" name="professional_website" readOnly={true} value={profWebsite} style={{ opacity: 0.65, cursor: 'not-allowed', backgroundColor: 'rgba(255, 255, 255, 0.02)' }} />
              </div>
            </div>

            {/* Warning Banner for Professional Fields */}
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '16px',
              padding: '16px 20px',
              borderRadius: '12px',
              backgroundColor: 'rgba(217, 119, 6, 0.05)',
              border: '1px solid rgba(217, 119, 6, 0.2)',
              marginTop: '24px'
            }}>
              <div style={{
                color: '#f59e0b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginTop: '2px'
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  color: '#f59e0b',
                  letterSpacing: '0.05em'
                }}>
                  Información Importante
                </span>
                <p style={{
                  fontSize: '0.85rem',
                  color: 'rgba(255, 255, 255, 0.7)',
                  margin: 0,
                  lineHeight: '1.4'
                }}>
                  Si quieres modificar tus datos registrados, debes enviar un correo a{' '}
                  <a href="mailto:derivaciones@policlinicotabancura.cl" style={{ fontWeight: 700, textDecoration: 'underline', color: '#fbbf24' }}>
                    derivaciones@policlinicotabancura.cl
                  </a>.
                </p>
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
