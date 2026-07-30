import React, { useState, useMemo } from 'react';
import { Equipo, PlantaUbicacion, ESTADOS_INFO, UBICACIONES_INFO } from '../types';
import { 
  MapPin, 
  Search, 
  ArrowLeftRight, 
  Building2, 
  User, 
  Clipboard, 
  ArrowUp, 
  ArrowDown, 
  CheckCircle,
  HelpCircle,
  Tag
} from 'lucide-react';

interface LocationTrackerProps {
  equipos: Equipo[];
  onUpdateLocation: (id: string, newUbicacion: PlantaUbicacion) => void;
}

export default function LocationTracker({ equipos, onUpdateLocation }: LocationTrackerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');

  // Filter equipment based on search term and status
  const filteredEquipos = useMemo(() => {
    return equipos.filter(eq => {
      const matchesSearch = 
        eq.nombreEquipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        eq.numeroSerie.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (eq.marca && eq.marca.toLowerCase().includes(searchTerm.toLowerCase())) ||
        eq.hospital.toLowerCase().includes(searchTerm.toLowerCase()) ||
        eq.colaborador.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'todos' || eq.estado === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [equipos, searchTerm, statusFilter]);

  // Split equipment by floor
  const plantaAltaEquipos = useMemo(() => {
    return filteredEquipos.filter(eq => eq.ubicacion === 'planta_alta');
  }, [filteredEquipos]);

  const plantaBajaEquipos = useMemo(() => {
    return filteredEquipos.filter(eq => eq.ubicacion === 'planta_baja');
  }, [filteredEquipos]);

  // Summary statistics
  const stats = useMemo(() => {
    const total = equipos.length;
    const alta = equipos.filter(eq => eq.ubicacion === 'planta_alta').length;
    const baja = equipos.filter(eq => eq.ubicacion === 'planta_baja').length;
    return { total, alta, baja };
  }, [equipos]);

  return (
    <div id="location-tracker-view" className="space-y-6">
      {/* View Header */}
      <div className="bg-gradient-to-r from-slate-900 to-blue-950 p-6 rounded-2xl border border-blue-900/40 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Building2 className="w-48 h-48 text-white" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2.5 mb-1">
              <div className="p-2 bg-red-600 rounded-lg text-white">
                <MapPin className="h-5 w-5" />
              </div>
              <h1 className="text-2xl font-black tracking-tight text-white uppercase">
                Rastreo de Planta (Alta / Baja)
              </h1>
            </div>
            <p className="text-xs text-blue-200/80 max-w-2xl font-medium">
              Supervisa en tiempo real la ubicación física de cada equipo médico. Organiza los flujos de trabajo, distribuye cargas entre plantas y mantén a todo el equipo de soporte técnico sincronizado al instante.
            </p>
          </div>
        </div>

        {/* Dynamic Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <div className="bg-[#0c1535]/80 backdrop-blur-xs p-4 rounded-xl border border-blue-900/30 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-blue-300/70 font-semibold uppercase tracking-wider">Total en Taller</p>
              <h3 className="text-2xl font-black text-white mt-1">{stats.total}</h3>
            </div>
            <div className="p-2.5 bg-blue-900/30 text-blue-400 rounded-lg">
              <Building2 className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-[#0c1535]/80 backdrop-blur-xs p-4 rounded-xl border border-orange-900/30 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-orange-400/80 font-semibold uppercase tracking-wider">Planta Alta (Electrónica/Ligeros)</p>
              <h3 className="text-2xl font-black text-orange-400 mt-1">{stats.alta}</h3>
            </div>
            <div className="p-2.5 bg-orange-900/30 text-orange-400 rounded-lg">
              <ArrowUp className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-[#0c1535]/80 backdrop-blur-xs p-4 rounded-xl border border-sky-900/30 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-sky-400/80 font-semibold uppercase tracking-wider">Planta Baja (Autoclaves/Pesados)</p>
              <h3 className="text-2xl font-black text-sky-400 mt-1">{stats.baja}</h3>
            </div>
            <div className="p-2.5 bg-sky-900/30 text-sky-400 rounded-lg">
              <ArrowDown className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Control Filters Panel */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search Input */}
        <div className="relative w-full md:w-96">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-red-600 focus:bg-white text-slate-800 placeholder-slate-400 font-medium transition-all"
            placeholder="Buscar por equipo, serie, marca o colaborador..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Status Filter Dropdown */}
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
            Filtrar por Estado:
          </label>
          <select
            className="text-xs bg-slate-50 border border-slate-200 text-slate-700 font-semibold rounded-lg px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-red-500 cursor-pointer w-full md:w-44"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="todos">Todos los Estados</option>
            <option value="recepcion">Recepción</option>
            <option value="espera">En Espera</option>
            <option value="revision">En Revisión</option>
            <option value="prueba">En Pruebas</option>
            <option value="terminado">Terminado</option>
            <option value="entregado">Entregado</option>
          </select>
        </div>
      </div>

      {/* Columns Board Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Column 1: Planta Alta */}
        <div className="bg-slate-50 rounded-2xl border-2 border-dashed border-orange-200/80 p-5 flex flex-col space-y-4">
          <div className="flex items-center justify-between border-b border-orange-100 pb-3">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-orange-500 rounded-lg text-white">
                <ArrowUp className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">Planta Alta</h2>
                <p className="text-[10px] text-orange-600 font-bold uppercase tracking-wider">Electrónica, calibraciones y ligeros</p>
              </div>
            </div>
            <span className="px-2.5 py-1 text-xs font-black bg-orange-100 text-orange-800 rounded-full">
              {plantaAltaEquipos.length} {plantaAltaEquipos.length === 1 ? 'equipo' : 'equipos'}
            </span>
          </div>

          <div className="flex-1 space-y-3.5 max-h-[600px] overflow-y-auto pr-1">
            {plantaAltaEquipos.length === 0 ? (
              <div className="h-44 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-200 rounded-xl bg-white/50">
                <HelpCircle className="w-8 h-8 text-slate-300 mb-2 animate-pulse" />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">No hay equipos en Planta Alta</p>
                <p className="text-[10px] text-slate-400 mt-1">Busca o cambia la ubicación de algún equipo para listarlo aquí.</p>
              </div>
            ) : (
              plantaAltaEquipos.map(eq => {
                const info = ESTADOS_INFO[eq.estado];
                return (
                  <div 
                    key={eq.id}
                    className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-all border-l-4 border-l-orange-500 hover:border-l-orange-600"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h4 className="font-extrabold text-slate-800 text-sm">{eq.nombreEquipo}</h4>
                        {eq.marca && <p className="text-[11px] text-slate-500 font-semibold">{eq.marca}</p>}
                      </div>
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-sm border ${info.color} ${info.bgColor} ${info.borderColor}`}>
                        {info.label}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-y-1.5 gap-x-4 mt-3 text-[11px] text-slate-600 font-medium">
                      <div className="flex items-center space-x-1.5">
                        <Tag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-mono text-slate-700">S/N: {eq.numeroSerie}</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{eq.hospital}</span>
                      </div>
                      <div className="col-span-2 flex items-center space-x-1.5 mt-0.5 pt-1.5 border-t border-slate-100">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Técnico: <strong className="text-slate-800 font-bold">{eq.colaborador}</strong></span>
                      </div>
                    </div>

                    {/* Quick Move Action */}
                    <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex justify-end">
                      <button
                        onClick={() => onUpdateLocation(eq.id, 'planta_baja')}
                        className="flex items-center space-x-1.5 text-xs font-bold text-sky-600 hover:text-sky-700 bg-sky-50 hover:bg-sky-100 px-3 py-1.5 rounded-lg transition-all cursor-pointer border border-sky-100"
                        title="Bajar equipo a Planta Baja"
                      >
                        <span>Mover a Planta Baja</span>
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Column 2: Planta Baja */}
        <div className="bg-slate-50 rounded-2xl border-2 border-dashed border-sky-200/80 p-5 flex flex-col space-y-4">
          <div className="flex items-center justify-between border-b border-sky-100 pb-3">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-sky-500 rounded-lg text-white">
                <ArrowDown className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">Planta Baja</h2>
                <p className="text-[10px] text-sky-600 font-bold uppercase tracking-wider">Autoclaves, generadores de vapor y equipos pesados</p>
              </div>
            </div>
            <span className="px-2.5 py-1 text-xs font-black bg-sky-100 text-sky-800 rounded-full">
              {plantaBajaEquipos.length} {plantaBajaEquipos.length === 1 ? 'equipo' : 'equipos'}
            </span>
          </div>

          <div className="flex-1 space-y-3.5 max-h-[600px] overflow-y-auto pr-1">
            {plantaBajaEquipos.length === 0 ? (
              <div className="h-44 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-200 rounded-xl bg-white/50">
                <HelpCircle className="w-8 h-8 text-slate-300 mb-2 animate-pulse" />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">No hay equipos en Planta Baja</p>
                <p className="text-[10px] text-slate-400 mt-1">Busca o cambia la ubicación de algún equipo para listarlo aquí.</p>
              </div>
            ) : (
              plantaBajaEquipos.map(eq => {
                const info = ESTADOS_INFO[eq.estado];
                return (
                  <div 
                    key={eq.id}
                    className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-all border-l-4 border-l-sky-500 hover:border-l-sky-600"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h4 className="font-extrabold text-slate-800 text-sm">{eq.nombreEquipo}</h4>
                        {eq.marca && <p className="text-[11px] text-slate-500 font-semibold">{eq.marca}</p>}
                      </div>
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-sm border ${info.color} ${info.bgColor} ${info.borderColor}`}>
                        {info.label}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-y-1.5 gap-x-4 mt-3 text-[11px] text-slate-600 font-medium">
                      <div className="flex items-center space-x-1.5">
                        <Tag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-mono text-slate-700">S/N: {eq.numeroSerie}</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{eq.hospital}</span>
                      </div>
                      <div className="col-span-2 flex items-center space-x-1.5 mt-0.5 pt-1.5 border-t border-slate-100">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Técnico: <strong className="text-slate-800 font-bold">{eq.colaborador}</strong></span>
                      </div>
                    </div>

                    {/* Quick Move Action */}
                    <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex justify-end">
                      <button
                        onClick={() => onUpdateLocation(eq.id, 'planta_alta')}
                        className="flex items-center space-x-1.5 text-xs font-bold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-lg transition-all cursor-pointer border border-orange-100"
                        title="Subir equipo a Planta Alta"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                        <span>Mover a Planta Alta</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
