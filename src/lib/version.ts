export interface ReleaseVersion {
  version: string;
  date: string;
  codename?: string;
  isLatest?: boolean;
  highlights: string[];
  sections: {
    category: 'Nuevas Funcionalidades' | 'Mejoras Clínicas & Legales' | 'Seguridad & Privacidad' | 'Correcciones';
    items: string[];
  }[];
}

export const CURRENT_VERSION = 'v1.1.0';

export const RELEASE_HISTORY: ReleaseVersion[] = [
  {
    version: 'v1.1.0',
    date: 'Septiembre 2026',
    codename: 'Epicrisis & Cumplimiento Normativo',
    isLatest: true,
    highlights: [
      'Nuevo estado clínico intermedio "Epicrisis Pendiente".',
      'Módulo oficial de emisión de Epicrisis Odontológica / Alta Médica.',
      'Protección estricta de fichas y evoluciones raw conforme a Ley 21.719.',
      'Sincronización bidireccional automática con Dentalink.'
    ],
    sections: [
      {
        category: 'Nuevas Funcionalidades',
        items: [
          'Estado "Epicrisis Pendiente": Transición previa al alta definitiva que exige informe médico suscrito por el profesional emisor (por defecto Dr. Antonio Alvear Muñoz).',
          'Tarjeta de Alta Odontológica: Vista formal para usuarios externos y derivadores con diagnóstico integral, indicaciones post-alta y profesional a cargo.',
          'Incorporación de Epicrisis Oficial en Fichas y Certificados Imprimibles con sello institucional.'
        ]
      },
      {
        category: 'Seguridad & Privacidad',
        items: [
          'Bloqueo preventivo de despliegue de evoluciones y adjuntos directos sin consentimiento explícito (Ley de Protección de Datos Personales).',
          'Barra informativa normalizada de precaución legal en bandejas de casos.',
          'Trazabilidad e inmutabilidad en auditoría de cambios de estado y emisión de altas.'
        ]
      },
      {
        category: 'Mejoras Clínicas & Legales',
        items: [
          'Sincronización continua de Dentalink: detección automática de tratamientos culminados que pasan inmediatamente a requerimiento de Epicrisis.',
          'Módulo de exportación PDF y Excel con datos anonimizados para perfiles de solo lectura.'
        ]
      }
    ]
  },
  {
    version: 'v1.0.1',
    date: 'Agosto 2026',
    codename: 'Sincronización Dentalink & Convenios',
    isLatest: false,
    highlights: [
      'Integración con Dentalink API.',
      'Gestión dinámica de aranceles y convenios institucionales.'
    ],
    sections: [
      {
        category: 'Nuevas Funcionalidades',
        items: [
          'Asistente de Ingreso Automático paso a paso con validación de RUT en Dentalink.',
          'Control y asignación de cuotas dentales y radiográficas por institución derivadora.'
        ]
      },
      {
        category: 'Correcciones',
        items: [
          'Optimización de tiempos de carga en bandeja de casos sociales.',
          'Corrección en cálculo correlativo anual de casos.'
        ]
      }
    ]
  }
];
