'use client';

import React, { useState, useEffect } from 'react';

// Tooth structure for Universal Numbering System (1-32 for Adult, 1-20 for Child)
interface ToothInfo {
  id: number;
  type: 'incisor' | 'canine' | 'premolar' | 'molar';
}

const ADULT_TEETH: ToothInfo[] = [
  // Upper Jaw: 1 to 16 (visual Left-to-Right in chart)
  { id: 1, type: 'molar' },
  { id: 2, type: 'molar' },
  { id: 3, type: 'molar' },
  { id: 4, type: 'premolar' },
  { id: 5, type: 'premolar' },
  { id: 6, type: 'canine' },
  { id: 7, type: 'incisor' },
  { id: 8, type: 'incisor' },
  { id: 9, type: 'incisor' },
  { id: 10, type: 'incisor' },
  { id: 11, type: 'canine' },
  { id: 12, type: 'premolar' },
  { id: 13, type: 'premolar' },
  { id: 14, type: 'molar' },
  { id: 15, type: 'molar' },
  { id: 16, type: 'molar' },

  // Lower Jaw: 17 to 32 (visual Left-to-Right in chart)
  { id: 17, type: 'molar' },
  { id: 18, type: 'molar' },
  { id: 19, type: 'molar' },
  { id: 20, type: 'premolar' },
  { id: 21, type: 'premolar' },
  { id: 22, type: 'canine' },
  { id: 23, type: 'incisor' },
  { id: 24, type: 'incisor' },
  { id: 25, type: 'incisor' },
  { id: 26, type: 'incisor' },
  { id: 27, type: 'canine' },
  { id: 28, type: 'premolar' },
  { id: 29, type: 'premolar' },
  { id: 30, type: 'molar' },
  { id: 31, type: 'molar' },
  { id: 32, type: 'molar' }
];

const CHILD_TEETH: ToothInfo[] = [
  // Upper Jaw: 1 to 10
  { id: 1, type: 'molar' },
  { id: 2, type: 'molar' },
  { id: 3, type: 'canine' },
  { id: 4, type: 'incisor' },
  { id: 5, type: 'incisor' },
  { id: 6, type: 'incisor' },
  { id: 7, type: 'incisor' },
  { id: 8, type: 'canine' },
  { id: 9, type: 'molar' },
  { id: 10, type: 'molar' },

  // Lower Jaw: 11 to 20
  { id: 11, type: 'molar' },
  { id: 12, type: 'molar' },
  { id: 13, type: 'canine' },
  { id: 14, type: 'incisor' },
  { id: 15, type: 'incisor' },
  { id: 16, type: 'incisor' },
  { id: 17, type: 'incisor' },
  { id: 18, type: 'canine' },
  { id: 19, type: 'molar' },
  { id: 20, type: 'molar' }
];

// Available treatments grouped by category
interface TreatmentOption {
  id: string;
  name: string;
  category: 'prev' | 'rest' | 'endo' | 'surg' | 'prot';
  color: string;
}

const TREATMENT_OPTIONS: TreatmentOption[] = [
  { id: 'limpieza', name: 'Limpieza Dental (Destartraje y profilaxis)', category: 'prev', color: '#14b8a6' },
  { id: 'fluor', name: 'Aplicación de Flúor Barniz', category: 'prev', color: '#14b8a6' },
  { id: 'sellante', name: 'Aplicación de Sellante', category: 'prev', color: '#14b8a6' },
  
  { id: 'obturacion_simple', name: 'Obturación Composite Simple (1 superficie)', category: 'rest', color: '#3b82f6' },
  { id: 'obturacion_comp', name: 'Obturación Composite Compuesta (2 o más)', category: 'rest', color: '#3b82f6' },
  { id: 'reconstruccion', name: 'Reconstrucción Diente Completo', category: 'rest', color: '#3b82f6' },
  
  { id: 'endodoncia_uni', name: 'Tratamiento de Conducto (Unirradicular)', category: 'endo', color: '#f59e0b' },
  { id: 'endodoncia_multi', name: 'Tratamiento de Conducto (Multirradicular)', category: 'endo', color: '#f59e0b' },
  
  { id: 'extraccion_simple', name: 'Extracción / Exodoncia Simple', category: 'surg', color: '#ef4444' },
  { id: 'extraccion_comp', name: 'Extracción Quirúrgica / Compleja', category: 'surg', color: '#ef4444' },
  
  { id: 'protesis_parcial', name: 'Confección de Prótesis Parcial Removible', category: 'prot', color: '#a855f7' },
  { id: 'protesis_total', name: 'Confección de Prótesis Total Completa', category: 'prot', color: '#a855f7' },
  { id: 'corona_porc', name: 'Corona Metálica/Porcelana', category: 'prot', color: '#a855f7' }
];

const CATEGORY_NAMES = {
  prev: 'Prevención & Higiene',
  rest: 'Operatoria / Restauradora',
  endo: 'Endodoncia',
  surg: 'Cirugía Oral',
  prot: 'Rehabilitación / Prótesis'
};

interface SelectedToothState {
  faces: {
    V: boolean; // Vestibular
    O: boolean; // Oclusal / Incisal
    M: boolean; // Mesial
    D: boolean; // Distal
    L: boolean; // Lingual / Palatina
  };
  treatments: string[]; // Treatment IDs
  condition?: 'ausente' | 'sano' | 'implante' | 'corona_existente'; 
}

interface OdontogramProps {
  initialType?: 'adult' | 'child';
  onChange: (data: {
    dentalDiagnosis: string;
    treatmentNeeded: string;
    description: string;
  }) => void;
}

export default function Odontogram({ initialType = 'adult', onChange }: OdontogramProps) {
  const [activeTab, setActiveTab] = useState<'adult' | 'child'>(initialType);
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [chartState, setChartState] = useState<Record<number, SelectedToothState>>({});
  const [generalObservations, setGeneralObservations] = useState('');

  // Auto switch tab if initialType changes from outside
  useEffect(() => {
    setActiveTab(initialType);
  }, [initialType]);

  // Handle outside change notifications
  useEffect(() => {
    // Compile data into readable text for hidden inputs
    const diagnosisList: string[] = [];
    const treatmentList: string[] = [];

    const stateToCompile = activeTab === 'adult' ? ADULT_TEETH : CHILD_TEETH;

    stateToCompile.forEach((tooth) => {
      const state = chartState[tooth.id];
      if (state) {
        const activeFaces = Object.entries(state.faces)
          .filter(([_, isActive]) => isActive)
          .map(([faceName]) => {
            if (faceName === 'V') return 'Vestibular';
            if (faceName === 'O') return 'Oclusal/Incisal';
            if (faceName === 'M') return 'Mesial';
            if (faceName === 'D') return 'Distal';
            if (faceName === 'L') return 'Lingual/Palatina';
            return faceName;
          });

        let toothCond = '';
        if (state.condition === 'ausente') toothCond = ' (Ausente/Pérdida)';
        if (state.condition === 'implante') toothCond = ' (Con Implante)';
        if (state.condition === 'corona_existente') toothCond = ' (Corona Previa)';

        // 1. Diagnosis
        if (activeFaces.length > 0 || state.condition) {
          const facesStr = activeFaces.length > 0 ? `Caras: ${activeFaces.join(', ')}` : 'Pieza Completa';
          diagnosisList.push(`Pieza ${tooth.id}${toothCond}: ${facesStr}`);
        }

        // 2. Treatments needed
        if (state.treatments.length > 0) {
          const treatmentNames = state.treatments.map((tid) => {
            const opt = TREATMENT_OPTIONS.find((o) => o.id === tid);
            return opt ? opt.name : tid;
          });
          treatmentList.push(`Pieza ${tooth.id}: Realizar [${treatmentNames.join(', ')}]`);
        }
      }
    });

    const fullDiagnosis = diagnosisList.length > 0
      ? `[Odontograma ${activeTab === 'adult' ? 'Adulto' : 'Infantil'}]\n` + diagnosisList.join('\n')
      : '';

    const fullTreatments = treatmentList.length > 0
      ? treatmentList.join('\n')
      : '';

    onChange({
      dentalDiagnosis: fullDiagnosis || 'Sin patologías o piezas ingresadas en odontograma interactivo.',
      treatmentNeeded: fullTreatments || 'Sin prestaciones asignadas en odontograma.',
      description: generalObservations
    });
  }, [chartState, activeTab, generalObservations]);

  // Initializing state for a tooth if it doesn't exist
  const getToothState = (id: number): SelectedToothState => {
    return chartState[id] || {
      faces: { V: false, O: false, M: false, D: false, L: false },
      treatments: []
    };
  };

  // Toggle specific face of a tooth
  const toggleFace = (id: number, face: keyof SelectedToothState['faces']) => {
    const currentState = getToothState(id);
    const updatedState = {
      ...currentState,
      faces: {
        ...currentState.faces,
        [face]: !currentState.faces[face]
      }
    };

    setChartState((prev) => ({
      ...prev,
      [id]: updatedState
    }));
  };

  // Toggle treatment for a tooth
  const toggleTreatment = (id: number, treatmentId: string) => {
    const currentState = getToothState(id);
    const hasTreatment = currentState.treatments.includes(treatmentId);
    
    let updatedTreatments: string[];
    if (hasTreatment) {
      updatedTreatments = currentState.treatments.filter((tid) => tid !== treatmentId);
    } else {
      updatedTreatments = [...currentState.treatments, treatmentId];
    }

    const updatedState = {
      ...currentState,
      treatments: updatedTreatments
    };

    setChartState((prev) => ({
      ...prev,
      [id]: updatedState
    }));
  };

  // Toggle general condition (ausente, implante, etc)
  const setToothCondition = (id: number, condition: SelectedToothState['condition'] | undefined) => {
    const currentState = getToothState(id);
    const updatedState = {
      ...currentState,
      condition: currentState.condition === condition ? undefined : condition
    };

    setChartState((prev) => ({
      ...prev,
      [id]: updatedState
    }));
  };

  // Clear a single tooth's selections
  const clearTooth = (id: number) => {
    setChartState((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
    if (selectedTooth === id) {
      setSelectedTooth(null);
    }
  };

  // Check if a tooth has any active state
  const isToothModified = (id: number) => {
    const state = chartState[id];
    if (!state) return false;
    const hasActiveFace = Object.values(state.faces).some(Boolean);
    const hasTreatments = state.treatments.length > 0;
    const hasCondition = !!state.condition;
    return hasActiveFace || hasTreatments || hasCondition;
  };

  // Render Tooth SVG Anatomical Icon (Line art, flips on isUpper=false)
  const renderToothIcon = (id: number, type: 'incisor' | 'canine' | 'premolar' | 'molar', isUpper: boolean, size = 30) => {
    const state = getToothState(id);
    const isFocused = selectedTooth === id;
    
    let color = 'hsla(var(--foreground-hsl) / 0.16)';
    if (isFocused) color = 'hsl(var(--primary-hsl))';
    else if (isToothModified(id)) color = 'hsl(var(--accent-hsl))';

    // Tailored SVG Line art paths for Incisor, Canine, Premolar, Molar
    let path = '';
    if (type === 'incisor') {
      path = 'M 16,35 L 24,35 C 26,35 27,33 27,24 C 27,18 24,14 20,4 C 16,14 13,18 13,24 C 13,33 14,35 16,35 Z';
    } else if (type === 'canine') {
      path = 'M 16,33 L 20,37 L 24,33 C 27,31 28,29 28,22 C 28,15 24,11 20,2 C 16,11 12,15 12,22 C 12,29 13,31 16,33 Z';
    } else if (type === 'premolar') {
      path = 'M 13,32 C 13,35 16,37 20,37 C 24,37 27,35 27,32 C 28,28 26,24 20,6 C 14,24 12,28 13,32 Z';
    } else { // molar
      path = 'M 11,33 C 11,36 14,37 20,37 C 26,37 29,36 29,33 C 29,26 27,24 25,18 C 24,12 25,5 24,4 C 23,4 22,12 20,18 C 18,12 17,4 16,4 C 15,5 16,12 15,18 C 13,24 11,26 11,33 Z';
    }

    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        onClick={() => setSelectedTooth(id)}
        className="odont-tooth-svg"
        style={{
          cursor: 'pointer',
          transform: isUpper ? 'none' : 'scaleY(-1)',
          transition: 'all 0.25s ease',
          margin: '2px 0'
        }}
      >
        <path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth={isFocused ? 2.5 : 1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ transition: 'all 0.25s ease' }}
        />
      </svg>
    );
  };

  // Render high-fidelity Concentric Circular 5-face interactive SVG cross
  const renderCircularSelector = (id: number, interactive = true, size = 36) => {
    const state = getToothState(id);
    const isFocused = selectedTooth === id;

    // Highlight modified tooth
    let strokeColor = 'var(--glass-border)';
    if (isFocused) strokeColor = 'hsl(var(--primary-hsl))';
    else if (isToothModified(id)) strokeColor = 'hsl(var(--accent-hsl))';

    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        onClick={(e) => {
          if (!interactive) return;
          e.stopPropagation();
          setSelectedTooth(id);
        }}
        className={interactive ? "odont-circle-svg" : ""}
        style={{
          cursor: interactive ? 'pointer' : 'default',
          filter: isFocused ? 'drop-shadow(0 0 5px rgba(59, 130, 246, 0.4))' : (isToothModified(id) ? 'drop-shadow(0 0 4px rgba(20, 184, 166, 0.25))' : 'none'),
          transition: 'all 0.2s ease',
          overflow: 'visible'
        }}
      >
        {/* Center: Oclusal (O) - Inner Circle */}
        <circle
          cx="20"
          cy="20"
          r="7"
          className={interactive ? "odont-face-sector" : ""}
          fill={state.condition === 'ausente' ? 'rgba(239, 68, 68, 0.18)' : (state.faces.O ? 'rgba(20, 184, 166, 0.38)' : 'hsla(var(--foreground-hsl) / 0.03)')}
          stroke="hsla(var(--foreground-hsl) / 0.08)"
          strokeWidth="0.8"
          onClick={(e) => {
            if (!interactive) return;
            e.stopPropagation();
            setSelectedTooth(id);
            toggleFace(id, 'O');
          }}
        />

        {/* Top: Vestibular (V) */}
        <path
          d="M 15 15 L 5 5 A 21 21 0 0 1 35 5 L 25 15 A 7 7 0 0 0 15 15 Z"
          className={interactive ? "odont-face-sector" : ""}
          fill={state.condition === 'ausente' ? 'rgba(239, 68, 68, 0.12)' : (state.faces.V ? 'rgba(20, 184, 166, 0.38)' : 'hsla(var(--foreground-hsl) / 0.015)')}
          stroke="hsla(var(--foreground-hsl) / 0.08)"
          strokeWidth="0.8"
          onClick={(e) => {
            if (!interactive) return;
            e.stopPropagation();
            setSelectedTooth(id);
            toggleFace(id, 'V');
          }}
        />

        {/* Bottom: Lingual / Palatina (L) */}
        <path
          d="M 15 25 L 5 35 A 21 21 0 0 0 35 35 L 25 25 A 7 7 0 0 1 15 25 Z"
          className={interactive ? "odont-face-sector" : ""}
          fill={state.condition === 'ausente' ? 'rgba(239, 68, 68, 0.12)' : (state.faces.L ? 'rgba(20, 184, 166, 0.38)' : 'hsla(var(--foreground-hsl) / 0.015)')}
          stroke="hsla(var(--foreground-hsl) / 0.08)"
          strokeWidth="0.8"
          onClick={(e) => {
            if (!interactive) return;
            e.stopPropagation();
            setSelectedTooth(id);
            toggleFace(id, 'L');
          }}
        />

        {/* Left: Mesial (M) */}
        <path
          d="M 15 15 L 5 5 A 21 21 0 0 0 5 35 L 15 25 A 7 7 0 0 1 15 15 Z"
          className={interactive ? "odont-face-sector" : ""}
          fill={state.condition === 'ausente' ? 'rgba(239, 68, 68, 0.12)' : (state.faces.M ? 'rgba(20, 184, 166, 0.38)' : 'hsla(var(--foreground-hsl) / 0.015)')}
          stroke="hsla(var(--foreground-hsl) / 0.08)"
          strokeWidth="0.8"
          onClick={(e) => {
            if (!interactive) return;
            e.stopPropagation();
            setSelectedTooth(id);
            toggleFace(id, 'M');
          }}
        />

        {/* Right: Distal (D) */}
        <path
          d="M 25 15 L 35 5 A 21 21 0 0 1 35 35 L 25 25 A 7 7 0 0 0 25 15 Z"
          className={interactive ? "odont-face-sector" : ""}
          fill={state.condition === 'ausente' ? 'rgba(239, 68, 68, 0.12)' : (state.faces.D ? 'rgba(20, 184, 166, 0.38)' : 'hsla(var(--foreground-hsl) / 0.015)')}
          stroke="hsla(var(--foreground-hsl) / 0.08)"
          strokeWidth="0.8"
          onClick={(e) => {
            if (!interactive) return;
            e.stopPropagation();
            setSelectedTooth(id);
            toggleFace(id, 'D');
          }}
        />

        {/* Outer Circular Border overlay */}
        <circle cx="20" cy="20" r="21" fill="none" stroke={strokeColor} strokeWidth={isFocused ? 2.2 : 1.2} style={{ pointerEvents: 'none' }} />

        {/* Special markers */}
        {state.condition === 'ausente' && (
          <path d="M 4 4 L 36 36 M 36 4 L 4 36" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" pointerEvents="none" />
        )}
        {state.condition === 'implante' && (
          <circle cx="20" cy="20" r="5" fill="#f59e0b" stroke="#ffffff" strokeWidth="1" pointerEvents="none" />
        )}
        {state.condition === 'corona_existente' && (
          <rect x="10" y="10" width="20" height="20" rx="3" fill="none" stroke="#a855f7" strokeWidth="1.8" pointerEvents="none" />
        )}
      </svg>
    );
  };

  const getToothName = (tooth: ToothInfo) => {
    let name = '';
    if (tooth.type === 'incisor') name = 'Incisivo';
    if (tooth.type === 'canine') name = 'Canino';
    if (tooth.type === 'premolar') name = 'Premolar';
    if (tooth.type === 'molar') name = 'Molar';
    return `${name} (Pieza ${tooth.id})`;
  };

  const currentTeethList = activeTab === 'adult' ? ADULT_TEETH : CHILD_TEETH;

  // Split upper and lower rows visually
  const upperRow = activeTab === 'adult' 
    ? ADULT_TEETH.slice(0, 16) 
    : CHILD_TEETH.slice(0, 10);
  const lowerRow = activeTab === 'adult' 
    ? ADULT_TEETH.slice(16, 32) 
    : CHILD_TEETH.slice(10, 20);

  const activeToothInfo = currentTeethList.find((t) => t.id === selectedTooth);
  const activeToothState = selectedTooth ? getToothState(selectedTooth) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      
      {/* Visual Header / Tab Switcher */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px',
        backgroundColor: 'hsla(var(--foreground-hsl) / 0.02)',
        border: '1px solid var(--glass-border)',
        borderRadius: '12px',
        gap: '8px'
      }}>
        <span style={{ fontSize: '0.82rem', fontWeight: 700, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.04em', paddingLeft: '12px', color: 'hsla(var(--foreground-hsl) / 0.8)' }}>
          Visualización del Odontograma
        </span>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              className="btn"
              style={{
                padding: '6px 16px',
                fontSize: '0.82rem',
                borderRadius: '8px',
                backgroundColor: activeTab === 'adult' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                color: activeTab === 'adult' ? 'hsl(var(--primary-hsl))' : 'hsla(var(--foreground-hsl) / 0.6)',
                borderColor: activeTab === 'adult' ? 'rgba(59, 130, 246, 0.25)' : 'transparent',
              }}
              onClick={() => {
                setActiveTab('adult');
                setSelectedTooth(null);
              }}
            >
              🦷 Permanente (Adulto)
            </button>
            <button
              type="button"
              className="btn"
              style={{
                padding: '6px 16px',
                fontSize: '0.82rem',
                borderRadius: '8px',
                backgroundColor: activeTab === 'child' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                color: activeTab === 'child' ? 'hsl(var(--accent-hsl))' : 'hsla(var(--foreground-hsl) / 0.6)',
                borderColor: activeTab === 'child' ? 'rgba(16, 185, 129, 0.25)' : 'transparent',
              }}
              onClick={() => {
                setActiveTab('child');
                setSelectedTooth(null);
              }}
            >
              🍼 Temporal (Niño)
            </button>
          </div>

          {Object.keys(chartState).length > 0 && (
            <button
              type="button"
              className="odont-option-btn btn-limpiar animate-fade-in"
              style={{
                padding: '6px 14px',
                fontSize: '0.8rem',
                borderRadius: '8px',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
              onClick={() => {
                if (window.confirm("¿Está seguro de que desea limpiar por completo todos los diagnósticos y tratamientos del odontograma?")) {
                  setChartState({});
                  setSelectedTooth(null);
                }
              }}
            >
              🧹 Limpiar Todo
            </button>
          )}
        </div>
      </div>

      {/* Anatomical Odontogram Chart */}
      <div className="glass-panel" style={{
        padding: '30px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '24px',
        background: 'var(--input-bg)',
        border: '1px solid var(--glass-border)',
        position: 'relative',
        overflowX: 'auto',
      }}>
        
        {/* Subtle grid indicators */}
        <div style={{ position: 'absolute', left: '16px', top: '16px', fontSize: '0.72rem', fontWeight: 700, opacity: 0.35, color: 'hsla(var(--foreground-hsl) / 0.8)' }}>
          DERIVACIÓN DENTAL VITACURA
        </div>

        {/* Anatomical Jaws Rows Wrapper */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          minWidth: activeTab === 'child' ? '450px' : '600px',
          maxWidth: activeTab === 'child' ? '540px' : '820px',
          width: '100%',
          alignItems: 'center'
        }}>
          
          {/* MAXILAR SUPERIOR (Upper Jaw) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              fontSize: '0.74rem',
              fontWeight: 800,
              color: 'hsla(var(--foreground-hsl) / 0.6)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              borderBottom: '1px solid var(--glass-border)',
              paddingBottom: '6px'
            }}>
              Maxilar Superior (Arcada Superior)
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '4px', width: '100%', padding: '0 4px' }}>
              {upperRow.map((tooth) => {
                const isModified = isToothModified(tooth.id);
                const isFocused = selectedTooth === tooth.id;
                return (
                  <div
                    key={tooth.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      flex: 1,
                    }}
                  >
                    {/* Upper layout: Number -> Anatomical Shape -> Circle Selector */}
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: isFocused ? 'hsl(var(--primary-hsl))' : (isModified ? 'hsl(var(--accent-hsl))' : 'hsla(var(--foreground-hsl) / 0.6)') }}>
                      {tooth.id}
                    </span>

                    {/* Tooth anatomical drawing */}
                    {renderToothIcon(tooth.id, tooth.type, true)}

                    {/* Circle 5-surface selector */}
                    {renderCircularSelector(tooth.id)}
                  </div>
                );
              })}
            </div>
          </div>

          {/* DIVIDER LINE FOR UPPER/LOWER */}
          <div style={{
            height: '2px',
            width: '100%',
            background: 'linear-gradient(90deg, transparent 0%, var(--glass-border) 50%, transparent 100%)'
          }} />

          {/* MANDÍBULA INFERIOR (Lower Jaw) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '4px', width: '100%', padding: '0 4px' }}>
              {lowerRow.map((tooth) => {
                const isModified = isToothModified(tooth.id);
                const isFocused = selectedTooth === tooth.id;
                return (
                  <div
                    key={tooth.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      flex: 1,
                    }}
                  >
                    {/* Lower layout: Circle Selector -> Anatomical Shape -> Number */}
                    {renderCircularSelector(tooth.id)}

                    {/* Tooth anatomical drawing (flipped vertically) */}
                    {renderToothIcon(tooth.id, tooth.type, false)}

                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: isFocused ? 'hsl(var(--primary-hsl))' : (isModified ? 'hsl(var(--accent-hsl))' : 'hsla(var(--foreground-hsl) / 0.6)') }}>
                      {tooth.id}
                    </span>
                  </div>
                );
              })}
            </div>
            
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              fontSize: '0.74rem',
              fontWeight: 800,
              color: 'hsla(var(--foreground-hsl) / 0.6)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              borderTop: '1px solid var(--glass-border)',
              paddingTop: '8px',
              marginTop: '4px'
            }}>
              Mandíbula Inferior (Arcada Inferior)
            </div>
          </div>

        </div>

      </div>

      {/* Editor & Detail Panel for Active Tooth */}
      {selectedTooth ? (
        activeToothInfo && activeToothState && (
          <div key="active-tooth-editor" className="glass-panel animate-fade-in" style={{
            padding: '24px 30px',
            background: 'linear-gradient(135deg, rgba(20, 184, 166, 0.03) 0%, rgba(59, 130, 246, 0.01) 100%), var(--glass-bg)',
            borderWidth: '1px 1px 1px 4px',
            borderStyle: 'solid',
            borderColor: 'var(--glass-border) var(--glass-border) var(--glass-border) hsl(var(--primary-hsl))',
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: '24px',
          }}>
            
            {/* Column 1: Header / Tooth Graphic & State Toggles */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  {renderToothIcon(selectedTooth, activeToothInfo.type, selectedTooth <= (activeTab === 'adult' ? 16 : 10), 32)}
                  {renderCircularSelector(selectedTooth, false, 44)}
                </div>
                <div>
                  <h4 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--foreground-hsl)' }}>
                    {getToothName(activeToothInfo)}
                  </h4>
                  <p style={{ fontSize: '0.8rem', opacity: 0.7, margin: 0, color: 'hsla(var(--foreground-hsl) / 0.8)' }}>
                    Tipo: {activeToothInfo.type === 'incisor' ? 'Incisivo' : activeToothInfo.type === 'canine' ? 'Canino' : activeToothInfo.type === 'premolar' ? 'Premolar' : 'Molar'} • Número: {activeToothInfo.id}
                  </p>
                </div>
              </div>

              {/* Special Condition Buttons */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setToothCondition(selectedTooth, 'ausente')}
                  className={`odont-option-btn btn-ausente ${activeToothState.condition === 'ausente' ? 'active' : ''}`}
                >
                  ❌ Pérdida / Ausente
                </button>
                <button
                  type="button"
                  onClick={() => setToothCondition(selectedTooth, 'implante')}
                  className={`odont-option-btn btn-implante ${activeToothState.condition === 'implante' ? 'active' : ''}`}
                >
                  🔩 Implante
                </button>
                <button
                  type="button"
                  onClick={() => setToothCondition(selectedTooth, 'corona_existente')}
                  className={`odont-option-btn btn-corona ${activeToothState.condition === 'corona_existente' ? 'active' : ''}`}
                >
                  👑 Corona Previa
                </button>
                <button
                  type="button"
                  onClick={() => clearTooth(selectedTooth)}
                  className="odont-option-btn btn-limpiar"
                >
                  🧹 Limpiar Diente
                </button>
              </div>
            </div>

            {/* Tooth Faces Toggles Visual Diagram Guide */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, opacity: 0.8, color: 'hsla(var(--foreground-hsl) / 0.8)' }}>
                Selección Manual de Caras Clínicas Afectadas:
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {[
                  { key: 'V', name: 'Vestibular (Frontal)' },
                  { key: 'O', name: 'Oclusal / Incisal (Masticatoria)' },
                  { key: 'M', name: 'Mesial (Lateral interna)' },
                  { key: 'D', name: 'Distal (Lateral externa)' },
                  { key: 'L', name: 'Lingual / Palatina (Trasera)' }
                ].map((face) => {
                  const key = face.key as keyof SelectedToothState['faces'];
                  const isFaceActive = activeToothState.faces[key];
                  return (
                    <button
                      key={face.key}
                      type="button"
                      onClick={() => toggleFace(selectedTooth, key)}
                      className={`odont-face-btn ${isFaceActive ? 'active' : ''}`}
                    >
                      {isFaceActive ? '✅' : '⚪'} {face.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ height: '1px', backgroundColor: 'var(--glass-border)' }}></div>

            {/* Column 2: Prestaciones (Treatments Checklist) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <span style={{ fontSize: '0.86rem', fontWeight: 800, color: 'hsl(var(--primary-hsl))' }}>
                Asignar Prestaciones para la Pieza {selectedTooth}:
              </span>

              {/* Categorized List of treatments */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '20px'
              }}>
                {(['prev', 'rest', 'endo', 'surg', 'prot'] as const).map((cat) => {
                  const catOpts = TREATMENT_OPTIONS.filter((t) => t.category === cat);
                  return (
                    <div key={cat} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <strong style={{ fontSize: '0.78rem', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'hsla(var(--foreground-hsl) / 0.5)' }}>
                        {CATEGORY_NAMES[cat]}
                      </strong>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {catOpts.map((opt) => {
                          const isAssigned = activeToothState.treatments.includes(opt.id);
                          return (
                            <div
                              key={opt.id}
                              onClick={() => selectedTooth && toggleTreatment(selectedTooth, opt.id)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                fontSize: '0.8rem',
                                padding: '8px 12px',
                                borderRadius: '8px',
                                backgroundColor: isAssigned ? 'rgba(59, 130, 246, 0.08)' : 'hsla(var(--foreground-hsl) / 0.01)',
                                borderWidth: '1px',
                                borderStyle: 'solid',
                                borderColor: isAssigned ? 'rgba(59, 130, 246, 0.3)' : 'var(--glass-border)',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                userSelect: 'none'
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={isAssigned}
                                readOnly
                                style={{
                                  width: '15px',
                                  height: '15px',
                                  cursor: 'pointer'
                                }}
                              />
                              <span style={{ color: isAssigned ? 'var(--foreground-hsl)' : 'hsla(var(--foreground-hsl) / 0.8)' }}>
                                {opt.name}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setSelectedTooth(null)}
                style={{ padding: '8px 24px', borderRadius: '8px', fontSize: '0.84rem' }}
              >
                Cerrar Editor del Diente
              </button>
            </div>

          </div>
        )
      ) : (
        <div key="inactive-tooth-placeholder" className="glass-panel" style={{
          padding: '16px 20px',
          background: 'var(--input-bg)',
          borderWidth: '1.5px',
          borderStyle: 'dashed',
          borderColor: 'var(--glass-border)',
          textAlign: 'center',
          color: 'hsla(var(--foreground-hsl) / 0.6)',
          fontSize: '0.85rem'
        }}>
          💡 Haz clic sobre cualquier pieza dental en el odontograma superior para diagnosticar caras y asignar prestaciones a realizar.
        </div>
      )}

      {/* Summary Table of Selected Treatments (Inspirada en el segundo pantallazo) */}
      {Object.keys(chartState).length > 0 && (
        <div className="glass-panel animate-fade-in" style={{ padding: '24px', border: '1px solid var(--glass-border)' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '8px', color: 'hsla(var(--foreground-hsl) / 0.8)' }}>
            📊 Resumen de Prestaciones Asignadas
          </h4>
          
          <div className="table-container">
            <table className="custom-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ padding: '8px 12px', color: 'hsla(var(--foreground-hsl) / 0.7)' }}>Diente</th>
                  <th style={{ padding: '8px 12px', color: 'hsla(var(--foreground-hsl) / 0.7)' }}>Tipo</th>
                  <th style={{ padding: '8px 12px', color: 'hsla(var(--foreground-hsl) / 0.7)' }}>Caras Clínicas</th>
                  <th style={{ padding: '8px 12px', color: 'hsla(var(--foreground-hsl) / 0.7)' }}>Prestaciones</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right', color: 'hsla(var(--foreground-hsl) / 0.7)' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(chartState).map(([idStr, state]) => {
                  const id = parseInt(idStr, 10);
                  const tooth = currentTeethList.find((t) => t.id === id);
                  if (!tooth) return null;

                  const activeFaces = Object.entries(state.faces)
                    .filter(([_, isActive]) => isActive)
                    .map(([faceName]) => faceName)
                    .join(', ');

                  let toothConditionLabel = '';
                  if (state.condition === 'ausente') toothConditionLabel = 'Ausente';
                  if (state.condition === 'implante') toothConditionLabel = 'Implante';
                  if (state.condition === 'corona_existente') toothConditionLabel = 'Corona Previa';

                  return (
                    <tr key={id}>
                      <td style={{ padding: '8px 12px', fontWeight: 700, color: 'var(--foreground-hsl)' }}>
                        Pieza {id} {toothConditionLabel && <span style={{ fontSize: '0.72rem', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', marginLeft: '6px' }}>{toothConditionLabel}</span>}
                      </td>
                      <td style={{ padding: '8px 12px', opacity: 0.7, fontSize: '0.84rem', color: 'var(--foreground-hsl)' }}>
                        {tooth.type === 'incisor' ? 'Incisivo' : tooth.type === 'canine' ? 'Canino' : tooth.type === 'premolar' ? 'Premolar' : 'Molar'}
                      </td>
                      <td style={{ padding: '8px 12px', color: 'hsl(var(--accent-hsl))', fontWeight: 600 }}>
                        {activeFaces || (state.condition === 'ausente' ? 'Completo' : 'General')}
                      </td>
                      <td style={{ padding: '8px 12px' }}>
                        {state.treatments.length > 0 ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {state.treatments.map((tid) => {
                              const opt = TREATMENT_OPTIONS.find((o) => o.id === tid);
                              return (
                                <span
                                  key={tid}
                                  style={{
                                    fontSize: '0.75rem',
                                    padding: '2px 8px',
                                    borderRadius: '12px',
                                    backgroundColor: opt ? `${opt.color}1c` : 'rgba(255,255,255,0.06)',
                                    color: opt ? opt.color : 'var(--foreground-hsl)',
                                    border: '1px solid',
                                    borderColor: opt ? `${opt.color}44` : 'rgba(255,255,255,0.1)'
                                  }}
                                >
                                  {opt ? opt.name.split(' (')[0] : tid}
                                </span>
                              );
                            })}
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.8rem', opacity: 0.4, fontStyle: 'italic', color: 'hsla(var(--foreground-hsl) / 0.4)' }}>Sin prestaciones asignadas</span>
                        )}
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => clearTooth(id)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            fontSize: '0.76rem',
                            fontWeight: 700,
                            padding: '4px'
                          }}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* General Comments Form field */}
      <div className="form-group" style={{ marginTop: '10px' }}>
        <label className="form-label" htmlFor="odontogram_observations" style={{ color: 'hsla(var(--foreground-hsl) / 0.85)' }}>
          Observaciones Generales Clínicas de la Derivación (Opcional)
        </label>
        <textarea
          className="form-textarea"
          id="odontogram_observations"
          rows={2}
          value={generalObservations}
          onChange={(e) => setGeneralObservations(e.target.value)}
          placeholder="Detalles complementarios clínicos, anomalías, derivaciones preferenciales o del caso..."
        />
      </div>

    </div>
  );
}
