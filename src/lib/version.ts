export interface ReleaseVersion {
  version: string;
  badgeColor?: string;
  date: string;
  department?: string;
  area?: string;
  bienio?: string;
  highlights?: string[];
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

export const CURRENT_VERSION = 'v1.0.1';

export const RELEASE_HISTORY: ReleaseVersion[] = [
  {
    version: 'v1.0.1',
    badgeColor: '#22c55e',
    date: '2026 - 2027',
    department: 'Departamento TIC',
    area: 'Área de Desarrollo y Sistemas Informáticos',
    bienio: '2026 - 2027',
    sections: [
      {
        category: 'Nuevas funcionalidades:',
        icon: '⭐',
        color: '#f59e0b',
        items: [
          {
            title: 'Seguimiento clínico completo:',
            description: 'En los casos finalizados, ahora es posible consultar la evolución clínica ingresada por el profesional tratante del Policlínico.'
          },
          {
            title: 'Visualización de exámenes e informes dentales:',
            description: 'Acceso directo a las radiografías e informes generados durante la atención. Por seguridad e integración con Dentalink, los enlaces de visualización tienen una vigencia de 1 hora al abrir la ficha del paciente.'
          },
          {
            title: 'Impresión integral del caso:',
            description: 'La vista de impresión ahora incluye el historial de evolución y los archivos clínicos pertinentes a la derivación.'
          },
          {
            title: 'Integración Dentalink:',
            description: 'Se sincroniza la información seleccionada e ingresada en el Odontograma directamente en la ficha del paciente.'
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
