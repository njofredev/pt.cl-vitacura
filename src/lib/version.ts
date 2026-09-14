export interface ReleaseVersion {
  version: string;
  badgeColor?: string;
  date: string;
  department?: string;
  area?: string;
  bienio?: string;
  isCurrent?: boolean;
  pageNumber?: string;
  sections: {
    category: string;
    icon?: string;
    color?: string;
    items: {
      title?: string;
      description: string;
    }[];
  }[];
  proximamente?: string;
  contactEmail?: string;
}

export const CURRENT_VERSION = 'v1.0.2';

export const RELEASE_HISTORY: ReleaseVersion[] = [
  {
    version: 'v1.0.2',
    badgeColor: '#22c55e',
    date: '2026 - 2027',
    department: 'Departamento TIC',
    area: 'Área de Desarrollo y Sistemas Informáticos',
    bienio: '2026 - 2027',
    isCurrent: true,
    pageNumber: '1/2',
    sections: [
      {
        category: 'Nuevas funcionalidades:',
        icon: '⭐',
        color: '#f59e0b',
        items: [
          {
            title: 'Nuevo estado "Epicrisis Pendiente":',
            description: 'Se incorpora un estado clínico intermedio previo a la finalización del caso. Requiere la redacción, firma y emisión de la Epicrisis Odontológica por parte del doctor tratante.'
          },
          {
            title: 'Módulo de emisión de Epicrisis Clínica:',
            description: 'Panel exclusivo para el profesional tratante donde registra diagnóstico de alta, resumen del tratamiento realizado e indicaciones de cuidados posteriores.'
          },
          {
            title: 'Certificado de Alta Oficial para Derivadores:',
            description: 'Los centros y profesionales externos ahora visualizan un documento de alta formal y estructurado con el sello del profesional responsable en lugar de datos sensibles en bruto.'
          }
        ]
      },
      {
        category: 'Mejoras y seguridad:',
        icon: '🔧',
        color: '#0ea5e9',
        items: [
          {
            title: 'Protección estricta de Ficha y Archivos Clínicos:',
            description: 'Se retira la visualización directa a la ficha clínica, historial de evoluciones y archivos sin consentimiento expreso, en estricto cumplimiento con la Ley de Protección de Datos Personales (Ley N°21.719).'
          },
          {
            title: 'Barra de advertencia legal normalizada:',
            description: 'Notificación permanente y visible en la bandeja de casos informando las restricciones legales y resguardo de la confidencialidad del paciente.'
          },
          {
            title: 'Automatización Dentalink a Epicrisis:',
            description: 'Al concluirse un tratamiento en Dentalink, el caso avanza automáticamente al estado "Epicrisis Pendiente" para su oportuna redacción médica.'
          }
        ]
      }
    ],
    proximamente: 'Versión Mobile, Reportes automatizados, Upload de radiografías entre otros.',
    contactEmail: 'njofre@policlinicotabancura.cl'
  },
  {
    version: 'v1.0.1',
    badgeColor: '#64748b',
    date: '2026 - 2027',
    department: 'Departamento TIC',
    area: 'Área de Desarrollo y Sistemas Informáticos',
    bienio: '2026 - 2027',
    isCurrent: false,
    pageNumber: '2/2',
    sections: [
      {
        category: 'Nuevas funcionalidades:',
        icon: '⭐',
        color: '#f59e0b',
        items: [
          {
            title: 'Seguimiento clínico completo:',
            description: 'En los casos finalizados, consulta de evolución clínica ingresada por el profesional tratante del Policlínico.'
          },
          {
            title: 'Visualización de exámenes e informes dentales:',
            description: 'Acceso a radiografías e informes generados durante la atención con enlaces temporales de 1 hora.'
          },
          {
            title: 'Impresión integral del caso:',
            description: 'Vista de impresión con información del paciente y detalles pertinentes a la derivación.'
          },
          {
            title: 'Integración Dentalink:',
            description: 'Sincronización de información ingresada en el Odontograma directamente en la ficha del paciente.'
          }
        ]
      },
      {
        category: 'Mejoras y seguridad:',
        icon: '🔧',
        color: '#0ea5e9',
        items: [
          {
            title: 'Sincronización de estados:',
            description: 'Mayor robustez y consistencia en el flujo de estados (Ingresado, Agendado, En tratamiento, etc).'
          },
          {
            title: 'Experiencia de usuario:',
            description: 'Mejoras visuales, animaciones más fluidas y diseño de interfaz optimizado.'
          },
          {
            title: 'Protección de Datos personales:',
            description: 'Actualización técnica y operativa alineada con las exigencias de la ley N°21.719.'
          }
        ]
      }
    ],
    proximamente: 'Versión Mobile, Reportes automatizados, Upload de radiografías entre otros.',
    contactEmail: 'njofre@policlinicotabancura.cl'
  }
];
