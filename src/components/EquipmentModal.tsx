import React, { useState, useEffect } from 'react';
import { X, Calendar, Wrench, Shield, Clipboard, User, MapPin, DollarSign, Package, Heart } from 'lucide-react';
import { Equipo, EquipoEstado, PlantaUbicacion } from '../types';
import { COLABORADORES_OPCIONES, HOSPITALES_OPCIONES, RECIBIDO_POR_OPCIONES } from '../data';

interface EquipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (equipo: Omit<Equipo, 'id'> & { id?: string }) => void;
  equipoToEdit?: Equipo | null;
  colaboradores: string[];
  recibidos: string[];
}

export default function EquipmentModal({
  isOpen,
  onClose,
  onSave,
  equipoToEdit,
  colaboradores,
  recibidos
}: EquipmentModalProps) {
  const [nombreEquipo, setNombreEquipo] = useState('');
  const [marca, setMarca] = useState('');
  const [numeroSerie, setNumeroSerie] = useState('');
  const [fechaLlegada, setFechaLlegada] = useState('');
  const [fechaInicioRevision, setFechaInicioRevision] = useState('');
  const [fechaTermino, setFechaTermino] = useState('');
  const [estado, setEstado] = useState<EquipoEstado>('recepcion');
  const [ubicacion, setUbicacion] = useState<PlantaUbicacion>('planta_baja');
  const [falla, setFalla] = useState('');
  const [accesorios, setAccesorios] = useState('');
  const [colaborador, setColaborador] = useState('');
  const [recibidoPor, setRecibidoPor] = useState('');
  const [hospital, setHospital] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [costoServicio, setCostoServicio] = useState<number>(0);
  const [cobrado, setCobrado] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset or fill form on open/edit change
  useEffect(() => {
    if (isOpen) {
      if (equipoToEdit) {
        setNombreEquipo(equipoToEdit.nombreEquipo);
        setMarca(equipoToEdit.marca || '');
        setNumeroSerie(equipoToEdit.numeroSerie);
        setFechaLlegada(equipoToEdit.fechaLlegada);
        setFechaInicioRevision(equipoToEdit.fechaInicioRevision || '');
        setFechaTermino(equipoToEdit.fechaTermino || '');
        setEstado(equipoToEdit.estado);
        setUbicacion(equipoToEdit.ubicacion);
        setFalla(equipoToEdit.falla);
        setAccesorios(equipoToEdit.accesorios);
        setColaborador(equipoToEdit.colaborador);
        setRecibidoPor(equipoToEdit.recibidoPor);
        setHospital(equipoToEdit.hospital);
        setObservaciones(equipoToEdit.observaciones);
        setCostoServicio(equipoToEdit.costoServicio);
        setCobrado(equipoToEdit.cobrado);
      } else {
        // Create new
        const today = new Date().toISOString().split('T')[0];
        setNombreEquipo('');
        setMarca('');
        setNumeroSerie('');
        setFechaLlegada(today);
        setFechaInicioRevision('');
        setFechaTermino('');
        setEstado('recepcion');
        setUbicacion('planta_baja');
        setFalla('');
        setAccesorios('');
        setColaborador(colaboradores[0] || 'Por asignar');
        setRecibidoPor(recibidos[0] || 'Diana Ruiz (Recepción)');
        setHospital(HOSPITALES_OPCIONES[0]);
        setObservaciones('');
        setCostoServicio(0);
        setCobrado(false);
      }
      setErrors({});
    }
  }, [isOpen, equipoToEdit]);

  // If status is changed to terminado or entregado and fechaTermino is empty, set it to today
  const handleEstadoChange = (newEstado: EquipoEstado) => {
    setEstado(newEstado);
    if ((newEstado === 'terminado' || newEstado === 'entregado') && !fechaTermino) {
      const today = new Date().toISOString().split('T')[0];
      setFechaTermino(today);
    } else if (newEstado !== 'terminado' && newEstado !== 'entregado') {
      setFechaTermino('');
    }
    if (newEstado === 'revision' && !fechaInicioRevision) {
      const today = new Date().toISOString().split('T')[0];
      setFechaInicioRevision(today);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!nombreEquipo.trim()) newErrors.nombreEquipo = 'El nombre del equipo es obligatorio';
    if (!hospital.trim()) newErrors.hospital = 'El hospital de procedencia es obligatorio';
    if (!falla.trim()) newErrors.falla = 'La falla reportada es obligatoria';
    if (costoServicio < 0) newErrors.costoServicio = 'El costo no puede ser negativo';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    onSave({
      id: equipoToEdit?.id,
      nombreEquipo: nombreEquipo.trim(),
      marca: marca.trim() || 'Por definir',
      numeroSerie: numeroSerie.trim().toUpperCase() || 'S/N',
      fechaLlegada,
      fechaInicioRevision: fechaInicioRevision ? fechaInicioRevision : null,
      fechaTermino: fechaTermino ? fechaTermino : null,
      estado,
      ubicacion,
      falla: falla.trim(),
      accesorios: accesorios.trim() || 'Ninguno',
      colaborador,
      recibidoPor,
      hospital,
      observaciones: observaciones.trim() || 'Sin observaciones adicionales.',
      costoServicio,
      cobrado
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div 
        id="equipment-modal" 
        className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col my-8 max-h-[90vh] animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center space-x-2">
            <Heart className="h-5 w-5 text-blue-200 animate-pulse" />
            <h2 className="text-lg font-semibold tracking-tight">
              {equipoToEdit ? 'Editar Registro de Equipo' : 'Registrar Ingreso de Equipo Biomédico'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/15 text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Section 1: General Info */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-1">
              <Package className="h-3.5 w-3.5" /> Datos Generales del Equipo
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Equipo Nombre */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Nombre del Equipo *</label>
                <input
                  type="text"
                  value={nombreEquipo}
                  onChange={(e) => setNombreEquipo(e.target.value)}
                  placeholder="Ej. Electrocardiógrafo MAC 2000"
                  className={`w-full px-3.5 py-2 border rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                    errors.nombreEquipo ? 'border-red-500 bg-red-50/50' : 'border-gray-300'
                  }`}
                />
                {errors.nombreEquipo && <p className="text-xs text-red-500 mt-1">{errors.nombreEquipo}</p>}
              </div>

              {/* Marca del Equipo */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Marca del Equipo</label>
                <input
                  type="text"
                  value={marca}
                  onChange={(e) => setMarca(e.target.value)}
                  placeholder="Ej. GE Healthcare, Mindray, Philips"
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              {/* Número de Serie */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Número de Serie (Opcional)</label>
                <input
                  type="text"
                  value={numeroSerie}
                  onChange={(e) => setNumeroSerie(e.target.value)}
                  placeholder="Ej. SN-ECG-99812 (Se asignará 'S/N' si se deja vacío)"
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              {/* Hospital de procedencia */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Hospital de Procedencia *</label>
                <div className="relative">
                  <input
                    type="text"
                    value={hospital}
                    onChange={(e) => setHospital(e.target.value)}
                    placeholder="Escribe o selecciona un hospital"
                    className={`w-full px-3.5 py-2 border rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                      errors.hospital ? 'border-red-500 bg-red-50/50' : 'border-gray-300'
                    }`}
                  />
                  {errors.hospital && <p className="text-xs text-red-500 mt-1">{errors.hospital}</p>}
                </div>
                {/* Suggestions badges */}
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {HOSPITALES_OPCIONES.filter(h => h !== 'Otro Hospital').slice(0, 4).map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setHospital(h)}
                      className="text-[10px] bg-gray-100 hover:bg-blue-50 hover:text-blue-700 text-gray-600 px-2 py-0.5 rounded-full transition-colors cursor-pointer"
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>

              {/* Accesorios que trae */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Accesorios Incluidos</label>
                <input
                  type="text"
                  value={accesorios}
                  onChange={(e) => setAccesorios(e.target.value)}
                  placeholder="Ej. Cable paciente, cable alimentación, sensores"
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Section 2: Flow & Dates */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" /> Proceso, Ubicación y Fechas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Estado */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Estado de Seguimiento</label>
                <select
                  value={estado}
                  onChange={(e) => handleEstadoChange(e.target.value as EquipoEstado)}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                >
                  <option value="recepcion">Recepción</option>
                  <option value="espera">En Espera / Cola</option>
                  <option value="revision">En Revisión</option>
                  <option value="prueba">En Pruebas / Validación</option>
                  <option value="terminado">Terminado (Listo para entrega)</option>
                  <option value="entregado">Entregado al Cliente</option>
                </select>
              </div>

              {/* Ubicación (Planta) */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Ubicación en Taller</label>
                <select
                  value={ubicacion}
                  onChange={(e) => setUbicacion(e.target.value as PlantaUbicacion)}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                >
                  <option value="planta_baja">Planta Baja</option>
                  <option value="planta_alta">Planta Alta</option>
                </select>
              </div>

              {/* Fecha Llegada */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Fecha de Llegada (Ingreso)</label>
                <div className="relative">
                  <input
                    type="date"
                    value={fechaLlegada}
                    onChange={(e) => setFechaLlegada(e.target.value)}
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              {/* Fecha de Inicio de Revisión */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Fecha de Inicio de Revisión
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={fechaInicioRevision}
                    onChange={(e) => setFechaInicioRevision(e.target.value)}
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-0.5">Opcional. Automático al pasar a En Revisión.</p>
              </div>

              {/* Fecha Terminado */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Fecha de Término (Equipo Listo)
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={fechaTermino}
                    onChange={(e) => setFechaTermino(e.target.value)}
                    placeholder="Pendiente"
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-0.5">Automático al marcar Terminado / Entregado.</p>
              </div>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Section 3: Technical / Staff */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-1">
              <User className="h-3.5 w-3.5" /> Responsables y Fallas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Colaborador asignado */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Colaborador Asignado (Revisión)</label>
                <input
                  type="text"
                  list="colaboradores-options"
                  value={colaborador}
                  onChange={(e) => setColaborador(e.target.value)}
                  placeholder="Escribe o selecciona un colaborador..."
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                />
                <datalist id="colaboradores-options">
                  {colaboradores.map((colab) => (
                    <option key={colab} value={colab} />
                  ))}
                </datalist>
                <p className="text-[10px] text-gray-400 mt-1">Puedes escribir libremente un nombre nuevo o editar el existente.</p>
              </div>

              {/* Recibido por */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Colaborador que recibió el equipo</label>
                <input
                  type="text"
                  list="recibido-options"
                  value={recibidoPor}
                  onChange={(e) => setRecibidoPor(e.target.value)}
                  placeholder="Escribe o selecciona quién recibió..."
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                />
                <datalist id="recibido-options">
                  {recibidos.map((rec) => (
                    <option key={rec} value={rec} />
                  ))}
                </datalist>
                <p className="text-[10px] text-gray-400 mt-1">Ingresa el colaborador encargado de recibir el equipo.</p>
              </div>

              {/* Falla reportada */}
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Falla Reportada o Diagnóstico Inicial *</label>
                <textarea
                  value={falla}
                  onChange={(e) => setFalla(e.target.value)}
                  rows={2}
                  placeholder="Describe la falla reportada por el cliente..."
                  className={`w-full px-3.5 py-2 border rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                    errors.falla ? 'border-red-500 bg-red-50/50' : 'border-gray-300'
                  }`}
                />
                {errors.falla && <p className="text-xs text-red-500 mt-1">{errors.falla}</p>}
              </div>

              {/* Observaciones adicionales */}
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Observaciones / Historial de Avances</label>
                <textarea
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  rows={2}
                  placeholder="Observaciones de refacciones, cotización o estado técnico..."
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Section 4: Finances (Integrated) */}
          <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-blue-800 mb-3 flex items-center gap-1">
              <DollarSign className="h-3.5 w-3.5" /> Costo del Servicio y Estado de Cobro
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Costo */}
              <div>
                <label className="block text-xs font-medium text-blue-900 mb-1">Costo de Reparación / Servicio ($ MXN)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 text-sm">$</span>
                  <input
                    type="number"
                    value={costoServicio}
                    onChange={(e) => setCostoServicio(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    min="0"
                    step="50"
                    className="w-full pl-7 pr-3.5 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
                <p className="text-[10px] text-gray-500 mt-0.5">Requerido para estadísticas financieras mensuales.</p>
              </div>

              {/* Cobrado o No */}
              <div className="flex items-center mt-5 md:mt-6">
                <label className="relative flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cobrado}
                    onChange={(e) => setCobrado(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  <span className="ml-3 text-sm font-semibold text-gray-700">
                    {cobrado ? (
                      <span className="text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">Cobrado con éxito</span>
                    ) : (
                      <span className="text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">Pendiente de Cobrar</span>
                    )}
                  </span>
                </label>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex items-center justify-end space-x-3 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="px-5 py-2 text-sm font-semibold rounded-lg text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:ring-red-300 shadow-sm transition-all cursor-pointer"
          >
            {equipoToEdit ? 'Guardar Cambios' : 'Registrar Ingreso'}
          </button>
        </div>
      </div>
    </div>
  );
}
