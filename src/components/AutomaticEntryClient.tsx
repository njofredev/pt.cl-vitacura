'use client';

import React, { useState, useEffect } from 'react';
import { checkDentalinkPatientAction, createDentalinkPatientAction, getDentalinkPatientTreatmentsAction, createDentalinkPatientTreatmentAction, addDentalinkTreatmentDetailAction, getDentalinkPatientEvolutionsAction } from '@/app/actions/dentalinkActions';
import { getOdontogramPrestacionesAction } from '@/app/actions/arancelActions';
import { updateCaseStatusAction } from '@/app/actions/caseActions';
import { formatRUT, formatDate } from '@/lib/utils';
import Modal from '@/components/ui/Modal';
import { 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Info,
  ArrowLeft,
  Activity,
  UserCheck
} from 'lucide-react';
import Link from 'next/link';

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
  observations?: string | null;
  created_at: Date | string;
  registered_by_name: string | null;
  yearly_correlative?: number | string;
}

interface AutomaticEntryClientProps {
  initialCases: CaseRecord[];
}

type VerificationState = 'idle' | 'loading' | 'exists' | 'not_exists' | 'error';

interface VerificationResult {
  state: VerificationState;
  patientData?: any;
  errorMsg?: string;
}

export default function AutomaticEntryClient({ initialCases }: AutomaticEntryClientProps) {
  const [cases, setCases] = useState<CaseRecord[]>(initialCases);
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<Record<string, VerificationResult>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const [isBulkVerifying, setIsBulkVerifying] = useState(false);
  const [selectedCase, setSelectedCase] = useState<CaseRecord | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Patient creation form states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createCaseData, setCreateCaseData] = useState<CaseRecord | null>(null);
  const [createRut, setCreateRut] = useState('');
  const [createNombre, setCreateNombre] = useState('');
  const [createApellidos, setCreateApellidos] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createCelular, setCreateCelular] = useState('');
  const [createTelefono, setCreateTelefono] = useState('');
  const [createFechaNacimiento, setCreateFechaNacimiento] = useState('');
  const [createComuna, setCreateComuna] = useState('');
  const [createCiudad, setCreateCiudad] = useState('');
  const [createDireccion, setCreateDireccion] = useState('');
  const [createSexo, setCreateSexo] = useState('M');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);

  // Verification Wizard states
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardCase, setWizardCase] = useState<CaseRecord | null>(null);
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardPatientExists, setWizardPatientExists] = useState<boolean | null>(null);
  const [wizardPatientData, setWizardPatientData] = useState<any | null>(null);
  const [wizardTreatments, setWizardTreatments] = useState<any[]>([]);
  const [wizardEvolutions, setWizardEvolutions] = useState<any[]>([]);
  const [wizardLoading, setWizardLoading] = useState(false);
  const [wizardError, setWizardError] = useState<string | null>(null);

  // Create Treatment Form states inside the wizard
  const [isCreateTreatmentFormOpen, setIsCreateTreatmentFormOpen] = useState(false);
  const [newTreatmentName, setNewTreatmentName] = useState('');
  const [newTreatmentConvenioId, setNewTreatmentConvenioId] = useState<number>(0);
  const [newTreatmentSucursalId, setNewTreatmentSucursalId] = useState<number>(2); // Default to Vitacura (id: 2)
  const [newTreatmentDentistaId, setNewTreatmentDentistaId] = useState<string>('');
  const [newTreatmentComentario, setNewTreatmentComentario] = useState<string>('');
  const [newTreatmentFinalizado, setNewTreatmentFinalizado] = useState<number>(0); // Default to Active (0)

  // Service assignment states (Step 3)
  const [selectedTreatmentForServices, setSelectedTreatmentForServices] = useState<any | null>(null);
  const [pendingServices, setPendingServices] = useState<string[]>([]);
  const [linkedServices, setLinkedServices] = useState<string[]>([]);
  const [localAranceles, setLocalAranceles] = useState<any[]>([]);

  // Fetch local aranceles on mount
  React.useEffect(() => {
    async function loadAranceles() {
      const res = await getOdontogramPrestacionesAction();
      if (res.success && res.data) {
        setLocalAranceles(res.data);
      }
    }
    loadAranceles();
  }, []);

  const getPrestacionIdFromName = (serviceString: string) => {
    const firstBracket = serviceString.indexOf('[');
    const lastBracket = serviceString.lastIndexOf(']');
    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
      let content = serviceString.substring(firstBracket + 1, lastBracket).trim();
      // Remove trailing metadata like [Dental] or [Rayos X]
      content = content.replace(/\s*\[(Dental|Rayos X)\]\s*$/i, '').trim();
      
      const serviceName = content.toLowerCase();
      const matches = localAranceles.filter(a => a.name.toLowerCase().trim() === serviceName);
      
      if (matches.length > 0) {
        // Determine if selected treatment is Preferencial
        const isPreferencial = !!(
          selectedTreatmentForServices?.nombre_convenio?.toLowerCase().includes('preferencial') ||
          selectedTreatmentForServices?.nombre?.toLowerCase().includes('preferencial')
        );

        if (isPreferencial) {
          // Find the item with a price_pref (Preferencial arancel)
          const prefMatch = matches.find(a => a.price_pref !== null && a.price_pref !== undefined);
          if (prefMatch && prefMatch.id_prestacion) {
            return prefMatch.id_prestacion;
          }
        } else {
          // Find the item with a price_base (Arancel base)
          const baseMatch = matches.find(a => a.price_base !== null && a.price_base !== undefined);
          if (baseMatch && baseMatch.id_prestacion) {
            return baseMatch.id_prestacion;
          }
        }
        
        // Fallback to first available match
        return matches[0].id_prestacion || null;
      }
    }
    return null;
  };

  const parseOdontogramServices = (treatmentNeededStr: string | null): string[] => {
    if (!treatmentNeededStr) return [];
    const lines = treatmentNeededStr
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.includes('Sin prestaciones asignadas'));

    const parsedServices: string[] = [];

    for (const line of lines) {
      const firstBracket = line.indexOf('[');
      const lastBracket = line.lastIndexOf(']');
      if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
        const prefix = line.substring(0, firstBracket).trim();
        const innerContent = line.substring(firstBracket + 1, lastBracket).trim();

        // Split by comma if there are multiple services
        // e.g. "Limpieza [Dental], Obturación [Dental]"
        const individualServices = innerContent.split(',').map(s => s.trim()).filter(s => s.length > 0);
        
        for (const service of individualServices) {
          parsedServices.push(`${prefix} [${service}]`);
        }
      } else {
        parsedServices.push(line);
      }
    }

    return parsedServices;
  };

  const startWizard = (c: CaseRecord) => {
    setWizardCase(c);
    setWizardStep(1);
    setWizardPatientExists(null);
    setWizardPatientData(null);
    setWizardTreatments([]);
    setWizardEvolutions([]);
    setIsCreateTreatmentFormOpen(false);
    
    const caseId = c.yearly_correlative ? String(c.yearly_correlative).padStart(4, '0') : '';
    const dateObj = new Date(c.created_at);
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    const calculatedName = `${caseId} DERIVACIÓN DIGITAL ${month}/${year}`.trim();
    
    setNewTreatmentName(calculatedName);
    setNewTreatmentConvenioId(0);
    setNewTreatmentSucursalId(2);
    setNewTreatmentDentistaId('');
    setNewTreatmentComentario('');
    setNewTreatmentFinalizado(0);
    setSelectedTreatmentForServices(null);
    setPendingServices([]);
    setLinkedServices([]);
    setWizardLoading(true);
    setWizardError(null);
    setIsWizardOpen(true);

    checkExistence(c.rut);
  };

  const handleSelectTreatment = async (treatment: any) => {
    setSelectedTreatmentForServices(treatment);
    if (!wizardCase) return;

    setWizardLoading(true);
    setWizardError(null);

    const parsed = parseOdontogramServices(wizardCase.treatment_needed);
    const successfullyLinked: string[] = [];
    const failedToLink: { service: string; error?: string }[] = [];

    // Determine if treatment is Preferencial
    const isPreferencial = !!(
      treatment.nombre_convenio?.toLowerCase().includes('preferencial') ||
      treatment.nombre?.toLowerCase().includes('preferencial')
    );

    // Helper to get prestacion ID
    const getPrestacionId = (serviceString: string) => {
      const firstBracket = serviceString.indexOf('[');
      const lastBracket = serviceString.lastIndexOf(']');
      if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
        let content = serviceString.substring(firstBracket + 1, lastBracket).trim();
        content = content.replace(/\s*\[(Dental|Rayos X)\]\s*$/i, '').trim();
        
        const serviceName = content.toLowerCase();
        const matches = localAranceles.filter(a => a.name.toLowerCase().trim() === serviceName);
        
        if (matches.length > 0) {
          if (isPreferencial) {
            const prefMatch = matches.find(a => a.price_pref !== null && a.price_pref !== undefined);
            if (prefMatch && prefMatch.id_prestacion) return prefMatch.id_prestacion;
          } else {
            const baseMatch = matches.find(a => a.price_base !== null && a.price_base !== undefined);
            if (baseMatch && baseMatch.id_prestacion) return baseMatch.id_prestacion;
          }
          return matches[0].id_prestacion || null;
        }
      }
      return null;
    };

    // Attempt to link each service automatically
    for (const serviceText of parsed) {
      const prestacionId = getPrestacionId(serviceText);
      if (!prestacionId) {
        failedToLink.push({ service: serviceText, error: 'No se encontró la prestación en el arancel local' });
        continue;
      }

      try {
        const res = await addDentalinkTreatmentDetailAction(treatment.id, prestacionId, 0);
        if (res.success) {
          successfullyLinked.push(serviceText);
        } else {
          failedToLink.push({ service: serviceText, error: res.error });
        }
      } catch (err: any) {
        failedToLink.push({ service: serviceText, error: err.message || 'Error de red' });
      }
    }

    setLinkedServices(successfullyLinked);
    setPendingServices(parsed.filter(s => !successfullyLinked.includes(s)));

    // If ALL services were successfully linked automatically, finalize synchronization
    if (failedToLink.length === 0 && parsed.length > 0) {
      try {
        const res = await updateCaseStatusAction(
          wizardCase.id,
          'sincronizado',
          wizardCase.observations || 'Sincronizado automáticamente con Dentalink'
        );
        if (res.success) {
          setCases(prev => prev.map(c => c.id === wizardCase.id ? { ...c, status: 'sincronizado' } : c));
        }
        setWizardStep(4);
      } catch (err: any) {
        console.error("Error finalizing wizard automatically:", err);
        setWizardStep(4);
      } finally {
        setWizardLoading(false);
      }
    } else {
      if (failedToLink.length > 0) {
        setWizardError(`Se vincularon automáticamente ${successfullyLinked.length} de ${parsed.length} prestaciones. Por favor revise las restantes manualmente.`);
      }
      setWizardLoading(false);
      setWizardStep(3);
    }
  };

  const handleLinkService = async (serviceText: string) => {
    const prestacionId = getPrestacionIdFromName(serviceText);
    if (!prestacionId || !selectedTreatmentForServices?.id) {
      alert(`No se pudo encontrar el ID de prestación o tratamiento para: ${serviceText}`);
      return;
    }

    // Call the endpoint with id_tratamiento, id_prestacion, and precio = 0
    const res = await addDentalinkTreatmentDetailAction(
      selectedTreatmentForServices.id,
      prestacionId,
      0
    );

    if (res.success) {
      setPendingServices(prev => prev.filter(s => s !== serviceText));
      setLinkedServices(prev => [...prev, serviceText]);
    } else {
      alert(`Error al vincular ${serviceText}: ${res.error}`);
    }
  };

  const handleLinkAllServices = async () => {
    const currentPending = [...pendingServices];
    for (const serviceText of currentPending) {
      const prestacionId = getPrestacionIdFromName(serviceText);
      if (!prestacionId || !selectedTreatmentForServices?.id) {
        continue; // Skip if no ID is found
      }
      
      const res = await addDentalinkTreatmentDetailAction(
        selectedTreatmentForServices.id,
        prestacionId,
        0
      );
      
      if (res.success) {
        setPendingServices(prev => prev.filter(s => s !== serviceText));
        setLinkedServices(prev => [...prev, serviceText]);
      } else {
        alert(`Error al vincular ${serviceText}: ${res.error}`);
      }
    }
  };


  const handleCreateTreatment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wizardPatientData?.id) return;
    if (!newTreatmentDentistaId) {
      setWizardError('Debe ingresar el ID del dentista');
      return;
    }
    setWizardLoading(true);
    setWizardError(null);
    try {
      const res = await createDentalinkPatientTreatmentAction(wizardPatientData.id, {
        nombre: newTreatmentName,
        id_sucursal: newTreatmentSucursalId,
        id_dentista: Number(newTreatmentDentistaId),
        comentario: newTreatmentComentario,
        finalizado: newTreatmentFinalizado,
        id_convenio: newTreatmentConvenioId
      });
      if (res.success) {
        setIsCreateTreatmentFormOpen(false);
        setNewTreatmentComentario('');
        setNewTreatmentDentistaId('');
        setNewTreatmentFinalizado(0);
        // Reload treatments list
        goToTreatmentsStep();
      } else {
        setWizardError(res.error || 'Error al registrar el tratamiento');
        setWizardLoading(false);
      }
    } catch (err: any) {
      setWizardError(err.message || 'Error de red');
      setWizardLoading(false);
    }
  };

  const checkExistence = async (rut: string) => {
    try {
      const res = await checkDentalinkPatientAction(rut);
      if (res.success) {
        setWizardPatientExists(res.exists || false);
        if (res.exists) {
          setWizardPatientData(res.patient);
        }
      } else {
        setWizardError(res.error || 'Error al verificar paciente');
      }
    } catch (err: any) {
      setWizardError(err.message || 'Error de red');
    } finally {
      setWizardLoading(false);
    }
  };

  const goToTreatmentsStep = async () => {
    if (!wizardPatientData?.id) return;
    setWizardStep(2);
    setWizardLoading(true);
    setWizardError(null);
    try {
      const res = await getDentalinkPatientTreatmentsAction(wizardPatientData.id);
      const evRes = await getDentalinkPatientEvolutionsAction(wizardPatientData.id);
      if (res.success) {
        setWizardTreatments(res.treatments || []);
      } else {
        setWizardError(res.error || 'Error al obtener tratamientos');
      }
      if (evRes.success) {
        setWizardEvolutions(evRes.evolutions || []);
      }
    } catch (err: any) {
      setWizardError(err.message || 'Error de red');
    } finally {
      setWizardLoading(false);
    }
  };

  const handleFinishWizard = async () => {
    if (!wizardCase) return;
    setWizardLoading(true);
    setWizardError(null);
    try {
      // Update case status to 'sincronizado' in the database
      const res = await updateCaseStatusAction(
        wizardCase.id,
        'sincronizado',
        wizardCase.observations || 'Sincronizado automáticamente con Dentalink'
      );
      if (res.success) {
        // Update local cases state
        setCases(prev => prev.map(c => c.id === wizardCase.id ? { ...c, status: 'sincronizado' } : c));
      } else {
        console.error("Failed to update case status in DB:", res.error);
      }
      setWizardStep(4);
    } catch (err: any) {
      console.error("Error finalizing wizard:", err);
      setWizardStep(4);
    } finally {
      setWizardLoading(false);
    }
  };

  const openCreateModal = (c: CaseRecord) => {
    setCreateCaseData(c);
    setCreateRut(c.rut);
    setCreateNombre(c.first_names);
    setCreateApellidos(c.last_names);
    setCreateEmail(c.email || '');
    setCreateCelular(c.mobile || '');
    setCreateTelefono('');
    const bdStr = c.birth_date ? new Date(c.birth_date).toISOString().split('T')[0] : '';
    setCreateFechaNacimiento(bdStr);
    setCreateComuna(c.commune || '');
    setCreateCiudad(c.commune || 'Santiago');
    setCreateDireccion('');
    setCreateSexo('M');
    setCreateError(null);
    setCreateSuccess(null);
    setIsCreateModalOpen(true);
  };

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createCaseData) return;
    setCreateLoading(true);
    setCreateError(null);
    setCreateSuccess(null);

    try {
      const res = await createDentalinkPatientAction({
        rut: createRut,
        nombre: createNombre,
        apellidos: createApellidos,
        email: createEmail,
        celular: createCelular,
        telefono: createTelefono,
        fecha_nacimiento: createFechaNacimiento,
        comuna: createComuna,
        ciudad: createCiudad,
        direccion: createDireccion,
        sexo: createSexo
      });

      if (res.success) {
        setCreateSuccess('¡Paciente registrado con éxito en Dentalink!');
        setResults(prev => ({
          ...prev,
          [createCaseData.id]: {
            state: 'exists',
            patientData: res.patient
          }
        }));
        setTimeout(() => {
          setIsCreateModalOpen(false);
        }, 1500);
      } else {
        setCreateError(res.error || 'Error al registrar el paciente');
      }
    } catch (err: any) {
      setCreateError(err.message || 'Error de red');
    } finally {
      setCreateLoading(false);
    }
  };

  // Filter cases based on search term
  const filteredCases = cases.filter((c) => {
    const fullName = `${c.first_names} ${c.last_names}`.toLowerCase();
    const cleanRutStr = c.rut.toLowerCase();
    const descStr = c.description.toLowerCase();
    const query = searchTerm.toLowerCase();

    return (
      fullName.includes(query) || 
      cleanRutStr.includes(query) || 
      descStr.includes(query)
    );
  });

  const totalPages = Math.ceil(filteredCases.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCases = filteredCases.slice(startIndex, startIndex + itemsPerPage);

  // Check a single patient RUT in Dentalink
  const verifyPatient = async (caseId: string, rut: string) => {
    setResults(prev => ({
      ...prev,
      [caseId]: { state: 'loading' }
    }));

    try {
      const res = await checkDentalinkPatientAction(rut);
      if (res.success) {
        if (res.exists) {
          setResults(prev => ({
            ...prev,
            [caseId]: { state: 'exists', patientData: res.patient }
          }));
        } else {
          setResults(prev => ({
            ...prev,
            [caseId]: { state: 'not_exists' }
          }));
        }
      } else {
        setResults(prev => ({
          ...prev,
          [caseId]: { state: 'error', errorMsg: res.error }
        }));
      }
    } catch (err: any) {
      setResults(prev => ({
        ...prev,
        [caseId]: { state: 'error', errorMsg: 'Error de red' }
      }));
    }
  };

  // Check all currently visible patients sequentially (only current page items)
  const verifyAllVisible = async () => {
    if (paginatedCases.length === 0 || isBulkVerifying) return;
    setIsBulkVerifying(true);

    for (const c of paginatedCases) {
      // If already verified as "exists", skip to save API requests
      if (results[c.id]?.state === 'exists') continue;
      await verifyPatient(c.id, c.rut);
    }

    setIsBulkVerifying(false);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '30px', paddingBottom: '40px' }}>
      
      {/* Header Panel */}
      <div
        className="glass-panel"
        style={{
          padding: '30px 40px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(20, 184, 166, 0.02) 100%), var(--glass-bg)',
          flexWrap: 'wrap',
          gap: '20px',
          borderLeft: '4px solid #10b981',
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
            border: '1px solid rgba(16, 185, 129, 0.2)'
          }}>
            <UserCheck size={28} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <h2 style={{ fontSize: '1.8rem', fontFamily: 'var(--font-display)', fontWeight: 800, margin: 0 }}>
              Ingreso Automático: Validación Dentalink
            </h2>
            <p style={{ opacity: 0.6, margin: 0, fontWeight: 500, fontSize: '0.95rem' }}>
              Consulte en tiempo real si el RUT de los pacientes ingresados existe en el sistema Dentalink.
            </p>
          </div>
        </div>

        <Link href="/dashboard" className="btn btn-secondary">
          <ArrowLeft size={16} /> Volver al Dashboard
        </Link>
      </div>

      {/* Filter and Bulk Actions Control Panel */}
      <div 
        className="glass-panel" 
        style={{ 
          padding: '24px', 
          display: 'flex', 
          gap: '20px', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          flexWrap: 'wrap' 
        }}
      >
        <div style={{ flex: 1, minWidth: '300px', position: 'relative' }}>
          <input 
            className="form-input"
            type="text"
            placeholder="Buscar por Nombre, RUT o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', paddingLeft: '40px' }}
          />
          <div style={{ position: 'absolute', left: '14px', top: '15px', opacity: 0.5 }}>
            <Search size={16} />
          </div>
        </div>

        <button 
          onClick={verifyAllVisible}
          className="btn btn-primary"
          disabled={isBulkVerifying || filteredCases.length === 0}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', height: '48px', padding: '0 24px' }}
        >
          <RefreshCw size={16} className={isBulkVerifying ? 'animate-spin' : ''} />
          {isBulkVerifying ? 'Validando lote...' : 'Verificar Todos los Visibles'}
        </button>
      </div>

      {/* Main Table Panel */}
      <div className="glass-panel" style={{ padding: '24px', overflow: 'hidden' }}>
        {filteredCases.length === 0 ? (
          <div style={{ padding: '50px 20px', textAlign: 'center', opacity: 0.6 }}>
            No se encontraron ingresos registrados en el sistema.
          </div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Beneficiario</th>
                  <th>RUT</th>
                  <th>Convenio / Diagnóstico</th>
                  <th>Fecha Registro</th>
                  <th>Estado Local</th>
                  <th style={{ width: '260px' }}>Estado Dentalink</th>
                  <th style={{ textAlign: 'right', width: '120px' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCases.map((c) => {
                  const checkResult = results[c.id] || { state: 'idle' };

                  return (
                    <tr key={c.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>
                          {c.yearly_correlative && (
                            <span style={{ opacity: 0.5, marginRight: '8px', fontWeight: 500, fontFamily: 'monospace' }}>
                              {String(c.yearly_correlative).padStart(4, '0')}
                            </span>
                          )}
                          {c.first_names} {c.last_names}
                        </div>
                        <div style={{ fontSize: '0.75rem', opacity: 0.5 }}>{c.nationality}</div>
                      </td>
                      <td style={{ whiteSpace: 'nowrap', fontWeight: 500 }}>{formatRUT(c.rut)}</td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{c.agreement_type || 'Sin convenio'}</div>
                        <div style={{ fontSize: '0.78rem', opacity: 0.7, maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {c.dental_diagnosis || c.description}
                        </div>
                      </td>
                      <td style={{ fontSize: '0.85rem', opacity: 0.7 }}>{formatDate(c.created_at)}</td>
                      <td>
                        <span className={`badge badge-${c.status}`}>
                          {c.status === 'en_tratamiento' ? 'En tratamiento' : c.status === 'sincronizado' ? 'Sincronizado' : c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                        </span>
                      </td>
                      <td>
                        {c.status === 'sincronizado' ? (
                          <span className="badge badge-aprobado" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle2 size={12} /> Verificado
                          </span>
                        ) : (
                          <>
                            {checkResult.state === 'idle' && (
                              <span className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                No verificado
                              </span>
                            )}

                            {checkResult.state === 'loading' && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'hsl(var(--accent-hsl))', fontSize: '0.85rem', fontWeight: 600 }}>
                                <RefreshCw size={14} className="animate-spin" />
                                Consultando API...
                              </div>
                            )}

                            {checkResult.state === 'exists' && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <span className="badge badge-aprobado" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', width: 'fit-content' }}>
                                  <CheckCircle2 size={12} /> Existe en Dentalink
                                </span>
                                {checkResult.patientData && (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <div style={{ fontSize: '0.72rem', opacity: 0.7, padding: '4px 8px', background: 'rgba(16, 185, 129, 0.04)', border: '1px solid rgba(16, 185, 129, 0.1)', borderRadius: '4px' }}>
                                      <div><strong>ID:</strong> {checkResult.patientData.id}</div>
                                      <div><strong>Ficha:</strong> {checkResult.patientData.numero_ficha || 'No reg.'}</div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedCase(c);
                                        setSelectedPatient(checkResult.patientData);
                                        setIsModalOpen(true);
                                      }}
                                      className="btn btn-secondary"
                                      style={{ padding: '4px 8px', fontSize: '0.75rem', height: 'auto', width: 'fit-content' }}
                                    >
                                      Ver datos
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}

                            {checkResult.state === 'not_exists' && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <span className="badge badge-rechazado" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', width: 'fit-content' }}>
                                  <XCircle size={12} /> No registrado
                                </span>
                                <button
                                  type="button"
                                  onClick={() => openCreateModal(c)}
                                  className="btn btn-primary"
                                  style={{ padding: '4px 8px', fontSize: '0.75rem', height: 'auto', width: 'fit-content', backgroundColor: '#10b981', borderColor: '#10b981', color: '#022c22', fontWeight: 'bold' }}
                                >
                                  Crear Ficha
                                </button>
                              </div>
                            )}

                            {checkResult.state === 'error' && (
                              <span className="badge badge-pendiente" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.2)' }} title={checkResult.errorMsg}>
                                <AlertCircle size={12} /> Error API
                              </span>
                            )}
                          </>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => startWizard(c)}
                          className="btn btn-primary"
                          disabled={c.status === 'sincronizado'}
                          style={{ 
                            padding: '6px 16px', 
                            fontSize: '0.82rem', 
                            height: '32px',
                            background: c.status === 'sincronizado' 
                              ? 'rgba(255, 255, 255, 0.05)' 
                              : 'linear-gradient(135deg, #1e3a8a 0%, #172554 100%)',
                            color: c.status === 'sincronizado' ? 'rgba(255, 255, 255, 0.3)' : 'inherit',
                            border: c.status === 'sincronizado' ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(255, 255, 255, 0.08)',
                            boxShadow: c.status === 'sincronizado' ? 'none' : '0 4px 12px rgba(30, 58, 138, 0.25)',
                            fontWeight: 700,
                            cursor: c.status === 'sincronizado' ? 'not-allowed' : 'pointer'
                          }}
                        >
                          Inicio
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginTop: '20px', 
                paddingTop: '16px',
                borderTop: '1px solid var(--glass-border)' 
              }}>
                <span style={{ fontSize: '0.88rem', opacity: 0.6 }}>
                  Mostrando {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredCases.length)} de {filteredCases.length} registros
                </span>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="btn btn-secondary"
                    style={{ padding: '6px 16px', fontSize: '0.82rem', opacity: currentPage === 1 ? 0.5 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                  >
                    Anterior
                  </button>
                  <span style={{ fontSize: '0.88rem', fontWeight: 600, padding: '0 10px', color: 'hsl(var(--foreground-hsl))' }}>
                    Página {currentPage} de {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="btn btn-secondary"
                    style={{ padding: '6px 16px', fontSize: '0.82rem', opacity: currentPage === totalPages ? 0.5 : 1, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Patient details modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Comparativa de Datos: Sistema vs Dentalink"
        maxWidth="1100px"
      >
        {selectedPatient && selectedCase && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="comparison-grid">
              
              {/* Local Data Box */}
              <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', backgroundColor: 'rgba(255, 255, 255, 0.01)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 805, color: '#10b981', borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Sistema de Derivación (Local)
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9rem' }}>
                  <div>
                    <span style={{ opacity: 0.5, display: 'block', fontSize: '0.72rem', fontWeight: 700 }}>RUT</span>
                    <strong>{formatRUT(selectedCase.rut)}</strong>
                  </div>
                  <div>
                    <span style={{ opacity: 0.5, display: 'block', fontSize: '0.72rem', fontWeight: 700 }}>NOMBRE COMPLETO</span>
                    <strong>{selectedCase.first_names} {selectedCase.last_names}</strong>
                  </div>
                  <div>
                    <span style={{ opacity: 0.5, display: 'block', fontSize: '0.72rem', fontWeight: 700 }}>FECHA NACIMIENTO</span>
                    <strong>{formatDate(selectedCase.birth_date)}</strong>
                  </div>
                  <div>
                    <span style={{ opacity: 0.5, display: 'block', fontSize: '0.72rem', fontWeight: 700 }}>EMAIL</span>
                    <strong style={{ wordBreak: 'break-all' }}>{selectedCase.email || 'No registrado'}</strong>
                  </div>
                  <div>
                    <span style={{ opacity: 0.5, display: 'block', fontSize: '0.72rem', fontWeight: 700 }}>TELÉFONO / MÓVIL</span>
                    <strong>{selectedCase.mobile || 'No registrado'}</strong>
                  </div>
                  <div>
                    <span style={{ opacity: 0.5, display: 'block', fontSize: '0.72rem', fontWeight: 700 }}>COMUNA</span>
                    <strong>{selectedCase.commune || 'No registrado'}</strong>
                  </div>
                  <div>
                    <span style={{ opacity: 0.5, display: 'block', fontSize: '0.72rem', fontWeight: 700 }}>NACIONALIDAD</span>
                    <strong>{selectedCase.nationality || 'No registrado'}</strong>
                  </div>
                  <div>
                    <span style={{ opacity: 0.5, display: 'block', fontSize: '0.72rem', fontWeight: 700 }}>INSTITUCIÓN</span>
                    <strong>{selectedCase.medical_center || 'No registrado'}</strong>
                  </div>
                  <div>
                    <span style={{ opacity: 0.5, display: 'block', fontSize: '0.72rem', fontWeight: 700 }}>CONVENIO</span>
                    <strong>{selectedCase.agreement_type || 'No registrado'}</strong>
                  </div>
                  <div>
                    <span style={{ opacity: 0.5, display: 'block', fontSize: '0.72rem', fontWeight: 700 }}>DIAGNÓSTICO DENTAL</span>
                    <strong>{selectedCase.dental_diagnosis || 'No registrado'}</strong>
                  </div>
                </div>
              </div>

              {/* Dentalink Data Box */}
              <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', backgroundColor: 'rgba(255, 255, 255, 0.01)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 805, color: 'hsl(var(--accent-hsl))', borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Dentalink API (Remoto)
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9rem' }}>
                  <div>
                    <span style={{ opacity: 0.5, display: 'block', fontSize: '0.72rem', fontWeight: 700 }}>ID PACIENTE</span>
                    <strong>{selectedPatient.id}</strong>
                  </div>
                  <div>
                    <span style={{ opacity: 0.5, display: 'block', fontSize: '0.72rem', fontWeight: 700 }}>NÚMERO FICHA</span>
                    <strong>{selectedPatient.numero_ficha || 'No registrado'}</strong>
                  </div>
                  <div>
                    <span style={{ opacity: 0.5, display: 'block', fontSize: '0.72rem', fontWeight: 700 }}>RUT</span>
                    <strong>{selectedPatient.rut || 'No registrado'}</strong>
                  </div>
                  <div>
                    <span style={{ opacity: 0.5, display: 'block', fontSize: '0.72rem', fontWeight: 700 }}>NOMBRE COMPLETO</span>
                    <strong>{selectedPatient.nombre} {selectedPatient.apellidos}</strong>
                  </div>
                  {selectedPatient.nombre_social && (
                    <div>
                      <span style={{ opacity: 0.5, display: 'block', fontSize: '0.72rem', fontWeight: 700 }}>NOMBRE SOCIAL</span>
                      <strong>{selectedPatient.nombre_social}</strong>
                    </div>
                  )}
                  <div>
                    <span style={{ opacity: 0.5, display: 'block', fontSize: '0.72rem', fontWeight: 700 }}>FECHA NACIMIENTO</span>
                    <strong>{formatDate(selectedPatient.fecha_nacimiento)}</strong>
                  </div>
                  <div>
                    <span style={{ opacity: 0.5, display: 'block', fontSize: '0.72rem', fontWeight: 700 }}>FECHA AFILIACIÓN</span>
                    <strong>{formatDate(selectedPatient.fecha_afiliacion)}</strong>
                  </div>
                  <div>
                    <span style={{ opacity: 0.5, display: 'block', fontSize: '0.72rem', fontWeight: 700 }}>EMAIL</span>
                    <strong style={{ wordBreak: 'break-all' }}>{selectedPatient.email || 'No registrado'}</strong>
                  </div>
                  <div>
                    <span style={{ opacity: 0.5, display: 'block', fontSize: '0.72rem', fontWeight: 700 }}>CELULAR</span>
                    <strong>{selectedPatient.celular || 'No registrado'}</strong>
                  </div>
                  <div>
                    <span style={{ opacity: 0.5, display: 'block', fontSize: '0.72rem', fontWeight: 700 }}>TELÉFONO</span>
                    <strong>{selectedPatient.telefono || 'No registrado'}</strong>
                  </div>
                  <div>
                    <span style={{ opacity: 0.5, display: 'block', fontSize: '0.72rem', fontWeight: 700 }}>DIRECCIÓN</span>
                    <strong>{selectedPatient.direccion || 'No registrado'}</strong>
                  </div>
                  <div>
                    <span style={{ opacity: 0.5, display: 'block', fontSize: '0.72rem', fontWeight: 700 }}>COMUNA / CIUDAD</span>
                    <strong>{selectedPatient.comuna || selectedPatient.ciudad || 'No registrado'}</strong>
                  </div>
                  <div>
                    <span style={{ opacity: 0.5, display: 'block', fontSize: '0.72rem', fontWeight: 700 }}>SEXO / GÉNERO</span>
                    <strong>{selectedPatient.sexo === 'M' ? 'Masculino' : selectedPatient.sexo === 'F' ? 'Femenino' : selectedPatient.sexo || 'No registrado'}</strong>
                  </div>
                  <div>
                    <span style={{ opacity: 0.5, display: 'block', fontSize: '0.72rem', fontWeight: 700 }}>ESTADO HABILITADO</span>
                    <strong>{selectedPatient.habilitado === 1 ? 'Habilitado' : 'Deshabilitado'}</strong>
                  </div>
                </div>
              </div>

            </div>

            <div style={{ marginTop: '10px' }}>
              <span style={{ opacity: 0.6, display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '8px' }}>JSON RAW DENTALINK:</span>
              <pre style={{ 
                background: 'rgba(0,0,0,0.3)', 
                border: '1px solid var(--glass-border)', 
                padding: '16px', 
                borderRadius: 'var(--radius-md)', 
                fontSize: '0.78rem',
                fontFamily: 'monospace',
                maxHeight: '150px',
                overflowY: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all'
              }}>
                {JSON.stringify(selectedPatient, null, 2)}
              </pre>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
                Cerrar
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Patient creation modal */}
      <Modal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        title="Crear Ficha de Paciente en Dentalink"
        maxWidth="800px"
      >
        {createCaseData && (
          <form onSubmit={handleCreatePatient} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {createError && (
              <div className="badge-rechazado" style={{ padding: '12px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', fontWeight: 600, border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                {createError}
              </div>
            )}
            {createSuccess && (
              <div className="badge-aprobado" style={{ padding: '12px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', fontWeight: 600, border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                {createSuccess}
              </div>
            )}

            <p style={{ fontSize: '0.9rem', opacity: 0.8, margin: 0 }}>
              Revise y complete los datos recuperados del sistema de derivación antes de confirmar el ingreso automático en Dentalink.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700 }}>RUT</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={createRut} 
                  onChange={e => setCreateRut(e.target.value)} 
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700 }}>Nombres</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={createNombre} 
                  onChange={e => setCreateNombre(e.target.value)} 
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700 }}>Apellidos</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={createApellidos} 
                  onChange={e => setCreateApellidos(e.target.value)} 
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700 }}>Email</label>
                <input 
                  type="email" 
                  className="form-input" 
                  value={createEmail} 
                  onChange={e => setCreateEmail(e.target.value)} 
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700 }}>Celular</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={createCelular} 
                  onChange={e => setCreateCelular(e.target.value)} 
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700 }}>Teléfono Fijo</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={createTelefono} 
                  onChange={e => setCreateTelefono(e.target.value)} 
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700 }}>Fecha Nacimiento</label>
                <input 
                  type="date" 
                  className="form-input" 
                  value={createFechaNacimiento} 
                  onChange={e => setCreateFechaNacimiento(e.target.value)} 
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700 }}>Sexo</label>
                <select 
                  className="form-select" 
                  value={createSexo} 
                  onChange={e => setCreateSexo(e.target.value)}
                  required
                  style={{
                    backgroundColor: 'rgba(0,0,0,0.2)',
                    color: 'inherit',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '8px 12px',
                    width: '100%',
                    height: '42px'
                  }}
                >
                  <option value="M" style={{ backgroundColor: 'black' }}>Masculino</option>
                  <option value="F" style={{ backgroundColor: 'black' }}>Femenino</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700 }}>Comuna</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={createComuna} 
                  onChange={e => setCreateComuna(e.target.value)} 
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700 }}>Ciudad</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={createCiudad} 
                  onChange={e => setCreateCiudad(e.target.value)} 
                />
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700 }}>Dirección</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={createDireccion} 
                  onChange={e => setCreateDireccion(e.target.value)} 
                  placeholder="Calle, número, depto..."
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
              <button 
                type="button" 
                onClick={() => setIsCreateModalOpen(false)} 
                className="btn btn-secondary"
                disabled={createLoading}
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={createLoading}
                style={{ backgroundColor: '#10b981', borderColor: '#10b981', color: '#022c22', fontWeight: 'bold' }}
              >
                {createLoading ? 'Registrando...' : 'Ingresar Paciente en Dentalink'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Step-by-Step Verification Modal (Asistente de Verificación) */}
      <Modal 
        isOpen={isWizardOpen} 
        onClose={() => setIsWizardOpen(false)} 
        title={wizardStep === 1 ? "Paso 1: Verificación de Paciente" : wizardStep === 2 ? "Paso 2: Comprobación de Tratamientos" : "Paso 3: Prestaciones del Tratamiento"} 
        maxWidth={wizardStep === 1 ? "600px" : "1000px"}
      >
        {wizardCase && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Step indicator header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '14px', flexWrap: 'wrap' }}>
              <div style={{ 
                width: '24px', 
                height: '24px', 
                borderRadius: '50%', 
                backgroundColor: wizardStep === 1 ? 'hsl(var(--primary-hsl))' : 'rgba(255,255,255,0.05)',
                color: wizardStep === 1 ? 'white' : 'rgba(255,255,255,0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.8rem',
                fontWeight: 'bold'
              }}>1</div>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: wizardStep === 1 ? 'hsl(var(--foreground-hsl))' : 'rgba(255,255,255,0.4)' }}>Verificación</span>
              <div style={{ width: '30px', height: '1.5px', backgroundColor: 'var(--glass-border)' }}></div>
              <div style={{ 
                width: '24px', 
                height: '24px', 
                borderRadius: '50%', 
                backgroundColor: wizardStep === 2 ? 'hsl(var(--primary-hsl))' : 'rgba(255,255,255,0.05)',
                color: wizardStep === 2 ? 'white' : 'rgba(255,255,255,0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.8rem',
                fontWeight: 'bold'
              }}>2</div>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: wizardStep === 2 ? 'hsl(var(--foreground-hsl))' : 'rgba(255,255,255,0.4)' }}>Tratamientos Clínicos</span>
              <div style={{ width: '30px', height: '1.5px', backgroundColor: 'var(--glass-border)' }}></div>
              <div style={{ 
                width: '24px', 
                height: '24px', 
                borderRadius: '50%', 
                backgroundColor: wizardStep === 3 ? 'hsl(var(--primary-hsl))' : 'rgba(255,255,255,0.05)',
                color: wizardStep === 3 ? 'white' : 'rgba(255,255,255,0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.8rem',
                fontWeight: 'bold'
              }}>3</div>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: wizardStep === 3 ? 'hsl(var(--foreground-hsl))' : 'rgba(255,255,255,0.4)' }}>Prestaciones del Tratamiento</span>
            </div>

            {/* Error Message banner */}
            {wizardError && (
              <div className="badge-rechazado" style={{ padding: '12px 16px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', fontWeight: 600, border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                {wizardError}
              </div>
            )}

            {/* Step 1 Content */}
            {wizardStep === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)' }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '0.92rem', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Datos del Caso Local</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', opacity: 0.55 }}>Paciente</span>
                      <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>{wizardCase.first_names} {wizardCase.last_names}</div>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', opacity: 0.55 }}>RUT</span>
                      <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>{formatRUT(wizardCase.rut)}</div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 0', gap: '12px' }}>
                  {wizardLoading ? (
                    <>
                      <RefreshCw className="animate-spin" size={32} style={{ color: 'hsl(var(--primary-hsl))' }} />
                      <span style={{ fontSize: '0.9rem', fontWeight: 600, opacity: 0.8 }}>Consultando existencia en Dentalink...</span>
                    </>
                  ) : wizardPatientExists === true ? (
                    <>
                      <CheckCircle2 size={40} style={{ color: '#10b981' }} />
                      <span style={{ fontSize: '1rem', fontWeight: 700, color: '#10b981' }}>¡El paciente existe en Dentalink!</span>
                      {wizardPatientData && (
                        <div style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', fontSize: '0.85rem' }}>
                          <div><strong>ID Paciente:</strong> {wizardPatientData.id}</div>
                          <div><strong>Nombre Completo:</strong> {wizardPatientData.nombre} {wizardPatientData.apellidos}</div>
                          {wizardPatientData.email && <div><strong>Correo:</strong> {wizardPatientData.email}</div>}
                          {wizardPatientData.celular && <div><strong>Celular:</strong> {wizardPatientData.celular}</div>}
                        </div>
                      )}
                    </>
                  ) : wizardPatientExists === false ? (
                    <>
                      <XCircle size={40} style={{ color: '#ef4444' }} />
                      <span style={{ fontSize: '1rem', fontWeight: 700, color: '#ef4444' }}>El paciente no está registrado en Dentalink</span>
                      <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.7, textAlign: 'center', maxWidth: '340px' }}>
                        Debe crear primero la ficha del paciente para poder consultar sus tratamientos.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setIsWizardOpen(false);
                          openCreateModal(wizardCase);
                        }}
                        className="btn btn-primary"
                        style={{ backgroundColor: '#10b981', borderColor: '#10b981', color: '#022c22', fontWeight: 'bold', padding: '8px 20px', marginTop: '8px' }}
                      >
                        Crear Ficha en Dentalink
                      </button>
                    </>
                  ) : null}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--glass-border)', paddingTop: '16px' }}>
                  <button type="button" onClick={() => setIsWizardOpen(false)} className="btn btn-secondary" disabled={wizardLoading}>
                    Cerrar
                  </button>
                  {wizardPatientExists === true && (
                    <button type="button" onClick={goToTreatmentsStep} className="btn btn-primary" style={{ padding: '10px 24px' }}>
                      Siguiente
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Step 2 Content */}
            {wizardStep === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {wizardLoading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 0', gap: '12px' }}>
                    <RefreshCw className="animate-spin" size={32} style={{ color: 'hsl(var(--primary-hsl))' }} />
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, opacity: 0.8 }}>Obteniendo tratamientos de la ficha clínica...</span>
                  </div>
                ) : isCreateTreatmentFormOpen ? (
                  /* Create Treatment Form */
                  <form onSubmit={handleCreateTreatment} style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)' }}>
                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'hsl(var(--foreground-hsl))' }}>
                      Nuevo Plan de Tratamiento para el Paciente
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.82rem', opacity: 0.6 }}>
                      Ingrese los detalles del plan de tratamiento para registrarlo directamente en la ficha clínica de Dentalink.
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                      <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <label className="form-label" htmlFor="new_treatment_name">Nombre o Descripción del Tratamiento *</label>
                        <input 
                          type="text" 
                          id="new_treatment_name"
                          className="form-input" 
                          required 
                          value={newTreatmentName} 
                          onChange={e => setNewTreatmentName(e.target.value)} 
                          placeholder="Ej: PLAN DE TRATAMIENTO SOCIAL VITACURA"
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label" htmlFor="new_treatment_sucursal">Sucursal *</label>
                        <select 
                          id="new_treatment_sucursal"
                          className="form-select" 
                          value={newTreatmentSucursalId} 
                          onChange={e => setNewTreatmentSucursalId(Number(e.target.value))}
                          required
                          style={{
                            backgroundColor: 'rgba(0,0,0,0.2)',
                            color: 'inherit',
                            border: '1px solid var(--glass-border)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '8px 12px',
                            width: '100%',
                            height: '42px'
                          }}
                        >
                          <option value={2} style={{ backgroundColor: 'black' }}>Vitacura (id: 2)</option>
                          <option value={1} style={{ backgroundColor: 'black' }}>Los Tribunales (id: 1)</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label" htmlFor="new_treatment_dentista">ID del Dentista *</label>
                        <input 
                          type="number" 
                          id="new_treatment_dentista"
                          className="form-input" 
                          required
                          value={newTreatmentDentistaId} 
                          onChange={e => setNewTreatmentDentistaId(e.target.value)} 
                          placeholder="Ej: 626"
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label" htmlFor="new_treatment_estado">Estado *</label>
                        <select 
                          id="new_treatment_estado"
                          className="form-select" 
                          value={newTreatmentFinalizado} 
                          onChange={e => setNewTreatmentFinalizado(Number(e.target.value))}
                          required
                          style={{
                            backgroundColor: 'rgba(0,0,0,0.2)',
                            color: 'inherit',
                            border: '1px solid var(--glass-border)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '8px 12px',
                            width: '100%',
                            height: '42px'
                          }}
                        >
                          <option value={0} style={{ backgroundColor: 'black' }}>Activo (0)</option>
                          <option value={1} style={{ backgroundColor: 'black' }}>Finalizado (1)</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label" htmlFor="new_treatment_convenio">ID del Convenio (Opcional)</label>
                        <input 
                          type="number" 
                          id="new_treatment_convenio"
                          className="form-input" 
                          value={newTreatmentConvenioId} 
                          onChange={e => setNewTreatmentConvenioId(Number(e.target.value))} 
                          placeholder="Ej: 0"
                        />
                      </div>

                      <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <label className="form-label" htmlFor="new_treatment_comentario">Comentario (Opcional)</label>
                        <textarea 
                          id="new_treatment_comentario"
                          className="form-textarea" 
                          rows={2}
                          value={newTreatmentComentario} 
                          onChange={e => setNewTreatmentComentario(e.target.value)} 
                          placeholder="Ingrese algún comentario adicional para este tratamiento..."
                          style={{ width: '100%', resize: 'vertical' }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                      <button 
                        type="button" 
                        onClick={() => setIsCreateTreatmentFormOpen(false)} 
                        className="btn btn-secondary"
                        style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                      >
                        Cancelar
                      </button>
                      <button 
                        type="submit" 
                        className="btn btn-primary"
                        style={{ backgroundColor: '#10b981', borderColor: '#10b981', color: '#022c22', fontWeight: 'bold', padding: '8px 20px' }}
                      >
                        Confirmar y Registrar
                      </button>
                    </div>
                  </form>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ margin: 0, fontSize: '0.92rem', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Historial de Tratamientos Clínicos
                      </h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button
                          type="button"
                          onClick={() => {
                            if (wizardCase) {
                              const caseId = wizardCase.yearly_correlative ? String(wizardCase.yearly_correlative).padStart(4, '0') : '';
                              const dateObj = new Date(wizardCase.created_at);
                              const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                              const year = dateObj.getFullYear();
                              const calculatedName = `${caseId} DERIVACIÓN DIGITAL ${month}/${year}`.trim();
                              setNewTreatmentName(calculatedName);
                            } else {
                              setNewTreatmentName('Nuevo plan de tratamiento');
                            }
                            setIsCreateTreatmentFormOpen(true);
                          }}
                          className="btn btn-primary"
                          style={{ padding: '4px 10px', fontSize: '0.75rem', height: 'auto', backgroundColor: '#3b82f6', borderColor: '#3b82f6', color: 'white' }}
                        >
                          + Crear Tratamiento
                        </button>
                        {wizardTreatments && (
                          <span className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.1)' }}>
                            {wizardTreatments.length} Registrado(s)
                          </span>
                        )}
                      </div>
                    </div>

                    {!wizardTreatments || wizardTreatments.length === 0 ? (
                      <div style={{ padding: '30px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', border: '1px dashed var(--glass-border)', borderRadius: '8px', textAlign: 'center' }}>
                        <span style={{ opacity: 0.6, fontSize: '0.9rem' }}>
                          No se registran tratamientos clínicos activos o anteriores en la ficha de este paciente en Dentalink.
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            if (wizardCase) {
                              const caseId = wizardCase.yearly_correlative ? String(wizardCase.yearly_correlative).padStart(4, '0') : '';
                              const dateObj = new Date(wizardCase.created_at);
                              const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                              const year = dateObj.getFullYear();
                              const calculatedName = `${caseId} DERIVACIÓN DIGITAL ${month}/${year}`.trim();
                              setNewTreatmentName(calculatedName);
                            } else {
                              setNewTreatmentName('Nuevo plan de tratamiento');
                            }
                            setIsCreateTreatmentFormOpen(true);
                          }}
                          className="btn btn-primary"
                          style={{ padding: '8px 20px', fontSize: '0.85rem', backgroundColor: '#10b981', borderColor: '#10b981', color: '#022c22', fontWeight: 'bold' }}
                        >
                          Crear Plan de Tratamiento
                        </button>
                      </div>
                    ) : (
                      <div className="table-container" style={{ maxHeight: '350px', overflowY: 'auto', border: '1px solid var(--glass-border)', borderRadius: '8px' }}>
                        <table className="custom-table" style={{ width: '100%' }}>
                          <thead style={{ position: 'sticky', top: 0, background: 'var(--select-option-bg, #0a1124)', zIndex: 10 }}>
                            <tr>
                              <th style={{ fontSize: '0.8rem', padding: '10px 14px' }}>ID</th>
                              <th style={{ fontSize: '0.8rem', padding: '10px 14px' }}>Tratamiento</th>
                              <th style={{ fontSize: '0.8rem', padding: '10px 14px' }}>Fecha</th>
                              <th style={{ fontSize: '0.8rem', padding: '10px 14px' }}>Dentista / Sucursal</th>
                              <th style={{ fontSize: '0.8rem', padding: '10px 14px' }}>Estado</th>
                              <th style={{ fontSize: '0.8rem', padding: '10px 14px', textAlign: 'center' }}>Prestaciones</th>
                            </tr>
                          </thead>
                          <tbody>
                            {wizardTreatments.map((t: any) => (
                              <tr key={t.id}>
                                <td style={{ fontSize: '0.82rem', padding: '10px 14px', fontFamily: 'monospace' }}>{t.id}</td>
                                <td style={{ fontSize: '0.82rem', padding: '10px 14px', fontWeight: 600 }}>
                                  {t.nombre}
                                  {t.nombre_convenio && (
                                    <div style={{ fontSize: '0.7rem', opacity: 0.5, fontWeight: 'normal' }}>
                                      Convenio: {t.nombre_convenio}
                                    </div>
                                  )}
                                  {(() => {
                                    const evs = wizardEvolutions.filter((ev: any) => Number(ev.id_tratamiento) === Number(t.id));
                                    if (evs.length > 0) {
                                      return (
                                        <div style={{ marginTop: '8px', padding: '6px 8px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.15)', textAlign: 'left' }}>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10b981', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            <Activity size={12} /> Evoluciones ({evs.length})
                                          </div>
                                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                                            {evs.map((ev: any, idx: number) => (
                                              <div key={idx} style={{ fontSize: '0.72rem', fontWeight: 500, opacity: 0.85, borderTop: idx > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none', paddingTop: idx > 0 ? '4px' : '0', color: 'var(--foreground)' }}>
                                                <span style={{ opacity: 0.6, marginRight: '4px' }}>{ev.fecha}:</span> {ev.datos}
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      );
                                    } else {
                                      return (
                                        <div style={{ marginTop: '6px', fontSize: '0.7rem', opacity: 0.5, fontWeight: 'normal', display: 'flex', alignItems: 'center', gap: '4px', textAlign: 'left' }}>
                                          <Activity size={10} /> Sin evoluciones registradas
                                        </div>
                                      );
                                    }
                                  })()}
                                </td>
                                <td style={{ fontSize: '0.82rem', padding: '10px 14px' }}>{t.fecha ? formatDate(t.fecha) : 'Sin fecha'}</td>
                                <td style={{ fontSize: '0.82rem', padding: '10px 14px' }}>
                                  <div>{t.nombre_dentista || 'No asignado'}</div>
                                  <div style={{ fontSize: '0.72rem', opacity: 0.5 }}>{t.nombre_sucursal || 'Principal'}</div>
                                </td>
                                <td style={{ fontSize: '0.82rem', padding: '10px 14px' }}>
                                  <span className={`badge ${t.finalizado === 1 ? 'badge-en_tratamiento' : 'badge-agendado'}`} style={{ fontSize: '0.65rem' }}>
                                    {t.finalizado === 1 ? 'Finalizado' : 'Activo'}
                                  </span>
                                </td>
                                <td style={{ fontSize: '0.82rem', padding: '10px 14px', textAlign: 'center' }}>
                                  <button
                                    type="button"
                                    onClick={() => handleSelectTreatment(t)}
                                    className="btn btn-primary"
                                    style={{ padding: '4px 10px', fontSize: '0.75rem', height: 'auto', backgroundColor: '#10b981', borderColor: '#10b981', color: '#022c22', fontWeight: 'bold' }}
                                  >
                                    Gestionar
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', borderTop: '1px solid var(--glass-border)', paddingTop: '16px' }}>
                  <button 
                    type="button" 
                    onClick={() => {
                      setWizardStep(1);
                      setWizardError(null);
                    }} 
                    className="btn btn-secondary" 
                    disabled={wizardLoading}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <ArrowLeft size={14} /> Atrás
                  </button>
                  <button type="button" onClick={() => setIsWizardOpen(false)} className="btn btn-secondary" disabled={wizardLoading}>
                    Finalizar
                  </button>
                </div>
              </div>
            )}

            {/* Step 3 Content */}
            {wizardStep === 3 && selectedTreatmentForServices && (() => {
              const totalServices = pendingServices.length + linkedServices.length;
              const progressPercent = totalServices > 0 ? Math.round((linkedServices.length / totalServices) * 100) : 0;
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                    <div style={{ fontSize: '0.75rem', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tratamiento Dentalink Seleccionado</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: 'hsl(var(--foreground-hsl))', marginTop: '2px' }}>
                      ID: <span style={{ fontFamily: 'monospace' }}>{selectedTreatmentForServices.id}</span> - {selectedTreatmentForServices.nombre}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600 }}>
                      <span>Progreso de Vinculación</span>
                      <span>{linkedServices.length} de {totalServices} prestaciones sincronizadas ({progressPercent}%)</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
                      <div style={{ width: `${progressPercent}%`, height: '100%', background: 'linear-gradient(90deg, #10b981, #14b8a6)', transition: 'width 0.3s ease' }}></div>
                    </div>
                  </div>

                  <div className="comparison-grid" style={{ marginTop: '10px' }}>
                  {/* Local Odontogram Services */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 700, opacity: 0.8 }}>
                        Prestaciones del Odontograma Local
                      </h4>
                      {pendingServices.length > 0 && (
                        <button
                          type="button"
                          onClick={handleLinkAllServices}
                          className="btn btn-primary"
                          style={{ padding: '3px 8px', fontSize: '0.7rem', height: 'auto', backgroundColor: '#3b82f6', borderColor: '#3b82f6', color: 'white' }}
                        >
                          Vincular Todas
                        </button>
                      )}
                    </div>

                    {pendingServices.length === 0 ? (
                      <div style={{ padding: '30px 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--glass-border)', borderRadius: '8px', opacity: 0.5, fontSize: '0.82rem', textAlign: 'center' }}>
                        No hay prestaciones pendientes en el odontograma.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '250px', overflowY: 'auto' }}>
                        {pendingServices.map((service, index) => (
                          <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', gap: '10px' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 500, lineHeight: 1.4 }}>
                              {service}
                              {getPrestacionIdFromName(service) && (
                                <span style={{ marginLeft: '8px', padding: '2px 6px', background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600 }}>
                                  ID: {getPrestacionIdFromName(service)}
                                </span>
                              )}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleLinkService(service)}
                              className="btn btn-primary"
                              style={{ padding: '4px 8px', fontSize: '0.7rem', height: 'auto', flexShrink: 0 }}
                            >
                              Vincular
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Dentalink Linked Services */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.02)', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
                    <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 700, opacity: 0.8, color: '#10b981' }}>
                      Prestaciones Vinculadas en Dentalink
                    </h4>

                    {linkedServices.length === 0 ? (
                      <div style={{ padding: '30px 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed rgba(16, 185, 129, 0.2)', borderRadius: '8px', opacity: 0.5, fontSize: '0.82rem', textAlign: 'center', color: '#10b981' }}>
                        Ninguna prestación vinculada aún a este tratamiento.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '250px', overflowY: 'auto' }}>
                        {linkedServices.map((service, index) => (
                          <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.06)', border: '1px solid rgba(16, 185, 129, 0.25)', gap: '10px', animation: 'fadeIn 0.3s ease' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px', lineHeight: 1.4 }}>
                              <CheckCircle2 size={14} />
                              {service}
                            </span>
                            <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '3px 8px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              Sincronizado
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', borderTop: '1px solid var(--glass-border)', paddingTop: '16px', marginTop: '10px' }}>
                  <button 
                    type="button" 
                    onClick={() => {
                      setWizardStep(2);
                      setWizardError(null);
                    }} 
                    className="btn btn-secondary" 
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <ArrowLeft size={14} /> Volver a Tratamientos
                  </button>
                  <button 
                    type="button" 
                    onClick={handleFinishWizard} 
                    className="btn btn-primary"
                    disabled={wizardLoading}
                    style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', fontWeight: 'bold' }}
                  >
                    {wizardLoading ? 'Finalizando...' : 'Finalizar y Sincronizar'}
                  </button>
                </div>
              </div>
            )})()}

            {/* Step 4 Content: Sincronización Exitosa */}
            {wizardStep === 4 && wizardCase && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '30px 20px', gap: '24px', textAlign: 'center' }}>
                <div style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#10b981',
                  boxShadow: '0 0 30px rgba(16, 185, 129, 0.25)',
                  border: '1px solid rgba(16, 185, 129, 0.3)'
                }}>
                  <CheckCircle2 size={42} />
                </div>
                
                <div>
                  <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10b981', margin: '0 0 8px 0' }}>
                    ¡Caso Sincronizado Exitosamente!
                  </h3>
                  <p style={{ margin: 0, opacity: 0.7, maxWidth: '500px', fontSize: '0.95rem', lineHeight: '1.5' }}>
                    El paciente **{wizardCase.first_names} {wizardCase.last_names}** y sus prestaciones médicas asociadas han sido cargados y vinculados correctamente en la API de Dentalink.
                  </p>
                </div>

                {/* Sincronización Details Checklist */}
                <div style={{ width: '100%', maxWidth: '500px', padding: '20px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', textAlign: 'left' }}>
                  <h5 style={{ margin: '0 0 12px 0', fontSize: '0.82rem', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Resumen de Sincronización
                  </h5>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <CheckCircle2 size={16} style={{ color: '#10b981', flexShrink: 0 }} />
                      <span>Ficha de Paciente validada/creada en Dentalink (ID: {wizardPatientData?.id})</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <CheckCircle2 size={16} style={{ color: '#10b981', flexShrink: 0 }} />
                      <span>Plan de Tratamiento asignado: **{selectedTreatmentForServices?.nombre}**</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <CheckCircle2 size={16} style={{ color: '#10b981', flexShrink: 0 }} />
                      <span>{linkedServices.length} Prestación(es) vinculadas de forma segura.</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', borderTop: '1px solid var(--glass-border)', paddingTop: '24px', width: '100%' }}>
                  <button 
                    type="button" 
                    onClick={() => {
                      setIsWizardOpen(false);
                      setSelectedCase(wizardCase);
                      setSelectedPatient(wizardPatientData);
                      setIsModalOpen(true);
                    }} 
                    className="btn btn-primary"
                    style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', fontWeight: 'bold' }}
                  >
                    Ver Ficha del Caso
                  </button>
                  <Link href="/dashboard" className="btn btn-secondary">
                    Ir al Dashboard
                  </Link>
                  <button 
                    type="button" 
                    onClick={() => {
                      setIsWizardOpen(false);
                    }} 
                    className="btn btn-secondary"
                  >
                    Ver bandeja de casos
                  </button>
                </div>
              </div>
            )}

          </div>
        )}
      </Modal>

      {/* Responsive stylesheet for comparison columns */}
      <style jsx global>{`
        .comparison-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
        }
        @media (min-width: 768px) {
          .comparison-grid {
            grid-template-columns: 1fr 1fr !important;
            gap: 30px !important;
          }
        }
      `}</style>
    </div>
  );
}
