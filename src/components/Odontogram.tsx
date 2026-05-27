'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Trash2,
  XCircle,
  Wrench,
  Crown,
  Eraser,
  Info,
  ChevronRight,
  ChevronDown,
  Check,
  Shield,
  Activity,
  HelpCircle,
  Scissors,
  Layers,
  X,
  Save,
  FileText
} from 'lucide-react';

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
  const [hoveredFace, setHoveredFace] = useState<keyof SelectedToothState['faces'] | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<'prev' | 'rest' | 'endo' | 'surg' | 'prot' | null>(null);

  const selectToothAndScroll = (id: number) => {
    setSelectedTooth(id);
  };

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset category on tooth select
  useEffect(() => {
    if (selectedTooth) {
      setSelectedCategory(null);
    }
  }, [selectedTooth]);

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
        onClick={() => selectToothAndScroll(id)}
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
          selectToothAndScroll(id);
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
          fill={isFocused && hoveredFace === 'O' ? 'rgba(20, 184, 166, 0.65)' : (state.condition === 'ausente' ? 'rgba(239, 68, 68, 0.18)' : (state.faces.O ? 'rgba(20, 184, 166, 0.38)' : 'hsla(var(--foreground-hsl) / 0.03)'))}
          stroke={isFocused && hoveredFace === 'O' ? '#14b8a6' : "hsla(var(--foreground-hsl) / 0.08)"}
          strokeWidth={isFocused && hoveredFace === 'O' ? "1.5" : "0.8"}
          onClick={(e) => {
            if (!interactive) return;
            e.stopPropagation();
            selectToothAndScroll(id);
            toggleFace(id, 'O');
          }}
        />

        {/* Top: Vestibular (V) */}
        <path
          d="M 15 15 L 5 5 A 21 21 0 0 1 35 5 L 25 15 A 7 7 0 0 0 15 15 Z"
          className={interactive ? "odont-face-sector" : ""}
          fill={isFocused && hoveredFace === 'V' ? 'rgba(20, 184, 166, 0.65)' : (state.condition === 'ausente' ? 'rgba(239, 68, 68, 0.12)' : (state.faces.V ? 'rgba(20, 184, 166, 0.38)' : 'hsla(var(--foreground-hsl) / 0.015)'))}
          stroke={isFocused && hoveredFace === 'V' ? '#14b8a6' : "hsla(var(--foreground-hsl) / 0.08)"}
          strokeWidth={isFocused && hoveredFace === 'V' ? "1.5" : "0.8"}
          onClick={(e) => {
            if (!interactive) return;
            e.stopPropagation();
            selectToothAndScroll(id);
            toggleFace(id, 'V');
          }}
        />

        {/* Bottom: Lingual / Palatina (L) */}
        <path
          d="M 15 25 L 5 35 A 21 21 0 0 0 35 35 L 25 25 A 7 7 0 0 1 15 25 Z"
          className={interactive ? "odont-face-sector" : ""}
          fill={isFocused && hoveredFace === 'L' ? 'rgba(20, 184, 166, 0.65)' : (state.condition === 'ausente' ? 'rgba(239, 68, 68, 0.12)' : (state.faces.L ? 'rgba(20, 184, 166, 0.38)' : 'hsla(var(--foreground-hsl) / 0.015)'))}
          stroke={isFocused && hoveredFace === 'L' ? '#14b8a6' : "hsla(var(--foreground-hsl) / 0.08)"}
          strokeWidth={isFocused && hoveredFace === 'L' ? "1.5" : "0.8"}
          onClick={(e) => {
            if (!interactive) return;
            e.stopPropagation();
            selectToothAndScroll(id);
            toggleFace(id, 'L');
          }}
        />

        {/* Left: Mesial (M) */}
        <path
          d="M 15 15 L 5 5 A 21 21 0 0 0 5 35 L 15 25 A 7 7 0 0 1 15 15 Z"
          className={interactive ? "odont-face-sector" : ""}
          fill={isFocused && hoveredFace === 'M' ? 'rgba(20, 184, 166, 0.65)' : (state.condition === 'ausente' ? 'rgba(239, 68, 68, 0.12)' : (state.faces.M ? 'rgba(20, 184, 166, 0.38)' : 'hsla(var(--foreground-hsl) / 0.015)'))}
          stroke={isFocused && hoveredFace === 'M' ? '#14b8a6' : "hsla(var(--foreground-hsl) / 0.08)"}
          strokeWidth={isFocused && hoveredFace === 'M' ? "1.5" : "0.8"}
          onClick={(e) => {
            if (!interactive) return;
            e.stopPropagation();
            selectToothAndScroll(id);
            toggleFace(id, 'M');
          }}
        />

        {/* Right: Distal (D) */}
        <path
          d="M 25 15 L 35 5 A 21 21 0 0 1 35 35 L 25 25 A 7 7 0 0 0 25 15 Z"
          className={interactive ? "odont-face-sector" : ""}
          fill={isFocused && hoveredFace === 'D' ? 'rgba(20, 184, 166, 0.65)' : (state.condition === 'ausente' ? 'rgba(239, 68, 68, 0.12)' : (state.faces.D ? 'rgba(20, 184, 166, 0.38)' : 'hsla(var(--foreground-hsl) / 0.015)'))}
          stroke={isFocused && hoveredFace === 'D' ? '#14b8a6' : "hsla(var(--foreground-hsl) / 0.08)"}
          strokeWidth={isFocused && hoveredFace === 'D' ? "1.5" : "0.8"}
          onClick={(e) => {
            if (!interactive) return;
            e.stopPropagation();
            selectToothAndScroll(id);
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
          <div style={{
            display: 'flex',
            backgroundColor: 'hsla(var(--foreground-hsl) / 0.04)',
            padding: '3px',
            borderRadius: '10px',
            border: '1px solid var(--glass-border)',
            gap: '2px'
          }}>
            <button
              type="button"
              style={{
                padding: '6px 14px',
                fontSize: '0.78rem',
                borderRadius: '8px',
                backgroundColor: activeTab === 'adult' ? 'var(--card-hsl)' : 'transparent',
                color: activeTab === 'adult' ? 'hsl(var(--primary-hsl))' : 'hsla(var(--foreground-hsl) / 0.6)',
                boxShadow: activeTab === 'adult' ? 'var(--shadow-sm)' : 'none',
                border: 'none',
                fontWeight: activeTab === 'adult' ? 700 : 500,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease',
                margin: 0
              }}
              onClick={() => {
                setActiveTab('adult');
                setSelectedTooth(null);
              }}
            >
              <Activity size={13} style={{ strokeWidth: 2.5 }} /> Permanente (Adulto)
            </button>
            <button
              type="button"
              style={{
                padding: '6px 14px',
                fontSize: '0.78rem',
                borderRadius: '8px',
                backgroundColor: activeTab === 'child' ? 'var(--card-hsl)' : 'transparent',
                color: activeTab === 'child' ? 'hsl(var(--accent-hsl))' : 'hsla(var(--foreground-hsl) / 0.6)',
                boxShadow: activeTab === 'child' ? 'var(--shadow-sm)' : 'none',
                border: 'none',
                fontWeight: activeTab === 'child' ? 700 : 500,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease',
                margin: 0
              }}
              onClick={() => {
                setActiveTab('child');
                setSelectedTooth(null);
              }}
            >
              <Layers size={13} style={{ strokeWidth: 2.5 }} /> Temporal (Niño)
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
              <Trash2 size={13} /> Limpiar Todo
            </button>
          )}
        </div>
      </div>

      {/* Anatomical Odontogram Chart */}
      <div className="glass-panel" style={{
        padding: '34px 28px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '28px',
        background: 'linear-gradient(180deg, hsl(var(--card-hsl)) 0%, hsla(var(--card-hsl) / 0.96) 100%)',
        border: '1.5px solid hsl(var(--card-border-hsl))',
        boxShadow: 'var(--shadow-lg), 0 12px 46px -12px rgba(139, 131, 114, 0.22)',
        position: 'relative',
        overflowX: 'auto',
      }}>

        {/* Subtle grid indicators */}
        <div style={{ position: 'absolute', left: '18px', top: '18px', fontSize: '0.74rem', fontWeight: 800, opacity: 0.5, color: 'hsla(var(--foreground-hsl) / 0.7)', letterSpacing: '0.05em' }}>
          DERIVACIÓN DENTAL VITACURA
        </div>

        {/* Anatomical Jaws Rows Wrapper */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '28px',
          minWidth: activeTab === 'child' ? '450px' : '600px',
          maxWidth: activeTab === 'child' ? '540px' : '820px',
          width: '100%',
          alignItems: 'center'
        }}>

          {/* MAXILAR SUPERIOR (Upper Jaw) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              fontSize: '0.82rem',
              fontWeight: 800,
              color: 'hsla(var(--foreground-hsl) / 0.95)',
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              borderBottom: '2.5px solid hsla(var(--primary-hsl) / 0.15)',
              paddingBottom: '8px',
              marginBottom: '6px'
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
                      gap: '6px',
                      flex: 1,
                    }}
                  >
                    {/* Upper layout: Number -> Anatomical Shape -> Circle Selector */}
                    <span style={{ fontSize: '0.88rem', fontWeight: 800, color: isFocused ? 'hsl(var(--primary-hsl))' : (isModified ? 'hsl(var(--accent-hsl))' : 'hsla(var(--foreground-hsl) / 0.85)') }}>
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
            height: '2.5px',
            width: '100%',
            background: 'linear-gradient(90deg, transparent 0%, hsla(var(--primary-hsl) / 0.2) 50%, transparent 100%)'
          }} />

          {/* MANDÍBULA INFERIOR (Lower Jaw) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
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
                      gap: '6px',
                      flex: 1,
                    }}
                  >
                    {/* Lower layout: Circle Selector -> Anatomical Shape -> Number */}
                    {renderCircularSelector(tooth.id)}

                    {/* Tooth anatomical drawing (flipped vertically) */}
                    {renderToothIcon(tooth.id, tooth.type, false)}

                    <span style={{ fontSize: '0.88rem', fontWeight: 800, color: isFocused ? 'hsl(var(--primary-hsl))' : (isModified ? 'hsl(var(--accent-hsl))' : 'hsla(var(--foreground-hsl) / 0.85)') }}>
                      {tooth.id}
                    </span>
                  </div>
                );
              })}
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'center',
              fontSize: '0.82rem',
              fontWeight: 800,
              color: 'hsla(var(--foreground-hsl) / 0.95)',
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              borderTop: '2.5px solid hsla(var(--primary-hsl) / 0.15)',
              paddingTop: '10px',
              marginTop: '6px'
            }}>
              Mandíbula Inferior (Arcada Inferior)
            </div>
          </div>

        </div>

      </div>

      {/* Editor & Detail Panel for Active Tooth as Popup Modal in React Portal */}
      {selectedTooth && mounted && typeof document !== 'undefined' ? (
        createPortal(
          activeToothInfo && activeToothState && (
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: '100vw',
                height: '100vh',
                backgroundColor: 'rgba(10, 17, 36, 0.5)',
                backdropFilter: 'blur(6px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 99999,
                padding: '24px'
              }}
              onClick={() => setSelectedTooth(null)}
            >
              <div
                id="active-tooth-editor"
                key="active-tooth-editor"
                className="glass-panel animate-fade-in"
                style={{
                  padding: '32px 34px 46px 34px',
                  background: 'linear-gradient(135deg, rgba(20, 184, 166, 0.04) 0%, rgba(59, 130, 246, 0.02) 100%), hsl(var(--card-hsl))',
                  borderWidth: '1.5px 1.5px 1.5px 6px',
                  borderStyle: 'solid',
                  borderColor: 'hsl(var(--card-border-hsl)) hsl(var(--card-border-hsl)) hsl(var(--card-border-hsl)) hsl(var(--primary-hsl))',
                  boxShadow: '0 24px 60px -15px rgba(10, 17, 36, 0.35), var(--shadow-lg)',
                  display: 'grid',
                  gridTemplateColumns: '1fr',
                  gap: '24px',
                  width: '95%',
                  maxWidth: '820px',
                  maxHeight: '92vh',
                  overflowY: 'auto',
                  position: 'relative',
                  margin: 'auto'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Top-Right Absolute Close X button */}
                <button
                  type="button"
                  onClick={() => setSelectedTooth(null)}
                  style={{
                    position: 'absolute',
                    right: '18px',
                    top: '18px',
                    background: 'hsla(var(--foreground-hsl) / 0.04)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'var(--foreground-hsl)',
                    transition: 'all 0.2s ease',
                    padding: 0,
                    zIndex: 10
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'hsla(var(--foreground-hsl) / 0.08)';
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'hsla(var(--foreground-hsl) / 0.04)';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <X size={16} style={{ strokeWidth: 2.5 }} />
                </button>

                {/* Column 1: Header / Tooth Graphic & State Toggles */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'center', justifyContent: 'space-between', paddingRight: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      {renderToothIcon(selectedTooth, activeToothInfo.type, selectedTooth <= (activeTab === 'adult' ? 16 : 10), 32)}
                      {renderCircularSelector(selectedTooth, false, 44)}
                    </div>
                    <div>
                      <h4 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--foreground-hsl)' }}>
                        {getToothName(activeToothInfo)}
                      </h4>
                      <p style={{ fontSize: '0.82rem', opacity: 0.8, margin: 0, color: 'hsla(var(--foreground-hsl) / 0.8)', fontWeight: 500 }}>
                        Tipo: {activeToothInfo.type === 'incisor' ? 'Incisivo' : activeToothInfo.type === 'canine' ? 'Canino' : activeToothInfo.type === 'premolar' ? 'Premolar' : 'Molar'} • Número: {activeToothInfo.id}
                      </p>
                    </div>
                  </div>

                  {/* Special Condition Buttons Group with styled title */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, opacity: 0.9, color: 'hsla(var(--foreground-hsl) / 0.85)', letterSpacing: '0.02em', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <HelpCircle size={14} style={{ color: 'hsl(var(--primary-hsl))' }} /> Estado o Condición Especial de la Pieza:
                    </span>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => setToothCondition(selectedTooth, 'ausente')}
                        className={`odont-option-btn btn-ausente ${activeToothState.condition === 'ausente' ? 'active' : ''}`}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
                      >
                        <XCircle size={15} style={{ opacity: 0.9 }} /> Pérdida / Ausente
                      </button>
                      <button
                        type="button"
                        onClick={() => setToothCondition(selectedTooth, 'implante')}
                        className={`odont-option-btn btn-implante ${activeToothState.condition === 'implante' ? 'active' : ''}`}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
                      >
                        <Wrench size={14} style={{ opacity: 0.9 }} /> Implante
                      </button>
                      <button
                        type="button"
                        onClick={() => setToothCondition(selectedTooth, 'corona_existente')}
                        className={`odont-option-btn btn-corona ${activeToothState.condition === 'corona_existente' ? 'active' : ''}`}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
                      >
                        <Crown size={14} style={{ opacity: 0.9 }} /> Corona Previa
                      </button>
                    </div>
                  </div>
                </div>

                {/* Tooth Faces Toggles Visual Diagram Guide */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '0.84rem', fontWeight: 800, opacity: 0.9, color: 'hsla(var(--foreground-hsl) / 0.85)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <Layers size={14} style={{ color: 'hsl(var(--primary-hsl))' }} /> Selección Manual de Caras Clínicas Afectadas:
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
                          onMouseEnter={() => setHoveredFace(key)}
                          onMouseLeave={() => setHoveredFace(null)}
                          className={`odont-face-btn ${isFaceActive ? 'active' : ''}`}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
                        >
                          {isFaceActive ? (
                            <Check size={14} style={{ color: 'hsl(var(--accent-hsl))', strokeWidth: 3 }} />
                          ) : (
                            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', border: '1.5px solid hsla(var(--foreground-hsl) / 0.45)', backgroundColor: 'transparent' }} />
                          )}
                          {face.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div style={{ height: '1px', backgroundColor: 'var(--glass-border)' }}></div>

                {/* Column 2: Prestaciones (Treatments Checklist) - Unified Accordion Panel */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <span style={{ fontSize: '0.86rem', fontWeight: 800, color: 'hsl(var(--primary-hsl))', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <FileText size={15} style={{ color: 'hsl(var(--primary-hsl))' }} /> Asignar Prestaciones para la Pieza {selectedTooth}:
                  </span>

                  {/* Unified Accordion List Container */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '14px',
                    overflow: 'hidden',
                    backgroundColor: 'hsla(var(--foreground-hsl) / 0.015)'
                  }}>
                    {(['prev', 'rest', 'endo', 'surg', 'prot'] as const).map((cat) => {
                      const catOpts = TREATMENT_OPTIONS.filter((t) => t.category === cat);
                      const isOpen = selectedCategory === cat;

                      // Count assigned treatments in this category
                      const assignedCount = activeToothState.treatments.filter(tid =>
                        catOpts.some(opt => opt.id === tid)
                      ).length;

                      // Get theme color
                      const catColor = catOpts[0]?.color || 'hsl(var(--primary-hsl))';

                      const renderCategoryIcon = () => {
                        const iconStyle = { display: 'inline-block', strokeWidth: 2.2 };
                        if (cat === 'prev') return <Shield size={16} style={iconStyle} />;
                        if (cat === 'rest') return <Activity size={16} style={iconStyle} />;
                        if (cat === 'endo') return <Layers size={16} style={iconStyle} />;
                        if (cat === 'surg') return <Scissors size={16} style={iconStyle} />;
                        return <Crown size={16} style={iconStyle} />;
                      };

                      return (
                        <div
                          key={cat}
                          style={{
                            borderBottom: cat !== 'prot' ? '1px solid var(--glass-border)' : 'none',
                            transition: 'all 0.25s ease'
                          }}
                        >
                          {/* Accordion Header */}
                          <div
                            onClick={() => setSelectedCategory(isOpen ? null as any : cat)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '14px 20px',
                              cursor: 'pointer',
                              backgroundColor: isOpen ? 'hsla(var(--foreground-hsl) / 0.03)' : 'transparent',
                              transition: 'all 0.2s ease',
                              userSelect: 'none'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = 'hsla(var(--foreground-hsl) / 0.04)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = isOpen ? 'hsla(var(--foreground-hsl) / 0.03)' : 'transparent';
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                color: isOpen ? catColor : 'var(--foreground-hsl)',
                                transition: 'color 0.2s ease'
                              }}>
                                {renderCategoryIcon()}
                              </span>
                              <span style={{
                                fontSize: '0.84rem',
                                fontWeight: 700,
                                color: isOpen ? catColor : 'var(--foreground-hsl)',
                                transition: 'color 0.2s ease'
                              }}>
                                {CATEGORY_NAMES[cat]}
                              </span>

                              {/* Count Badge */}
                              {assignedCount > 0 && (
                                <span style={{
                                  backgroundColor: catColor,
                                  color: '#ffffff',
                                  fontSize: '0.72rem',
                                  fontWeight: 800,
                                  borderRadius: '9999px',
                                  padding: '1px 7px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  boxShadow: `0 2px 6px ${catColor}44`
                                }}>
                                  {assignedCount}
                                </span>
                              )}
                            </div>

                            {/* Caret Arrow Indicator */}
                            <span style={{
                              opacity: 0.7,
                              transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                              transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              color: isOpen ? catColor : 'var(--foreground-hsl)'
                            }}>
                              <ChevronRight size={16} style={{ strokeWidth: 2.5 }} />
                            </span>
                          </div>

                          {/* Accordion Body (Collapsible Section) */}
                          {isOpen && (
                            <div
                              className="animate-fade-in"
                              style={{
                                padding: '18px 20px',
                                backgroundColor: 'hsla(var(--foreground-hsl) / 0.01)',
                                borderTop: '1px solid var(--glass-border)',
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                                gap: '12px'
                              }}
                            >
                              {catOpts.map((opt) => {
                                const isAssigned = activeToothState.treatments.includes(opt.id);
                                return (
                                  <div
                                    key={opt.id}
                                    onClick={() => selectedTooth && toggleTreatment(selectedTooth, opt.id)}
                                    className={`odont-treatment-card ${isAssigned ? 'active' : ''}`}
                                    style={{
                                      borderColor: isAssigned ? opt.color : 'var(--glass-border)',
                                      boxShadow: isAssigned ? `0 4px 14px ${opt.color}1e` : 'none'
                                    }}
                                  >
                                    <div
                                      className="odont-treatment-checkbox"
                                      style={{
                                        backgroundColor: isAssigned ? opt.color : 'transparent',
                                        borderColor: isAssigned ? opt.color : 'rgba(120, 120, 120, 0.3)',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                      }}
                                    >
                                      {isAssigned && (
                                        <Check size={11} style={{ color: '#ffffff', strokeWidth: 4 }} />
                                      )}
                                    </div>
                                    <span style={{
                                      color: isAssigned ? 'var(--foreground-hsl)' : 'hsla(var(--foreground-hsl) / 0.85)',
                                      fontWeight: isAssigned ? 600 : 500
                                    }}>
                                      {opt.name}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  marginTop: '20px',
                  borderTop: '1px solid var(--glass-border)',
                  paddingTop: '16px',
                  gap: '12px',
                  flexWrap: 'wrap'
                }}>
                  <button
                    type="button"
                    onClick={() => {
                      setChartState(prev => {
                        const copy = { ...prev };
                        if (selectedTooth !== null) {
                          delete copy[selectedTooth];
                        }
                        return copy;
                      });
                      setSelectedTooth(null);
                    }}
                    className="btn btn-secondary"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 22px',
                      borderRadius: '8px',
                      fontSize: '0.84rem',
                      fontWeight: 700,
                      color: 'hsl(var(--danger-hsl))',
                      borderColor: 'rgba(239, 68, 68, 0.25)'
                    }}
                  >
                    <Eraser size={14} style={{ strokeWidth: 2.2 }} /> Limpiar Selección
                  </button>
                  <button
                    type="button"
                    className="btn btn-accent"
                    onClick={() => setSelectedTooth(null)}
                    style={{
                      padding: '10px 26px',
                      borderRadius: '8px',
                      fontSize: '0.84rem',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 12px rgba(20, 184, 166, 0.2)'
                    }}
                  >
                    <Save size={15} style={{ strokeWidth: 2.5 }} /> Guardar
                  </button>
                </div>

              </div>
            </div>
          ),
          document.body
        )
      ) : null}

      {/* Inactive tooth placeholder in regular DOM tree flow */}
      {!selectedTooth && (
        <div key="inactive-tooth-placeholder" className="glass-panel" style={{
          padding: '18px 24px',
          background: 'hsla(var(--primary-hsl) / 0.03)',
          borderWidth: '1.5px',
          borderStyle: 'dashed',
          borderColor: 'hsla(var(--primary-hsl) / 0.25)',
          borderRadius: '12px',
          textAlign: 'center',
          color: 'hsla(var(--foreground-hsl) / 0.85)',
          fontSize: '0.86rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <Info size={16} style={{ color: 'hsl(var(--primary-hsl))', flexShrink: 0 }} />
          Haz clic sobre cualquier pieza dental en el odontograma superior para diagnosticar caras y asignar prestaciones a realizar.
        </div>
      )}

      {/* Summary Table of Selected Treatments (Inspirada en el segundo pantallazo) */}
      {Object.keys(chartState).length > 0 && (
        <div className="glass-panel animate-fade-in" style={{ padding: '24px', border: '1px solid var(--glass-border)' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '8px', color: 'hsla(var(--foreground-hsl) / 0.8)' }}>
            <Activity size={18} style={{ color: 'hsl(var(--primary-hsl))' }} /> Resumen de Prestaciones Asignadas
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
