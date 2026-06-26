# Portal de Derivación Digital — Policlínico Tabancura & Vitacura 🏥✨

Este es el repositorio principal del portal de **Derivación Digital**, diseñado para conectar y agilizar el flujo de derivaciones y casos sociales entre la red asistencial del **Policlínico Tabancura** y la **Municipalidad de Vitacura**.

El sistema integra un odontograma interactivo de alta fidelidad, control inteligente de cupos para profesionales derivadores y sincronización bidireccional en tiempo real con **Dentalink**.

---

## 🚀 Características Principales

### 1. Odontograma Digital Interactivo
* **Soporte Completo:** Modos de dentición Permanente (Adulto - 32 piezas) e Infantil (Niño - 20 piezas).
* **Diagnósticos Detallados:** Selección clínica por caras del diente (Vestibular, Oclusal, Mesial, Distal, Lingual) o condiciones globales (Ausente, Implante, Corona previa, Cariada, Obturada, Fracturada, Provisional).
* **Acciones en Masa y Selección Múltiple:** Opciones avanzadas para aplicar tratamientos por arcadas completas (superior/inferior), boca completa o mediante multiselección de dientes.

### 2. Gestión de Aranceles y Prestaciones
* **Carga desde Excel:** Sincronización masiva de aranceles desde archivos de planillas Excel (`prestaciones.xlsx`) a PostgreSQL.
* **Control de Visibilidad:** Panel administrativo para activar/desactivar la visibilidad de prestaciones específicas y categorías enteras en el odontograma.
* **Búsqueda Avanzada:** Buscador integrado con mapeo clínico óptimo (por ejemplo, las obturaciones tradicionales se manejan y buscan bajo la nomenclatura de **"Resina"**).

### 3. Control Inteligente de Cupos (Cuotas)
* **Validación en Tiempo Real:** El sistema valida automáticamente los cupos disponibles de **Procedimientos Dentales** y **Radiología (Rayos X)** asignados a cada institución y profesional externo antes de registrar la derivación.
* **Prevención de Sobrecupos:** Las transacciones de registro fallan de manera segura (`ROLLBACK`) si el caso excede el cupo disponible.

### 4. Integración Robusta con la API de Dentalink
* **Búsqueda Inteligente por RUT:** Valida en paralelo 3 formatos de RUT (limpio, con guion, con puntos y guion) para evitar registros duplicados.
* **Asistente de Vinculación (Automatic Entry Wizard):**
  1. Comprueba si el paciente existe en Dentalink y lo crea automáticamente si no es así.
  2. Permite crear nuevos planes de tratamientos en Dentalink asociados a la derivación.
  3. Vincula y asocia automáticamente las prestaciones del odontograma al plan de tratamiento con descuento del 100% (costo cero para el paciente derivado).
* **Sincronización Bidireccional de Estados:** Monitorea evoluciones y citas agendadas en Dentalink para actualizar los estados del caso en el portal (`ingresado` ➔ `agendado` ➔ `en_tratamiento` ➔ `finalizado` / `sincronizado`).

---

## 🛠️ Tecnologías Utilizadas

* **Framework:** Next.js 16 (App Router)
* **Lenguaje:** TypeScript / Python (Scripts de soporte)
* **Base de Datos:** PostgreSQL con cliente nativo `pg` (Pool de conexiones optimizado)
* **Estilos:** Vanilla CSS con variables de diseño moderno (Glassmorphism, vibrantes colores clínicos, animaciones suaves)
* **Seguridad:** Autenticación de sesiones seguras mediante `jose` / JSON Web Tokens y encriptación con `bcryptjs`.

---

## 💻 Comandos y Guía de Operación

### Configuración del Entorno
Duplica el archivo `.env.example` como `.env.local` y configura las credenciales de base de datos PostgreSQL, SMTP para correos de notificación y el token de la API de Dentalink:
```env
POSTGRES_HOST=your_host
POSTGRES_DATABASE=db_casos
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password
DENTALINK_API_TOKEN=Token your_token
```

### Ejecutar en Desarrollo
Inicia el servidor local de Next.js:
```bash
npm run dev
```

### Gestión de Base de Datos

* **Inicializar Estructura de Base de Datos:**
  Crea las tablas, restricciones, índices y datos semilla iniciales (convenios y administrador por defecto):
  ```bash
  npx tsx src/lib/setup-db.ts
  ```

* **Sincronizar Aranceles desde Excel (`prestaciones.xlsx`):**
  Limpia y actualiza el catálogo local con los aranceles activos (Base y Preferencial):
  ```bash
  python src/lib/sync-aranceles.py
  ```

* **Reiniciar Base de Datos para Pruebas (Desarrollo):**
  Limpia por completo las tablas de casos ingresados (`cases`), personas (`persons`) e historial de auditoría (`audit_logs`), y reestablece los contadores de cuotas usadas de instituciones y usuarios a `0`:
  ```bash
  npx tsx src/lib/reset-cases.ts
  ```

---

## 📂 Estructura del Código

* `/src/app`: Rutas del sistema, vistas de dashboard y **Server Actions** lógicos (`/actions`).
* `/src/components`: Componentes del cliente interactivo (Odontograma digital, Asistente de entrada, Administrador de aranceles).
* `/src/lib`: Inicialización de base de datos, utilidades y scripts de migración/reinicio.

*Para detalles profundos sobre la base de datos o lógica de negocio específica, por favor consulta el archivo [DOCUMENTATION.md](file:///c:/Users/EQUIPO/Desktop/Sandbox/devPythonActual/pt.cl-vitacura/DOCUMENTATION.md).*
