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
  FileText,
  Search,
  MousePointerClick,
  Paintbrush,
  Stethoscope,
  Zap,
  CheckSquare
} from 'lucide-react';
import { getOdontogramPrestacionesAction } from '@/app/actions/arancelActions';

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
  id_prestacion?: number;
  name: string;
  category: string;
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
  condition?: 'ausente' | 'sano' | 'perdida' | 'implante' | 'corona_existente' | 'cariada' | 'obturada' | 'fracturada' | 'provisional';
}

interface OdontogramProps {
  initialType?: 'adult' | 'child';
  initialDentalDiagnosis?: string | null;
  initialTreatmentNeeded?: string | null;
  onChange: (data: {
    dentalDiagnosis: string;
    treatmentNeeded: string;
    description: string;
    selectedTreatmentIds: string;
    dentalCount: number;
    xrayCount: number;
  }) => void;
}

function getCategoryColor(category: string): string {
  const catLower = category.toLowerCase();
  if (catLower.includes('cirug') || catLower.includes('quir')) return '#ef4444'; // Red
  if (catLower.includes('endo')) return '#f59e0b'; // Amber
  if (catLower.includes('orto') || catLower.includes('prev') || catLower.includes('higien')) return '#14b8a6'; // Teal
  if (catLower.includes('prot') || catLower.includes('fija') || catLower.includes('remov')) return '#a855f7'; // Purple
  if (catLower.includes('radiolog') || catLower.includes('exame')) return '#3b82f6'; // Blue
  return '#10b981'; // Green
}

export default function Odontogram({ 
  initialType = 'adult', 
  initialDentalDiagnosis, 
  initialTreatmentNeeded, 
  onChange 
}: OdontogramProps) {
  const [activeTab, setActiveTab] = useState<'adult' | 'child'>(initialType);
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [chartState, setChartState] = useState<Record<number, SelectedToothState>>({});
  const [generalObservations, setGeneralObservations] = useState('');
  const [localObservations, setLocalObservations] = useState('');

  useEffect(() => {
    setLocalObservations(generalObservations);
  }, [generalObservations]);

  const [hoveredFace, setHoveredFace] = useState<keyof SelectedToothState['faces'] | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [hoveredBtn, setHoveredBtn] = useState<'upper' | 'lower' | 'full' | 'multiselect' | null>(null);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [multiSelectedTeeth, setMultiSelectedTeeth] = useState<number[]>([]);
  const [selectedMultiTreatment, setSelectedMultiTreatment] = useState<string | null>(null);

  // Dynamic database aranceles states
  const [treatmentOptions, setTreatmentOptions] = useState<TreatmentOption[]>(TREATMENT_OPTIONS);
  const [categories, setCategories] = useState<string[]>(['prev', 'rest', 'endo', 'surg', 'prot']);
  const [visibleLimits, setVisibleLimits] = useState<Record<string, number>>({});

  // Load initial data if provided
  useEffect(() => {
    if (!initialDentalDiagnosis && !initialTreatmentNeeded) {
      setChartState({});
      return;
    }

    const newChartState: Record<number, SelectedToothState> = {};
    let parsedTab: 'adult' | 'child' = initialType;

    const getOrCreateState = (id: number): SelectedToothState => {
      if (!newChartState[id]) {
        newChartState[id] = {
          faces: { V: false, O: false, M: false, D: false, L: false },
          treatments: []
        };
      }
      return newChartState[id];
    };

    if (initialDentalDiagnosis) {
      if (initialDentalDiagnosis.includes('[Odontogram Infantil]')) {
        parsedTab = 'child';
      } else if (initialDentalDiagnosis.includes('[Odontogram Adulto]')) {
        parsedTab = 'adult';
      }

      const lines = initialDentalDiagnosis.split('\n');
      lines.forEach(line => {
        if (line.includes('Arcada Superior Completa')) {
          getOrCreateState(101);
        } else if (line.includes('Arcada Inferior Completa')) {
          getOrCreateState(102);
        } else if (line.includes('Boca Completa')) {
          getOrCreateState(103);
        } else {
          const match = line.match(/Pieza\s+(\d+)/i);
          if (match) {
            const toothId = parseInt(match[1], 10);
            const state = getOrCreateState(toothId);

            if (line.includes('Ausente')) {
              state.condition = 'ausente';
            } else if (line.includes('Pérdida')) {
              state.condition = 'perdida';
            } else if (line.includes('Implante')) {
              state.condition = 'implante';
            } else if (line.includes('Corona Previa') || line.includes('Corona Existente')) {
              state.condition = 'corona_existente';
            } else if (line.includes('Cariada')) {
              state.condition = 'cariada';
            } else if (line.includes('Obturada')) {
              state.condition = 'obturada';
            } else if (line.includes('Fracturada')) {
              state.condition = 'fracturada';
            } else if (line.includes('Provisional')) {
              state.condition = 'provisional';
            } else if (line.includes('Sana')) {
              state.condition = 'sano';
            }

            if (line.includes('Caras:')) {
              const facesPart = line.split('Caras:')[1];
              if (facesPart.includes('Vestibular')) state.faces.V = true;
              if (facesPart.includes('Oclusal') || facesPart.includes('Incisal')) state.faces.O = true;
              if (facesPart.includes('Mesial')) state.faces.M = true;
              if (facesPart.includes('Distal')) state.faces.D = true;
              if (facesPart.includes('Lingual') || facesPart.includes('Palatina')) state.faces.L = true;
            }
          }
        }
      });
    }

    if (initialTreatmentNeeded) {
      const lines = initialTreatmentNeeded.split('\n');
      lines.forEach(line => {
        let toothId: number | null = null;
        if (line.includes('Arcada Superior Completa')) {
          toothId = 101;
        } else if (line.includes('Arcada Inferior Completa')) {
          toothId = 102;
        } else if (line.includes('Boca Completa')) {
          toothId = 103;
        } else {
          const match = line.match(/Pieza\s+(\d+)/i);
          if (match) {
            toothId = parseInt(match[1], 10);
          }
        }

        if (toothId !== null) {
          const state = getOrCreateState(toothId);
          const startIdx = line.indexOf('[');
          const endIdx = line.lastIndexOf(']');
          if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
            const treatmentsText = line.substring(startIdx + 1, endIdx);
            const parts = treatmentsText.split(',').map(p => p.trim());
            parts.forEach(part => {
              const cleanPart = part.replace(/\s*\[(Dental|Rayos X)\]\s*$/i, '').trim();
              const found = treatmentOptions.find(opt => opt.name.toLowerCase() === cleanPart.toLowerCase());
              if (found) {
                if (!state.treatments.includes(found.id)) {
                  state.treatments.push(found.id);
                }
              }
            });
          }
        }
      });
    }

    setChartState(newChartState);
    setActiveTab(parsedTab);
  }, [initialDentalDiagnosis, initialTreatmentNeeded, treatmentOptions, initialType]);

  // Mass selection states
  const [massSelectionType, setMassSelectionType] = useState<'upper' | 'lower' | 'full' | null>(null);
  const [massSelectedCategory, setMassSelectedCategory] = useState<string | null>(null);

  // Tour states
  const [showTour, setShowTour] = useState(false);
  const [tourStep, setTourStep] = useState(0);

  // Load dynamic active aranceles from the database db_casos
  useEffect(() => {
    async function loadDynamicPrestaciones() {
      try {
        const res = await getOdontogramPrestacionesAction();
        if (res.success && res.data) {
          if (res.data.length > 0) {
            const mapped: TreatmentOption[] = res.data.map(item => ({
              id: item.id.toString(),
              id_prestacion: item.id_prestacion,
              name: item.name,
              category: item.category,
              color: getCategoryColor(item.category)
            }));
            setTreatmentOptions(mapped);

            // Get unique categories list
            const uniqueCats = Array.from(new Set(res.data.map(item => item.category)));
            setCategories(uniqueCats);
          } else {
            // Explicitly set empty to trigger warning panel if all categories are deactivated
            setTreatmentOptions([]);
            setCategories([]);
          }
        }
      } catch (err) {
        console.error("Failed to load prestaciones:", err);
      }
    }
    loadDynamicPrestaciones();
  }, []);

  // Mass operations application logic
  const handleApplyMassTreatment = (treatmentId: string) => {
    if (!massSelectionType) return;
    
    // Instead of entering the treatment piece by piece, assign it to a single pseudo-ID representing the complete arch
    let pseudoId = 0;
    if (massSelectionType === 'upper') pseudoId = 101;
    else if (massSelectionType === 'lower') pseudoId = 102;
    else pseudoId = 103;

    setChartState(prev => {
      const next = { ...prev };
      const current = next[pseudoId] || {
        faces: { V: false, O: false, M: false, D: false, L: false },
        treatments: []
      };
      // Add treatment if not already assigned
      if (!current.treatments.includes(treatmentId)) {
        next[pseudoId] = {
          ...current,
          treatments: [...current.treatments, treatmentId]
        };
      }
      return next;
    });

    setMassSelectionType(null); // Close modal
    setMassSelectedCategory(null);
  };

  const selectToothAndScroll = (id: number, e?: React.MouseEvent) => {
    const isCtrlPressed = e ? (e.ctrlKey || e.metaKey) : false;

    if (isMultiSelectMode || isCtrlPressed) {
      if (!isMultiSelectMode) {
        setIsMultiSelectMode(true);
      }
      setMultiSelectedTeeth((prev) => {
        if (prev.includes(id)) {
          return prev.filter((tid) => tid !== id);
        } else {
          return [...prev, id];
        }
      });
    } else {
      setSelectedTooth(id);
    }
  };

  const handleApplyMultiTreatment = () => {
    if (!selectedMultiTreatment || multiSelectedTeeth.length === 0) return;

    setChartState((prev) => {
      const next = { ...prev };
      multiSelectedTeeth.forEach((id) => {
        const current = next[id] || {
          faces: { V: false, O: false, M: false, D: false, L: false },
          treatments: []
        };
        if (!current.treatments.includes(selectedMultiTreatment)) {
          next[id] = {
            ...current,
            treatments: [...current.treatments, selectedMultiTreatment]
          };
        }
      });
      return next;
    });

    // Reset state
    setMultiSelectedTeeth([]);
    setSelectedMultiTreatment(null);
    setIsMultiSelectMode(false);
  };

  const handleCancelMultiSelect = () => {
    setMultiSelectedTeeth([]);
    setSelectedMultiTreatment(null);
    setIsMultiSelectMode(false);
  };

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const resetTourStepState = (step: number) => {
    if (step === 0) {
      setSelectedTooth(null);
      setIsMultiSelectMode(false);
      // Pre-populate with initial mock data so summary table renders immediately
      setChartState({
        18: {
          faces: { V: true, O: false, M: false, D: false, L: false },
          treatments: ['obturacion_simple']
        }
      });
    } else if (step === 1 || step === 2) {
      setSelectedTooth(18);
      setIsMultiSelectMode(false);
      setChartState({
        18: {
          faces: { V: true, O: false, M: false, D: false, L: false },
          treatments: ['obturacion_simple']
        }
      });
    } else if (step === 3) {
      setSelectedTooth(null);
      setIsMultiSelectMode(false);
      // Pre-populate upper arch mass action mock data
      setChartState({
        18: {
          faces: { V: true, O: false, M: false, D: false, L: false },
          treatments: ['obturacion_simple']
        },
        101: {
          faces: { V: false, O: false, M: false, D: false, L: false },
          treatments: ['limpieza']
        }
      });
    } else if (step === 4) {
      setSelectedTooth(null);
      setIsMultiSelectMode(true);
      setChartState({
        18: {
          faces: { V: true, O: false, M: false, D: false, L: false },
          treatments: ['obturacion_simple']
        },
        101: {
          faces: { V: false, O: false, M: false, D: false, L: false },
          treatments: ['limpieza']
        }
      });
    } else if (step === 5) {
      setSelectedTooth(null);
      setIsMultiSelectMode(false);
      // Ensure both tooth 18 and upper arch are in the summary table for final step
      setChartState({
        18: {
          faces: { V: true, O: false, M: false, D: false, L: false },
          treatments: ['obturacion_simple']
        },
        101: {
          faces: { V: false, O: false, M: false, D: false, L: false },
          treatments: ['limpieza']
        }
      });
    }
  };

  // Tour step synchronizer to make the walkthrough interactive
  useEffect(() => {
    if (showTour) {
      resetTourStepState(tourStep);
    } else {
      // Reset modes when tour is closed
      if (tourStep === 4 || tourStep === 5) {
        setIsMultiSelectMode(false);
      }
    }
  }, [showTour, tourStep]);

  const closeTourAndClear = () => {
    setShowTour(false);
    setChartState({});
    setSelectedTooth(null);
    setIsMultiSelectMode(false);
    setMultiSelectedTeeth([]);
    setSelectedMultiTreatment(null);
  };

  const renderTourBubble = (stepNumber: number) => {
    if (!showTour || tourStep !== stepNumber) return null;

    const stepsData = [
      {
        title: "Selección de Piezas",
        desc: "Haz clic sobre cualquier pieza dental en el odontograma para ver sus caras y poder asignarle diagnósticos o prestaciones específicas.",
        icon: <MousePointerClick size={20} />
      },
      {
        title: "Diagnóstico por Caras",
        desc: "Haz clic en las caras clínicas del diente (Vestibular, Oclusal, Mesial, Distal, Lingual) o marca un estado global (Ausente, Implante, Corona).",
        icon: <Paintbrush size={20} />
      },
      {
        title: "Asignación de Prestaciones",
        desc: "Busca prestaciones arancelarias por nombre o categoría, y márcalas para asignarlas inmediatamente a la pieza seleccionada.",
        icon: <Stethoscope size={20} />
      },
      {
        title: "Acciones en Masa",
        desc: "Usa estos accesos rápidos para aplicar el tratamiento elegido a toda la arcada superior, inferior o a la boca completa en un clic.",
        icon: <Zap size={20} />
      },
      {
        title: "Selección Múltiple",
        desc: "Activa este modo para seleccionar múltiples piezas simultáneamente y aplicarles el mismo tratamiento en lote.",
        icon: <CheckSquare size={20} />
      },
      {
        title: "Resumen de Prestaciones",
        desc: "Visualiza el desglose completo de tratamientos y diagnósticos asignados en la tabla de resumen al final de la página antes de comenzar.",
        icon: <FileText size={20} />
      }
    ];

    const step = stepsData[stepNumber];

    const isLastStep = stepNumber === 5;

    return createPortal(
      <div 
        className="glass-panel animate-fade-in"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          padding: '24px',
          background: 'linear-gradient(135deg, rgba(251, 146, 60, 0.05) 0%, rgba(59, 130, 246, 0.03) 100%), hsl(var(--card-hsl))',
          borderWidth: '1.5px 1.5px 1.5px 6px',
          borderStyle: 'solid',
          borderColor: isLastStep ? 'hsl(var(--card-border-hsl)) hsl(var(--card-border-hsl)) hsl(var(--card-border-hsl)) #10b981' : 'hsl(var(--card-border-hsl)) hsl(var(--card-border-hsl)) hsl(var(--card-border-hsl)) #fb923c',
          borderRadius: '16px',
          boxShadow: isLastStep ? '0 16px 40px -10px rgba(16, 185, 129, 0.25), var(--shadow-lg)' : '0 16px 40px -10px rgba(251, 146, 60, 0.25), var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          width: '380px',
          maxWidth: '90vw',
          zIndex: 999999, // Above the active tooth editor modal (99999)
          textAlign: 'left'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span style={{ color: isLastStep ? '#10b981' : '#fb923c', display: 'flex', alignItems: 'center' }}>{step.icon}</span>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: isLastStep ? '#10b981' : '#fb923c', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Guía Rápida • Paso {stepNumber + 1} de 6
            </span>
            <h5 style={{ fontSize: '0.94rem', fontWeight: 800, margin: '2px 0 0 0', color: 'hsl(var(--foreground-hsl))' }}>
              {step.title}
            </h5>
          </div>
          <button 
            type="button" 
            onClick={(e) => { e.stopPropagation(); closeTourAndClear(); }}
            style={{ 
              background: 'rgba(255, 255, 255, 0.15)', 
              border: 'none', 
              borderRadius: '50%',
              width: '28px',
              height: '28px',
              cursor: 'pointer', 
              color: '#ffffff', 
              display: 'flex', 
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
              padding: 0
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.25)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'}
          >
            <X size={16} style={{ strokeWidth: 3, color: '#ffffff' }} />
          </button>
        </div>
        <p style={{ fontSize: '0.82rem', lineHeight: '1.5', margin: 0, color: 'hsla(var(--foreground-hsl) / 0.85)', fontWeight: 500 }}>
          {step.desc}
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setTourStep(prev => Math.max(0, prev - 1)); }}
            disabled={stepNumber === 0}
            className="odont-option-btn"
            style={{ 
              padding: '6px 14px', 
              fontSize: '0.78rem', 
              borderRadius: '8px', 
              opacity: stepNumber === 0 ? 0.4 : 1, 
              margin: 0, 
              cursor: stepNumber === 0 ? 'not-allowed' : 'pointer',
              fontWeight: 700
            }}
          >
            Atrás
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); if (stepNumber < 5) setTourStep(prev => prev + 1); else closeTourAndClear(); }}
            className="odont-option-btn"
            style={{ 
              padding: '6px 16px', 
              fontSize: '0.78rem', 
              borderRadius: '8px', 
              backgroundColor: isLastStep ? '#10b981' : '#fb923c', 
              color: '#ffffff', 
              border: isLastStep ? '1px solid #10b981' : '1px solid #fb923c', 
              margin: 0, 
              fontWeight: 800,
              boxShadow: isLastStep ? '0 4px 12px rgba(16, 185, 129, 0.2)' : 'none'
            }}
          >
            {isLastStep ? 'Iniciar' : 'Siguiente'}
          </button>
        </div>
      </div>,
      document.body
    );
  };

  // Reset category and search term on tooth select
  useEffect(() => {
    if (selectedTooth) {
      setSelectedCategory(null);
      setSearchTerm('');
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

    let dentalCount = 0;
    let xrayCount = 0;

    // Compile pseudo-IDs (arches or whole mouth) first to keep it elegant and structured
    const pseudoIds = [101, 102, 103];
    pseudoIds.forEach((id) => {
      const state = chartState[id];
      if (state) {
        let name = '';
        if (id === 101) name = 'Arcada Superior Completa';
        else if (id === 102) name = 'Arcada Inferior Completa';
        else name = 'Boca Completa';

        diagnosisList.push(`${name}: Diagnóstico/Estado general`);

        if (state.treatments.length > 0) {
          const treatmentNames = state.treatments.map((tid) => {
            const opt = treatmentOptions.find((o) => o.id === tid);
            if (opt) {
              const typeLabel = opt.category === 'Radiología' ? 'Rayos X' : 'Dental';
              if (opt.category === 'Radiología') {
                xrayCount++;
              } else {
                dentalCount++;
              }
              return `${opt.name} [${typeLabel}]`;
            }
            return tid;
          });
          treatmentList.push(`${name}: Realizar [${treatmentNames.join(', ')}]`);
        }
      }
    });

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
        if (state.condition === 'ausente') toothCond = ' (Ausente)';
        if (state.condition === 'perdida') toothCond = ' (Pérdida)';
        if (state.condition === 'implante') toothCond = ' (Implante)';
        if (state.condition === 'corona_existente') toothCond = ' (Corona Previa)';
        if (state.condition === 'cariada') toothCond = ' (Cariada)';
        if (state.condition === 'obturada') toothCond = ' (Obturada)';
        if (state.condition === 'fracturada') toothCond = ' (Fracturada)';
        if (state.condition === 'provisional') toothCond = ' (Provisional)';
        if (state.condition === 'sano') toothCond = ' (Sana)';

        // 1. Diagnosis
        if (activeFaces.length > 0 || state.condition) {
          const facesStr = activeFaces.length > 0 ? `Caras: ${activeFaces.join(', ')}` : 'Pieza Completa';
          diagnosisList.push(`Pieza ${tooth.id}${toothCond}: ${facesStr}`);
        }

        // 2. Treatments needed
        if (state.treatments.length > 0) {
          const treatmentNames = state.treatments.map((tid) => {
            const opt = treatmentOptions.find((o) => o.id === tid);
            if (opt) {
              const typeLabel = opt.category === 'Radiología' ? 'Rayos X' : 'Dental';
              if (opt.category === 'Radiología') {
                xrayCount++;
              } else {
                dentalCount++;
              }
              return `${opt.name} [${typeLabel}]`;
            }
            return tid;
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

    const allSelectedTreatmentIds: string[] = [];
    Object.entries(chartState).forEach(([id, state]) => {
      if (state.treatments && state.treatments.length > 0) {
        state.treatments.forEach(tid => {
          allSelectedTreatmentIds.push(tid);
        });
      }
    });

    onChange({
      dentalDiagnosis: fullDiagnosis || 'Sin patologías o piezas ingresadas en odontograma interactivo.',
      treatmentNeeded: fullTreatments || 'Sin prestaciones asignadas en odontograma.',
      description: generalObservations,
      selectedTreatmentIds: allSelectedTreatmentIds.join(','),
      dentalCount,
      xrayCount
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
    const isMultiSelected = multiSelectedTeeth.includes(id);

    let color = 'hsla(var(--foreground-hsl) / 0.16)';
    if (isFocused) color = 'hsl(var(--primary-hsl))';
    else if (isMultiSelected) color = 'hsl(var(--accent-hsl))';
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
        onClick={(e) => selectToothAndScroll(id, e)}
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
    const isMultiSelected = multiSelectedTeeth.includes(id);

    // Highlight modified tooth
    let strokeColor = 'var(--glass-border)';
    if (isFocused) strokeColor = 'hsl(var(--primary-hsl))';
    else if (isMultiSelected) strokeColor = 'hsl(var(--accent-hsl))';
    else if (isToothModified(id)) strokeColor = 'hsl(var(--accent-hsl))';

    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        onClick={(e) => {
          if (!interactive) return;
          e.stopPropagation();
          selectToothAndScroll(id, e);
        }}
        className={interactive ? "odont-circle-svg" : ""}
        style={{
          cursor: interactive ? 'pointer' : 'default',
          filter: 'none',
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
          fill={isFocused && hoveredFace === 'O' ? 'rgba(20, 184, 166, 0.65)' : ((state.condition === 'ausente' || state.condition === 'perdida') ? 'rgba(239, 68, 68, 0.18)' : (state.faces.O ? (state.condition === 'cariada' ? 'rgba(244, 63, 94, 0.6)' : state.condition === 'obturada' ? 'rgba(59, 130, 246, 0.6)' : 'rgba(20, 184, 166, 0.38)') : 'hsla(var(--foreground-hsl) / 0.03)'))}
          stroke={isFocused && hoveredFace === 'O' ? '#14b8a6' : "hsla(var(--foreground-hsl) / 0.08)"}
          strokeWidth={isFocused && hoveredFace === 'O' ? "1.5" : "0.8"}
          onClick={(e) => {
            if (!interactive) return;
            e.stopPropagation();
            if (isMultiSelectMode || e.ctrlKey || e.metaKey) {
              selectToothAndScroll(id, e);
            } else {
              selectToothAndScroll(id, e);
              toggleFace(id, 'O');
            }
          }}
        />

        {/* Top: Vestibular (V) */}
        <path
          d="M 15 15 L 5 5 A 21 21 0 0 1 35 5 L 25 15 A 7 7 0 0 0 15 15 Z"
          className={interactive ? "odont-face-sector" : ""}
          fill={isFocused && hoveredFace === 'V' ? 'rgba(20, 184, 166, 0.65)' : ((state.condition === 'ausente' || state.condition === 'perdida') ? 'rgba(239, 68, 68, 0.12)' : (state.faces.V ? (state.condition === 'cariada' ? 'rgba(244, 63, 94, 0.6)' : state.condition === 'obturada' ? 'rgba(59, 130, 246, 0.6)' : 'rgba(20, 184, 166, 0.38)') : 'hsla(var(--foreground-hsl) / 0.015)'))}
          stroke={isFocused && hoveredFace === 'V' ? '#14b8a6' : "hsla(var(--foreground-hsl) / 0.08)"}
          strokeWidth={isFocused && hoveredFace === 'V' ? "1.5" : "0.8"}
          onClick={(e) => {
            if (!interactive) return;
            e.stopPropagation();
            if (isMultiSelectMode || e.ctrlKey || e.metaKey) {
              selectToothAndScroll(id, e);
            } else {
              selectToothAndScroll(id, e);
              toggleFace(id, 'V');
            }
          }}
        />

        {/* Bottom: Lingual / Palatina (L) */}
        <path
          d="M 15 25 L 5 35 A 21 21 0 0 0 35 35 L 25 25 A 7 7 0 0 1 15 25 Z"
          className={interactive ? "odont-face-sector" : ""}
          fill={isFocused && hoveredFace === 'L' ? 'rgba(20, 184, 166, 0.65)' : ((state.condition === 'ausente' || state.condition === 'perdida') ? 'rgba(239, 68, 68, 0.12)' : (state.faces.L ? (state.condition === 'cariada' ? 'rgba(244, 63, 94, 0.6)' : state.condition === 'obturada' ? 'rgba(59, 130, 246, 0.6)' : 'rgba(20, 184, 166, 0.38)') : 'hsla(var(--foreground-hsl) / 0.015)'))}
          stroke={isFocused && hoveredFace === 'L' ? '#14b8a6' : "hsla(var(--foreground-hsl) / 0.08)"}
          strokeWidth={isFocused && hoveredFace === 'L' ? "1.5" : "0.8"}
          onClick={(e) => {
            if (!interactive) return;
            e.stopPropagation();
            if (isMultiSelectMode || e.ctrlKey || e.metaKey) {
              selectToothAndScroll(id, e);
            } else {
              selectToothAndScroll(id, e);
              toggleFace(id, 'L');
            }
          }}
        />

        {/* Left: Mesial (M) */}
        <path
          d="M 15 15 L 5 5 A 21 21 0 0 0 5 35 L 15 25 A 7 7 0 0 1 15 15 Z"
          className={interactive ? "odont-face-sector" : ""}
          fill={isFocused && hoveredFace === 'M' ? 'rgba(20, 184, 166, 0.65)' : ((state.condition === 'ausente' || state.condition === 'perdida') ? 'rgba(239, 68, 68, 0.12)' : (state.faces.M ? (state.condition === 'cariada' ? 'rgba(244, 63, 94, 0.6)' : state.condition === 'obturada' ? 'rgba(59, 130, 246, 0.6)' : 'rgba(20, 184, 166, 0.38)') : 'hsla(var(--foreground-hsl) / 0.015)'))}
          stroke={isFocused && hoveredFace === 'M' ? '#14b8a6' : "hsla(var(--foreground-hsl) / 0.08)"}
          strokeWidth={isFocused && hoveredFace === 'M' ? "1.5" : "0.8"}
          onClick={(e) => {
            if (!interactive) return;
            e.stopPropagation();
            if (isMultiSelectMode || e.ctrlKey || e.metaKey) {
              selectToothAndScroll(id, e);
            } else {
              selectToothAndScroll(id, e);
              toggleFace(id, 'M');
            }
          }}
        />

        {/* Right: Distal (D) */}
        <path
          d="M 25 15 L 35 5 A 21 21 0 0 1 35 35 L 25 25 A 7 7 0 0 0 25 15 Z"
          className={interactive ? "odont-face-sector" : ""}
          fill={isFocused && hoveredFace === 'D' ? 'rgba(20, 184, 166, 0.65)' : ((state.condition === 'ausente' || state.condition === 'perdida') ? 'rgba(239, 68, 68, 0.12)' : (state.faces.D ? (state.condition === 'cariada' ? 'rgba(244, 63, 94, 0.6)' : state.condition === 'obturada' ? 'rgba(59, 130, 246, 0.6)' : 'rgba(20, 184, 166, 0.38)') : 'hsla(var(--foreground-hsl) / 0.015)'))}
          stroke={isFocused && hoveredFace === 'D' ? '#14b8a6' : "hsla(var(--foreground-hsl) / 0.08)"}
          strokeWidth={isFocused && hoveredFace === 'D' ? "1.5" : "0.8"}
          onClick={(e) => {
            if (!interactive) return;
            e.stopPropagation();
            if (isMultiSelectMode || e.ctrlKey || e.metaKey) {
              selectToothAndScroll(id, e);
            } else {
              selectToothAndScroll(id, e);
              toggleFace(id, 'D');
            }
          }}
        />

        {/* Outer Circular Border overlay */}
        <circle cx="20" cy="20" r="21" fill="none" stroke={strokeColor} strokeWidth={isFocused ? 2.2 : 1.2} style={{ pointerEvents: 'none' }} />

        {/* Special markers */}
        {state.condition === 'ausente' && (
          <path d="M 4 4 L 36 36 M 36 4 L 4 36" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" pointerEvents="none" />
        )}
        {state.condition === 'perdida' && (
          <path d="M 4 4 L 36 36 M 36 4 L 4 36" stroke="#ef4444" strokeWidth="2" strokeDasharray="3 3" strokeLinecap="round" pointerEvents="none" />
        )}
        {state.condition === 'implante' && (
          <circle cx="20" cy="20" r="5" fill="#f59e0b" stroke="#ffffff" strokeWidth="1" pointerEvents="none" />
        )}
        {state.condition === 'corona_existente' && (
          <rect x="10" y="10" width="20" height="20" rx="3" fill="none" stroke="#a855f7" strokeWidth="1.8" pointerEvents="none" />
        )}
        {state.condition === 'cariada' && (
          <circle cx="20" cy="20" r="4.5" fill="#f43f5e" stroke="#ffffff" strokeWidth="1" pointerEvents="none" />
        )}
        {state.condition === 'obturada' && (
          <circle cx="20" cy="20" r="4.5" fill="#3b82f6" stroke="#ffffff" strokeWidth="1" pointerEvents="none" />
        )}
        {state.condition === 'fracturada' && (
          <path d="M 12 20 L 18 16 L 22 24 L 28 20" fill="none" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" pointerEvents="none" />
        )}
        {state.condition === 'provisional' && (
          <circle cx="20" cy="20" r="16" fill="none" stroke="#06b6d4" strokeWidth="1.5" strokeDasharray="3 3" pointerEvents="none" />
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
    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', padding: '24px', border: '1.5px solid hsl(var(--card-border-hsl))' }}>

      {/* Visual Header / Tab Switcher */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px',
        gap: '8px'
      }}>
        <span style={{ 
          fontSize: '0.82rem', 
          fontWeight: 700, 
          opacity: 0.8, 
          textTransform: 'uppercase', 
          letterSpacing: '0.04em', 
          paddingLeft: '12px', 
          color: 'hsla(var(--foreground-hsl) / 0.8)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Activity size={16} style={{ color: 'hsl(var(--primary-hsl))', strokeWidth: 2.5 }} />
          Odontograma digital
        </span>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="odont-option-btn animate-glow-orange"
            style={{
              padding: '6px 14px',
              fontSize: '0.8rem',
              borderRadius: '8px',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(251, 146, 60, 0.08)',
              color: '#fb923c',
              border: '1px solid rgba(251, 146, 60, 0.25)',
              margin: 0
            }}
            onClick={() => {
              setShowTour(true);
              setTourStep(0);
            }}
          >
            <HelpCircle size={13} /> Guía Rápida
          </button>

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
      <div style={{
        padding: '10px 0 0 0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '28px',
        position: 'relative',
        overflowX: 'auto',
        width: '100%'
      }}>

        {treatmentOptions.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '60px 40px',
            maxWidth: '680px',
            width: '100%',
            marginTop: '20px',
            gap: '18px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
              border: '1.5px solid rgba(239, 68, 68, 0.3)',
              boxShadow: '0 0 20px rgba(239, 68, 68, 0.1)',
              animation: 'pulse 2s infinite'
            }}>
              <XCircle size={32} style={{ color: 'hsl(var(--danger-hsl))' }} />
            </div>
            
            <h3 style={{
              fontSize: '1.2rem',
              fontWeight: 800,
              color: 'var(--foreground-hsl)',
              margin: 0,
              letterSpacing: '-0.02em'
            }}>
              No se encuentran prestaciones disponibles para cargar
            </h3>
            
            <p style={{
              fontSize: '0.9rem',
              lineHeight: '1.6',
              opacity: 0.85,
              color: 'hsla(var(--foreground-hsl) / 0.85)',
              fontWeight: 500,
              margin: 0
            }}>
              Por favor, contactarse con su encargado más cercano, o escríbanos directamente a{' '}
              <a 
                href="mailto:soporte@policlinicotabancura.cl" 
                style={{ 
                  color: 'hsl(var(--primary-hsl))', 
                  fontWeight: 700, 
                  textDecoration: 'underline',
                  transition: 'opacity 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              >
                soporte@policlinicotabancura.cl
              </a>{' '}
              o{' '}
              <a 
                href="mailto:derivaciones@policlinicotabancura.cl" 
                style={{ 
                  color: 'hsl(var(--primary-hsl))', 
                  fontWeight: 700, 
                  textDecoration: 'underline',
                  transition: 'opacity 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              >
                derivaciones@policlinicotabancura.cl
              </a>.
            </p>
          </div>
        ) : (
          <>
            {/* Main layout container splitting sidebar buttons and teeth chart */}
            <div style={{
              display: 'flex',
              flexDirection: 'row',
              gap: '40px',
              width: 'max-content',
              minWidth: '100%',
              alignItems: 'center',
              justifyContent: 'center',
              flexWrap: 'nowrap',
              marginTop: '10px',
              padding: '0 10px'
            }}>

          {/* Left Operations Panel */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            justifyContent: 'center',
            borderRight: '1.5px solid var(--glass-border)',
            minWidth: '270px',
            flexShrink: 0,
            // Tour Step 3 Highlight
            border: (showTour && tourStep === 3) ? '2.5px solid #fb923c' : '2.5px solid transparent',
            borderRadius: '16px',
            paddingTop: (showTour && tourStep === 3) ? '16px' : '0px',
            paddingRight: (showTour && (tourStep === 3 || tourStep === 4)) ? '16px' : '32px',
            paddingBottom: (showTour && tourStep === 3) ? '16px' : '0px',
            paddingLeft: (showTour && tourStep === 3) ? '16px' : '0px',
            backgroundColor: (showTour && tourStep === 3) ? 'rgba(251, 146, 60, 0.04)' : 'transparent',
            boxShadow: (showTour && tourStep === 3) ? '0 0 25px rgba(251, 146, 60, 0.15)' : 'none',
            transition: 'all 0.3s ease',
            position: 'relative'
          }}>
            <div style={{
              fontSize: '0.74rem',
              fontWeight: 800,
              opacity: 0.65,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: '6px',
              color: 'hsla(var(--foreground-hsl) / 0.85)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><path d="m9 12 2 2 4-4" /></svg>
              Selecciona 2 o más piezas
            </div>

            {/* Arcada Superior Button */}
            <button
              type="button"
              className="odont-option-btn animate-fade-in"
              onMouseEnter={() => setHoveredBtn('upper')}
              onMouseLeave={() => setHoveredBtn(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: '12px',
                padding: '12px 18px',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '0.82rem',
                backgroundColor: hoveredBtn === 'upper' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.05)',
                color: '#10b981',
                border: hoveredBtn === 'upper' ? '1.5px solid rgba(16, 185, 129, 0.45)' : '1.5px solid rgba(16, 185, 129, 0.20)',
                boxShadow: hoveredBtn === 'upper' ? '0 6px 20px -4px rgba(16, 185, 129, 0.18)' : 'none',
                transform: hoveredBtn === 'upper' ? 'translateY(-2px)' : 'none',
                cursor: 'pointer',
                width: '100%',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                margin: 0
              }}
              onClick={() => setMassSelectionType('upper')}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                backgroundColor: hoveredBtn === 'upper' ? 'rgba(16, 185, 129, 0.20)' : 'rgba(16, 185, 129, 0.12)',
                flexShrink: 0,
                transition: 'all 0.2s ease'
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>
              </div>
              <span style={{ whiteSpace: 'nowrap' }}>Arcada Superior</span>
            </button>

            {/* Arcada Inferior Button */}
            <button
              type="button"
              className="odont-option-btn animate-fade-in"
              onMouseEnter={() => setHoveredBtn('lower')}
              onMouseLeave={() => setHoveredBtn(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: '12px',
                padding: '12px 18px',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '0.82rem',
                backgroundColor: hoveredBtn === 'lower' ? 'rgba(59, 130, 246, 0.12)' : 'rgba(59, 130, 246, 0.05)',
                color: '#3b82f6',
                border: hoveredBtn === 'lower' ? '1.5px solid rgba(59, 130, 246, 0.45)' : '1.5px solid rgba(59, 130, 246, 0.20)',
                boxShadow: hoveredBtn === 'lower' ? '0 6px 20px -4px rgba(59, 130, 246, 0.18)' : 'none',
                transform: hoveredBtn === 'lower' ? 'translateY(-2px)' : 'none',
                cursor: 'pointer',
                width: '100%',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                margin: 0
              }}
              onClick={() => setMassSelectionType('lower')}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                backgroundColor: hoveredBtn === 'lower' ? 'rgba(59, 130, 246, 0.20)' : 'rgba(59, 130, 246, 0.12)',
                flexShrink: 0,
                transition: 'all 0.2s ease'
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>
              </div>
              <span style={{ whiteSpace: 'nowrap' }}>Arcada Inferior</span>
            </button>

            {/* Toda la Boca Button */}
            <button
              type="button"
              className="odont-option-btn animate-fade-in"
              onMouseEnter={() => setHoveredBtn('full')}
              onMouseLeave={() => setHoveredBtn(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: '12px',
                padding: '12px 18px',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '0.82rem',
                backgroundColor: hoveredBtn === 'full' ? 'rgba(168, 85, 247, 0.12)' : 'rgba(168, 85, 247, 0.05)',
                color: '#a855f7',
                border: hoveredBtn === 'full' ? '1.5px solid rgba(168, 85, 247, 0.45)' : '1.5px solid rgba(168, 85, 247, 0.20)',
                boxShadow: hoveredBtn === 'full' ? '0 6px 20px -4px rgba(168, 85, 247, 0.18)' : 'none',
                transform: hoveredBtn === 'full' ? 'translateY(-2px)' : 'none',
                cursor: 'pointer',
                width: '100%',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                margin: 0
              }}
              onClick={() => setMassSelectionType('full')}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                backgroundColor: hoveredBtn === 'full' ? 'rgba(168, 85, 247, 0.20)' : 'rgba(168, 85, 247, 0.12)',
                flexShrink: 0,
                transition: 'all 0.2s ease'
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M4 8.5C4 6 6 4 12 4c6 0 8 2 8 4.5 0 3.5-3 5-3 8.5 0 1.5 1 2 1 2s-1.5 1-4 1c-1.5 0-2-.5-2-.5s-.5.5-2 .5c-2.5 0-4-1-4-1s1-.5 1-2c0-3.5-3-5-3-8.5Z"/></svg>
              </div>
              <span style={{ whiteSpace: 'nowrap' }}>Toda la Boca</span>
            </button>

            {/* Selección Múltiple Toggle Button */}
            <button
              type="button"
              className="odont-option-btn animate-fade-in"
              onMouseEnter={() => setHoveredBtn('multiselect')}
              onMouseLeave={() => setHoveredBtn(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: '12px',
                padding: '12px 18px',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '0.82rem',
                backgroundColor: isMultiSelectMode 
                  ? 'rgba(20, 184, 166, 0.15)' 
                  : (hoveredBtn === 'multiselect' ? 'rgba(120, 120, 120, 0.12)' : 'rgba(120, 120, 120, 0.05)'),
                color: isMultiSelectMode ? '#14b8a6' : 'hsla(var(--foreground-hsl) / 0.85)',
                border: (showTour && tourStep === 4) 
                  ? '2px solid #fb923c' 
                  : (isMultiSelectMode ? '1.5px solid #14b8a6' : (hoveredBtn === 'multiselect' ? '1.5px solid rgba(120, 120, 120, 0.4)' : '1.5px solid rgba(120, 120, 120, 0.18)')),
                boxShadow: (showTour && tourStep === 4) 
                  ? '0 0 20px rgba(251, 146, 60, 0.25)' 
                  : (isMultiSelectMode ? '0 6px 20px -4px rgba(20, 184, 166, 0.22)' : 'none'),
                transform: hoveredBtn === 'multiselect' ? 'translateY(-2px)' : 'none',
                cursor: 'pointer',
                width: '100%',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                margin: 0
              }}
              onClick={() => {
                setIsMultiSelectMode(!isMultiSelectMode);
                if (isMultiSelectMode) {
                  setMultiSelectedTeeth([]);
                  setSelectedMultiTreatment(null);
                }
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                backgroundColor: isMultiSelectMode ? 'rgba(20, 184, 166, 0.25)' : 'rgba(120, 120, 120, 0.12)',
                flexShrink: 0,
                transition: 'all 0.2s ease'
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><polyline points="9 11 12 14 22 4"></polyline></svg>
              </div>
              <span style={{ whiteSpace: 'nowrap' }}>Selección Múltiple</span>
              {isMultiSelectMode && (
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#14b8a6',
                  marginLeft: 'auto',
                  display: 'inline-block',
                  boxShadow: '0 0 8px #14b8a6',
                  animation: 'pulse 1.5s infinite'
                }} />
              )}
            </button>

          </div>
 
          {/* Right Anatomical Jaws Rows Panel */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '28px',
            minWidth: activeTab === 'child' ? '450px' : '600px',
            maxWidth: activeTab === 'child' ? '540px' : '820px',
            width: '100%',
            alignItems: 'center',
            paddingLeft: '20px',
            flex: 1,
            // Tour Step 0 Highlight
            border: (showTour && tourStep === 0) ? '2.5px solid #fb923c' : '2.5px dashed transparent',
            borderRadius: '16px',
            padding: '16px 16px 16px 20px',
            boxShadow: (showTour && tourStep === 0) ? '0 0 25px rgba(251, 146, 60, 0.25)' : 'none',
            transition: 'all 0.3s ease'
          }}>
 
            {/* MAXILAR SUPERIOR (Upper Jaw) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                borderBottom: '2.5px solid hsla(var(--primary-hsl) / 0.15)',
                paddingBottom: '8px',
                marginBottom: '6px',
                gap: '6px'
              }}>
                <div style={{
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  color: 'hsla(var(--foreground-hsl) / 0.95)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                }}>
                  Maxilar Superior (Arcada Superior)
                </div>
                {chartState[101] && chartState[101].treatments.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', justifyContent: 'center' }}>
                    {chartState[101].treatments.map(tid => {
                      const opt = treatmentOptions.find(o => o.id === tid);
                      return (
                        <span key={tid} style={{
                          fontSize: '0.7rem',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          backgroundColor: opt ? `${opt.color}1c` : 'rgba(255,255,255,0.06)',
                          color: opt ? opt.color : 'var(--foreground-hsl)',
                          border: '1px solid',
                          borderColor: opt ? `${opt.color}44` : 'rgba(255,255,255,0.1)',
                          fontWeight: 700,
                          textTransform: 'none'
                        }}>
                          Arcada Superior: {opt ? (opt.id_prestacion ? `[ID: ${opt.id_prestacion}] ${opt.name.split(' (')[0]}` : opt.name.split(' (')[0]) : tid}
                        </span>
                      );
                    })}
                  </div>
                )}
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
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                borderTop: '2.5px solid hsla(var(--primary-hsl) / 0.15)',
                paddingTop: '10px',
                marginTop: '6px',
                gap: '6px'
              }}>
                {chartState[102] && chartState[102].treatments.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', justifyContent: 'center', marginBottom: '4px' }}>
                    {chartState[102].treatments.map(tid => {
                      const opt = treatmentOptions.find(o => o.id === tid);
                      return (
                        <span key={tid} style={{
                          fontSize: '0.7rem',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          backgroundColor: opt ? `${opt.color}1c` : 'rgba(255,255,255,0.06)',
                          color: opt ? opt.color : 'var(--foreground-hsl)',
                          border: '1px solid',
                          borderColor: opt ? `${opt.color}44` : 'rgba(255,255,255,0.1)',
                          fontWeight: 700,
                          textTransform: 'none'
                        }}>
                          Arcada Inferior: {opt ? (opt.id_prestacion ? `[ID: ${opt.id_prestacion}] ${opt.name.split(' (')[0]}` : opt.name.split(' (')[0]) : tid}
                        </span>
                      );
                    })}
                  </div>
                )}
                <div style={{
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  color: 'hsla(var(--foreground-hsl) / 0.95)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                }}>
                  Mandíbula Inferior (Arcada Inferior)
                </div>
              </div>
            </div>
 
          </div>
 
        </div>

        {/* Dynamic Multi-Select Action Panel at the bottom */}
        {isMultiSelectMode && (
          <div className="glass-panel animate-fade-in" style={{
            padding: '16px 24px',
            borderRadius: '16px',
            border: '1.5px solid var(--glass-border)',
            background: 'linear-gradient(135deg, rgba(20, 184, 166, 0.06) 0%, rgba(59, 130, 246, 0.03) 100%), hsla(var(--foreground-hsl) / 0.02)',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '24px',
            marginTop: '10px',
            width: '100%',
            boxShadow: '0 8px 32px -4px rgba(20, 184, 166, 0.08)',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: '1 1 auto', minWidth: '250px' }}>
              <div style={{ 
                fontSize: '0.8rem', 
                fontWeight: 800, 
                color: '#14b8a6', 
                textTransform: 'uppercase', 
                letterSpacing: '0.06em',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#14b8a6',
                  display: 'inline-block',
                  boxShadow: '0 0 8px #14b8a6',
                  animation: 'pulse 1.5s infinite'
                }} />
                Selección Múltiple Activa
              </div>
              <div style={{
                fontSize: '0.86rem',
                fontWeight: 700,
                color: 'var(--foreground-hsl)',
                opacity: 0.95
              }}>
                Piezas seleccionadas ({multiSelectedTeeth.length}): {multiSelectedTeeth.length > 0 ? (
                  <span style={{ color: '#14b8a6', fontWeight: 800 }}>{multiSelectedTeeth.sort((a,b)=>a-b).join(', ')}</span>
                ) : (
                  <span style={{ opacity: 0.6, fontStyle: 'italic', fontWeight: 500 }}>Ninguna pieza seleccionada. Haz clic en las piezas para seleccionarlas.</span>
                )}
              </div>
            </div>
            
            {multiSelectedTeeth.length > 0 ? (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '20px',
                flex: '1 1 auto',
                justifyContent: 'flex-end',
                flexWrap: 'wrap'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '280px' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, opacity: 0.7 }}>Asignar Prestación Masiva:</span>
                  <select
                    value={selectedMultiTreatment || ''}
                    onChange={(e) => setSelectedMultiTreatment(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1.5px solid var(--glass-border)',
                      backgroundColor: 'var(--card-hsl)',
                      color: 'var(--foreground-hsl)',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="" style={{ color: '#334155', backgroundColor: '#ffffff' }}>-- Seleccionar --</option>
                    {categories.map(cat => {
                      const catOpts = treatmentOptions.filter(opt => opt.category === cat);
                      if (catOpts.length === 0) return null;
                      return (
                        <optgroup key={cat} label={cat.toUpperCase()} style={{ fontWeight: 800, color: '#334155', backgroundColor: '#ffffff' }}>
                          {catOpts.map(opt => (
                            <option key={opt.id} value={opt.id} style={{ color: '#334155', backgroundColor: '#ffffff', fontWeight: 500 }}>
                              {opt.name}
                            </option>
                          ))}
                        </optgroup>
                      );
                    })}
                  </select>
                </div>
                
                <div style={{ display: 'flex', gap: '8px', alignSelf: 'flex-end' }}>
                  <button
                    type="button"
                    className="btn btn-accent"
                    disabled={!selectedMultiTreatment}
                    onClick={handleApplyMultiTreatment}
                    style={{
                      padding: '10px 20px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      borderRadius: '8px',
                      cursor: !selectedMultiTreatment ? 'not-allowed' : 'pointer',
                      opacity: !selectedMultiTreatment ? 0.6 : 1,
                      backgroundColor: '#14b8a6',
                      borderColor: '#14b8a6',
                      color: '#ffffff',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    Aplicar
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleCancelMultiSelect}
                    style={{
                      padding: '10px 20px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                    Limpiar
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: '0.82rem', opacity: 0.7, fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '8px', width: '100%', justifyContent: 'center', padding: '8px 0' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#14b8a6' }}><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                Haz clic en las piezas del odontograma para seleccionarlas.
              </div>
            )}
          </div>
        )}
          </>
        )}
 
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
                  gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
                  gap: '32px',
                  width: '95%',
                  maxWidth: '1080px',
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

                {/* Left Column: Tooth details, graphic selection diagram, special conditions, and faces selection buttons */}
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '20px',
                  border: (showTour && tourStep === 1) ? '2px solid #fb923c' : '2.5px solid transparent',
                  borderRadius: '16px',
                  padding: (showTour && tourStep === 1) ? '12px' : '0px',
                  backgroundColor: (showTour && tourStep === 1) ? 'rgba(251, 146, 60, 0.04)' : 'transparent',
                  boxShadow: (showTour && tourStep === 1) ? '0 0 25px rgba(251, 146, 60, 0.15)' : 'none',
                  transition: 'all 0.3s ease',
                  position: 'relative'
                }}>
                  {/* Tooth Header Information & Center Graphic */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '6px',
                      background: 'hsla(var(--foreground-hsl) / 0.03)',
                      padding: '12px 14px',
                      borderRadius: '14px',
                      border: '1.5px solid var(--glass-border)',
                      minWidth: '90px',
                      justifyContent: 'center',
                      boxShadow: 'var(--shadow-sm)'
                    }}>
                      {renderToothIcon(selectedTooth, activeToothInfo.type, selectedTooth <= (activeTab === 'adult' ? 16 : 10), 38)}
                      {renderCircularSelector(selectedTooth, true, 48)}
                    </div>
                    <div>
                      <h4 style={{ fontSize: '1.32rem', fontWeight: 800, margin: 0, color: 'var(--foreground-hsl)' }}>
                        {getToothName(activeToothInfo)}
                      </h4>
                      <p style={{ fontSize: '0.84rem', opacity: 0.85, margin: '4px 0 0 0', color: 'hsla(var(--foreground-hsl) / 0.8)', fontWeight: 500 }}>
                        Tipo: <span style={{ color: 'hsl(var(--primary-hsl))', fontWeight: 700 }}>{activeToothInfo.type === 'incisor' ? 'Incisivo' : activeToothInfo.type === 'canine' ? 'Canino' : activeToothInfo.type === 'premolar' ? 'Premolar' : 'Molar'}</span>
                      </p>
                      <p style={{ fontSize: '0.84rem', opacity: 0.85, margin: '2px 0 0 0', color: 'hsla(var(--foreground-hsl) / 0.8)', fontWeight: 500 }}>
                        Número: <span style={{ color: 'hsl(var(--primary-hsl))', fontWeight: 800 }}>{activeToothInfo.id}</span>
                      </p>
                    </div>
                  </div>

                  {/* Special Condition Buttons Group */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 800, opacity: 0.9, color: 'hsla(var(--foreground-hsl) / 0.85)', letterSpacing: '0.02em', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <HelpCircle size={14} style={{ color: 'hsl(var(--primary-hsl))' }} /> Estado o Condición Especial de la Pieza:
                    </span>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => setToothCondition(selectedTooth, 'sano')}
                        className={`odont-option-btn btn-sano ${(!activeToothState.condition || activeToothState.condition === 'sano') ? 'active' : ''}`}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
                      >
                        <Shield size={14} style={{ opacity: 0.9 }} /> Sana (Por defecto)
                      </button>
                      <button
                        type="button"
                        onClick={() => setToothCondition(selectedTooth, 'ausente')}
                        className={`odont-option-btn btn-ausente ${activeToothState.condition === 'ausente' ? 'active' : ''}`}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
                      >
                        <XCircle size={15} style={{ opacity: 0.9 }} /> Ausente
                      </button>
                      <button
                        type="button"
                        onClick={() => setToothCondition(selectedTooth, 'perdida')}
                        className={`odont-option-btn btn-perdida ${activeToothState.condition === 'perdida' ? 'active' : ''}`}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
                      >
                        <XCircle size={15} style={{ opacity: 0.9 }} /> Perdida
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
                        <Crown size={14} style={{ opacity: 0.9 }} /> Corona previa
                      </button>
                      <button
                        type="button"
                        onClick={() => setToothCondition(selectedTooth, 'cariada')}
                        className={`odont-option-btn btn-cariada ${activeToothState.condition === 'cariada' ? 'active' : ''}`}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
                      >
                        <Activity size={14} style={{ opacity: 0.9 }} /> Cariada
                      </button>
                      <button
                        type="button"
                        onClick={() => setToothCondition(selectedTooth, 'obturada')}
                        className={`odont-option-btn btn-obturada ${activeToothState.condition === 'obturada' ? 'active' : ''}`}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
                      >
                        <CheckSquare size={14} style={{ opacity: 0.9 }} /> Obturada
                      </button>
                      <button
                        type="button"
                        onClick={() => setToothCondition(selectedTooth, 'fracturada')}
                        className={`odont-option-btn btn-fracturada ${activeToothState.condition === 'fracturada' ? 'active' : ''}`}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
                      >
                        <Zap size={14} style={{ opacity: 0.9 }} /> Fracturada
                      </button>
                      <button
                        type="button"
                        onClick={() => setToothCondition(selectedTooth, 'provisional')}
                        className={`odont-option-btn btn-provisional ${activeToothState.condition === 'provisional' ? 'active' : ''}`}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
                      >
                        <Info size={14} style={{ opacity: 0.9 }} /> Provisional
                      </button>
                    </div>
                  </div>

                  {/* Tooth Faces Toggles Visual Diagram Guide */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 800, opacity: 0.9, color: 'hsla(var(--foreground-hsl) / 0.85)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <Layers size={14} style={{ color: 'hsl(var(--primary-hsl))' }} /> Selección de Caras Clínicas Afectadas:
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '8px',
                              fontWeight: 700,
                              width: '100%',
                              justifyContent: 'flex-start',
                              padding: '10px 14px'
                            }}
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
                </div>

                {/* Right Column: Prestaciones (Treatments Checklist) with Instant Search Bar */}
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '16px', 
                  overflow: 'hidden',
                  border: (showTour && tourStep === 2) ? '2px solid #fb923c' : '2.5px solid transparent',
                  borderRadius: '16px',
                  padding: (showTour && tourStep === 2) ? '12px' : '0px',
                  backgroundColor: (showTour && tourStep === 2) ? 'rgba(251, 146, 60, 0.04)' : 'transparent',
                  boxShadow: (showTour && tourStep === 2) ? '0 0 25px rgba(251, 146, 60, 0.15)' : 'none',
                  transition: 'all 0.3s ease',
                  position: 'relative'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span style={{ fontSize: '0.86rem', fontWeight: 800, color: 'hsl(var(--primary-hsl))', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <FileText size={15} style={{ color: 'hsl(var(--primary-hsl))' }} /> Asignar Prestaciones para la Pieza {selectedTooth}:
                    </span>

                    {/* Quick Search Input */}
                    <div style={{ position: 'relative', width: '100%' }}>
                      <input
                        type="text"
                        placeholder="Buscar prestación..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px 16px 12px 42px',
                          borderRadius: '12px',
                          border: '1.5px solid var(--glass-border)',
                          backgroundColor: 'hsla(var(--foreground-hsl) / 0.02)',
                          color: 'var(--foreground-hsl)',
                          fontSize: '0.88rem',
                          fontWeight: 500,
                          outline: 'none',
                          transition: 'all 0.2s ease',
                          boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.02)'
                        }}
                      />
                      <span style={{
                        position: 'absolute',
                        left: '14px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'hsla(var(--foreground-hsl) / 0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        pointerEvents: 'none'
                      }}>
                        <Search size={16} />
                      </span>
                      {searchTerm && (
                        <button
                          type="button"
                          onClick={() => setSearchTerm('')}
                          style={{
                            position: 'absolute',
                            right: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'hsla(var(--foreground-hsl) / 0.5)',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            borderRadius: '50%',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--foreground-hsl)'}
                          onMouseLeave={(e) => e.currentTarget.style.color = 'hsla(var(--foreground-hsl) / 0.5)'}
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Unified Accordion List or Search Results Container */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '14px',
                    overflowY: 'auto',
                    maxHeight: '440px',
                    backgroundColor: 'hsla(var(--foreground-hsl) / 0.015)'
                  }}>
                    {searchTerm.trim() !== '' ? (
                      // Search results mode
                      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {(() => {
                          const term = searchTerm.toLowerCase();
                          const filtered = treatmentOptions.filter(opt =>
                            opt.name.toLowerCase().includes(term) ||
                            opt.category.toLowerCase().includes(term)
                          );

                          return (
                            <>
                              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'hsla(var(--foreground-hsl) / 0.5)', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid var(--glass-border)', paddingBottom: '6px', marginBottom: '4px' }}>
                                Resultados de la búsqueda ({filtered.length})
                              </div>
                              {filtered.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                  {filtered.slice(0, 50).map((opt) => {
                                    const isAssigned = activeToothState.treatments.includes(opt.id);
                                    return (
                                      <div
                                        key={opt.id}
                                        onClick={() => selectedTooth && toggleTreatment(selectedTooth, opt.id)}
                                        className={`odont-treatment-card ${isAssigned ? 'active' : ''}`}
                                        style={{
                                          borderColor: isAssigned ? opt.color : 'var(--glass-border)',
                                          boxShadow: isAssigned ? `0 4px 14px ${opt.color}1e` : 'none',
                                          display: 'flex',
                                          alignItems: 'center',
                                          padding: '10px 14px',
                                          borderRadius: '10px',
                                          cursor: 'pointer',
                                          transition: 'all 0.2s ease',
                                          userSelect: 'none'
                                        }}
                                      >
                                        <div
                                          className="odont-treatment-checkbox"
                                          style={{
                                            backgroundColor: isAssigned ? opt.color : 'transparent',
                                            borderColor: isAssigned ? opt.color : 'rgba(120, 120, 120, 0.3)',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginRight: '12px',
                                            flexShrink: 0
                                          }}
                                        >
                                          {isAssigned && (
                                            <Check size={11} style={{ color: '#ffffff', strokeWidth: 4 }} />
                                          )}
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
                                          <span style={{
                                            fontSize: '0.84rem',
                                            color: isAssigned ? 'hsl(var(--foreground-hsl))' : 'hsla(var(--foreground-hsl) / 0.85)',
                                            fontWeight: isAssigned ? 600 : 500
                                          }}>
                                            {opt.id_prestacion ? `[ID: ${opt.id_prestacion}] ${opt.name}` : opt.name}
                                          </span>
                                          <span style={{
                                            fontSize: '0.72rem',
                                            color: opt.color,
                                            fontWeight: 700,
                                            opacity: 0.95
                                          }}>
                                            Categoría: {opt.category.toUpperCase()}
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                  {filtered.length > 50 && (
                                    <div style={{ 
                                      textAlign: 'center', 
                                      padding: '12px', 
                                      fontSize: '0.8rem', 
                                      color: 'hsla(var(--foreground-hsl) / 0.5)',
                                      border: '1.5px dashed var(--glass-border)',
                                      borderRadius: '10px',
                                      marginTop: '4px',
                                      fontWeight: 500
                                    }}>
                                      Mostrando los primeros 50 resultados de {filtered.length}. Refina tu búsqueda para encontrar más prestaciones.
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div style={{ padding: '24px 16px', textAlign: 'center', color: 'hsla(var(--foreground-hsl) / 0.5)', fontSize: '0.84rem', fontWeight: 500 }}>
                                  No se encontraron prestaciones que coincidan con &ldquo;{searchTerm}&rdquo;.
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    ) : (
                      // Traditional category accordions mode
                      categories.map((cat) => {
                        const catOpts = treatmentOptions.filter((t) => t.category === cat);
                        const isOpen = selectedCategory === cat;

                        // Count assigned treatments in this category
                        const assignedCount = activeToothState.treatments.filter(tid =>
                          catOpts.some(opt => opt.id === tid)
                        ).length;

                        // Get theme color
                        const catColor = catOpts[0]?.color || 'hsl(var(--primary-hsl))';

                        const renderCategoryIcon = () => {
                          const iconStyle = { display: 'inline-block', strokeWidth: 2.2 };
                          const catLower = cat.toLowerCase();
                          if (catLower.includes('prev') || catLower.includes('higien')) return <Shield size={16} style={iconStyle} />;
                          if (catLower.includes('rest') || catLower.includes('oper') || catLower.includes('general')) return <Activity size={16} style={iconStyle} />;
                          if (catLower.includes('endo')) return <Layers size={16} style={iconStyle} />;
                          if (catLower.includes('cirug') || catLower.includes('quir')) return <Scissors size={16} style={iconStyle} />;
                          if (catLower.includes('prot') || catLower.includes('fija') || catLower.includes('remov')) return <Crown size={16} style={iconStyle} />;
                          return <FileText size={16} style={iconStyle} />;
                        };

                        return (
                          <div
                            key={cat}
                            style={{
                              borderBottom: '1px solid var(--glass-border)',
                              transition: 'all 0.25s ease'
                            }}
                          >
                            {/* Accordion Header */}
                            <div
                              onClick={() => setSelectedCategory(isOpen ? null : cat)}
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
                                  color: isOpen ? catColor : 'hsl(var(--foreground-hsl))',
                                  transition: 'color 0.2s ease'
                                }}>
                                  {renderCategoryIcon()}
                                </span>
                                <span style={{
                                  fontSize: '0.84rem',
                                  fontWeight: 700,
                                  color: isOpen ? catColor : 'hsl(var(--foreground-hsl))',
                                  transition: 'color 0.2s ease'
                                }}>
                                  {cat}
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
                                color: isOpen ? catColor : 'hsl(var(--foreground-hsl))'
                              }}>
                                <ChevronRight size={16} style={{ strokeWidth: 2.5 }} />
                              </span>
                            </div>

                            {/* Accordion Body (Collapsible Section) */}
                            {isOpen && (() => {
                              const limit = visibleLimits[cat] || 40;
                              const visibleOpts = catOpts.slice(0, limit);
                              return (
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
                                  {visibleOpts.map((opt) => {
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
                                          color: isAssigned ? 'hsl(var(--foreground-hsl))' : 'hsla(var(--foreground-hsl) / 0.85)',
                                          fontWeight: isAssigned ? 600 : 500
                                        }}>
                                          {opt.id_prestacion ? `[ID: ${opt.id_prestacion}] ${opt.name}` : opt.name}
                                        </span>
                                      </div>
                                    );
                                  })}
                                  {catOpts.length > limit && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setVisibleLimits(prev => ({ ...prev, [cat]: (prev[cat] || 40) + 100 }));
                                      }}
                                      className="btn btn-secondary"
                                      style={{
                                        gridColumn: '1 / -1',
                                        padding: '10px',
                                        fontSize: '0.8rem',
                                        fontWeight: 700,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '6px',
                                        marginTop: '8px',
                                        width: '100%',
                                        cursor: 'pointer'
                                      }}
                                    >
                                      Mostrar más (+{catOpts.length - limit} restantes)
                                    </button>
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Footer Buttons Section */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  marginTop: '20px',
                  borderTop: '1px solid var(--glass-border)',
                  paddingTop: '16px',
                  gap: '12px',
                  flexWrap: 'wrap',
                  gridColumn: '1 / -1'
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
        <div 
          className="glass-panel animate-fade-in" 
          style={{ 
            padding: '24px', 
            border: showTour && tourStep === 5 ? '2px solid #fb923c' : '1px solid var(--glass-border)',
            boxShadow: showTour && tourStep === 5 ? '0 0 20px rgba(251, 146, 60, 0.4)' : 'none',
            transition: 'all 0.3s ease'
          }}
        >
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
                  const isPseudo = id === 101 || id === 102 || id === 103;
                  
                  let nameLabel = '';
                  let typeLabel = '';
                  let activeFaces = '';
                  
                  if (isPseudo) {
                    if (id === 101) {
                      nameLabel = 'Arcada Superior';
                      typeLabel = 'Arcada Superior';
                    } else if (id === 102) {
                      nameLabel = 'Arcada Inferior';
                      typeLabel = 'Arcada Inferior';
                    } else {
                      nameLabel = 'Toda la Boca';
                      typeLabel = 'Dentición Completa';
                    }
                    activeFaces = 'Completo';
                  } else {
                    const tooth = currentTeethList.find((t) => t.id === id);
                    if (!tooth) return null;
                    nameLabel = `Pieza ${id}`;
                    typeLabel = tooth.type === 'incisor' ? 'Incisivo' : tooth.type === 'canine' ? 'Canino' : tooth.type === 'premolar' ? 'Premolar' : 'Molar';
                    activeFaces = Object.entries(state.faces)
                      .filter(([_, isActive]) => isActive)
                      .map(([faceName]) => faceName)
                      .join(', ') || ((state.condition === 'ausente' || state.condition === 'perdida') ? 'Completo' : 'General');
                  }

                  let toothConditionLabel = '';
                  if (!isPseudo) {
                    if (state.condition === 'ausente') toothConditionLabel = 'Ausente';
                    if (state.condition === 'perdida') toothConditionLabel = 'Perdida';
                    if (state.condition === 'implante') toothConditionLabel = 'Implante';
                    if (state.condition === 'corona_existente') toothConditionLabel = 'Corona Previa';
                    if (state.condition === 'cariada') toothConditionLabel = 'Cariada';
                    if (state.condition === 'obturada') toothConditionLabel = 'Obturada';
                    if (state.condition === 'fracturada') toothConditionLabel = 'Fracturada';
                    if (state.condition === 'provisional') toothConditionLabel = 'Provisional';
                    if (state.condition === 'sano') toothConditionLabel = 'Sana';
                  }

                  return (
                    <tr key={id}>
                      <td style={{ padding: '8px 12px', fontWeight: 700, color: 'var(--foreground-hsl)' }}>
                        {nameLabel} {toothConditionLabel && (
                          <span style={{ 
                            fontSize: '0.72rem', 
                            padding: '2px 6px', 
                            borderRadius: '4px', 
                            backgroundColor: state.condition === 'ausente' || state.condition === 'perdida' || state.condition === 'cariada' || state.condition === 'fracturada'
                              ? 'rgba(239, 68, 68, 0.15)' 
                              : state.condition === 'implante'
                              ? 'rgba(245, 158, 11, 0.15)'
                              : state.condition === 'corona_existente'
                              ? 'rgba(168, 85, 247, 0.15)'
                              : state.condition === 'obturada'
                              ? 'rgba(59, 130, 246, 0.15)'
                              : state.condition === 'provisional'
                              ? 'rgba(6, 182, 212, 0.15)'
                              : 'rgba(16, 185, 129, 0.15)', 
                            color: state.condition === 'ausente' || state.condition === 'perdida' || state.condition === 'cariada' || state.condition === 'fracturada'
                              ? '#ef4444' 
                              : state.condition === 'implante'
                              ? '#f59e0b'
                              : state.condition === 'corona_existente'
                              ? '#a855f7'
                              : state.condition === 'obturada'
                              ? '#3b82f6'
                              : state.condition === 'provisional'
                              ? '#06b6d4'
                              : '#10b981',
                            marginLeft: '6px' 
                          }}>
                            {toothConditionLabel}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '8px 12px', opacity: 0.7, fontSize: '0.84rem', color: 'var(--foreground-hsl)' }}>
                        {typeLabel}
                      </td>
                      <td style={{ padding: '8px 12px', color: 'hsl(var(--accent-hsl))', fontWeight: 600 }}>
                        {activeFaces}
                      </td>
                      <td style={{ padding: '8px 12px' }}>
                        {state.treatments.length > 0 ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {state.treatments.map((tid) => {
                              const opt = treatmentOptions.find((o) => o.id === tid);
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
                                  {opt ? (opt.id_prestacion ? `[ID: ${opt.id_prestacion}] ${opt.name.split(' (')[0]}` : opt.name.split(' (')[0]) : tid}
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
          value={localObservations}
          onChange={(e) => setLocalObservations(e.target.value)}
          onBlur={() => setGeneralObservations(localObservations)}
          placeholder="Detalles complementarios clínicos, anomalías, derivaciones preferenciales o del caso..."
        />
      </div>

      {/* Mass Selection Portal */}
      {massSelectionType && mounted && typeof document !== 'undefined' ? (
        createPortal(
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
            onClick={() => setMassSelectionType(null)}
          >
            <div
              className="glass-panel animate-fade-in"
              style={{
                padding: '32px 34px 46px 34px',
                background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.04) 0%, rgba(59, 130, 246, 0.02) 100%), hsl(var(--card-hsl))',
                borderWidth: '1.5px 1.5px 1.5px 6px',
                borderStyle: 'solid',
                borderColor: 'hsl(var(--card-border-hsl)) hsl(var(--card-border-hsl)) hsl(var(--card-border-hsl)) #a855f7',
                boxShadow: '0 24px 60px -15px rgba(10, 17, 36, 0.35), var(--shadow-lg)',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                width: '95%',
                maxWidth: '680px',
                maxHeight: '88vh',
                overflowY: 'auto',
                position: 'relative',
                margin: 'auto'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => {
                  setMassSelectionType(null);
                  setMassSelectedCategory(null);
                }}
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
                  color: 'hsl(var(--foreground-hsl))',
                  transition: 'all 0.2s ease',
                  padding: 0,
                  zIndex: 10
                }}
              >
                <X size={16} style={{ strokeWidth: 2.5 }} />
              </button>

              <div>
                <h4 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'hsl(var(--foreground-hsl))' }}>
                  Asignar Prestación en Masa
                </h4>
                <p style={{ fontSize: '0.82rem', opacity: 0.8, margin: '4px 0 0 0', color: 'hsla(var(--foreground-hsl) / 0.8)' }}>
                  Se aplicará la prestación seleccionada a todas las piezas dentales en la{' '}
                  <strong style={{ color: '#a855f7' }}>
                    {massSelectionType === 'upper' ? 'Arcada Superior' : massSelectionType === 'lower' ? 'Arcada Inferior' : 'Boca Completa'}
                  </strong>.
                </p>
              </div>

              <div style={{ height: '1px', backgroundColor: 'var(--glass-border)' }} />

              {/* Prestaciones Selector Accordion */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '0.86rem', fontWeight: 800, color: 'hsl(var(--primary-hsl))' }}>
                  Selecciona la prestación a aplicar:
                </span>
                
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  backgroundColor: 'hsla(var(--foreground-hsl) / 0.01)'
                }}>
                  {categories.map((cat) => {
                    const catOpts = treatmentOptions.filter(t => t.category === cat);
                    const isOpen = massSelectedCategory === cat;
                    const catColor = catOpts[0]?.color || 'hsl(var(--primary-hsl))';

                    const renderCategoryIcon = () => {
                      const iconStyle = { display: 'inline-block', strokeWidth: 2.2 };
                      const catLower = cat.toLowerCase();
                      if (catLower.includes('prev') || catLower.includes('higien')) return <Shield size={15} style={iconStyle} />;
                      if (catLower.includes('rest') || catLower.includes('oper') || catLower.includes('general')) return <Activity size={15} style={iconStyle} />;
                      if (catLower.includes('endo')) return <Layers size={15} style={iconStyle} />;
                      if (catLower.includes('cirug') || catLower.includes('quir')) return <Scissors size={15} style={iconStyle} />;
                      if (catLower.includes('prot') || catLower.includes('rehab')) return <Crown size={15} style={iconStyle} />;
                      return <FileText size={15} style={iconStyle} />;
                    };

                    return (
                      <div key={`mass-${cat}`} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                        <div
                          onClick={() => setMassSelectedCategory(isOpen ? null : cat)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '12px 18px',
                            cursor: 'pointer',
                            backgroundColor: isOpen ? 'hsla(var(--foreground-hsl) / 0.03)' : 'transparent',
                            transition: 'all 0.2s ease',
                            userSelect: 'none'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ color: isOpen ? catColor : 'hsl(var(--foreground-hsl))' }}>
                              {renderCategoryIcon()}
                            </span>
                            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: isOpen ? catColor : 'hsl(var(--foreground-hsl))' }}>
                              {cat}
                            </span>
                          </div>
                          <ChevronRight size={14} style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'all 0.2s ease' }} />
                        </div>

                        {isOpen && (
                          <div style={{
                            padding: '14px 18px',
                            backgroundColor: 'hsla(var(--foreground-hsl) / 0.005)',
                            borderTop: '1px solid var(--glass-border)',
                            display: 'grid',
                            gridTemplateColumns: '1fr',
                            gap: '8px'
                          }}>
                            {catOpts.map((opt) => (
                              <button
                                key={`mass-opt-${opt.id}`}
                                type="button"
                                onClick={() => handleApplyMassTreatment(opt.id)}
                                className="odont-treatment-card"
                                style={{
                                  padding: '10px 14px',
                                  textAlign: 'left',
                                  width: '100%',
                                  cursor: 'pointer',
                                  borderColor: 'var(--glass-border)',
                                  justifyContent: 'flex-start',
                                  backgroundColor: 'transparent',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '10px'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.borderColor = opt.color;
                                  e.currentTarget.style.backgroundColor = `${opt.color}0a`;
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.borderColor = 'var(--glass-border)';
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                              >
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: opt.color }} />
                                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'hsl(var(--foreground-hsl))' }}>{opt.name}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>,
          document.body
        )
      ) : null}

      {mounted && showTour && renderTourBubble(tourStep)}

    </div>
  );
}
