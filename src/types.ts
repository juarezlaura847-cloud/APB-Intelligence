export type EquipoEstado = 'recepcion' | 'espera' | 'revision' | 'prueba' | 'terminado' | 'entregado';

export type PlantaUbicacion = 'planta_alta' | 'planta_baja';

export interface Equipo {
  id: string;
  nombreEquipo: string;
  numeroSerie: string;
  fechaLlegada: string; // YYYY-MM-DD
  fechaInicioRevision?: string | null; // YYYY-MM-DD or null
  fechaTermino: string | null; // YYYY-MM-DD or null
  estado: EquipoEstado;
  ubicacion: PlantaUbicacion;
  falla: string;
  accesorios: string;
  colaborador: string; // Assigned engineer/tech
  recibidoPor: string; // Receptionist / staff
  hospital: string;
  observaciones: string;
  costoServicio: number; // Cost of repair
  cobrado: boolean; // Has it been paid?
  marca?: string; // Optional Brand
}

export const ESTADOS_INFO: Record<EquipoEstado, { label: string; color: string; bgColor: string; borderColor: string }> = {
  recepcion: {
    label: 'Recepción',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  espera: {
    label: 'En Espera',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200'
  },
  revision: {
    label: 'En Revisión',
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200'
  },
  prueba: {
    label: 'En Pruebas',
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200'
  },
  terminado: {
    label: 'Terminado',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200'
  },
  entregado: {
    label: 'Entregado',
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-300'
  }
};

export const ESTADOS_ORDEN: EquipoEstado[] = ['recepcion', 'espera', 'revision', 'prueba', 'terminado', 'entregado'];

export const UBICACIONES_INFO: Record<PlantaUbicacion, { label: string; color: string; bgColor: string }> = {
  planta_alta: {
    label: 'Planta Alta',
    color: 'text-orange-700',
    bgColor: 'bg-orange-50'
  },
  planta_baja: {
    label: 'Planta Baja',
    color: 'text-sky-700',
    bgColor: 'bg-sky-50'
  }
};

export type ShowroomEstado = 'disponible' | 'vendido' | 'prestado';

export interface ShowroomEquipo {
  id: string;
  nombreEquipo: string;
  marca: string;
  modelo?: string;
  numeroSerie: string;
  precioDistribuidor: number;
  precioPublico: number;
  accesorios: string;
  fichaTecnicaUrl: string;
  vendidoA: string;
  vendido: boolean;
  fechaVenta?: string;
  prestadoA?: string;
  fechaPrestamo?: string;
  estado?: ShowroomEstado;
  fotos: string[]; // Base64 data strings, max 5
  observaciones?: string;
}

