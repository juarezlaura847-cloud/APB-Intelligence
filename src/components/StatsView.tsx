import React, { useMemo } from 'react';
import { Award, ShieldCheck, Activity, Users, AlertCircle, TrendingUp, Building2, Server, HelpCircle } from 'lucide-react';
import { Equipo, ESTADOS_INFO, UBICACIONES_INFO } from '../types';

interface StatsViewProps {
  equipos: Equipo[];
}

export default function StatsView({ equipos }: StatsViewProps) {
  // 1. Calculations - Hospital with most equipments/repairs
  const hospitalStats = useMemo(() => {
    const statsMap: Record<string, { count: number; totalValue: number; paidCount: number }> = {};
    
    equipos.forEach(eq => {
      const hosp = eq.hospital.trim();
      if (!statsMap[hosp]) {
        statsMap[hosp] = { count: 0, totalValue: 0, paidCount: 0 };
      }
      statsMap[hosp].count += 1;
      statsMap[hosp].totalValue += eq.costoServicio;
      if (eq.cobrado) {
        statsMap[hosp].paidCount += 1;
      }
    });

    return Object.entries(statsMap)
      .map(([name, stat]) => ({
        name,
        count: stat.count,
        totalValue: stat.totalValue,
        paidCount: stat.paidCount,
        paidRatio: stat.count > 0 ? (stat.paidCount / stat.count) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count); // Sorted by equipment count descending
  }, [equipos]);

  // Lead hospital
  const leadHospital = hospitalStats[0] || null;

  // 2. Location Distribution (Planta Alta vs Planta Baja)
  const locationStats = useMemo(() => {
    let alta = 0;
    let baja = 0;
    equipos.forEach(eq => {
      if (eq.ubicacion === 'planta_alta') alta++;
      else baja++;
    });
    const total = equipos.length || 1;
    return {
      alta,
      baja,
      altaPct: (alta / total) * 100,
      bajaPct: (baja / total) * 100
    };
  }, [equipos]);

  // 3. Status workflow distribution
  const statusDistribution = useMemo(() => {
    const counts = {
      recepcion: 0,
      espera: 0,
      revision: 0,
      prueba: 0,
      terminado: 0,
      entregado: 0
    };
    equipos.forEach(eq => {
      if (counts[eq.estado] !== undefined) {
        counts[eq.estado]++;
      }
    });
    const total = equipos.length || 1;
    return Object.entries(counts).map(([key, count]) => ({
      key,
      count,
      pct: (count / total) * 100
    }));
  }, [equipos]);

  // 4. Collaborator Workload
  const collaboratorStats = useMemo(() => {
    const map: Record<string, { total: number; active: number; completed: number }> = {};
    equipos.forEach(eq => {
      const colab = eq.colaborador;
      if (!map[colab]) {
        map[colab] = { total: 0, active: 0, completed: 0 };
      }
      map[colab].total += 1;
      if (eq.estado === 'terminado' || eq.estado === 'entregado') {
        map[colab].completed += 1;
      } else {
        map[colab].active += 1;
      }
    });

    return Object.entries(map)
      .map(([name, stat]) => ({
        name,
        ...stat
      }))
      .sort((a, b) => b.active - a.active);
  }, [equipos]);

  // General KPIs
  const totalEquipos = equipos.length;
  const equiposEntregados = equipos.filter(e => e.estado === 'entregado').length;
  const equiposTerminados = equipos.filter(e => e.estado === 'terminado').length;
  const equiposEnTaller = totalEquipos - equiposEntregados;

  return (
    <div id="stats-view-container" className="space-y-6">
      
      {/* 4 General KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-red-50 rounded-xl text-red-600">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Total Recibidos</p>
            <h3 className="text-2xl font-extrabold text-gray-900 mt-1">{totalEquipos}</h3>
            <p className="text-[10px] text-gray-400 mt-0.5">Equipos ingresados en total</p>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Activos en Taller</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{equiposEnTaller}</h3>
            <p className="text-[10px] text-gray-400 mt-0.5">En recepción, revisión, prueba o listo</p>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Entregados</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{equiposEntregados}</h3>
            <p className="text-[10px] text-gray-400 mt-0.5">Ciclos completos de entrega</p>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Clientes / Clínicas</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{hospitalStats.length}</h3>
            <p className="text-[10px] text-gray-400 mt-0.5">Hospitales registrados activos</p>
          </div>
        </div>
      </div>

      {/* --- FEATURED SECTION: CLINIC LEADER --- */}
      {leadHospital && (
        <div className="bg-gradient-to-r from-[#0A122C] via-[#121E42] to-[#1E2E5C] rounded-2xl p-6 text-white shadow-md border-b-4 border-red-600">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start space-x-4">
              <div className="bg-yellow-500/25 p-4 rounded-2xl border border-yellow-400/30 text-yellow-300 animate-bounce">
                <Award className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold bg-yellow-400 text-yellow-950 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  HOSPITAL LÍDER DE REPARACIONES
                </span>
                <h2 className="text-2xl font-bold tracking-tight">{leadHospital.name}</h2>
                <p className="text-blue-100 text-xs max-w-xl">
                  Este es el centro hospitalario que ha ingresado la mayor cantidad de equipos biomédicos en nuestro taller para revisión técnica o mantenimiento correctivo.
                </p>
              </div>
            </div>

            {/* Micro stats for the leader */}
            <div className="bg-white/10 px-6 py-4 rounded-xl border border-white/10 text-center self-stretch md:self-auto shrink-0 min-w-[120px] flex flex-col justify-center items-center">
              <div>
                <p className="text-[10px] font-bold text-blue-200 uppercase tracking-wider">Equipos</p>
                <p className="text-3xl font-black text-white mt-1">{leadHospital.count}</p>
                <p className="text-[10px] text-blue-300 font-semibold">recibidos</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grid of details: Hospital Ranking & Location/Workload */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Hospital Ranking Table Card */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-bold text-gray-900 text-base">Frecuencia por Hospital</h3>
                <p className="text-xs text-gray-500">Listado ordenado de hospitales con mayor demanda de servicios</p>
              </div>
              <Building2 className="h-5 w-5 text-gray-400" />
            </div>

            <div className="space-y-4">
              {hospitalStats.slice(0, 6).map((item, index) => {
                const isWinner = index === 0;
                return (
                  <div key={item.name} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        isWinner 
                          ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="truncate flex-1">
                        <p className="text-xs font-bold text-gray-800 truncate">{item.name}</p>
                        {/* Custom progress bar representing proportions relative to the leader */}
                        <div className="w-full bg-gray-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${isWinner ? 'bg-yellow-500' : 'bg-blue-600'}`}
                            style={{ width: `${(item.count / (leadHospital?.count || 1)) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="text-right pl-4">
                      <span className="inline-block px-2.5 py-0.5 text-xs font-bold bg-blue-50 text-blue-700 rounded-full border border-blue-100">
                        {item.count} {item.count === 1 ? 'equipo' : 'equipos'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {hospitalStats.length > 6 && (
            <p className="text-center text-xs text-gray-400 mt-4 font-semibold">
              + {hospitalStats.length - 6} hospitales adicionales registrados.
            </p>
          )}
        </div>

        {/* Location & Workshop Metrics */}
        <div className="space-y-6">
          {/* Location Distribution Card */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
            <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-bold text-gray-900 text-base">Carga de Trabajo por Planta</h3>
                <p className="text-xs text-gray-500">Distribución física de los equipos biomédicos en el taller</p>
              </div>
              <Server className="h-5 w-5 text-gray-400" />
            </div>

            <div className="space-y-5">
              {/* Planta Alta */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-gray-700 mb-1.5">
                  <span className="flex items-center space-x-1">
                    <span className="inline-block w-3 h-3 bg-orange-500 rounded-sm" />
                    <span>Planta Alta</span>
                  </span>
                  <span>{locationStats.alta} equipos ({Math.round(locationStats.altaPct)}%)</span>
                </div>
                <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                  <div className="bg-orange-500 h-full rounded-full" style={{ width: `${locationStats.altaPct}%` }} />
                </div>
              </div>

              {/* Planta Baja */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-gray-700 mb-1.5">
                  <span className="flex items-center space-x-1">
                    <span className="inline-block w-3 h-3 bg-sky-500 rounded-sm" />
                    <span>Planta Baja</span>
                  </span>
                  <span>{locationStats.baja} equipos ({Math.round(locationStats.bajaPct)}%)</span>
                </div>
                <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                  <div className="bg-sky-500 h-full rounded-full" style={{ width: `${locationStats.bajaPct}%` }} />
                </div>
              </div>
            </div>

            <p className="text-[11px] text-gray-400 mt-4 italic">
              * Nota: Los equipos ligeros o pequeños suelen revisarse en Planta Alta, mientras que autoclaves y equipos pesados se atienden en Planta Baja.
            </p>
          </div>

          {/* Collaborator Load Card */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
            <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-bold text-gray-900 text-base">Productividad de Colaboradores</h3>
                <p className="text-xs text-gray-500">Equipos asignados y tasa de avance técnico por ingeniero</p>
              </div>
              <Users className="h-5 w-5 text-gray-400" />
            </div>

            <div className="space-y-4">
              {collaboratorStats.map(col => {
                const completionRate = col.total > 0 ? Math.round((col.completed / col.total) * 100) : 0;
                return (
                  <div key={col.name} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-gray-800">{col.name}</span>
                      <span className="text-gray-500">
                        <strong className="text-gray-900">{col.active} activos</strong> / {col.total} totales ({completionRate}% listo)
                      </span>
                    </div>
                    {/* Visual compound progress bar */}
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden flex">
                      <div 
                        title="Listos/Entregados"
                        className="bg-emerald-500 h-full" 
                        style={{ width: `${(col.completed / (col.total || 1)) * 100}%` }} 
                      />
                      <div 
                        title="En proceso activos"
                        className="bg-blue-500 h-full" 
                        style={{ width: `${(col.active / (col.total || 1)) * 100}%` }} 
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
