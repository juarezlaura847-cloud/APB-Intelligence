import React, { useMemo, useState } from 'react';
import { Clock, AlertTriangle, ArrowRight, CheckCircle, Edit, ExternalLink, RefreshCw, MessageSquare } from 'lucide-react';
import { Equipo, EquipoEstado, ESTADOS_INFO } from '../types';

interface WaitingIssuesProps {
  equipos: Equipo[];
  onQuickStatusChange: (id: string, nextStatus: EquipoEstado) => void;
  onEditEquipment: (equipo: Equipo) => void;
  onUpdateObservations: (id: string, newObs: string) => void;
}

export default function WaitingIssues({
  equipos,
  onQuickStatusChange,
  onEditEquipment,
  onUpdateObservations
}: WaitingIssuesProps) {
  const [editingObsId, setEditingObsId] = useState<string | null>(null);
  const [tempObs, setTempObs] = useState('');

  // 1. Filter and sort equipment currently in 'espera' status
  const waitingEquipos = useMemo(() => {
    // Current simulated date July 16, 2026
    const currentDate = new Date('2026-07-16');

    return equipos
      .filter(eq => eq.estado === 'espera')
      .map(eq => {
        const arrival = eq.fechaLlegada ? new Date(eq.fechaLlegada) : null;
        const daysDiff = arrival && !isNaN(arrival.getTime())
          ? Math.floor((currentDate.getTime() - arrival.getTime()) / (1000 * 3600 * 24))
          : 0;
        
        let severity: 'critical' | 'warning' | 'info' = 'info';
        if (daysDiff >= 14) {
          severity = 'critical';
        } else if (daysDiff >= 7) {
          severity = 'warning';
        }

        return {
          ...eq,
          daysWaiting: daysDiff,
          severity
        };
      })
      .sort((a, b) => b.daysWaiting - a.daysWaiting); // Sort by longest wait first
  }, [equipos]);

  const stats = useMemo(() => {
    const total = waitingEquipos.length;
    const critical = waitingEquipos.filter(e => e.severity === 'critical').length;
    const warning = waitingEquipos.filter(e => e.severity === 'warning').length;
    return { total, critical, warning };
  }, [waitingEquipos]);

  const handleStartEditingObs = (id: string, currentObs: string) => {
    setEditingObsId(id);
    setTempObs(currentObs);
  };

  const handleSaveObs = (id: string) => {
    onUpdateObservations(id, tempObs);
    setEditingObsId(null);
  };

  return (
    <div id="waiting-issues-container" className="space-y-6">
      
      {/* Informative Header Banner */}
      <div className="bg-[#0A122C] text-white rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-4 border-red-600 shadow-md">
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-red-600 rounded-xl text-white shrink-0">
            <Clock className="h-6 w-6 animate-spin-slow" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">Control de Equipos en Espera Prolongada</h2>
            <p className="text-xs text-slate-200 mt-0.5 max-w-xl font-medium">
              Aquí puedes ver los equipos biomédicos que llevan más tiempo en el taller esperando diagnóstico, refacciones o aprobación de presupuesto por parte del hospital.
            </p>
          </div>
        </div>

        {/* Small stats summary */}
        <div className="flex space-x-3 shrink-0">
          <div className="bg-red-500/20 border border-red-500/30 px-4 py-2.5 rounded-xl text-center">
            <p className="text-[10px] font-bold text-red-300 uppercase">Crítico (14d+)</p>
            <p className="text-xl font-extrabold text-white mt-0.5">{stats.critical}</p>
          </div>
          <div className="bg-amber-500/20 border border-amber-500/30 px-4 py-2.5 rounded-xl text-center">
            <p className="text-[10px] font-bold text-amber-300 uppercase font-semibold">Alerta (7d+)</p>
            <p className="text-xl font-extrabold text-white mt-0.5">{stats.warning}</p>
          </div>
          <div className="bg-slate-700/50 border border-slate-600 px-4 py-2.5 rounded-xl text-center">
            <p className="text-[10px] font-bold text-slate-300 uppercase">Total Espera</p>
            <p className="text-xl font-extrabold text-white mt-0.5">{stats.total}</p>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {waitingEquipos.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center max-w-md mx-auto shadow-xs">
          <div className="mx-auto w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mb-4 text-emerald-600">
            <CheckCircle className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-gray-900">¡Excelente control operativo!</h3>
          <p className="text-xs text-gray-500 mt-1">
            No hay ningún equipo en estado "En Espera" actualmente. Todos los equipos ingresados están fluyendo correctamente en revisión, pruebas o ya listos para entregar.
          </p>
        </div>
      )}

      {/* Waiting Equipment List */}
      {waitingEquipos.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Listado por Antigüedad de Espera ({waitingEquipos.length} equipos)
          </h3>

          <div className="grid grid-cols-1 gap-4">
            {waitingEquipos.map((eq) => {
              // Decide visual styling based on severity
              let severityBadge = '';
              let cardBorder = '';
              let severityText = '';
              
              if (eq.severity === 'critical') {
                severityBadge = 'bg-red-100 text-red-700 border-red-200';
                cardBorder = 'border-red-200 hover:border-red-300 shadow-sm';
                severityText = 'Espera Crítica';
              } else if (eq.severity === 'warning') {
                severityBadge = 'bg-amber-100 text-amber-700 border-amber-200';
                cardBorder = 'border-amber-200 hover:border-amber-300';
                severityText = 'Espera Alerta';
              } else {
                severityBadge = 'bg-blue-50 text-blue-700 border-blue-100';
                cardBorder = 'border-gray-200 hover:border-gray-300';
                severityText = 'Espera Reciente';
              }

              return (
                <div 
                  key={eq.id}
                  className={`bg-white rounded-xl border p-5 transition-all ${cardBorder} flex flex-col md:flex-row gap-5 items-stretch`}
                >
                  {/* Left Column: Delay counter / status badge */}
                  <div className="md:w-[180px] shrink-0 bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col items-center justify-center text-center">
                    <Clock className={`h-8 w-8 mb-2 ${eq.severity === 'critical' ? 'text-red-500' : eq.severity === 'warning' ? 'text-amber-500' : 'text-blue-500'}`} />
                    <span className="text-2xl font-extrabold text-slate-800 leading-none">
                      {eq.daysWaiting}
                    </span>
                    <span className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wide">
                      {eq.daysWaiting === 1 ? 'Día en Espera' : 'Días en Espera'}
                    </span>
                    
                    <span className={`mt-3 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${severityBadge}`}>
                      {severityText}
                    </span>
                  </div>

                  {/* Middle Column: Details & Notes */}
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-sm font-bold">
                        {eq.numeroSerie}
                      </span>
                      <span className="text-xs text-gray-400 font-semibold">•</span>
                      <span className="text-xs text-gray-500">
                        {eq.fechaLlegada 
                          ? `Ingresó el ${new Date(eq.fechaLlegada + 'T00:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}`
                          : 'Sin fecha de ingreso'
                        }
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-gray-900 text-lg leading-tight">
                        {eq.nombreEquipo}
                      </h4>
                      <p className="text-xs font-bold text-red-700 mt-0.5">
                        🏥 {eq.hospital}
                      </p>
                    </div>

                    <div className="bg-gray-50/50 p-3 rounded-lg border border-gray-100 space-y-1">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Falla reportada:</p>
                      <p className="text-xs text-gray-700 font-semibold">{eq.falla}</p>
                    </div>

                    {/* Observations space with fast inline editor */}
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" /> Observaciones y Seguimiento Interno:
                      </p>
                      
                      {editingObsId === eq.id ? (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={tempObs}
                            onChange={(e) => setTempObs(e.target.value)}
                            className="flex-1 px-3 py-1.5 border border-red-500 rounded-lg text-xs bg-white focus:outline-none"
                            placeholder="Escribe el avance..."
                          />
                          <button
                            onClick={() => handleSaveObs(eq.id)}
                            className="bg-red-600 hover:bg-red-700 text-white font-bold px-3 py-1 rounded-lg text-xs cursor-pointer"
                          >
                            Guardar
                          </button>
                          <button
                            onClick={() => setEditingObsId(null)}
                            className="border border-gray-300 text-gray-600 font-bold px-3 py-1 rounded-lg text-xs bg-white cursor-pointer"
                          >
                            X
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between bg-yellow-50/40 p-3 rounded-lg border border-yellow-100 gap-4">
                          <p className="text-xs text-gray-600 italic">
                            "{eq.observaciones}"
                          </p>
                          <button
                            onClick={() => handleStartEditingObs(eq.id, eq.observaciones)}
                            className="text-xs text-red-600 hover:text-red-800 font-bold shrink-0 hover:underline cursor-pointer flex items-center gap-0.5"
                          >
                            <Edit className="h-3 w-3" />
                            <span>Actualizar nota</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Actions to fast track */}
                  <div className="md:w-[200px] shrink-0 flex flex-col justify-between border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-4">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Técnico Asignado</p>
                      <p className="text-xs font-bold text-gray-800">{eq.colaborador}</p>
                      <p className="text-[9px] text-gray-400">Piso de Taller: {eq.ubicacion === 'planta_alta' ? 'Planta Alta' : 'Planta Baja'}</p>
                    </div>

                    <div className="space-y-2 mt-4 md:mt-0">
                      {/* Fast action: Start Review */}
                      <button
                        onClick={() => onQuickStatusChange(eq.id, 'revision')}
                        className="w-full flex items-center justify-center space-x-1.5 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-3 rounded-lg text-xs transition-colors cursor-pointer"
                      >
                        <RefreshCw className="h-3.5 w-3.5 animate-spin-slow" />
                        <span>Pasar a Revisión</span>
                      </button>

                      {/* Full edit */}
                      <button
                        onClick={() => onEditEquipment(eq)}
                        className="w-full flex items-center justify-center space-x-1.5 border border-gray-300 text-gray-700 hover:bg-gray-50 font-bold py-2 px-3 rounded-lg text-xs transition-colors cursor-pointer"
                      >
                        <span>Ver Ficha Completa</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
