'use client';

import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { formatRUT, formatDate, formatDateTime } from '@/lib/utils';
import { updateCaseStatusAction, deleteCaseAction, updateCaseDetailsAction } from '@/app/actions/caseActions';
import { getConveniosByMedicalCenterAction } from '@/app/actions/convenioActions';
import { UserSession } from '@/lib/auth';
import Link from 'next/link';
import CustomSelect from '@/components/ui/CustomSelect';
import CustomDatePicker from '@/components/ui/CustomDatePicker';
import Odontogram from '@/components/Odontogram';
import { getOdontogramPrestacionesAction } from '@/app/actions/arancelActions';

interface CaseRecord {
  id: string;
  rut: string;
  first_names: string;
  last_names: string;
  nationality: string;
  birth_date: Date | string;
  commune: string;
  email: string | null;
  mobile: string;
  description: string;
  medical_center: string | null;
  agreement_type: string | null;
  dental_diagnosis: string | null;
  treatment_needed: string | null;
  professional_name: string | null;
  status: 'ingresado' | 'agendado' | 'en_tratamiento' | 'finalizado' | 'sincronizado';
  observations: string | null;
  created_at: Date | string;
  registered_by_name: string | null;
  evaluator_name: string | null;
  yearly_correlative?: number | string;
  dental_count?: number;
  xray_count?: number;
  status_history?: Record<string, string>;
}

const formatDateTimeCompact = (dateInput: any) => {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

interface CaseListClientProps {
  initialCases: CaseRecord[];
  user: UserSession;
}

export default function CaseListClient({ initialCases, user }: CaseListClientProps) {
  const [cases, setCases] = useState<CaseRecord[]>(initialCases);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [hoveredCase, setHoveredCase] = useState<{ case: CaseRecord; rect: { top: number; bottom: number; left: number; width: number } } | null>(null);

  // Advanced filters state
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [institutionFilter, setInstitutionFilter] = useState('todos');
  const [agreementFilter, setAgreementFilter] = useState('todos');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [prestacionFilter, setPrestacionFilter] = useState('todos');

  // Load search from URL parameters if present
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const searchParam = params.get('search');
      if (searchParam) {
        setSearchTerm(searchParam);
      }
    }
  }, []);

  // Modal & Edit state
  const [selectedCase, setSelectedCase] = useState<CaseRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [evalStatus, setEvalStatus] = useState<'ingresado' | 'agendado' | 'en_tratamiento' | 'finalizado' | 'sincronizado'>('ingresado');
  const [evalObs, setEvalObs] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [prestacionesList, setPrestacionesList] = useState<{ id_prestacion: number; name: string }[]>([]);

  useEffect(() => {
    async function loadPrestaciones() {
      try {
        const res = await getOdontogramPrestacionesAction();
        if (res.success && res.data) {
          setPrestacionesList(res.data
            .filter(item => typeof item.id_prestacion === 'number')
            .map(item => ({
              id_prestacion: item.id_prestacion as number,
              name: item.name
            }))
          );
        }
      } catch (err) {
        console.error('Failed to load prestaciones in CaseList:', err);
      }
    }
    loadPrestaciones();
  }, []);

  // Edit case details states (for admin only)
  const [isEditing, setIsEditing] = useState(false);
  const [editRut, setEditRut] = useState('');
  const [editFirstNames, setEditFirstNames] = useState('');
  const [editLastNames, setEditLastNames] = useState('');
  const [editNationality, setEditNationality] = useState('');
  const [editBirthDate, setEditBirthDate] = useState('');
  const [editCommune, setEditCommune] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editMobile, setEditMobile] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editMedicalCenter, setEditMedicalCenter] = useState('');
  const [editAgreementType, setEditAgreementType] = useState('');
  const [editDentalDiagnosis, setEditDentalDiagnosis] = useState('');
  const [editTreatmentNeeded, setEditTreatmentNeeded] = useState('');
  const [editProfessionalName, setEditProfessionalName] = useState('');

  const [editMedicalCenterSelect, setEditMedicalCenterSelect] = useState('');
  const [customEditMedicalCenter, setCustomEditMedicalCenter] = useState('');
  const [editAgreementTypeSelect, setEditAgreementTypeSelect] = useState('');
  const [customEditAgreementType, setCustomEditAgreementType] = useState('');
  const [editAgreements, setEditAgreements] = useState<{ value: string; label: string }[]>([]);

  // Filter cases based on search and status dropdown
  const filteredCases = cases.filter((c) => {
    const fullName = `${c.first_names} ${c.last_names}`.toLowerCase();
    const cleanRutStr = c.rut.toLowerCase();
    const descStr = (c.description || '').toLowerCase();
    const diagStr = (c.dental_diagnosis || '').toLowerCase();
    const query = searchTerm.toLowerCase();

    const matchesSearch =
      fullName.includes(query) ||
      cleanRutStr.includes(query) ||
      descStr.includes(query) ||
      diagStr.includes(query);

    const matchesStatus =
      statusFilter === 'todos' ||
      c.status === statusFilter;

    const matchesInstitution =
      institutionFilter === 'todos' ||
      c.medical_center === institutionFilter;

    const matchesAgreement =
      agreementFilter === 'todos' ||
      c.agreement_type === agreementFilter;

    let matchesDate = true;
    if (startDate || endDate) {
      const caseDate = new Date(c.created_at);
      caseDate.setHours(0, 0, 0, 0);

      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (caseDate < start) matchesDate = false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(0, 0, 0, 0);
        if (caseDate > end) matchesDate = false;
      }
    }

    let matchesPrestacion = true;
    if (prestacionFilter === 'dental') {
      matchesPrestacion = (c.dental_count || 0) > 0;
    } else if (prestacionFilter === 'xray') {
      matchesPrestacion = (c.xray_count || 0) > 0;
    }

    return matchesSearch && matchesStatus && matchesInstitution && matchesAgreement && matchesDate && matchesPrestacion;
  });

  const uniqueInstitutions = Array.from(new Set(cases.map(c => c.medical_center).filter(Boolean))) as string[];
  const uniqueAgreements = Array.from(new Set(cases.map(c => c.agreement_type).filter(Boolean))) as string[];

  function openDetails(c: CaseRecord) {
    setSelectedCase(c);
    setEvalStatus(c.status);
    setEvalObs(c.observations || '');

    // Initialize edit details states
    setEditRut(c.rut);
    setEditFirstNames(c.first_names);
    setEditLastNames(c.last_names);
    setEditNationality(c.nationality);
    const bdStr = c.birth_date ? new Date(c.birth_date).toISOString().split('T')[0] : '';
    setEditBirthDate(bdStr);
    setEditCommune(c.commune);
    setEditEmail(c.email || '');
    setEditMobile(c.mobile);
    setEditDescription(c.description || '');
    setEditMedicalCenter(c.medical_center || '');
    setEditAgreementType(c.agreement_type || '');
    setEditDentalDiagnosis(c.dental_diagnosis || '');
    setEditTreatmentNeeded(c.treatment_needed || '');
    setEditProfessionalName(c.professional_name || '');

    const knownCenters = ['CESFAM Vitacura', 'CESFAM Lo Barnechea', 'Consultorio Dr. Aníbal Ariztía', 'Policlinico Tabancura'];
    if (c.medical_center && knownCenters.includes(c.medical_center)) {
      setEditMedicalCenterSelect(c.medical_center);
      setCustomEditMedicalCenter('');
    } else {
      setEditMedicalCenterSelect(c.medical_center ? 'Otro' : '');
      setCustomEditMedicalCenter(c.medical_center || '');
    }

    setIsEditing(false);
    setError(null);
    setSuccess(null);
    setIsModalOpen(true);
  }

  useEffect(() => {
    async function loadEditConvenios() {
      const center = editMedicalCenterSelect === 'Otro' ? customEditMedicalCenter : editMedicalCenterSelect;
      if (!center) {
        setEditAgreements([{ value: 'Otro', label: 'Otro Convenio' }]);
        return;
      }

      try {
        const res = await getConveniosByMedicalCenterAction(center);
        if (res.success && res.convenios) {
          const mapped = res.convenios.map((cov: any) => ({
            value: cov.empresa,
            label: cov.empresa,
          }));
          mapped.push({ value: 'Otro', label: 'Otro Convenio' });
          setEditAgreements(mapped);

          // Attempt to map the loaded agreement
          const currentAgreement = selectedCase?.agreement_type || '';
          const isValid = mapped.some((opt: any) => opt.value === currentAgreement);
          if (isValid) {
            setEditAgreementTypeSelect(currentAgreement);
            setCustomEditAgreementType('');
          } else {
            setEditAgreementTypeSelect(currentAgreement ? 'Otro' : '');
            setCustomEditAgreementType(currentAgreement);
          }
        } else {
          setEditAgreements([{ value: 'Otro', label: 'Otro Convenio' }]);
          setEditAgreementTypeSelect(selectedCase?.agreement_type ? 'Otro' : '');
          setCustomEditAgreementType(selectedCase?.agreement_type || '');
        }
      } catch (err) {
        console.error('Failed to load edit convenios:', err);
        setEditAgreements([{ value: 'Otro', label: 'Otro Convenio' }]);
      }
    }
    if (isEditing) {
      loadEditConvenios();
    }
  }, [editMedicalCenterSelect, customEditMedicalCenter, isEditing, selectedCase]);

  async function handleDeleteCase(caseId: string, name: string) {
    const confirmed = window.confirm(`¿Está seguro de que desea eliminar permanentemente el caso social de ${name}? Esta acción no se puede deshacer.`);
    if (!confirmed) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await deleteCaseAction(caseId);

      if (result.success) {
        alert(`El caso de ${name} ha sido eliminado correctamente.`);
        setCases(cases.filter(c => c.id !== caseId));
        if (selectedCase?.id === caseId) {
          setIsModalOpen(false);
          setSelectedCase(null);
        }
      } else {
        setError(result.error || 'Error al eliminar el caso');
        alert(result.error || 'Error al eliminar el caso');
      }
    } catch (err) {
      setError('Error en el servidor al eliminar el caso.');
      alert('Error en el servidor al eliminar el caso.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveDetails(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCase) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    const finalMedicalCenter = editMedicalCenterSelect === 'Otro' ? customEditMedicalCenter : editMedicalCenterSelect;
    const finalAgreementType = editAgreementTypeSelect === 'Otro' ? customEditAgreementType : editAgreementTypeSelect;

    try {
      const result = await updateCaseDetailsAction(selectedCase.id, {
        rut: editRut,
        first_names: editFirstNames,
        last_names: editLastNames,
        nationality: editNationality,
        birth_date: editBirthDate,
        commune: editCommune,
        email: editEmail,
        mobile: editMobile,
        description: editDescription,
        medical_center: finalMedicalCenter,
        agreement_type: finalAgreementType,
        dental_diagnosis: editDentalDiagnosis,
        treatment_needed: editTreatmentNeeded,
        professional_name: editProfessionalName
      });

      if (result.success) {
        setSuccess('¡Datos del caso actualizados con éxito!');

        // Update local records state so UI updates instantly
        const updatedRecord: CaseRecord = {
          ...selectedCase,
          rut: editRut,
          first_names: editFirstNames,
          last_names: editLastNames,
          nationality: editNationality,
          birth_date: editBirthDate,
          commune: editCommune,
          email: editEmail || null,
          mobile: editMobile,
          description: editDescription,
          medical_center: finalMedicalCenter || null,
          agreement_type: finalAgreementType || null,
          dental_diagnosis: editDentalDiagnosis || null,
          treatment_needed: editTreatmentNeeded || null,
          professional_name: editProfessionalName || null
        };

        setCases(cases.map(c => c.id === selectedCase.id ? updatedRecord : c));
        setSelectedCase(updatedRecord);

        setTimeout(() => {
          setIsEditing(false);
          setSuccess(null);
        }, 1200);
      } else {
        setError(result.error || 'Error al actualizar los datos');
      }
    } catch (err) {
      setError('Error en el servidor al actualizar los datos del caso.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveEvaluation(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCase) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await updateCaseStatusAction(selectedCase.id, evalStatus, evalObs);

      if (result.success) {
        setSuccess('¡Evaluación y convenio guardados exitosamente!');

        // Update local state immediately for fast feedback
        setCases(cases.map(c =>
          c.id === selectedCase.id
            ? { ...c, status: evalStatus, observations: evalObs, evaluator_name: user.name }
            : c
        ));

        // Update selected case view inside the modal
        setSelectedCase({
          ...selectedCase,
          status: evalStatus,
          observations: evalObs,
          evaluator_name: user.name
        });

        setTimeout(() => {
          setIsModalOpen(false);
          setSuccess(null);
        }, 1500);
      } else {
        setError(result.error || 'Error al guardar la evaluación');
      }
    } catch (err) {
      setError('Error en el servidor al evaluar el caso.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Page Title with Action Button on the same row inside the container */}
      <div
        className="glass-panel"
        style={{
          padding: '24px 30px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.04) 0%, rgba(20, 184, 166, 0.01) 100%), var(--glass-bg)',
          borderLeft: '4px solid #10b981',
          borderRadius: 'var(--radius-md)',
          flexWrap: 'wrap',
          gap: '20px',
          width: '100%'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
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
            <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="8" y="2" width="8" height="4" rx="1" ry="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><path d="M9 9h6" /><path d="M9 13h6" /><path d="M9 17h6" /></svg>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <h2 style={{ fontSize: '1.75rem', fontFamily: 'var(--font-display)', fontWeight: 800, margin: 0 }}>
              Bandeja de Casos Sociales
            </h2>
            <p style={{ opacity: 0.7, margin: 0, fontSize: '0.9rem' }}>
              {user.role === 'external'
                ? 'Monitoree el estado de revisión de los casos que ha inscrito.'
                : 'Filtre, evalúe y asigne estados de convenios a los casos postulantes.'}
            </p>
          </div>
        </div>

        {user.role !== 'internal' && user.role !== 'reader' && (
          <Link href="/dashboard/register" className="login-pill-btn" style={{ gap: '8px' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Nueva Derivación
          </Link>
        )}
      </div>

      {/* Filter panel */}
      <div
        className="glass-panel"
        style={{
          padding: '20px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}
      >
        <div style={{
          display: 'flex',
          gap: '20px',
          alignItems: 'center',
          flexWrap: 'wrap',
          width: '100%'
        }}>
          <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
            <input
              className="form-input"
              type="text"
              placeholder="Buscar por Nombre, RUT o Descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', paddingLeft: '40px' }}
            />
            <div style={{ position: 'absolute', left: '14px', top: '15px', opacity: 0.5 }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, opacity: 0.7, textTransform: 'uppercase' }}>Estado:</span>
            <div style={{ minWidth: '180px' }}>
              <CustomSelect
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                  { value: 'todos', label: 'Todos los Estados' },
                  { value: 'ingresado', label: 'Ingresados' },
                  { value: 'sincronizado', label: 'Sincronizados' },
                  { value: 'agendado', label: 'Agendados' },
                  { value: 'en_tratamiento', label: 'En Tratamiento' },
                  { value: 'finalizado', label: 'Finalizados' }
                ]}
              />
            </div>
          </div>

          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="btn btn-secondary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              fontWeight: 600,
              backgroundColor: showAdvancedFilters ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
              borderColor: showAdvancedFilters ? '#10b981' : 'var(--glass-border)',
              color: showAdvancedFilters ? '#10b981' : 'inherit',
              transition: 'all 0.2s ease'
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" /><line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" /><line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" /><line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" /></svg>
            Filtros Avanzados
            <span style={{
              transform: showAdvancedFilters ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
              display: 'inline-block',
              fontSize: '0.75rem'
            }}>▼</span>
          </button>
        </div>

        {/* Collapsible advanced filters area */}
        {showAdvancedFilters && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              paddingTop: '16px',
              borderTop: '1px solid var(--glass-border)',
              animation: 'slideDown 0.2s ease-out'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, opacity: 0.7 }}>Centro Médico</label>
              <CustomSelect
                value={institutionFilter}
                onChange={setInstitutionFilter}
                options={[
                  { value: 'todos', label: 'Todos los Centros' },
                  ...uniqueInstitutions.map(inst => ({ value: inst, label: inst }))
                ]}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, opacity: 0.7 }}>Convenio</label>
              <CustomSelect
                value={agreementFilter}
                onChange={setAgreementFilter}
                options={[
                  { value: 'todos', label: 'Todos los Convenios' },
                  ...uniqueAgreements.map(agr => ({ value: agr, label: agr }))
                ]}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, opacity: 0.7 }}>Prestaciones</label>
              <CustomSelect
                value={prestacionFilter}
                onChange={setPrestacionFilter}
                options={[
                  { value: 'todos', label: 'Todas las Prestaciones' },
                  { value: 'dental', label: 'Sólo Dentales (🦷 > 0)' },
                  { value: 'xray', label: 'Sólo Rayos X (⚡ > 0)' }
                ]}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, opacity: 0.7 }}>Fecha Desde</label>
              <CustomDatePicker
                value={startDate}
                onChange={setStartDate}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, opacity: 0.7 }}>Fecha Hasta</label>
              <CustomDatePicker
                value={endDate}
                onChange={setEndDate}
              />
            </div>
          </div>
        )}
      </div>

      {/* Main Glass Table Container */}
      <div className="glass-panel" style={{ padding: '24px', overflow: 'hidden', minHeight: '380px' }}>
        {filteredCases.length === 0 ? (
          <div style={{ padding: '50px 20px', textAlign: 'center', opacity: 0.6 }}>
            No se encontraron casos registrados con los filtros seleccionados.
          </div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Beneficiario</th>
                  <th>RUT</th>
                  <th>Comuna</th>
                  <th>Detalle de Derivación</th>
                  <th>Prestaciones</th>
                  <th>Fecha Ingreso</th>
                  <th>Profesional Derivador</th>
                  <th>Estado</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredCases.map((c, idx) => (
                  <tr key={c.id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600, opacity: 0.8 }}>
                      {c.yearly_correlative ? String(c.yearly_correlative).padStart(4, '0') : '-'}
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      {c.first_names} {c.last_names}
                    </td>
                    <td style={{ whiteSpace: 'nowrap', opacity: 0.9 }}>{formatRUT(c.rut)}</td>
                    <td>{c.commune}</td>
                    <td
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setHoveredCase({
                          case: c,
                          rect: {
                            top: rect.top,
                            bottom: rect.bottom,
                            left: rect.left,
                            width: rect.width
                          }
                        });
                      }}
                      onMouseLeave={() => setHoveredCase(null)}
                      style={{ cursor: 'help' }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontWeight: 700, color: 'hsl(var(--accent-hsl))', fontSize: '0.88rem' }}>
                          {c.agreement_type || 'Sin Convenio'}
                        </span>
                        {c.medical_center && (
                          <span style={{ fontSize: '0.72rem', opacity: 0.7, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            📍 {c.medical_center}
                          </span>
                        )}
                        <span
                          style={{
                            fontSize: '0.72rem',
                            opacity: 0.6,
                            maxWidth: '220px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                          title={c.dental_diagnosis ? `Diag: ${c.dental_diagnosis}` : c.description || ''}
                        >
                          💬 {c.dental_diagnosis ? `Diag: ${c.dental_diagnosis}` : c.description || 'Sin descripción'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                        <span style={{ fontWeight: 700, color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          🦷 {c.dental_count || 0} Dentales
                        </span>
                        <span style={{ fontWeight: 700, color: '#a855f7', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          ⚡ {c.xray_count || 0} Rayos X
                        </span>
                      </div>
                    </td>
                    <td style={{ fontSize: '0.85rem', opacity: 0.7 }}>{formatDate(c.created_at)}</td>
                    <td style={{ fontSize: '0.85rem', opacity: 0.8 }}>{c.registered_by_name || 'Admin Semilla'}</td>
                    <td>
                      <div className="status-timeline-tooltip-container" style={{ position: 'relative', display: 'inline-block' }}>
                        <style>{`
                          .status-timeline-tooltip-container:hover .status-timeline-tooltip {
                            display: flex !important;
                          }
                        `}</style>
                        <span className={`badge badge-${c.status}`} style={{ cursor: 'help', padding: '4px 10px', fontSize: '0.75rem', fontWeight: 700 }}>
                          {c.status === 'en_tratamiento' ? 'En tratamiento' : c.status === 'sincronizado' ? 'Sincronizado' : c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                        </span>
                        
                          {/* Hover Tooltip Box */}
                          {(() => {
                            const isLastRow = idx === filteredCases.length - 1;
                            const isFirstRow = idx === 0;
                            
                            const tooltipStyle: React.CSSProperties = {
                              position: 'absolute',
                              right: '110%',
                              backgroundColor: '#111827',
                              border: '1px solid rgba(255, 255, 255, 0.15)',
                              borderRadius: '8px',
                              padding: '12px 16px',
                              zIndex: 100,
                              width: '270px',
                              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
                              display: 'none',
                              flexDirection: 'column',
                              gap: '6px',
                              pointerEvents: 'none',
                              ...(isLastRow && !isFirstRow ? {
                                bottom: '-8px',
                                transform: 'none'
                              } : isFirstRow ? {
                                top: '-8px',
                                transform: 'none'
                              } : {
                                top: '50%',
                                transform: 'translateY(-50%)'
                              })
                            };
                            
                            const arrowStyle: React.CSSProperties = {
                              position: 'absolute',
                              left: '100%',
                              width: '0',
                              height: '0',
                              borderTop: '6px solid transparent',
                              borderBottom: '6px solid transparent',
                              borderLeft: '6px solid #111827',
                              ...(isLastRow && !isFirstRow ? {
                                bottom: '12px',
                                transform: 'none'
                              } : isFirstRow ? {
                                top: '12px',
                                transform: 'none'
                              } : {
                                top: '50%',
                                transform: 'translateY(-50%)'
                              })
                            };

                            return (
                              <div className="status-timeline-tooltip" style={tooltipStyle}>
                                {/* Triangle Arrow */}
                                <div style={arrowStyle} />
                                
                                <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'hsl(var(--foreground-hsl))', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '6px', marginBottom: '4px', textAlign: 'left' }}>
                                  Historial de Estados
                                </div>
                                
                                {/* Timeline Items */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.72rem', textAlign: 'left' }}>
                                  {[
                                    { key: 'ingresado', label: 'Ingresado', color: '#10b981' },
                                    { key: 'sincronizado', label: 'Sincronizado', color: '#10b981' },
                                    { key: 'agendado', label: 'Agendado', color: '#3b82f6' },
                                    { key: 'en_tratamiento', label: 'En Tto', color: '#a855f7' },
                                    { key: 'finalizado', label: 'Finalizado', color: '#10b981' }
                                  ].map((state) => {
                                    const hasTimestamp = !!c.status_history?.[state.key];
                                    const isCurrent = c.status === state.key;
                                    const timestampValue = c.status_history?.[state.key];
                                    
                                    return (
                                      <div 
                                        key={state.key}
                                        style={{ 
                                          display: 'flex', 
                                          justifyContent: 'space-between', 
                                          alignItems: 'center', 
                                          gap: '8px',
                                          padding: '4px 6px',
                                          borderRadius: '4px',
                                          backgroundColor: isCurrent ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                                          border: isCurrent ? `1px solid ${state.color}` : '1px solid transparent'
                                        }}
                                      >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                          <span style={{ 
                                            color: hasTimestamp ? state.color : 'rgba(255,255,255,0.25)', 
                                            fontWeight: isCurrent ? 800 : 600 
                                          }}>
                                            ● {state.label}:
                                          </span>
                                          {isCurrent && (
                                            <span style={{ 
                                              fontSize: '0.58rem', 
                                              color: '#fff', 
                                              backgroundColor: state.color, 
                                              padding: '1px 4px', 
                                              borderRadius: '3px', 
                                              fontWeight: 800,
                                              textTransform: 'uppercase',
                                              letterSpacing: '0.5px'
                                            }}>
                                              Actual
                                            </span>
                                          )}
                                        </div>
                                        <span style={{ 
                                          color: hasTimestamp ? '#ffffff' : 'rgba(255,255,255,0.25)', 
                                          fontFamily: 'monospace',
                                          fontWeight: isCurrent ? 700 : 'normal' 
                                        }}>
                                          {hasTimestamp ? formatDateTimeCompact(timestampValue) : '--/-- --:--'}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })()}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                        <button
                          onClick={() => openDetails(c)}
                          className="btn btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                        >
                          Ver Ficha
                        </button>
                        <a
                          href={`/dashboard/cases/${c.id}/print`}
                          target="_blank"
                          className="btn btn-primary"
                          style={{ padding: '6px 12px', fontSize: '0.8rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></svg>
                          Imprimir
                        </a>
                        {user.role === 'admin' && (
                          <button
                            onClick={() => handleDeleteCase(c.id, `${c.first_names} ${c.last_names}`)}
                            className="btn btn-danger"
                            style={{ padding: '6px 10px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center' }}
                            title="Eliminar Caso"
                            disabled={loading}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Ficha / Case Detail Modal */}
      {selectedCase && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={`Ficha de Caso Social - ${selectedCase.first_names} ${selectedCase.last_names}`}
          maxWidth="1200px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>


            {isEditing ? (
              /* Editable details form for administrator role */
              <form onSubmit={handleSaveDetails} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {error && (
                  <div className="badge-rechazado" style={{ padding: '12px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', fontWeight: 600, border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                    {error}
                  </div>
                )}
                {success && (
                  <div className="badge-aprobado" style={{ padding: '12px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', fontWeight: 600, border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                    {success}
                  </div>
                )}

                <div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 800, opacity: 0.8, color: 'hsl(var(--accent-hsl))', borderBottom: '1px solid var(--glass-border)', paddingBottom: '8px', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                    Editar Datos del Postulante
                  </h4>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                    <div style={{ padding: '12px 16px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)' }}>
                      <label style={{ opacity: 0.5, display: 'block', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Nombres</label>
                      <input type="text" className="form-input" value={editFirstNames} onChange={e => setEditFirstNames(e.target.value)} required style={{ width: '100%' }} />
                    </div>
                    <div style={{ padding: '12px 16px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)' }}>
                      <label style={{ opacity: 0.5, display: 'block', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Apellidos</label>
                      <input type="text" className="form-input" value={editLastNames} onChange={e => setEditLastNames(e.target.value)} required style={{ width: '100%' }} />
                    </div>
                    <div style={{ padding: '12px 16px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)' }}>
                      <label style={{ opacity: 0.5, display: 'block', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>RUT</label>
                      <input type="text" className="form-input" value={editRut} onChange={e => setEditRut(e.target.value.replace(/[^0-9kK.-]/g, ''))} maxLength={12} required style={{ width: '100%' }} />
                    </div>
                    <div style={{ padding: '12px 16px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)' }}>
                      <label style={{ opacity: 0.5, display: 'block', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Nacionalidad</label>
                      <input type="text" className="form-input" value={editNationality} onChange={e => setEditNationality(e.target.value)} required style={{ width: '100%' }} />
                    </div>
                    <div style={{ padding: '12px 16px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)' }}>
                      <label style={{ opacity: 0.5, display: 'block', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Fecha de Nacimiento</label>
                      <CustomDatePicker
                        value={editBirthDate}
                        onChange={setEditBirthDate}
                        required
                      />
                    </div>
                    <div style={{ padding: '12px 16px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)' }}>
                      <label style={{ opacity: 0.5, display: 'block', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Comuna Residencia</label>
                      <input type="text" className="form-input" value={editCommune} onChange={e => setEditCommune(e.target.value)} required style={{ width: '100%' }} />
                    </div>
                    <div style={{ padding: '12px 16px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)' }}>
                      <label style={{ opacity: 0.5, display: 'block', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Celular Contacto</label>
                      <input type="text" className="form-input" value={editMobile} onChange={e => setEditMobile(e.target.value)} required style={{ width: '100%' }} />
                    </div>
                    <div style={{ padding: '12px 16px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)' }}>
                      <label style={{ opacity: 0.5, display: 'block', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Correo Electrónico</label>
                      <input type="email" className="form-input" value={editEmail} onChange={e => setEditEmail(e.target.value)} style={{ width: '100%' }} />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 800, opacity: 0.8, color: 'hsl(var(--accent-hsl))', borderBottom: '1px solid var(--glass-border)', paddingBottom: '8px', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
                    Editar Detalles de la Solicitud
                  </h4>

                  <div className="glass-panel" style={{ padding: '24px', backgroundColor: 'rgba(255, 255, 255, 0.01)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                      {/* Interactive Odontogram Editor */}
                      <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
                        <label style={{ fontSize: '0.88rem', fontWeight: 800, opacity: 0.9, color: 'hsl(var(--accent-hsl))' }}>Odontograma Clínico Interactivo</label>
                        <div style={{ width: '100%', overflowX: 'auto', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', padding: '16px', background: 'rgba(0, 0, 0, 0.2)' }}>
                          <Odontogram
                            initialType="adult"
                            initialDentalDiagnosis={selectedCase.dental_diagnosis}
                            initialTreatmentNeeded={selectedCase.treatment_needed}
                            onChange={(odontData) => {
                              setEditDentalDiagnosis(odontData.dentalDiagnosis);
                              setEditTreatmentNeeded(odontData.treatmentNeeded);
                            }}
                          />
                        </div>
                      </div>

                      <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 700, opacity: 0.7 }}>Observaciones Generales / Descripción</label>
                        <textarea className="form-textarea" rows={3} value={editDescription} onChange={e => setEditDescription(e.target.value)} style={{ width: '100%', resize: 'vertical' }} />
                      </div>
                      <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 700, opacity: 0.7 }}>Profesional Derivador</label>
                        <input type="text" className="form-input" value={editProfessionalName} onChange={e => setEditProfessionalName(e.target.value)} style={{ width: '100%' }} />
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                  <button type="button" onClick={() => setIsEditing(false)} className="btn-secondary" disabled={loading} style={{ padding: '10px 20px' }}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn-accent" disabled={loading} style={{ padding: '10px 20px', fontWeight: 750, boxShadow: '0 4px 15px rgba(20, 184, 166, 0.25)' }}>
                    {loading ? 'Guardando...' : 'Guardar Cambios de Ficha'}
                  </button>
                </div>
              </form>
            ) : (
              /* Read-only details view (original layout) */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                {/* Beneficiary particulars grid */}
                <div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 800, opacity: 0.8, color: 'hsl(var(--accent-hsl))', borderBottom: '1px solid var(--glass-border)', paddingBottom: '8px', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                    Datos del Postulante
                  </h4>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                    <div style={{ padding: '12px 16px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)' }}>
                      <span style={{ opacity: 0.5, display: 'block', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>RUT</span>
                      <strong style={{ fontSize: '0.95rem' }}>{formatRUT(selectedCase.rut)}</strong>
                    </div>
                    <div style={{ padding: '12px 16px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)' }}>
                      <span style={{ opacity: 0.5, display: 'block', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>Nacionalidad</span>
                      <strong style={{ fontSize: '0.95rem' }}>{selectedCase.nationality}</strong>
                    </div>
                    <div style={{ padding: '12px 16px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)' }}>
                      <span style={{ opacity: 0.5, display: 'block', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>Fecha de Nacimiento</span>
                      <strong style={{ fontSize: '0.95rem' }}>{formatDate(selectedCase.birth_date)}</strong>
                    </div>
                    <div style={{ padding: '12px 16px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)' }}>
                      <span style={{ opacity: 0.5, display: 'block', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>Comuna Residencia</span>
                      <strong style={{ fontSize: '0.95rem' }}>{selectedCase.commune}</strong>
                    </div>
                    <div style={{ padding: '12px 16px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)' }}>
                      <span style={{ opacity: 0.5, display: 'block', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>Celular Contacto</span>
                      <strong style={{ fontSize: '0.95rem' }}>{selectedCase.mobile}</strong>
                    </div>
                    <div style={{ padding: '12px 16px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                      <span style={{ opacity: 0.5, display: 'block', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>Correo Electrónico</span>
                      <strong style={{ fontSize: '0.95rem', wordBreak: 'break-all', display: 'block' }}>{selectedCase.email || '-'}</strong>
                    </div>
                  </div>
                </div>

                {/* Case Details */}
                <div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 800, opacity: 0.8, color: 'hsl(var(--accent-hsl))', borderBottom: '1px solid var(--glass-border)', paddingBottom: '8px', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
                    Detalles de la Solicitud Social
                  </h4>
                  <div
                    className="glass-panel"
                    style={{
                      padding: '20px',
                      backgroundColor: 'rgba(255, 255, 255, 0.01)',
                      border: '1px solid var(--glass-border)',
                      fontSize: '0.95rem',
                      lineHeight: '1.6',
                      borderRadius: 'var(--radius-md)'
                    }}
                  >
                    {selectedCase.dental_diagnosis ? (() => {
                      // Helper to parse serialized odontogram text into structured data
                      const parseOdontogram = (diagText: string | null, treatText: string | null) => {
                        const piecesMap: Record<string, { id: string; diagnosis: string; treatments: string }> = {};

                        if (diagText) {
                          diagText.split('\n').forEach(line => {
                            if (line.startsWith('[Odontograma') || !line.trim()) return;
                            const match = line.match(/^(Pieza\s+\d+|Arcada\s+\w+|Boca\s+\w+)/i);
                            if (match) {
                              const pId = match[1];
                              const details = line.substring(pId.length).replace(/^:\s*/, '').trim();
                              piecesMap[pId] = { id: pId, diagnosis: details, treatments: '' };
                            }
                          });
                        }

                        if (treatText) {
                          treatText.split('\n').forEach(line => {
                            if (!line.trim()) return;
                            const match = line.match(/^(Pieza\s+\d+|Arcada\s+\w+|Boca\s+\w+)/i);
                            if (match) {
                              const pId = match[1];
                              const start = line.indexOf('[');
                              const end = line.lastIndexOf(']');
                              let treatVal = '';
                              if (start !== -1 && end !== -1 && end > start) {
                                treatVal = line.substring(start + 1, end);
                              } else {
                                treatVal = line.substring(pId.length).replace(/^:\s*Realizar\s*/, '').trim();
                              }

                              if (piecesMap[pId]) {
                                piecesMap[pId].treatments = treatVal;
                              } else {
                                piecesMap[pId] = { id: pId, diagnosis: 'No especificado', treatments: treatVal };
                              }
                            }
                          });
                        }
                        return Object.values(piecesMap);
                      };

                      const parsedPieces = parseOdontogram(selectedCase.dental_diagnosis, selectedCase.treatment_needed);

                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                            <div style={{ padding: '12px 16px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)' }}>
                              <span style={{ opacity: 0.5, display: 'block', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>Institución</span>
                              <strong style={{ fontSize: '0.95rem' }}>{selectedCase.medical_center || 'No asignado'}</strong>
                            </div>
                            <div style={{ padding: '12px 16px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)' }}>
                              <span style={{ opacity: 0.5, display: 'block', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>Convenio Asignado</span>
                              <strong style={{ fontSize: '0.95rem', color: 'hsl(var(--accent-hsl))' }}>{selectedCase.agreement_type || 'Sin Convenio'}</strong>
                            </div>
                            <div style={{ padding: '12px 16px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)' }}>
                              <span style={{ opacity: 0.5, display: 'block', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>Profesional Derivador</span>
                              <strong style={{ fontSize: '0.95rem', color: 'hsl(var(--primary-hsl))' }}>{selectedCase.professional_name || 'No especificado'}</strong>
                            </div>
                          </div>

                          <div style={{ marginTop: '10px' }}>
                            <span style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
                              🦷 Detalle Clínico por Piezas Dentales
                            </span>
                            <div className="table-container" style={{ border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)' }}>
                              <table className="custom-table" style={{ margin: 0 }}>
                                <thead>
                                  <tr>
                                    <th style={{ fontSize: '0.78rem', padding: '10px 16px' }}>Pieza</th>
                                    <th style={{ fontSize: '0.78rem', padding: '10px 16px' }}>Prestación Solicitada</th>
                                    <th style={{ fontSize: '0.78rem', padding: '10px 16px' }}>Cara / Sección / Estado</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {parsedPieces.length === 0 ? (
                                    <tr>
                                      <td colSpan={3} style={{ textAlign: 'center', opacity: 0.6, padding: '20px' }}>
                                        No hay detalles clínicos registrados.
                                      </td>
                                    </tr>
                                  ) : (
                                    parsedPieces.map((piece, idx) => {
                                      // Lookup prestación ID from name
                                      let prestacionId = '';
                                      if (piece.treatments) {
                                        const cleanName = piece.treatments.replace(/\s*\[(Dental|Rayos X)\]\s*$/i, '').trim().toLowerCase();
                                        const matched = prestacionesList.find(p => p.name.toLowerCase() === cleanName);
                                        if (matched) {
                                          prestacionId = `(ID: ${matched.id_prestacion})`;
                                        }
                                      }

                                      return (
                                        <tr key={idx}>
                                          <td style={{ fontWeight: 700, fontSize: '0.88rem', padding: '12px 16px' }}>{piece.id}</td>
                                          <td style={{ fontSize: '0.85rem', fontWeight: 600, color: 'hsl(var(--accent-hsl))', padding: '12px 16px' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                              <span>{piece.treatments || 'No asignada'}</span>
                                              {prestacionId && (
                                                <span style={{ fontSize: '0.72rem', opacity: 0.6, fontWeight: 500, color: 'hsl(var(--foreground-hsl))' }}>
                                                  {prestacionId}
                                                </span>
                                              )}
                                            </div>
                                          </td>
                                          <td style={{ fontSize: '0.85rem', opacity: 0.9, padding: '12px 16px' }}>
                                            <span style={{
                                              padding: '3px 8px',
                                              borderRadius: '4px',
                                              backgroundColor: piece.diagnosis.includes('Ausente') ? 'rgba(239, 68, 68, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                                              border: '1px solid var(--glass-border)',
                                              color: piece.diagnosis.includes('Ausente') ? '#ef4444' : 'inherit'
                                            }}>
                                              {piece.diagnosis || 'Sin patologías'}
                                            </span>
                                          </td>
                                        </tr>
                                      );
                                    })
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {selectedCase.description && (
                            <div style={{ marginTop: '10px', padding: '16px', background: 'rgba(255, 255, 255, 0.01)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)' }}>
                              <span style={{ opacity: 0.5, display: 'block', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Observaciones Generales</span>
                              <p style={{ margin: 0, opacity: 0.85, fontSize: '0.9rem' }}>{selectedCase.description}</p>
                            </div>
                          )}
                        </div>
                      );
                    })() : (
                      <div style={{ whiteSpace: 'pre-wrap', opacity: 0.9 }}>
                        {selectedCase.description}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '20px', marginTop: '12px', fontSize: '0.8rem', opacity: 0.5, paddingLeft: '4px' }}>
                    <span>Inscrito el: {formatDateTime(selectedCase.created_at)}</span>
                    <span>Registrado por: {selectedCase.registered_by_name || 'Admin Semilla'}</span>
                  </div>
                </div>
              </div>
            )}
            {/* Review and observations block */}
            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 800, opacity: 0.8, color: 'hsl(var(--accent-hsl))', borderBottom: '1px solid var(--glass-border)', paddingBottom: '8px', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                Evaluación Administrativa / Convenio
              </h4>

              {/* Show-only panel for External / Reader (who cannot edit statuses) */}
              {user.role === 'external' || user.role === 'reader' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)' }}>
                    <span style={{ fontSize: '0.9rem', opacity: 0.7, fontWeight: 600 }}>Estado actual:</span>
                    <span className={`badge badge-${selectedCase.status}`} style={{ padding: '6px 12px', fontSize: '0.78rem' }}>
                      {selectedCase.status === 'en_tratamiento' ? 'En tratamiento' : selectedCase.status === 'sincronizado' ? 'Sincronizado' : selectedCase.status.charAt(0).toUpperCase() + selectedCase.status.slice(1)}
                    </span>
                  </div>
                  {selectedCase.observations ? (
                    <div className="glass-panel" style={{ padding: '18px', backgroundColor: 'rgba(255, 255, 255, 0.01)', border: '1px solid var(--glass-border)', fontSize: '0.95rem', lineHeight: '1.6', borderRadius: 'var(--radius-md)' }}>
                      <strong style={{ display: 'block', fontSize: '0.85rem', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Observaciones del Evaluador</strong>
                      <p style={{ margin: 0, whiteSpace: 'pre-wrap', opacity: 0.95 }}>{selectedCase.observations}</p>
                    </div>
                  ) : (
                    <span style={{ fontStyle: 'italic', fontSize: '0.85rem', opacity: 0.5, paddingLeft: '4px' }}>No hay observaciones registradas aún.</span>
                  )}
                </div>
              ) : (
                /* Editable form for Admins and Internals */
                <form onSubmit={handleSaveEvaluation} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

                  {error && (
                    <div className="badge-rechazado" style={{ padding: '12px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', fontWeight: 600, border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                      {error}
                    </div>
                  )}

                  {success && (
                    <div className="badge-aprobado" style={{ padding: '12px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', fontWeight: 600, border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                      {success}
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label" htmlFor="eval_status" style={{ fontSize: '0.82rem', fontWeight: 700, opacity: 0.7 }}>Asignar Estado del Caso</label>
                    <CustomSelect
                      value={evalStatus}
                      onChange={(val) => setEvalStatus(val as any)}
                      options={[
                        { value: 'ingresado', label: 'Ingresado' },
                        { value: 'sincronizado', label: 'Sincronizado' },
                        { value: 'agendado', label: 'Agendado' },
                        { value: 'en_tratamiento', label: 'En Tratamiento' },
                        { value: 'finalizado', label: 'Finalizado' }
                      ]}
                      disabled={loading}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="eval_obs" style={{ fontSize: '0.82rem', fontWeight: 700, opacity: 0.7 }}>Observaciones y Diagnóstico Social *</label>
                    <textarea
                      className="form-textarea"
                      id="eval_obs"
                      value={evalObs}
                      onChange={(e) => setEvalObs(e.target.value)}
                      required
                      rows={4}
                      placeholder="Ingrese los motivos clínicos/sociales de la aprobación, rechazo o detalles técnicos del convenio aplicado..."
                      disabled={loading}
                      style={{ border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)', resize: 'vertical' }}
                    />
                  </div>

                  {selectedCase.evaluator_name && (
                    <div style={{ fontSize: '0.75rem', opacity: 0.5, fontStyle: 'italic', paddingLeft: '4px' }}>
                      Última evaluación realizada por: {selectedCase.evaluator_name}
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginTop: '10px', width: '100%' }}>
                    <div>
                      {user.role === 'admin' && (
                        <button
                          type="button"
                          onClick={() => {
                            if (selectedCase) {
                              handleDeleteCase(selectedCase.id, `${selectedCase.first_names} ${selectedCase.last_names}`);
                            }
                          }}
                          className="btn-danger"
                          disabled={loading}
                          style={{ padding: '10px 20px' }}
                        >
                          Eliminar Caso
                        </button>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary" disabled={loading} style={{ padding: '10px 20px' }}>
                        Cerrar
                      </button>
                      {user.role === 'admin' && (
                        selectedCase.status === 'ingresado' ? (
                          <button
                            type="button"
                            onClick={() => setIsEditing(true)}
                            className="btn-accent"
                            style={{
                              padding: '10px 20px',
                              fontWeight: 700,
                              backgroundColor: '#4f46e5',
                              borderColor: '#4f46e5',
                              color: '#ffffff',
                              boxShadow: '0 4px 15px rgba(79, 70, 229, 0.25)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
                            Editar Datos de Ficha
                          </button>
                        ) : (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '0.82rem',
                            color: '#fb923c',
                            fontWeight: 700,
                            padding: '8px 14px',
                            background: 'rgba(251, 146, 60, 0.08)',
                            border: '1px solid rgba(251, 146, 60, 0.2)',
                            borderRadius: '8px'
                          }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                            Sincronizado con Dentalink (Edición bloqueada)
                          </div>
                        )
                      )}
                      <button type="submit" className="btn-accent" disabled={loading} style={{ padding: '10px 20px', fontWeight: 700, boxShadow: '0 4px 15px rgba(20, 184, 166, 0.25)' }}>
                        {loading ? 'Guardando...' : 'Guardar Evaluación'}
                      </button>
                    </div>
                  </div>

                </form>
              )}
            </div>

          </div>
        </Modal>
      )}

      {hoveredCase && (
        <div
          className="tooltip-card"
          style={{
            top: `${hoveredCase.rect.bottom + 8}px`,
            left: `${hoveredCase.rect.left}px`,
          }}
        >
          <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'hsl(var(--accent-hsl))', marginBottom: '12px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '6px' }}>
            Detalles del Ingreso
          </h4>
          
          <div className="tooltip-section-title">Convenio</div>
          <div className="tooltip-section-value">{hoveredCase.case.agreement_type || 'Sin convenio'}</div>
          
          {(hoveredCase.case.dental_diagnosis || hoveredCase.case.description) && (
            <>
              <div className="tooltip-section-title">Diagnóstico / Descripción</div>
              <div className="tooltip-section-value">{hoveredCase.case.dental_diagnosis || hoveredCase.case.description}</div>
            </>
          )}
          
          {hoveredCase.case.treatment_needed && (
            <>
              <div className="tooltip-section-title">Prestaciones / Tratamiento</div>
              <div className="tooltip-section-value" style={{ whiteSpace: 'pre-line', fontSize: '0.8rem' }}>{hoveredCase.case.treatment_needed}</div>
            </>
          )}
          
          {hoveredCase.case.medical_center && (
            <>
              <div className="tooltip-section-title">Centro Derivador</div>
              <div className="tooltip-section-value">{hoveredCase.case.medical_center}</div>
            </>
          )}
          
          {hoveredCase.case.professional_name && (
            <>
              <div className="tooltip-section-title">Profesional Derivador</div>
              <div className="tooltip-section-value">{hoveredCase.case.professional_name}</div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
