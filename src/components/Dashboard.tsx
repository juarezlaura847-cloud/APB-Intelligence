import React, { useState, useMemo } from 'react';
import { 
  Search, Plus, MapPin, Wrench, User, Calendar, 
  CheckCircle, ArrowRight, AlertTriangle, Play, Check, 
  Trash2, Edit, FilterX, Laptop, ArrowUp, ArrowDown, FileText, CheckCircle2, XCircle, QrCode
} from 'lucide-react';
import { Equipo, EquipoEstado, PlantaUbicacion, ESTADOS_INFO, ESTADOS_ORDEN, UBICACIONES_INFO } from '../types';

interface DashboardProps {
  equipos: Equipo[];
  onAddEquipment: () => void;
  onEditEquipment: (equipo: Equipo) => void;
  onDeleteEquipment: (id: string) => void;
  onQuickStatusChange: (id: string, nextStatus: EquipoEstado) => void;
  onQuickLocationChange: (id: string, nextLocation: PlantaUbicacion) => void;
  onQuickPaymentToggle: (id: string) => void;
  onShowQr: (equipo: Equipo) => void;
}

export default function Dashboard({
  equipos,
  onAddEquipment,
  onEditEquipment,
  onDeleteEquipment,
  onQuickStatusChange,
  onQuickLocationChange,
  onQuickPaymentToggle,
  onShowQr
}: DashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEstado, setSelectedEstado] = useState<string>('todos');
  const [selectedUbicacion, setSelectedUbicacion] = useState<string>('todas');
  const [selectedHospital, setSelectedHospital] = useState<string>('todos');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // List of unique hospitals for the filter dropdown
  const uniqueHospitals = useMemo(() => {
    const list = equipos.map(e => e.hospital.trim());
    return ['todos', ...Array.from(new Set(list))];
  }, [equipos]);

  // General Status Counts (Helper for filter widgets)
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      todos: equipos.length,
      recepcion: 0,
      espera: 0,
      revision: 0,
      prueba: 0,
      terminado: 0,
      entregado: 0,
    };
    equipos.forEach(eq => {
      if (counts[eq.estado] !== undefined) {
        counts[eq.estado]++;
      }
    });
    return counts;
  }, [equipos]);

  // Filter & Search Logic
  const filteredEquipos = useMemo(() => {
    return equipos.filter((eq) => {
      // Search text
      const matchesSearch = 
        eq.nombreEquipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        eq.numeroSerie.toLowerCase().includes(searchTerm.toLowerCase()) ||
        eq.hospital.toLowerCase().includes(searchTerm.toLowerCase()) ||
        eq.colaborador.toLowerCase().includes(searchTerm.toLowerCase()) ||
        eq.falla.toLowerCase().includes(searchTerm.toLowerCase());

      // Estado filter
      const matchesEstado = selectedEstado === 'todos' || eq.estado === selectedEstado;

      // Ubicacion filter
      const matchesUbicacion = selectedUbicacion === 'todas' || eq.ubicacion === selectedUbicacion;

      // Hospital filter
      const matchesHospital = selectedHospital === 'todos' || eq.hospital.trim() === selectedHospital;

      return matchesSearch && matchesEstado && matchesUbicacion && matchesHospital;
    });
  }, [equipos, searchTerm, selectedEstado, selectedUbicacion, selectedHospital]);

  // Format date helper
  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  // Status index helper for workflow advance
  const getNextStatus = (currentStatus: EquipoEstado): EquipoEstado | null => {
    const currentIndex = ESTADOS_ORDEN.indexOf(currentStatus);
    if (currentIndex < ESTADOS_ORDEN.length - 1) {
      return ESTADOS_ORDEN[currentIndex + 1];
    }
    return null;
  };

  // Helper to check if equipment is in waiting for over 7 days
  const isDelayedInWaiting = (eq: Equipo) => {
    if (eq.estado !== 'espera') return false;
    if (!eq.fechaLlegada) return false;
    const arrivalDate = new Date(eq.fechaLlegada);
    // Use system's current simulated date July 16, 2026 for comparison
    const currentDate = new Date('2026-07-16');
    const timeDiff = currentDate.getTime() - arrivalDate.getTime();
    const daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24));
    return daysDiff >= 7;
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedEstado('todos');
    setSelectedUbicacion('todas');
    setSelectedHospital('todos');
  };

  return (
    <div id="dashboard-view" className="space-y-6">
      
      {/* Banner / Quick Actions */}
      <div className="bg-gradient-to-r from-[#850A0A] via-[#991B1B] to-[#B91C1C] text-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6 border-b-4 border-[#0A122C]">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="bg-[#0A122C] text-white px-2.5 py-1 text-xs font-black rounded-md uppercase tracking-wider">
              Seguimiento interno del control de equipos
            </span>
          </div>
          <p className="text-slate-200 text-xs max-w-xl font-medium pt-1">
            Control de flujo operativo, estados de revisión, asignación de taller en Planta Alta/Baja y cobros de APB.
          </p>
        </div>
        <button
          id="btn-nuevo-equipo"
          onClick={onAddEquipment}
          className="flex items-center justify-center space-x-2 bg-[#0A122C] hover:bg-[#121E42] text-white font-extrabold px-5 py-3 rounded-xl shadow-md transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer self-start md:self-auto shrink-0 border border-slate-800"
        >
          <Plus className="h-5 w-5" />
          <span>Registrar Nuevo Equipo</span>
        </button>
      </div>

      {/* Interactive Flow Filter Widgets (Click to filter status) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2.5">
        <button
          onClick={() => setSelectedEstado('todos')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            selectedEstado === 'todos'
              ? 'bg-red-700 text-white border-red-700 shadow-md'
              : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700'
          }`}
        >
          <p className="text-[10px] font-bold opacity-80 uppercase tracking-wider">Total Equipos</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-extrabold">{statusCounts.todos}</span>
            <span className={`text-xs px-1.5 py-0.5 rounded-md font-bold ${selectedEstado === 'todos' ? 'bg-[#0A122C] text-white' : 'bg-slate-100 text-slate-700'}`}>Ver</span>
          </div>
        </button>

        {ESTADOS_ORDEN.map((est) => {
          const info = ESTADOS_INFO[est];
          const isSelected = selectedEstado === est;
          return (
            <button
              key={est}
              onClick={() => setSelectedEstado(est)}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                isSelected
                  ? 'bg-white ring-2 ring-[#0A122C] border-[#0A122C] shadow-sm'
                  : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
            >
              <p className={`text-[10px] font-bold uppercase tracking-wider ${isSelected ? 'text-[#0A122C]' : 'text-gray-500'}`}>
                {info.label}
              </p>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-xl font-extrabold text-gray-900">{statusCounts[est]}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${info.bgColor} ${info.color}`}>
                  {info.label.split(' ')[0]}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Search, Filter Tools Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por equipo, serie, hospital, colaborador, falla..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0A122C]/20 focus:border-[#0A122C] transition-all"
            />
          </div>

          {/* Filtering Dropdowns */}
          <div className="flex flex-wrap gap-2.5 items-center">
            {/* Ubicación Filter */}
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-bold text-gray-500">Ubicación:</span>
              <select
                value={selectedUbicacion}
                onChange={(e) => setSelectedUbicacion(e.target.value)}
                className="text-xs font-semibold border border-gray-300 bg-white rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#0A122C]/20 focus:border-[#0A122C] cursor-pointer"
              >
                <option value="todas">Todas</option>
                <option value="planta_baja">Planta Baja</option>
                <option value="planta_alta">Planta Alta</option>
              </select>
            </div>

            {/* Hospital Filter */}
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-bold text-gray-500">Hospital:</span>
              <select
                value={selectedHospital}
                onChange={(e) => setSelectedHospital(e.target.value)}
                className="text-xs font-semibold border border-gray-300 bg-white rounded-md max-w-[160px] px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#0A122C]/20 focus:border-[#0A122C] cursor-pointer"
              >
                {uniqueHospitals.map(hosp => (
                  <option key={hosp} value={hosp}>
                    {hosp === 'todos' ? 'Todos los Hospitales' : hosp}
                  </option>
                ))}
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-0.5 border border-gray-200">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  viewMode === 'grid' ? 'bg-red-700 text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Cuadrícula
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  viewMode === 'list' ? 'bg-red-700 text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Lista
              </button>
            </div>

            {/* Clear Filters (Visible only if filtered/searched) */}
            {(searchTerm || selectedEstado !== 'todos' || selectedUbicacion !== 'todas' || selectedHospital !== 'todos') && (
              <button
                onClick={clearFilters}
                className="flex items-center space-x-1 text-xs font-semibold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <FilterX className="h-3.5 w-3.5" />
                <span>Limpiar</span>
              </button>
            )}
          </div>
        </div>

        {/* Status of filtered list */}
        <div className="text-xs text-gray-500 font-medium">
          Mostrando <span className="font-bold text-gray-700">{filteredEquipos.length}</span> equipos de {equipos.length} registros totales.
        </div>
      </div>

      {/* Empty State */}
      {equipos.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center max-w-xl mx-auto space-y-5 shadow-xs">
          <div className="mx-auto w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
            <Laptop className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-gray-900">¡Te damos la bienvenida a APB Biomédica!</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
              No hay ningún equipo biomédico registrado en el sistema actualmente. Comienza registrando tu primer equipo para gestionar el flujo técnico, ubicación de taller e ingresos financieros.
            </p>
          </div>
          <button
            onClick={onAddEquipment}
            className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2.5 px-5 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Registrar Primer Equipo</span>
          </button>
        </div>
      ) : filteredEquipos.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-12 text-center max-w-xl mx-auto">
          <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Search className="h-6 w-6 text-gray-400" />
          </div>
          <h3 className="text-base font-semibold text-gray-900">No se encontraron equipos</h3>
          <p className="text-xs text-gray-500 mt-1">
            Intenta cambiar los filtros o el texto de búsqueda. También puedes registrar un nuevo equipo.
          </p>
          <button
            onClick={clearFilters}
            className="mt-4 text-xs font-semibold text-blue-600 hover:text-blue-800 underline cursor-pointer"
          >
            Restaurar todos los filtros
          </button>
        </div>
      ) : null}

      {/* --- GRID VIEW MODE --- */}
      {viewMode === 'grid' && filteredEquipos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredEquipos.map((eq) => {
            const currentStatusInfo = ESTADOS_INFO[eq.estado];
            const currentUbicacionInfo = UBICACIONES_INFO[eq.ubicacion];
            const nextStatus = getNextStatus(eq.estado);
            const isDelayed = isDelayedInWaiting(eq);

            return (
              <div 
                key={eq.id}
                className={`bg-white rounded-xl border transition-all hover:shadow-md flex flex-col justify-between overflow-hidden ${
                  isDelayed ? 'border-red-300 ring-2 ring-red-50' : 'border-gray-200'
                }`}
              >
                {/* Card Top Header */}
                <div className="bg-gray-50/75 px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-gray-500">
                    {eq.numeroSerie}
                  </span>

                  <div className="flex items-center space-x-1.5">
                    {/* Delayed badge */}
                    {isDelayed && (
                      <span className="flex items-center space-x-0.5 bg-red-100 text-red-700 text-[10px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wide animate-pulse">
                        <AlertTriangle className="h-3 w-3" />
                        <span>Retrasado</span>
                      </span>
                    )}

                    {/* Floor badge with action */}
                    <button
                      onClick={() => onQuickLocationChange(eq.id, eq.ubicacion === 'planta_baja' ? 'planta_alta' : 'planta_baja')}
                      title="Haz clic para cambiar de planta"
                      className={`flex items-center space-x-1 px-2 py-0.5 rounded-sm text-[10px] font-bold transition-all hover:opacity-90 cursor-pointer ${currentUbicacionInfo.bgColor} ${currentUbicacionInfo.color}`}
                    >
                      {eq.ubicacion === 'planta_alta' ? (
                        <ArrowUp className="h-3 w-3 text-orange-600" />
                      ) : (
                        <ArrowDown className="h-3 w-3 text-sky-600" />
                      )}
                      <span>{currentUbicacionInfo.label}</span>
                    </button>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 flex-1 space-y-3">
                  {/* Title & Hospital */}
                  <div>
                    <h4 className="font-bold text-gray-900 text-base leading-tight">
                      {eq.nombreEquipo}
                    </h4>
                    <div className="text-xs text-gray-500 font-semibold mt-0.5">
                      Marca: <span className="text-gray-800 font-bold">{eq.marca || 'Por definir'}</span>
                    </div>
                    <p className="text-xs font-bold text-[#0A122C] bg-blue-50/70 inline-block px-2 py-0.5 rounded-md mt-1 border border-blue-100/50">
                      🏥 {eq.hospital}
                    </p>
                  </div>

                  {/* Falla */}
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider text-[9px]">Falla reportada:</p>
                    <p className="text-xs font-semibold text-slate-800 mt-0.5 line-clamp-2" title={eq.falla}>
                      {eq.falla}
                    </p>
                  </div>

                  {/* Accesorios & Recepción */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-400 font-medium">Accesorios:</span>
                      <p className="font-semibold text-gray-700 truncate" title={eq.accesorios}>
                        {eq.accesorios}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-400 font-medium">Recibido por:</span>
                      <p className="font-semibold text-gray-700 truncate" title={eq.recibidoPor}>
                        {eq.recibidoPor.split(' ')[0]}
                      </p>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="flex items-center justify-between text-xs text-gray-500 border-t border-dashed border-gray-100 pt-2.5">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3.5 w-3.5 text-gray-400" />
                      <span>Ingreso: <strong className="text-gray-700 font-semibold">{formatDate(eq.fechaLlegada)}</strong></span>
                    </div>
                    {eq.fechaTermino && (
                      <div className="flex items-center space-x-1">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        <span>Listo: <strong className="text-emerald-700 font-semibold">{formatDate(eq.fechaTermino)}</strong></span>
                      </div>
                    )}
                  </div>

                  {/* Assigned Collaborator */}
                  <div className="flex items-center justify-between bg-gray-50 p-2 rounded-lg border border-gray-100">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-[#0A122C] flex items-center justify-center text-[10px] font-bold">
                        {eq.colaborador.split(' ').pop()?.substring(0, 2) || 'CQ'}
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 font-medium leading-none">Colaborador</p>
                        <p className="text-xs font-bold text-gray-700 mt-0.5 leading-tight">{eq.colaborador}</p>
                      </div>
                    </div>

                    {/* Cobrado quick action */}
                    <button
                      onClick={() => onQuickPaymentToggle(eq.id)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md border cursor-pointer transition-all ${
                        eq.cobrado
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                      }`}
                    >
                      {eq.cobrado ? '✓ Cobrado' : '$ Pendiente'}
                    </button>
                  </div>

                  {/* Mini-workflow Progress Bar Visual */}
                  <div className="pt-1.5 space-y-1">
                    <div className="flex justify-between text-[9px] font-bold text-gray-400 uppercase tracking-wide">
                      <span>Proceso actual</span>
                      <span className={`${currentStatusInfo.color}`}>{currentStatusInfo.label}</span>
                    </div>
                    {/* Visual dot track */}
                    <div className="flex items-center justify-between gap-1">
                      {ESTADOS_ORDEN.map((est, idx) => {
                        const currentIdx = ESTADOS_ORDEN.indexOf(eq.estado);
                        let dotBg = 'bg-gray-200';
                        if (idx < currentIdx) dotBg = 'bg-red-700'; // past (Red)
                        if (idx === currentIdx) dotBg = ESTADOS_INFO[eq.estado].color.replace('text-', 'bg-'); // present
                        return (
                          <div 
                            key={est} 
                            className={`h-2 flex-1 rounded-full ${dotBg}`}
                            title={ESTADOS_INFO[est].label}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="bg-gray-50 px-4 py-3 border-t border-gray-100 flex items-center justify-between">
                  {/* Edit/Delete/QR */}
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => onShowQr(eq)}
                      className="p-1.5 text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                      title="Código QR"
                    >
                      <QrCode className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onEditEquipment(eq)}
                      className="p-1.5 text-gray-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                      title="Editar registro completo"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDeleteEquipment(eq.id)}
                      className="p-1.5 text-gray-500 hover:text-[#0A122C] hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                      title="Eliminar de la base de datos"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Flow progression action */}
                  {nextStatus ? (
                    <button
                      onClick={() => onQuickStatusChange(eq.id, nextStatus)}
                      className="flex items-center space-x-1 text-xs font-bold text-white bg-red-700 hover:bg-red-800 px-3 py-1.5 rounded-lg transition-all cursor-pointer shadow-sm"
                    >
                      <span>Avanzar a {ESTADOS_INFO[nextStatus].label}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  ) : (
                    <span className="flex items-center space-x-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-lg">
                      <Check className="h-3.5 w-3.5" />
                      <span>Ciclo Entregado</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* --- LIST VIEW MODE --- */}
      {viewMode === 'list' && filteredEquipos.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="p-4">Serie / Equipo</th>
                  <th className="p-4">Hospital de Procedencia</th>
                  <th className="p-4">Falla Reportada</th>
                  <th className="p-4">Estado</th>
                  <th className="p-4">Ubicación</th>
                  <th className="p-4">Colaborador</th>
                  <th className="p-4">Fecha Ingreso</th>
                  <th className="p-4">Costo / Cobro</th>
                  <th className="p-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredEquipos.map((eq) => {
                  const statusInfo = ESTADOS_INFO[eq.estado];
                  const ubiInfo = UBICACIONES_INFO[eq.ubicacion];
                  const nextStatus = getNextStatus(eq.estado);

                  return (
                    <tr key={eq.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Name & Serial */}
                      <td className="p-4">
                        <div className="font-bold text-gray-900">{eq.nombreEquipo}</div>
                        <div className="text-[11px] font-semibold text-gray-500 mt-0.5">Marca: {eq.marca || 'Por definir'}</div>
                        <div className="font-mono text-[10px] text-gray-400 mt-0.5">{eq.numeroSerie}</div>
                      </td>

                      {/* Hospital */}
                      <td className="p-4">
                        <span className="font-semibold text-gray-700">🏢 {eq.hospital}</span>
                      </td>

                      {/* Falla */}
                      <td className="p-4 max-w-[200px]">
                        <p className="text-xs text-gray-600 line-clamp-2" title={eq.falla}>
                          {eq.falla}
                        </p>
                      </td>

                      {/* Estado */}
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${statusInfo.bgColor} ${statusInfo.color} ${statusInfo.borderColor}`}>
                          {statusInfo.label}
                        </span>
                      </td>

                      {/* Ubicación */}
                      <td className="p-4">
                        <button
                          onClick={() => onQuickLocationChange(eq.id, eq.ubicacion === 'planta_baja' ? 'planta_alta' : 'planta_baja')}
                          className={`text-xs font-bold px-2 py-1 rounded-sm border cursor-pointer hover:opacity-80 transition-all ${ubiInfo.bgColor} ${ubiInfo.color}`}
                        >
                          {ubiInfo.label}
                        </button>
                      </td>

                      {/* Colaborador */}
                      <td className="p-4 text-xs font-semibold text-gray-700">
                        {eq.colaborador}
                      </td>

                      {/* Fecha de Llegada */}
                      <td className="p-4 text-xs font-mono text-gray-600">
                        {formatDate(eq.fechaLlegada)}
                      </td>

                      {/* Costo & Cobro */}
                      <td className="p-4">
                        <div className="font-bold text-gray-900">${eq.costoServicio.toLocaleString()}</div>
                        <button
                          onClick={() => onQuickPaymentToggle(eq.id)}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md mt-1 cursor-pointer block text-center ${
                            eq.cobrado
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {eq.cobrado ? 'Cobrado' : 'Pendiente'}
                        </button>
                      </td>

                      {/* Acciones */}
                      <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => onShowQr(eq)}
                          className="p-1 text-blue-700 hover:bg-blue-50 rounded-md inline-block cursor-pointer"
                          title="Código QR"
                        >
                          <QrCode className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onEditEquipment(eq)}
                          className="p-1 text-gray-500 hover:text-blue-700 hover:bg-blue-50 rounded-md inline-block cursor-pointer"
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onDeleteEquipment(eq.id)}
                          className="p-1 text-gray-500 hover:text-[#0A122C] hover:bg-blue-50 rounded-md inline-block cursor-pointer"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>

                        {nextStatus ? (
                          <button
                            onClick={() => onQuickStatusChange(eq.id, nextStatus)}
                            className="text-xs font-bold bg-red-700 text-white px-2.5 py-1 rounded-md hover:bg-red-800 transition-colors inline-block cursor-pointer"
                            title={`Avanzar a ${ESTADOS_INFO[nextStatus].label}`}
                          >
                            →
                          </button>
                        ) : (
                          <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded-sm inline-block">
                            ✓
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
