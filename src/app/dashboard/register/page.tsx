'use client';

import React, { useState, useEffect } from 'react';
import { formatRUT, validateRUT, cleanRUT } from '@/lib/utils';
import { registerPersonAndCaseAction, getPersonByRutAction } from '@/app/actions/caseActions';
import { getCurrentUserAction } from '@/app/actions/userActions';
import { getConveniosByMedicalCenterAction } from '@/app/actions/convenioActions';
import { useRouter } from 'next/navigation';
import Odontogram from '@/components/Odontogram';
import Modal from '@/components/ui/Modal';
import CustomSelect from '@/components/ui/CustomSelect';
import CustomDatePicker from '@/components/ui/CustomDatePicker';

export default function RegisterCasePage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [rut, setRut] = useState('');
  const [rutError, setRutError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Controlled form states for pre-fetching existing person details
  const [firstNames, setFirstNames] = useState('');
  const [lastNames, setLastNames] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [mobileInput, setMobileInput] = useState('');

  // Pre-submission review summary states
  const [showSummary, setShowSummary] = useState(false);
  const [formDataObj, setFormDataObj] = useState<Record<string, string>>({});
  const [formRef, setFormRef] = useState<HTMLFormElement | null>(null);

  // States for professional defaults
  const [profName, setProfName] = useState('');
  const [profTitle, setProfTitle] = useState('');
  const [profPosition, setProfPosition] = useState('');
  const [profEmail, setProfEmail] = useState('');
  const [profAddress, setProfAddress] = useState('');
  const [profWebsite, setProfWebsite] = useState('');

  // State and mask for Birth Date text input optimization
  const [birthDateInput, setBirthDateInput] = useState('');
  const [pickerDate, setPickerDate] = useState('');
  const [odontogramType, setOdontogramType] = useState<'adult' | 'child'>('adult');
  const [odontogramData, setOdontogramData] = useState({
    dentalDiagnosis: '',
    treatmentNeeded: '',
    description: ''
  });

  // States for dynamic "Other" selects
  const [selectedNationality, setSelectedNationality] = useState('Chilena');
  const [customNationality, setCustomNationality] = useState('');

  const [selectedCommune, setSelectedCommune] = useState('Vitacura');
  const [customCommune, setCustomCommune] = useState('');

  const [selectedMedicalCenter, setSelectedMedicalCenter] = useState('');
  const [customMedicalCenter, setCustomMedicalCenter] = useState('');
  const [hasPreloadedMedicalCenter, setHasPreloadedMedicalCenter] = useState(false);

  const [selectedAgreementType, setSelectedAgreementType] = useState('');
  const [customAgreementType, setCustomAgreementType] = useState('');
  const [agreements, setAgreements] = useState<{ value: string; label: string }[]>([]);
  const [preloadedAgreementType, setPreloadedAgreementType] = useState('');

  // Specific validation error states
  const [firstNamesError, setFirstNamesError] = useState<string | null>(null);
  const [lastNamesError, setLastNamesError] = useState<string | null>(null);
  const [nationalityError, setNationalityError] = useState<string | null>(null);
  const [birthDateError, setBirthDateError] = useState<string | null>(null);
  const [communeError, setCommuneError] = useState<string | null>(null);
  const [mobileError, setMobileError] = useState<string | null>(null);
  const [medicalCenterError, setMedicalCenterError] = useState<string | null>(null);
  const [agreementTypeError, setAgreementTypeError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isCancelHovered, setIsCancelHovered] = useState(false);

  // Structural type for validation error center
  interface ValidationErrorItem {
    field: string;
    step: 1 | 2;
    label: string;
    message: string;
    elementId: string;
  }
  const [validationErrors, setValidationErrors] = useState<ValidationErrorItem[]>([]);

  // Focus & Scroll helper for the error center list
  function triggerErrorJump(elementId: string, stepNum: 1 | 2) {
    if (step !== stepNum) {
      setStep(stepNum);
    }
    setTimeout(() => {
      const el = document.getElementById(elementId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Focus programmatically
        el.focus();

        // Apply temporary high-contrast vibration/shake/pulse glow animation
        el.classList.add('animate-shake-error');
        setTimeout(() => {
          el.classList.remove('animate-shake-error');
        }, 1500);
      }
    }, 200);
  }

  // Clear field error dyamically as they correct it in real-time
  function clearFieldError(fieldId: string, errorSetter?: (err: string | null) => void) {
    if (errorSetter) errorSetter(null);
    setValidationErrors(prev => {
      const filtered = prev.filter(e => e.elementId !== fieldId && e.field !== fieldId);
      if (filtered.length === 0) {
        setError(null);
      }
      return filtered;
    });
  }


  function handleBirthDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value; // YYYY-MM-DD
    setPickerDate(val);

    if (!val) {
      setBirthDateInput('');
      return;
    }

    const parts = val.split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const month = parts[1];
      const day = parts[2];

      // Format as DD/MM/AAAA for existing validation
      setBirthDateInput(`${day}/${month}/${year}`);

      // Calculate age to switch odontogram automatically
      const today = new Date();
      const birth = new Date(val);
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
      }

      if (age < 12) {
        setOdontogramType('child');
      } else {
        setOdontogramType('adult');
      }
    }
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
          if (u.medical_center) {
            setSelectedMedicalCenter(u.medical_center);
            setHasPreloadedMedicalCenter(true);
          }
          if (u.agreement_type) {
            setPreloadedAgreementType(u.agreement_type);
            setSelectedAgreementType(u.agreement_type);
          }
        }
      } catch (err) {
        console.error('Failed to load professional defaults:', err);
      }
    }
    loadDefaults();
  }, []);

  useEffect(() => {
    async function loadConvenios() {
      const center = selectedMedicalCenter === 'Otro' ? customMedicalCenter : selectedMedicalCenter;
      if (!center) {
        setAgreements([{ value: 'Otro', label: 'Otro Convenio' }]);
        return;
      }

      try {
        const res = await getConveniosByMedicalCenterAction(center);
        if (res.success && res.convenios) {
          const mapped = res.convenios.map((c: any) => ({
            value: c.empresa,
            label: c.empresa,
          }));
          mapped.push({ value: 'Otro', label: 'Otro Convenio' });
          setAgreements(mapped);

          // If there's a preloaded agreement type, select it. Otherwise if medical center was preloaded, select the first matching convenio
          if (preloadedAgreementType) {
            const matches = mapped.some((opt: any) => opt.value === preloadedAgreementType);
            if (matches) {
              setSelectedAgreementType(preloadedAgreementType);
            } else if (res.convenios.length > 0) {
              setSelectedAgreementType(res.convenios[0].empresa);
            }
          } else if (hasPreloadedMedicalCenter && res.convenios.length > 0) {
            setSelectedAgreementType(res.convenios[0].empresa);
          } else {
            // Reset selection if it's not valid for the new medical center
            const isValid = mapped.some((opt: any) => opt.value === selectedAgreementType);
            if (!isValid && selectedAgreementType !== '' && selectedAgreementType !== 'Otro') {
              setSelectedAgreementType('');
            }
          }
        } else {
          setAgreements([{ value: 'Otro', label: 'Otro Convenio' }]);
        }
      } catch (err) {
        console.error('Failed to load convenios:', err);
        setAgreements([{ value: 'Otro', label: 'Otro Convenio' }]);
      }
    }
    loadConvenios();
  }, [selectedMedicalCenter, customMedicalCenter, preloadedAgreementType]);

  function handleRutChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    const filtered = raw.replace(/[^0-9kK.-]/g, '');
    setRut(filtered);
    if (rutError) setRutError(null);
  }

  function handleRutKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault(); // Prevent standard form submission
      handleRutBlur(); // Format, validate, and search the RUT
    }
  }

  async function handleRutBlur() {
    if (!rut) return;
    const formatted = formatRUT(rut);
    const cleaned = cleanRUT(rut);

    setRut(formatted);

    if (!validateRUT(cleaned)) {
      setRutError('RUT inválido. Verifique el dígito verificador.');
      return;
    } else {
      setRutError(null);
    }

    try {
      setLoading(true);
      const res = await getPersonByRutAction(cleaned);
      if (res.success && res.person) {
        const p = res.person;
        setFirstNames(p.firstNames || '');
        setLastNames(p.lastNames || '');
        setEmailInput(p.email || '');
        setMobileInput(p.mobile || '');

        // Auto select nationality CustomSelect value
        const defaultNationalities = ['Chilena', 'Venezolana', 'Colombiana', 'Peruana', 'Haitiana', 'Ecuatoriana', 'Boliviana'];
        if (p.nationality && defaultNationalities.includes(p.nationality)) {
          setSelectedNationality(p.nationality);
          setCustomNationality('');
        } else if (p.nationality) {
          setSelectedNationality('Otra');
          setCustomNationality(p.nationality);
        }

        // Auto select Commune CustomSelect value
        const defaultCommunes = ['Vitacura', 'Las Condes', 'Lo Barnechea', 'Providencia', 'Santiago', 'Ñuñoa', 'Macul', 'Recoleta', 'Independencia', 'Estación Central', 'La Florida', 'Maipú'];
        if (p.commune && defaultCommunes.includes(p.commune)) {
          setSelectedCommune(p.commune);
          setCustomCommune('');
        } else if (p.commune) {
          setSelectedCommune('Otra Comuna');
          setCustomCommune(p.commune);
        }

        // Handle Birth Date text input & Odontogram calculations
        if (p.birthDate) {
          setPickerDate(p.birthDate); // YYYY-MM-DD
          const parts = p.birthDate.split('-');
          if (parts.length === 3) {
            setBirthDateInput(`${parts[2]}/${parts[1]}/${parts[0]}`);
          }

          const today = new Date();
          const birth = new Date(p.birthDate);
          let age = today.getFullYear() - birth.getFullYear();
          const m = today.getMonth() - birth.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
            age--;
          }
          if (age < 12) {
            setOdontogramType('child');
          } else {
            setOdontogramType('adult');
          }
        }
      }
    } catch (err) {
      console.error('Failed to pre-fetch person details:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleClearForm() {
    setRut('');
    setRutError(null);
    setFirstNames('');
    setLastNames('');
    setEmailInput('');
    setMobileInput('');
    setBirthDateInput('');
    setPickerDate('');
    setSelectedNationality('Chilena');
    setCustomNationality('');
    setSelectedCommune('Vitacura');
    setCustomCommune('');
    setOdontogramType('adult');
    setError(null);
    setSuccess(null);
    setStep(1);

    // Clear validation errors
    setFirstNamesError(null);
    setLastNamesError(null);
    setNationalityError(null);
    setBirthDateError(null);
    setCommuneError(null);
    setMobileError(null);
    setMedicalCenterError(null);
    setAgreementTypeError(null);
    setEmailError(null);
    setValidationErrors([]);
  }

  function validateStep1(): boolean {
    setError(null);
    setRutError(null);
    setFirstNamesError(null);
    setLastNamesError(null);
    setNationalityError(null);
    setBirthDateError(null);
    setCommuneError(null);
    setMobileError(null);
    setAgreementTypeError(null);
    setEmailError(null);

    const errorsList: ValidationErrorItem[] = [];

    // Validate RUT
    const cleaned = cleanRUT(rut);
    if (!rut.trim()) {
      setRutError('El RUT es obligatorio.');
      errorsList.push({
        field: 'rut',
        step: 1,
        label: 'RUT del Beneficiario',
        message: 'El RUT es obligatorio.',
        elementId: 'rut'
      });
    } else if (!validateRUT(cleaned)) {
      setRutError('RUT inválido. Verifique el dígito verificador.');
      errorsList.push({
        field: 'rut',
        step: 1,
        label: 'RUT del Beneficiario',
        message: 'RUT inválido.',
        elementId: 'rut'
      });
    }

    // Validate Nombres
    if (!firstNames.trim()) {
      setFirstNamesError('Por favor ingrese los Nombres.');
      errorsList.push({
        field: 'first_names',
        step: 1,
        label: 'Nombres',
        message: 'Los nombres son obligatorios.',
        elementId: 'first_names'
      });
    }

    // Validate Apellidos
    if (!lastNames.trim()) {
      setLastNamesError('Por favor ingrese los Apellidos.');
      errorsList.push({
        field: 'last_names',
        step: 1,
        label: 'Apellidos',
        message: 'Los apellidos son obligatorios.',
        elementId: 'last_names'
      });
    }

    // Validate Nacionalidad
    if (!selectedNationality) {
      setNationalityError('Por favor seleccione una nacionalidad.');
      errorsList.push({
        field: 'nationality',
        step: 1,
        label: 'Nacionalidad',
        message: 'Seleccione nacionalidad.',
        elementId: 'nationality_select'
      });
    } else if (selectedNationality === 'Otra' && !customNationality.trim()) {
      setNationalityError('Por favor especifique la nacionalidad.');
      errorsList.push({
        field: 'custom_nationality',
        step: 1,
        label: 'Nacionalidad Especificada',
        message: 'Especifique la nacionalidad.',
        elementId: 'custom_nationality'
      });
    }

    // Validate Fecha de Nacimiento
    const dateParts = birthDateInput.split('/');
    if (dateParts.length !== 3 || dateParts[2].length !== 4 || dateParts[1].length !== 2 || dateParts[0].length !== 2) {
      setBirthDateError('Por favor ingrese una fecha de nacimiento válida en formato DD/MM/AAAA.');
      errorsList.push({
        field: 'birth_date',
        step: 1,
        label: 'Fecha de Nacimiento',
        message: 'Formato DD/MM/AAAA requerido.',
        elementId: 'birth_date_text'
      });
    } else {
      const day = parseInt(dateParts[0], 10);
      const month = parseInt(dateParts[1], 10);
      const year = parseInt(dateParts[2], 10);
      if (isNaN(day) || isNaN(month) || isNaN(year) || month < 1 || month > 12 || day < 1 || day > 31 || year < 1900 || year > new Date().getFullYear()) {
        setBirthDateError('Por favor ingrese una fecha de nacimiento válida.');
        errorsList.push({
          field: 'birth_date',
          step: 1,
          label: 'Fecha de Nacimiento',
          message: 'Fecha no válida.',
          elementId: 'birth_date_text'
        });
      }
    }

    // Validate Comuna
    if (!selectedCommune) {
      setCommuneError('Por favor seleccione una comuna de residencia.');
      errorsList.push({
        field: 'commune',
        step: 1,
        label: 'Comuna de Residencia',
        message: 'Seleccione comuna.',
        elementId: 'commune_select'
      });
    } else if (selectedCommune === 'Otra Comuna' && !customCommune.trim()) {
      setCommuneError('Por favor especifique su comuna de residencia.');
      errorsList.push({
        field: 'custom_commune',
        step: 1,
        label: 'Comuna Especificada',
        message: 'Especifique la comuna.',
        elementId: 'custom_commune'
      });
    }

    // Validate Email
    if (!emailInput.trim()) {
      setEmailError('Por favor ingrese un correo electrónico.');
      errorsList.push({
        field: 'email',
        step: 1,
        label: 'Correo Electrónico',
        message: 'El correo electrónico es obligatorio.',
        elementId: 'email'
      });
    } else if (!emailInput.includes('@')) {
      setEmailError('Por favor ingrese un correo electrónico válido.');
      errorsList.push({
        field: 'email',
        step: 1,
        label: 'Correo Electrónico',
        message: 'Correo electrónico inválido.',
        elementId: 'email'
      });
    }

    // Validate Celular
    if (!mobileInput.trim()) {
      setMobileError('Por favor ingrese un celular de contacto.');
      errorsList.push({
        field: 'mobile',
        step: 1,
        label: 'Celular de Contacto',
        message: 'El celular es obligatorio.',
        elementId: 'mobile'
      });
    }

    setValidationErrors(errorsList);

    if (errorsList.length > 0) {
      setError('Por favor corrija los datos obligatorios o incorrectos en el formulario.');
      // Auto jump and focus the first error
      const firstErr = errorsList[0];
      triggerErrorJump(firstErr.elementId, 1);
      return false;
    }

    return true;
  }

  function handleNextStep() {
    if (validateStep1()) {
      setValidationErrors([]);
      window.scrollTo({ top: 150, behavior: 'smooth' });
      setStep(2);
    }
  }

  function validateStep2(): boolean {
    setError(null);
    setMedicalCenterError(null);
    setAgreementTypeError(null);

    // Keep active step 1 errors if somehow they exist
    const errorsList: ValidationErrorItem[] = [...validationErrors.filter(e => e.step === 1)];

    if (!selectedMedicalCenter) {
      setMedicalCenterError('Por favor seleccione un centro médico de origen.');
      errorsList.push({
        field: 'medical_center',
        step: 2,
        label: 'Centro Médico de Origen',
        message: 'Seleccione un centro médico.',
        elementId: 'medical_center_select'
      });
    } else if (selectedMedicalCenter === 'Otro' && !customMedicalCenter.trim()) {
      setMedicalCenterError('Por favor especifique el centro médico de origen.');
      errorsList.push({
        field: 'custom_medical_center',
        step: 2,
        label: 'Centro Médico Especificado',
        message: 'Especifique el centro médico.',
        elementId: 'custom_medical_center'
      });
    }

    if (!selectedAgreementType) {
      setAgreementTypeError('Por favor seleccione un tipo de convenio.');
      errorsList.push({
        field: 'agreement_type',
        step: 2,
        label: 'Tipo de Convenio',
        message: 'Seleccione tipo de convenio.',
        elementId: 'agreement_type_select'
      });
    } else if (selectedAgreementType === 'Otro' && !customAgreementType.trim()) {
      setAgreementTypeError('Por favor especifique el tipo de convenio.');
      errorsList.push({
        field: 'custom_agreement_type',
        step: 2,
        label: 'Convenio Especificado',
        message: 'Especifique el tipo de convenio.',
        elementId: 'custom_agreement_type'
      });
    }

    setValidationErrors(errorsList);

    if (errorsList.length > 0) {
      setError('Por favor corrija los datos obligatorios o incorrectos en el formulario.');
      const step2Errs = errorsList.filter(e => e.step === 2);
      if (step2Errs.length > 0) {
        triggerErrorJump(step2Errs[0].elementId, 2);
      } else {
        triggerErrorJump(errorsList[0].elementId, errorsList[0].step);
      }
      return false;
    }

    return true;
  }

  function handleNextStep2() {
    if (validateStep2()) {
      setValidationErrors([]);
      window.scrollTo({ top: 150, behavior: 'smooth' });
      setStep(3);
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

    // Intercept submission to show confirmation summary modal
    const formData = new FormData(formElement);
    const data: Record<string, string> = {
      rut: formatRUT(rut),
      firstNames: formData.get('first_names') as string || '',
      lastNames: formData.get('last_names') as string || '',
      nationality: selectedNationality === 'Otra' ? customNationality : selectedNationality,
      birthDate: birthDateInput,
      commune: selectedCommune === 'Otra Comuna' ? customCommune : selectedCommune,
      email: formData.get('email') as string || 'No especificado',
      mobile: formData.get('mobile') as string || '',
      medicalCenter: selectedMedicalCenter === 'Otro' ? customMedicalCenter : selectedMedicalCenter,
      agreementType: selectedAgreementType === 'Otro' ? customAgreementType : selectedAgreementType,
      dentalDiagnosis: odontogramData.dentalDiagnosis || 'Sin patologías registradas en odontograma.',
      treatmentNeeded: odontogramData.treatmentNeeded || 'Sin prestaciones asignadas.',
      description: odontogramData.description || 'Derivación ingresada mediante odontograma interactivo.'
    };

    setFormDataObj(data);
    setFormRef(formElement);
    setShowSummary(true);
  }

  async function confirmRegistration() {
    if (!formRef) return;
    setShowSummary(false);
    setLoading(true);
    setError(null);
    setSuccess(null);

    const cleaned = cleanRUT(rut);
    const formData = new FormData(formRef);
    formData.set('rut', cleaned); // Send cleaned RUT to server

    try {
      const result = await registerPersonAndCaseAction(formData);

      if (result.success) {
        setSuccess('¡Caso social e inscripción registrados exitosamente! Redireccionando...');
        formRef.reset();
        setRut('');
        setFirstNames('');
        setLastNames('');
        setEmailInput('');
        setMobileInput('');
        setBirthDateInput('');
        setPickerDate('');

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
          <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" /></svg>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <h2 style={{ fontSize: '1.75rem', fontFamily: 'var(--font-display)', fontWeight: 800, margin: 0 }}>
            Inscribir Persona y Derivación Digital
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
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.88rem', lineHeight: '1.45' }}>
          <strong style={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: '0.78rem' }}>Información Importante</strong>
          <span style={{ fontWeight: 500, opacity: 0.95 }}>
            Una vez ingresada la derivación, el registro quedará bloqueado para su edición. Si necesitas corregir o modificar algún dato posterior al envío, por favor escribe directamente a <a href="mailto:derivaciones@policlinicotabancura.cl" style={{ color: 'currentColor', textDecoration: 'underline', fontWeight: 700 }}>derivaciones@policlinicotabancura.cl</a>.
          </span>
        </div>
      </div>

      {/* Main Glassmorphic Form Container */}
      <div className="glass-panel" style={{ padding: '40px' }}>
        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>

          {/* Premium Step Indicator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            marginBottom: '10px',
            paddingBottom: '20px',
            borderBottom: '1px solid var(--glass-border)',
            flexWrap: 'wrap'
          }}>
            {/* Step 1 */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              borderRadius: '20px',
              backgroundColor: step === 1 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.03)',
              border: step === 1 ? '1px solid #10b981' : '1px solid rgba(16, 185, 129, 0.25)',
              color: '#10b981',
              fontWeight: 700,
              fontSize: '0.85rem',
              transition: 'all 0.3s ease'
            }}>
              <span style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                backgroundColor: '#10b981',
                color: '#ffffff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 800
              }}>{step > 1 ? '✓' : '1'}</span>
              1. Datos Personales
            </div>
            <div style={{
              height: '2px',
              width: '30px',
              backgroundColor: step >= 2 ? '#10b981' : 'var(--glass-border)',
              transition: 'all 0.3s ease'
            }} />

            {/* Step 2 */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              borderRadius: '20px',
              backgroundColor: step === 2 ? 'rgba(20, 184, 166, 0.1)' : step > 2 ? 'rgba(20, 184, 166, 0.03)' : 'rgba(255, 255, 255, 0.02)',
              border: step === 2 ? '1px solid #14b8a6' : step > 2 ? '1px solid rgba(20, 184, 166, 0.25)' : '1px solid var(--glass-border)',
              color: step >= 2 ? '#14b8a6' : 'var(--foreground-hsl)',
              fontWeight: 700,
              fontSize: '0.85rem',
              transition: 'all 0.3s ease',
              opacity: step >= 2 ? 1 : 0.6
            }}>
              <span style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                backgroundColor: step >= 2 ? '#14b8a6' : 'rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 800
              }}>{step > 2 ? '✓' : '2'}</span>
              2. Caso y Odontograma
            </div>
            <div style={{
              height: '2px',
              width: '30px',
              backgroundColor: step >= 3 ? '#10b981' : 'var(--glass-border)',
              transition: 'all 0.3s ease'
            }} />

            {/* Step 3 */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              borderRadius: '20px',
              backgroundColor: step === 3 ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255, 255, 255, 0.02)',
              border: step === 3 ? '1px solid #3b82f6' : '1px solid var(--glass-border)',
              color: step === 3 ? '#3b82f6' : 'var(--foreground-hsl)',
              fontWeight: 700,
              fontSize: '0.85rem',
              transition: 'all 0.3s ease',
              opacity: step === 3 ? 1 : 0.6
            }}>
              <span style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                backgroundColor: step === 3 ? '#3b82f6' : 'rgba(255, 255, 255, 0.1)',
                color: step === 3 ? '#ffffff' : 'var(--foreground-hsl)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 800
              }}>3</span>
              3. Firma y Envío
            </div>
          </div>

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
          {step === 1 ? (
            <div className="animate-fade-in">
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
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                1. Datos Personales del Beneficiario
              </h3>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '20px'
              }}>

                {/* RUT field */}
                <div className="form-group">
                  <label className="form-label" htmlFor="rut" style={{ color: rutError ? 'hsl(var(--danger-hsl))' : undefined }}>
                    RUT del Beneficiario * {rutError && <span className="animate-fade-in" style={{ marginLeft: '4px' }}>⚠️</span>}
                  </label>
                  <span style={{ fontSize: '0.76rem', opacity: 0.55, marginTop: '-3px', marginBottom: '2px', display: 'block', fontWeight: 500 }}>
                    Ej: 123456781 + Enter/Tab para buscar en el registro
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      className={`form-input ${rutError ? 'animate-shake-error' : ''}`}
                      type="text"
                      id="rut"
                      name="rut"
                      required
                      value={rut}
                      onChange={(e) => {
                        handleRutChange(e);
                        clearFieldError('rut', setRutError);
                      }}
                      onBlur={handleRutBlur}
                      onKeyDown={handleRutKeyDown}
                      placeholder=""
                      disabled={loading}
                      maxLength={12}
                      style={{
                        flex: 1,
                        borderColor: rutError ? 'hsl(var(--danger-hsl))' : 'var(--glass-border)'
                      }}
                    />
                    {(rut || firstNames || lastNames || emailInput || mobileInput || birthDateInput) && (
                      <button
                        type="button"
                        onClick={handleClearForm}
                        className="btn-secondary"
                        style={{
                          padding: '0 16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          fontSize: '0.85rem',
                          whiteSpace: 'nowrap',
                          height: '42px',
                          borderColor: 'rgba(239, 68, 68, 0.2)',
                          color: '#ef4444',
                        }}
                        title="Limpiar Búsqueda y Datos Formulario"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
                        Limpiar
                      </button>
                    )}
                  </div>
                  {rutError && (
                    <span style={{ fontSize: '0.75rem', color: 'hsl(var(--danger-hsl))', fontWeight: 600, marginTop: '4px' }}>
                      {rutError}
                    </span>
                  )}
                </div>

                {/* First Names */}
                <div className="form-group">
                  <label className="form-label" htmlFor="first_names" style={{ color: firstNamesError ? 'hsl(var(--danger-hsl))' : undefined }}>
                    Nombres * {firstNamesError && <span className="animate-fade-in" style={{ marginLeft: '4px' }}>⚠️</span>}
                  </label>
                  <span style={{ fontSize: '0.76rem', opacity: 0.55, marginTop: '-3px', marginBottom: '2px', display: 'block', fontWeight: 500 }}>
                    Nombres completos del beneficiario
                  </span>
                  <input
                    className={`form-input ${firstNamesError ? 'animate-shake-error' : ''}`}
                    type="text"
                    id="first_names"
                    name="first_names"
                    required
                    placeholder=""
                    disabled={loading}
                    value={firstNames}
                    onChange={(e) => {
                      setFirstNames(e.target.value);
                      clearFieldError('first_names', setFirstNamesError);
                    }}
                    style={{
                      borderColor: firstNamesError ? 'hsl(var(--danger-hsl))' : 'var(--glass-border)',
                      boxShadow: firstNamesError ? '0 0 0 3px rgba(239, 68, 68, 0.15)' : 'none'
                    }}
                  />
                  {firstNamesError && (
                    <span style={{ fontSize: '0.75rem', color: 'hsl(var(--danger-hsl))', fontWeight: 600, marginTop: '4px' }}>
                      {firstNamesError}
                    </span>
                  )}
                </div>

                {/* Last Names */}
                <div className="form-group">
                  <label className="form-label" htmlFor="last_names" style={{ color: lastNamesError ? 'hsl(var(--danger-hsl))' : undefined }}>
                    Apellidos * {lastNamesError && <span className="animate-fade-in" style={{ marginLeft: '4px' }}>⚠️</span>}
                  </label>
                  <span style={{ fontSize: '0.76rem', opacity: 0.55, marginTop: '-3px', marginBottom: '2px', display: 'block', fontWeight: 500 }}>
                    Apellidos paterno y materno
                  </span>
                  <input
                    className={`form-input ${lastNamesError ? 'animate-shake-error' : ''}`}
                    type="text"
                    id="last_names"
                    name="last_names"
                    required
                    placeholder=""
                    disabled={loading}
                    value={lastNames}
                    onChange={(e) => {
                      setLastNames(e.target.value);
                      clearFieldError('last_names', setLastNamesError);
                    }}
                    style={{
                      borderColor: lastNamesError ? 'hsl(var(--danger-hsl))' : 'var(--glass-border)',
                      boxShadow: lastNamesError ? '0 0 0 3px rgba(239, 68, 68, 0.15)' : 'none'
                    }}
                  />
                  {lastNamesError && (
                    <span style={{ fontSize: '0.75rem', color: 'hsl(var(--danger-hsl))', fontWeight: 600, marginTop: '4px' }}>
                      {lastNamesError}
                    </span>
                  )}
                </div>

                {/* Nationality */}
                <div className="form-group" id="nationality_group" tabIndex={-1} style={{ outline: 'none' }}>
                  <label className="form-label" htmlFor="nationality_select" style={{ color: nationalityError ? 'hsl(var(--danger-hsl))' : undefined }}>
                    Nacionalidad * {nationalityError && <span className="animate-fade-in" style={{ marginLeft: '4px' }}>⚠️</span>}
                  </label>
                  <span style={{ fontSize: '0.76rem', opacity: 0.55, marginTop: '-3px', marginBottom: '2px', display: 'block', fontWeight: 500 }}>
                    Nacionalidad de origen
                  </span>
                  <CustomSelect
                    value={selectedNationality}
                    onChange={(val) => {
                      setSelectedNationality(val);
                      clearFieldError('nationality_select', setNationalityError);
                    }}
                    options={[
                      { value: 'Chilena', label: 'Chilena' },
                      { value: 'Venezolana', label: 'Venezolana' },
                      { value: 'Colombiana', label: 'Colombiana' },
                      { value: 'Peruana', label: 'Peruana' },
                      { value: 'Haitiana', label: 'Haitiana' },
                      { value: 'Ecuatoriana', label: 'Ecuatoriana' },
                      { value: 'Boliviana', label: 'Boliviana' },
                      { value: 'Otra', label: 'Otra nacionalidad' }
                    ]}
                    placeholder="Seleccione nacionalidad..."
                    disabled={loading}
                    id="nationality_select"
                    hasError={!!nationalityError}
                  />

                  {selectedNationality === 'Otra' && (
                    <div className="form-group animate-fade-in" style={{ marginTop: '10px' }}>
                      <label className="form-label" htmlFor="custom_nationality" style={{ fontSize: '0.78rem', opacity: 0.8 }}>Especifique la Nacionalidad *</label>
                      <input
                        className={`form-input ${nationalityError ? 'animate-shake-error' : ''}`}
                        type="text"
                        id="custom_nationality"
                        placeholder="Escriba la nacionalidad"
                        value={customNationality}
                        onChange={(e) => {
                          setCustomNationality(e.target.value);
                          clearFieldError('custom_nationality', setNationalityError);
                        }}
                        required
                        disabled={loading}
                        style={{
                          borderColor: nationalityError ? 'hsl(var(--danger-hsl))' : 'var(--glass-border)',
                          boxShadow: nationalityError ? '0 0 0 3px rgba(239, 68, 68, 0.15)' : 'none'
                        }}
                      />
                    </div>
                  )}
                  {nationalityError && (
                    <span style={{ fontSize: '0.75rem', color: 'hsl(var(--danger-hsl))', fontWeight: 600, marginTop: '4px' }}>
                      {nationalityError}
                    </span>
                  )}

                  <input
                    type="hidden"
                    name="nationality"
                    value={selectedNationality === 'Otra' ? customNationality : selectedNationality}
                  />
                </div>

                {/* Birth Date Input */}
                <div className="form-group">
                  <label className="form-label" htmlFor="birth_date_text" style={{ color: birthDateError ? 'hsl(var(--danger-hsl))' : undefined }}>
                    Fecha de Nacimiento * {birthDateError && <span className="animate-fade-in" style={{ marginLeft: '4px' }}>⚠️</span>}
                  </label>
                  <span style={{ fontSize: '0.76rem', opacity: 0.55, marginTop: '-3px', marginBottom: '2px', display: 'block', fontWeight: 500 }}>
                    Formato DD/MM/AAAA
                  </span>
                  <CustomDatePicker
                    value={pickerDate}
                    onChange={(val) => {
                      setPickerDate(val);
                      clearFieldError('birth_date_text', setBirthDateError);
                      if (!val) {
                        setBirthDateInput('');
                        return;
                      }
                      const parts = val.split('-');
                      if (parts.length === 3) {
                        setBirthDateInput(`${parts[2]}/${parts[1]}/${parts[0]}`);

                        // Calculate age to switch odontogram automatically
                        const today = new Date();
                        const birth = new Date(val);
                        let age = today.getFullYear() - birth.getFullYear();
                        const m = today.getMonth() - birth.getMonth();
                        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
                          age--;
                        }
                        if (age < 12) {
                          setOdontogramType('child');
                        } else {
                          setOdontogramType('adult');
                        }
                      }
                    }}
                    required
                    disabled={loading}
                    hasError={!!birthDateError}
                  />
                  {birthDateError && (
                    <span style={{ fontSize: '0.75rem', color: 'hsl(var(--danger-hsl))', fontWeight: 600, marginTop: '4px' }}>
                      {birthDateError}
                    </span>
                  )}

                  <input type="hidden" name="birth_date" value={(() => {
                    const parts = birthDateInput.split('/');
                    return parts.length === 3 && parts[2].length === 4
                      ? `${parts[2]}-${parts[1]}-${parts[0]}`
                      : '';
                  })()} />
                </div>

                {/* Commune */}
                <div className="form-group" id="commune_group" tabIndex={-1} style={{ outline: 'none' }}>
                  <label className="form-label" htmlFor="commune_select" style={{ color: communeError ? 'hsl(var(--danger-hsl))' : undefined }}>
                    Comuna de Residencia * {communeError && <span className="animate-fade-in" style={{ marginLeft: '4px' }}>⚠️</span>}
                  </label>
                  <span style={{ fontSize: '0.76rem', opacity: 0.55, marginTop: '-3px', marginBottom: '2px', display: 'block', fontWeight: 500 }}>
                    Comuna de residencia actual
                  </span>
                  <CustomSelect
                    value={selectedCommune}
                    onChange={(val) => {
                      setSelectedCommune(val);
                      clearFieldError('commune_select', setCommuneError);
                    }}
                    options={[
                      { value: 'Vitacura', label: 'Vitacura' },
                      { value: 'Las Condes', label: 'Las Condes' },
                      { value: 'Lo Barnechea', label: 'Lo Barnechea' },
                      { value: 'Providencia', label: 'Providencia' },
                      { value: 'Santiago', label: 'Santiago' },
                      { value: 'Ñuñoa', label: 'Ñuñoa' },
                      { value: 'Macul', label: 'Macul' },
                      { value: 'Recoleta', label: 'Recoleta' },
                      { value: 'Independencia', label: 'Independencia' },
                      { value: 'Estación Central', label: 'Estación Central' },
                      { value: 'La Florida', label: 'La Florida' },
                      { value: 'Maipú', label: 'Maipú' },
                      { value: 'Otra Comuna', label: 'Otra Comuna' }
                    ]}
                    placeholder="Seleccione comuna..."
                    disabled={loading}
                    id="commune_select"
                    hasError={!!communeError}
                  />

                  {selectedCommune === 'Otra Comuna' && (
                    <div className="form-group animate-fade-in" style={{ marginTop: '10px' }}>
                      <label className="form-label" htmlFor="custom_commune" style={{ fontSize: '0.78rem', opacity: 0.8 }}>Especifique la Comuna *</label>
                      <input
                        className={`form-input ${communeError ? 'animate-shake-error' : ''}`}
                        type="text"
                        id="custom_commune"
                        placeholder="Escriba el nombre de la comuna"
                        value={customCommune}
                        onChange={(e) => {
                          setCustomCommune(e.target.value);
                          clearFieldError('custom_commune', setCommuneError);
                        }}
                        required
                        disabled={loading}
                        style={{
                          borderColor: communeError ? 'hsl(var(--danger-hsl))' : 'var(--glass-border)',
                          boxShadow: communeError ? '0 0 0 3px rgba(239, 68, 68, 0.15)' : 'none'
                        }}
                      />
                    </div>
                  )}
                  {communeError && (
                    <span style={{ fontSize: '0.75rem', color: 'hsl(var(--danger-hsl))', fontWeight: 600, marginTop: '4px' }}>
                      {communeError}
                    </span>
                  )}

                  <input
                    type="hidden"
                    name="commune"
                    value={selectedCommune === 'Otra Comuna' ? customCommune : selectedCommune}
                  />
                </div>

                {/* Email */}
                <div className="form-group">
                  <label className="form-label" htmlFor="email" style={{ color: emailError ? 'hsl(var(--danger-hsl))' : undefined }}>
                    Correo Electrónico * {emailError && <span className="animate-fade-in" style={{ marginLeft: '4px' }}>⚠️</span>}
                  </label>
                  <span style={{ fontSize: '0.76rem', opacity: 0.55, marginTop: '-3px', marginBottom: '2px', display: 'block', fontWeight: 500 }}>
                    Dirección de correo electrónico
                  </span>
                  <input
                    className={`form-input ${emailError ? 'animate-shake-error' : ''}`}
                    type="email"
                    id="email"
                    name="email"
                    required
                    placeholder=""
                    disabled={loading}
                    value={emailInput}
                    onChange={(e) => {
                      setEmailInput(e.target.value);
                      clearFieldError('email', setEmailError);
                    }}
                    style={{
                      borderColor: emailError ? 'hsl(var(--danger-hsl))' : 'var(--glass-border)',
                      boxShadow: emailError ? '0 0 0 3px rgba(239, 68, 68, 0.15)' : 'none'
                    }}
                  />
                  {emailError && (
                    <span style={{ fontSize: '0.75rem', color: 'hsl(var(--danger-hsl))', fontWeight: 600, marginTop: '4px' }}>
                      {emailError}
                    </span>
                  )}
                </div>

                {/* Mobile Phone */}
                <div className="form-group">
                  <label className="form-label" htmlFor="mobile" style={{ color: mobileError ? 'hsl(var(--danger-hsl))' : undefined }}>
                    Celular de Contacto * {mobileError && <span className="animate-fade-in" style={{ marginLeft: '4px' }}>⚠️</span>}
                  </label>
                  <span style={{ fontSize: '0.76rem', opacity: 0.55, marginTop: '-3px', marginBottom: '2px', display: 'block', fontWeight: 500 }}>
                    Ej: +56 9 1234 5678
                  </span>
                  <input
                    className={`form-input ${mobileError ? 'animate-shake-error' : ''}`}
                    type="tel"
                    id="mobile"
                    name="mobile"
                    required
                    placeholder=""
                    disabled={loading}
                    value={mobileInput}
                    onChange={(e) => {
                      setMobileInput(e.target.value);
                      clearFieldError('mobile', setMobileError);
                    }}
                    style={{
                      borderColor: mobileError ? 'hsl(var(--danger-hsl))' : 'var(--glass-border)',
                      boxShadow: mobileError ? '0 0 0 3px rgba(239, 68, 68, 0.15)' : 'none'
                    }}
                  />
                  {mobileError && (
                    <span style={{ fontSize: '0.75rem', color: 'hsl(var(--danger-hsl))', fontWeight: 600, marginTop: '4px' }}>
                      {mobileError}
                    </span>
                  )}
                </div>

              </div>
            </div>
          ) : (
            /* Step 2 Verified Personal Data summary header card */
            <div className="animate-fade-in" style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              padding: '24px 28px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.04) 0%, rgba(20, 184, 166, 0.01) 100%)',
              border: '1.5px solid rgba(16, 185, 129, 0.2)',
              boxShadow: 'var(--shadow-sm)',
              position: 'relative'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <span style={{ fontSize: '1.02rem', fontWeight: 800, color: '#10b981', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  Datos Personales Verificados y Confirmados
                </span>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn-secondary"
                  style={{
                    padding: '8px 16px',
                    fontSize: '0.8rem',
                    borderRadius: '8px',
                    fontWeight: 700,
                    height: 'auto',
                    border: '1px solid rgba(255,255,255,0.08)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
                  Modificar
                </button>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '16px',
                marginTop: '6px'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <span style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    opacity: 0.6,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '2px',
                    color: 'var(--foreground-hsl)'
                  }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#10b981' }}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                    Nombre del Paciente
                  </span>
                  <strong style={{ fontSize: '0.94rem', paddingLeft: '19px' }}>{firstNames} {lastNames}</strong>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <span style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    opacity: 0.6,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '2px',
                    color: 'var(--foreground-hsl)'
                  }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#10b981' }}><rect x="3" y="4" width="18" height="16" rx="2" ry="2" /><line x1="7" y1="8" x2="17" y2="8" /><line x1="7" y1="12" x2="13" y2="12" /><line x1="7" y1="16" x2="9" y2="16" /></svg>
                    RUT
                  </span>
                  <strong style={{ fontSize: '0.94rem', paddingLeft: '19px' }}>{formatRUT(rut)}</strong>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <span style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    opacity: 0.6,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '2px',
                    color: 'var(--foreground-hsl)'
                  }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#10b981' }}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                    Fecha de Nacimiento
                  </span>
                  <strong style={{ fontSize: '0.94rem', paddingLeft: '19px' }}>{birthDateInput}</strong>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <span style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    opacity: 0.6,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '2px',
                    color: 'var(--foreground-hsl)'
                  }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#10b981' }}><circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /><path d="M2 12h20" /></svg>
                    Nacionalidad
                  </span>
                  <strong style={{ fontSize: '0.94rem', paddingLeft: '19px' }}>{selectedNationality === 'Otra' ? customNationality : selectedNationality}</strong>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <span style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    opacity: 0.6,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '2px',
                    color: 'var(--foreground-hsl)'
                  }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#10b981' }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                    Comuna de Residencia
                  </span>
                  <strong style={{ fontSize: '0.94rem', paddingLeft: '19px' }}>{selectedCommune === 'Otra Comuna' ? customCommune : selectedCommune}</strong>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <span style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    opacity: 0.6,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '2px',
                    color: 'var(--foreground-hsl)'
                  }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#10b981' }}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                    Celular
                  </span>
                  <strong style={{ fontSize: '0.94rem', paddingLeft: '19px' }}>{mobileInput}</strong>
                </div>
              </div>
              {/* Hidden fields for Step 1 so HTML form handles them on submit */}
              <input type="hidden" name="first_names" value={firstNames} />
              <input type="hidden" name="last_names" value={lastNames} />
              <input type="hidden" name="email" value={emailInput} />
              <input type="hidden" name="mobile" value={mobileInput} />
              <input type="hidden" name="nationality" value={selectedNationality === 'Otra' ? customNationality : selectedNationality} />
              <input type="hidden" name="birth_date" value={(() => {
                const parts = birthDateInput.split('/');
                return parts.length === 3 && parts[2].length === 4
                  ? `${parts[2]}-${parts[1]}-${parts[0]}`
                  : '';
              })()} />
              <input type="hidden" name="commune" value={selectedCommune === 'Otra Comuna' ? customCommune : selectedCommune} />
            </div>
          )}

          {/* Section 2 & 3: Only visible on step 2 or 3 */}
          {(step === 2 || step === 3) && (
            <div className="animate-fade-in" style={{ display: step === 2 ? 'flex' : 'none', flexDirection: 'column', gap: '30px' }}>
              {/* Section 2: Case Details */}
              <div>
                <h3 style={{
                  fontSize: '1.1rem',
                  fontFamily: 'var(--font-display)',
                  fontWeight: 700,
                  borderBottom: '1px solid var(--glass-border)',
                  paddingBottom: '10px',
                  marginBottom: '14px',
                  color: 'hsl(var(--accent-hsl))',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
                  2. Detalle del Caso o Convenio
                </h3>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '20px'
                }}>
                  {/* Medical Center */}
                  <div className="form-group" id="medical_center_group" tabIndex={-1} style={{ outline: 'none' }}>
                    <label className="form-label" htmlFor="medical_center_select" style={{ color: medicalCenterError ? 'hsl(var(--danger-hsl))' : undefined }}>
                      Centro Médico de Origen * {medicalCenterError && <span className="animate-fade-in" style={{ marginLeft: '4px' }}>⚠️</span>}
                    </label>
                    {hasPreloadedMedicalCenter ? (
                      <>
                        <input
                          className="form-input"
                          type="text"
                          id="medical_center_display"
                          readOnly={true}
                          value={selectedMedicalCenter}
                          style={{
                            opacity: 0.8,
                            cursor: 'not-allowed',
                            backgroundColor: 'rgba(255, 255, 255, 0.03)',
                            fontWeight: 600,
                            borderColor: 'var(--glass-border)'
                          }}
                        />
                        <input
                          type="hidden"
                          name="medical_center"
                          value={selectedMedicalCenter}
                        />
                      </>
                    ) : (
                      <>
                        <CustomSelect
                          value={selectedMedicalCenter}
                          onChange={(val) => {
                            setSelectedMedicalCenter(val);
                            clearFieldError('medical_center_select', setMedicalCenterError);
                          }}
                          options={[
                            { value: 'CESFAM Vitacura', label: 'CESFAM Vitacura' },
                            { value: 'CESFAM Lo Barnechea', label: 'CESFAM Lo Barnechea' },
                            { value: 'Consultorio Dr. Aníbal Ariztía', label: 'Consultorio Dr. Aníbal Ariztía' },
                            { value: 'Otro', label: 'Otro Centro de Salud Familiar' }
                          ]}
                          placeholder="Seleccione un Centro..."
                          disabled={loading}
                          id="medical_center_select"
                          hasError={!!medicalCenterError}
                        />

                        {selectedMedicalCenter === 'Otro' && (
                          <div className="form-group animate-fade-in" style={{ marginTop: '10px' }}>
                            <label className="form-label" htmlFor="custom_medical_center" style={{ fontSize: '0.78rem', opacity: 0.8 }}>Especifique el Centro Médico *</label>
                            <input
                              className={`form-input ${medicalCenterError ? 'animate-shake-error' : ''}`}
                              type="text"
                              id="custom_medical_center"
                              placeholder="Escriba el nombre del centro médico"
                              value={customMedicalCenter}
                              onChange={(e) => {
                                setCustomMedicalCenter(e.target.value);
                                clearFieldError('custom_medical_center', setMedicalCenterError);
                              }}
                              required
                              disabled={loading}
                              style={{
                                borderColor: medicalCenterError ? 'hsl(var(--danger-hsl))' : 'var(--glass-border)',
                                boxShadow: medicalCenterError ? '0 0 0 3px rgba(239, 68, 68, 0.15)' : 'none'
                              }}
                            />
                          </div>
                        )}
                      </>
                    )}
                    {medicalCenterError && (
                      <span style={{ fontSize: '0.75rem', color: 'hsl(var(--danger-hsl))', fontWeight: 600, marginTop: '4px' }}>
                        {medicalCenterError}
                      </span>
                    )}
                  </div>

                  {/* Agreement Type */}
                  <div className="form-group" id="agreement_type_group" tabIndex={-1} style={{ outline: 'none' }}>
                    <label className="form-label" htmlFor="agreement_type_select" style={{ color: agreementTypeError ? 'hsl(var(--danger-hsl))' : undefined }}>
                      Convenio sin Costo de * {agreementTypeError && <span className="animate-fade-in" style={{ marginLeft: '4px' }}>⚠️</span>}
                    </label>
                    {hasPreloadedMedicalCenter ? (
                      <>
                        <input
                          className="form-input"
                          type="text"
                          id="agreement_type_display"
                          readOnly={true}
                          value={selectedAgreementType}
                          style={{
                            opacity: 0.8,
                            cursor: 'not-allowed',
                            backgroundColor: 'rgba(255, 255, 255, 0.03)',
                            fontWeight: 600,
                            borderColor: 'var(--glass-border)'
                          }}
                        />
                        <input
                          type="hidden"
                          name="agreement_type"
                          value={selectedAgreementType}
                        />
                      </>
                    ) : (
                      <>
                        <CustomSelect
                          value={selectedAgreementType}
                          onChange={(val) => {
                            setSelectedAgreementType(val);
                            clearFieldError('agreement_type_select', setAgreementTypeError);
                          }}
                          options={agreements.length > 0 ? agreements : [
                            { value: 'Confección de Prótesis Removibles', label: 'Confección de Prótesis Removibles' },
                            { value: 'Atención Dental Básica', label: 'Atención Dental Básica' },
                            { value: 'Tratamiento de Endodoncia', label: 'Tratamiento de Endodoncia' },
                            { value: 'Implantes Dentales', label: 'Implantes Dentales' },
                            { value: 'Otro', label: 'Otro Convenio' }
                          ]}
                          placeholder="Seleccione tipo de convenio..."
                          disabled={loading}
                          id="agreement_type_select"
                          hasError={!!agreementTypeError}
                        />
                      </>
                    )}

                    {selectedAgreementType === 'Otro' && (
                      <div className="form-group animate-fade-in" style={{ marginTop: '10px' }}>
                        <label className="form-label" htmlFor="custom_agreement_type" style={{ fontSize: '0.78rem', opacity: 0.8 }}>Especifique el Convenio *</label>
                        <input
                          className={`form-input ${agreementTypeError ? 'animate-shake-error' : ''}`}
                          type="text"
                          id="custom_agreement_type"
                          placeholder="Escriba el tipo de convenio"
                          value={customAgreementType}
                          onChange={(e) => {
                            setCustomAgreementType(e.target.value);
                            clearFieldError('custom_agreement_type', setAgreementTypeError);
                          }}
                          required
                          disabled={loading}
                          style={{
                            borderColor: agreementTypeError ? 'hsl(var(--danger-hsl))' : 'var(--glass-border)',
                            boxShadow: agreementTypeError ? '0 0 0 3px rgba(239, 68, 68, 0.15)' : 'none'
                          }}
                        />
                      </div>
                    )}
                    {agreementTypeError && (
                      <span style={{ fontSize: '0.75rem', color: 'hsl(var(--danger-hsl))', fontWeight: 600, marginTop: '4px' }}>
                        {agreementTypeError}
                      </span>
                    )}
                  </div>
                </div>

                <p style={{
                  fontSize: '0.86rem',
                  color: '#d97706',
                  fontWeight: 600,
                  margin: '16px 0 0 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  lineHeight: '1.4'
                }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
                  Los convenios se encuentran precargados en el sistema. Si necesita revisar o cambiar esa asignación, por favor comuníquese con el encargado del convenio registrado.
                </p>

                {/* Interactive Odontogram Integration */}
                <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <h3 style={{
                      fontSize: '1.15rem',
                      fontFamily: 'var(--font-display)',
                      fontWeight: 800,
                      color: 'hsl(var(--primary-hsl))',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      margin: 0
                    }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                      Detalle Odontológico Clínico *
                    </h3>
                    <span style={{ fontSize: '0.84rem', opacity: 0.8, color: 'hsla(var(--foreground-hsl) / 0.85)' }}>
                      Diagnostique piezas y caras dentales, y asigne las prestaciones necesarias usando el odontograma interactivo.
                    </span>
                  </div>

                  <Odontogram initialType={odontogramType} onChange={setOdontogramData} />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            /* Step 3 Verified Case & Odontogram summary card */
            <div className="animate-fade-in" style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              padding: '24px 28px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(20, 184, 166, 0.04) 0%, rgba(59, 130, 246, 0.01) 100%)',
              border: '1.5px solid rgba(20, 184, 166, 0.2)',
              boxShadow: 'var(--shadow-sm)',
              position: 'relative'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <span style={{ fontSize: '1.02rem', fontWeight: 800, color: '#14b8a6', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  Detalle del Caso y Diagnóstico Verificados
                </span>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="btn-secondary"
                  style={{
                    padding: '8px 16px',
                    fontSize: '0.8rem',
                    borderRadius: '8px',
                    fontWeight: 700,
                    height: 'auto',
                    border: '1px solid rgba(255,255,255,0.08)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
                  Modificar
                </button>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '16px',
                marginTop: '6px'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <span style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    opacity: 0.6,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '2px',
                    color: 'var(--foreground-hsl)'
                  }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#14b8a6' }}><path d="M3 21h18" /><path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16" /><path d="M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4" /><path d="M10 9h4" /><path d="M12 7v4" /></svg>
                    Centro Médico de Origen
                  </span>
                  <strong style={{ fontSize: '0.94rem', paddingLeft: '19px' }}>{selectedMedicalCenter === 'Otro' ? customMedicalCenter : selectedMedicalCenter}</strong>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <span style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    opacity: 0.6,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '2px',
                    color: 'var(--foreground-hsl)'
                  }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#14b8a6' }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
                    Tipo de Convenio
                  </span>
                  <strong style={{ fontSize: '0.94rem', paddingLeft: '19px' }}>{selectedAgreementType === 'Otro' ? customAgreementType : selectedAgreementType}</strong>
                </div>
                <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    opacity: 0.6,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '4px',
                    color: 'var(--foreground-hsl)'
                  }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#14b8a6' }}><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
                    Diagnósticos Registrados (Odontograma)
                  </span>
                  <div style={{ paddingLeft: '19px' }}>
                    <p style={{ margin: 0, fontSize: '0.88rem', whiteSpace: 'pre-wrap', fontStyle: 'italic', opacity: 0.9, lineHeight: '1.4' }}>
                      {odontogramData.dentalDiagnosis || 'Sin patologías o piezas ingresadas en odontograma interactivo.'}
                    </p>
                  </div>
                </div>
                <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    opacity: 0.6,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '4px',
                    color: 'var(--foreground-hsl)'
                  }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#14b8a6' }}><rect x="8" y="2" width="8" height="4" rx="1" ry="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /></svg>
                    Prestaciones Requeridas (Odontograma)
                  </span>
                  <div style={{ paddingLeft: '19px' }}>
                    <p style={{ margin: 0, fontSize: '0.88rem', whiteSpace: 'pre-wrap', opacity: 0.9, lineHeight: '1.4' }}>
                      {odontogramData.treatmentNeeded || 'Sin prestaciones asignadas.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Hidden fields for submission */}
              <input type="hidden" name="medical_center" value={selectedMedicalCenter === 'Otro' ? customMedicalCenter : selectedMedicalCenter} />
              <input type="hidden" name="agreement_type" value={selectedAgreementType === 'Otro' ? customAgreementType : selectedAgreementType} />
              <input type="hidden" name="dental_diagnosis" value={odontogramData.dentalDiagnosis || 'Sin patologías registradas en odontograma.'} />
              <input type="hidden" name="treatment_needed" value={odontogramData.treatmentNeeded || 'Sin tratamientos asignados.'} />
              <input type="hidden" name="description" value={odontogramData.description || 'Derivación ingresada mediante odontograma interactivo.'} />
            </div>
          )}

          {/* Section 3: Professional Details (Step 3 Only) */}
          {step === 3 && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
              <div>
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
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
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

                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '16px',
                  padding: '16px 20px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(217, 119, 6, 0.05)',
                  border: '1px solid rgba(217, 119, 6, 0.2)',
                  color: '#d97706',
                  marginTop: '24px'
                }}>
                  <div style={{
                    color: '#d97706',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '2px'
                  }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      color: '#d97706',
                      letterSpacing: '0.05em'
                    }}>
                      Información Importante
                    </span>
                    <p style={{
                      fontSize: '0.85rem',
                      margin: 0,
                      lineHeight: '1.4',
                      opacity: 0.95
                    }}>
                      Si quieres modificar tus datos registrados, debes enviar un correo a{' '}
                      <a href="mailto:derivaciones@policlinicotabancura.cl" style={{ fontWeight: 700, textDecoration: 'underline', color: 'currentColor' }}>
                        derivaciones@policlinicotabancura.cl
                      </a>.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer Action Buttons with conditional wizard steps */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '15px',
            borderTop: '1px solid var(--glass-border)',
            paddingTop: '25px',
            marginTop: '10px'
          }}>
            {step === 1 ? (
              <>
                <button
                  type="button"
                  onClick={() => router.push('/dashboard')}
                  className="btn-secondary"
                  disabled={loading}
                  onMouseEnter={() => setIsCancelHovered(true)}
                  onMouseLeave={() => setIsCancelHovered(false)}
                  style={{
                    backgroundColor: isCancelHovered ? 'hsl(var(--warning-hsl, 45 90% 50%))' : undefined,
                    color: isCancelHovered ? '#000000' : undefined,
                    borderColor: isCancelHovered ? 'hsl(var(--warning-hsl, 45 90% 50%))' : undefined,
                    boxShadow: isCancelHovered ? '0 0 15px rgba(245, 158, 11, 0.4)' : undefined
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="btn-primary"
                  style={{
                    padding: '12px 28px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  disabled={loading}
                >
                  Continuar
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                </button>
              </>
            ) : step === 2 ? (
              <>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn-secondary"
                  disabled={loading}
                >
                  Volver al Paso 1
                </button>
                <button
                  type="button"
                  onClick={handleNextStep2}
                  className="btn-primary"
                  style={{
                    padding: '12px 28px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  disabled={loading}
                >
                  Continuar
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="btn-secondary"
                  disabled={loading}
                >
                  Volver al Paso 2
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
              </>
            )}
          </div>

        </form>
      </div>

      {/* Confirmation Summary Modal */}
      <Modal
        isOpen={showSummary}
        onClose={() => setShowSummary(false)}
        title="🔍 Revisión y Confirmación de Inscripción"
        maxWidth="750px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Banner */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            padding: '14px 18px',
            backgroundColor: 'rgba(59, 130, 246, 0.05)',
            border: '1px solid rgba(59, 130, 246, 0.25)',
            borderRadius: 'var(--radius-sm)',
            color: 'hsl(var(--primary-hsl))'
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '2px' }}><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.86rem', lineHeight: '1.4' }}>
              <strong style={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: '0.76rem' }}>Revisión de Ficha Clínica y Social</strong>
              <span style={{ opacity: 0.9 }}>
                Por favor, verifique detalladamente los datos a continuación. Si la información es correcta, haga clic en **"Confirmar y Enviar Registro"** para guardar la inscripción de forma definitiva.
              </span>
            </div>
          </div>

          {/* Grid de Datos del Paciente */}
          <div>
            <h4 style={{ fontSize: '0.86rem', fontWeight: 800, opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '4px', color: 'hsla(var(--foreground-hsl) / 0.8)' }}>
              👥 Datos del Beneficiario
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '12px 16px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.08)', color: '#10b981', flexShrink: 0 }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                </div>
                <div>
                  <span style={{ opacity: 0.5, display: 'block', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>Nombre del Paciente</span>
                  <strong style={{ fontSize: '0.92rem' }}>{formDataObj.firstNames} {formDataObj.lastNames}</strong>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '12px 16px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.08)', color: '#10b981', flexShrink: 0 }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2" ry="2" /><line x1="7" y1="8" x2="17" y2="8" /><line x1="7" y1="12" x2="13" y2="12" /><line x1="7" y1="16" x2="9" y2="16" /></svg>
                </div>
                <div>
                  <span style={{ opacity: 0.5, display: 'block', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>RUT</span>
                  <strong style={{ fontSize: '0.92rem' }}>{formDataObj.rut}</strong>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '12px 16px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.08)', color: '#10b981', flexShrink: 0 }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                </div>
                <div>
                  <span style={{ opacity: 0.5, display: 'block', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>Fecha de Nacimiento</span>
                  <strong style={{ fontSize: '0.92rem' }}>{formDataObj.birthDate}</strong>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '12px 16px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.08)', color: '#10b981', flexShrink: 0 }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /><path d="M2 12h20" /></svg>
                </div>
                <div>
                  <span style={{ opacity: 0.5, display: 'block', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>Nacionalidad</span>
                  <strong style={{ fontSize: '0.92rem' }}>{formDataObj.nationality}</strong>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '12px 16px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.08)', color: '#10b981', flexShrink: 0 }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                </div>
                <div>
                  <span style={{ opacity: 0.5, display: 'block', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>Comuna</span>
                  <strong style={{ fontSize: '0.92rem' }}>{formDataObj.commune}</strong>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '12px 16px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.08)', color: '#10b981', flexShrink: 0 }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                </div>
                <div>
                  <span style={{ opacity: 0.5, display: 'block', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>Contacto Celular</span>
                  <strong style={{ fontSize: '0.92rem' }}>{formDataObj.mobile}</strong>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '12px 16px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden', gridColumn: '1 / -1' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.08)', color: '#10b981', flexShrink: 0 }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                </div>
                <div>
                  <span style={{ opacity: 0.5, display: 'block', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>Correo Electrónico</span>
                  <strong style={{ fontSize: '0.92rem', wordBreak: 'break-all', display: 'block' }}>{formDataObj.email || 'No ingresado'}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Convenio y Origen */}
          <div>
            <h4 style={{ fontSize: '0.86rem', fontWeight: 800, opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '4px', color: 'hsla(var(--foreground-hsl) / 0.8)' }}>
              🏥 Información del Convenio y Origen
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '12px 16px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', borderRadius: '50%', background: 'rgba(20, 184, 166, 0.08)', color: '#14b8a6', flexShrink: 0 }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18" /><path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16" /><path d="M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4" /><path d="M10 9h4" /><path d="M12 7v4" /></svg>
                </div>
                <div>
                  <span style={{ opacity: 0.5, display: 'block', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>Centro Médico de Origen</span>
                  <strong style={{ fontSize: '0.92rem' }}>{formDataObj.medicalCenter}</strong>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '12px 16px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', borderRadius: '50%', background: 'rgba(20, 184, 166, 0.08)', color: '#14b8a6', flexShrink: 0 }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
                </div>
                <div>
                  <span style={{ opacity: 0.5, display: 'block', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>Convenio Solicitado</span>
                  <strong style={{ fontSize: '0.92rem', color: 'hsl(var(--accent-hsl))' }}>{formDataObj.agreementType}</strong>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '12px 16px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', gridColumn: '1 / -1' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', borderRadius: '50%', background: 'rgba(20, 184, 166, 0.08)', color: '#14b8a6', flexShrink: 0 }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                </div>
                <div>
                  <span style={{ opacity: 0.5, display: 'block', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>Profesional Derivador</span>
                  <strong style={{ fontSize: '0.92rem' }}>{profName}</strong>
                  <span style={{ display: 'block', fontSize: '0.75rem', opacity: 0.7, marginTop: '2px' }}>{profTitle} • {profPosition} • {profEmail}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Diagnóstico Odontológico */}
          <div>
            <h4 style={{ fontSize: '0.86rem', fontWeight: 800, opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '4px', color: 'hsla(var(--foreground-hsl) / 0.8)' }}>
              🦷 Detalle Diagnóstico Odontológico (Odontograma)
            </h4>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              padding: '18px 20px',
              background: 'rgba(255, 255, 255, 0.01)',
              border: '1px solid var(--glass-border)',
              borderRadius: 'var(--radius-md)'
            }}>
              <div>
                <span style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  opacity: 0.5,
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '6px',
                  color: 'var(--foreground-hsl)'
                }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#3b82f6' }}><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
                  Diagnósticos Registrados (Odontograma)
                </span>
                <p style={{ margin: 0, fontSize: '0.88rem', whiteSpace: 'pre-wrap', fontStyle: 'italic', opacity: 0.9, lineHeight: '1.4', paddingLeft: '19px' }}>
                  {formDataObj.dentalDiagnosis}
                </p>
              </div>
              <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.04)', paddingTop: '12px' }}>
                <span style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  opacity: 0.5,
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '6px',
                  color: 'var(--foreground-hsl)'
                }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#3b82f6' }}><rect x="8" y="2" width="8" height="4" rx="1" ry="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /></svg>
                  Prestaciones Requeridas (Odontograma)
                </span>
                <p style={{ margin: 0, fontSize: '0.88rem', whiteSpace: 'pre-wrap', opacity: 0.9, lineHeight: '1.4', paddingLeft: '19px' }}>
                  {formDataObj.treatmentNeeded}
                </p>
              </div>
              {formDataObj.description && formDataObj.description !== 'Derivación ingresada mediante odontograma interactivo.' && (
                <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.04)', paddingTop: '12px' }}>
                  <span style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    opacity: 0.5,
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '6px',
                    color: 'var(--foreground-hsl)'
                  }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#3b82f6' }}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                    Observaciones Generales de la Derivación
                  </span>
                  <p style={{ margin: 0, fontSize: '0.88rem', opacity: 0.8, lineHeight: '1.4', paddingLeft: '19px' }}>
                    {formDataObj.description}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Modal Footer Buttons */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            borderTop: '1px solid var(--glass-border)',
            paddingTop: '20px',
            marginTop: '10px'
          }}>
            <button
              type="button"
              onClick={() => setShowSummary(false)}
              className="btn-secondary"
              style={{ padding: '10px 20px', borderRadius: '8px' }}
            >
              Volver a Editar
            </button>
            <button
              type="button"
              onClick={confirmRegistration}
              className="btn-primary"
              style={{
                padding: '10px 24px',
                borderRadius: '8px',
                fontWeight: 750,
                boxShadow: '0 4px 15px rgba(59, 130, 246, 0.25)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
              Confirmar y Enviar Registro
            </button>
          </div>

        </div>
      </Modal>

      {/* Sticky Bottom Smart Validation Error Center */}
      {validationErrors.length > 0 && (
        <div
          className="animate-fade-in"
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'linear-gradient(180deg, rgba(239, 68, 68, 0.08) 0%, rgba(239, 68, 68, 0.02) 100%), var(--glass-bg)',
            backdropFilter: 'blur(20px)',
            borderTop: '2.5px solid hsl(var(--danger-hsl))',
            boxShadow: '0 -10px 40px rgba(239, 68, 68, 0.12)',
            zIndex: 9999,
            padding: '16px 30px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '24px',
            flexWrap: 'wrap',
            animation: 'fadeIn 0.3s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'hsl(var(--danger-hsl))' }}>
            <span style={{ fontSize: '1.4rem' }}>⚠️</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 800 }}>Datos requeridos faltantes o incorrectos</span>
              <span style={{ fontSize: '0.78rem', opacity: 0.85, color: 'var(--foreground-hsl)' }}>
                Se encontraron {validationErrors.length} errores. Haga clic en un campo para corregirlo directamente:
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', flex: 1, justifyContent: 'flex-start' }}>
            {validationErrors.map((err, idx) => (
              <button
                key={idx}
                type="button"
                className="odont-option-btn animate-fade-in"
                style={{
                  padding: '6px 14px',
                  fontSize: '0.76rem',
                  borderRadius: '8px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: 'rgba(239, 68, 68, 0.06)',
                  color: '#ef4444',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  cursor: 'pointer',
                  fontWeight: 700,
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 6px rgba(239, 68, 68, 0.03)',
                  margin: 0
                }}
                onClick={() => triggerErrorJump(err.elementId, err.step)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.12)';
                  e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.06)';
                  e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.25)';
                }}
              >
                <span style={{ fontSize: '0.85rem' }}>📍</span>
                <strong>{err.label}</strong>: {err.message}
              </button>
            ))}
          </div>

          {/* Quick Clear button */}
          <button
            type="button"
            onClick={() => setValidationErrors([])}
            style={{
              background: 'hsla(var(--foreground-hsl) / 0.05)',
              border: 'none',
              borderRadius: '8px',
              padding: '6px 14px',
              fontSize: '0.76rem',
              fontWeight: 700,
              cursor: 'pointer',
              color: 'var(--foreground-hsl)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'hsla(var(--foreground-hsl) / 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'hsla(var(--foreground-hsl) / 0.05)';
            }}
          >
            Ocultar aviso
          </button>
        </div>
      )}

    </div>
  );
}
