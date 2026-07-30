import React, { useState, useMemo } from 'react';
import { 
  Lock, Unlock, DollarSign, PiggyBank, Receipt, 
  TrendingUp, TrendingDown, Percent, Search, 
  Calendar, CheckCircle, AlertCircle, Eye, EyeOff, Check, CreditCard
} from 'lucide-react';
import { Equipo } from '../types';

interface FinancesViewProps {
  equipos: Equipo[];
  isUnlocked: boolean;
  onUnlock: () => void;
  onLock: () => void;
  onQuickPaymentToggle: (id: string) => void;
  finanzasPassword: string;
  onUpdatePassword: (newPass: string) => void;
}

export default function FinancesView({
  equipos,
  isUnlocked,
  onUnlock,
  onLock,
  onQuickPaymentToggle,
  finanzasPassword,
  onUpdatePassword
}: FinancesViewProps) {
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Local state filters for financial records table
  const [financeSearch, setFinanceSearch] = useState('');
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<'todos' | 'julio' | 'junio'>('todos');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'todos' | 'cobrados' | 'pendientes'>('todos');

  // Dynamic correct password backed by synchronized state
  const passwordValue = finanzasPassword;

  const handleUnlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === passwordValue) {
      onUnlock();
      setPasswordInput('');
      setErrorMsg('');
    } else {
      setErrorMsg('Contraseña incorrecta. Por favor, reintente.');
      setPasswordInput('');
    }
  };

  // --- DYNAMIC FINANCIAL CALCULATIONS ---
  // Today's context: July 16, 2026.
  // Current month: July 2026 (Date prefix: 2026-07)
  // Previous month: June 2026 (Date prefix: 2026-06)

  const stats = useMemo(() => {
    // Current Month (July)
    const currentMonthEquipos = equipos.filter(e => (e.fechaLlegada || '').startsWith('2026-07'));
    const currentTotal = currentMonthEquipos.reduce((sum, e) => sum + e.costoServicio, 0);
    const currentCobrado = currentMonthEquipos.filter(e => e.cobrado).reduce((sum, e) => sum + e.costoServicio, 0);
    const currentPendiente = currentTotal - currentCobrado;
    const currentCobradoCount = currentMonthEquipos.filter(e => e.cobrado).length;
    const currentTotalCount = currentMonthEquipos.length;

    // Previous Month (June)
    const prevMonthEquipos = equipos.filter(e => (e.fechaLlegada || '').startsWith('2026-06'));
    const prevTotal = prevMonthEquipos.reduce((sum, e) => sum + e.costoServicio, 0);
    const prevCobrado = prevMonthEquipos.filter(e => e.cobrado).reduce((sum, e) => sum + e.costoServicio, 0);
    const prevPendiente = prevTotal - prevCobrado;
    const prevCobradoCount = prevMonthEquipos.filter(e => e.cobrado).length;
    const prevTotalCount = prevMonthEquipos.length;

    // Comparisons
    const totalDiffPct = prevTotal > 0 ? ((currentTotal - prevTotal) / prevTotal) * 100 : 0;
    const cobradoDiffPct = prevCobrado > 0 ? ((currentCobrado - prevCobrado) / prevCobrado) * 100 : 0;

    return {
      current: {
        total: currentTotal,
        cobrado: currentCobrado,
        pendiente: currentPendiente,
        totalCount: currentTotalCount,
        cobradoCount: currentCobradoCount,
        pctCobrado: currentTotal > 0 ? (currentCobrado / currentTotal) * 100 : 0
      },
      prev: {
        total: prevTotal,
        cobrado: prevCobrado,
        pendiente: prevPendiente,
        totalCount: prevTotalCount,
        cobradoCount: prevCobradoCount,
        pctCobrado: prevTotal > 0 ? (prevCobrado / prevTotal) * 100 : 0
      },
      comparisons: {
        totalDiffPct,
        cobradoDiffPct,
        isTotalUp: currentTotal >= prevTotal,
        isCobradoUp: currentCobrado >= prevCobrado
      }
    };
  }, [equipos]);

  // Filtered ledger records
  const filteredLedger = useMemo(() => {
    return equipos
      .filter(eq => {
        // Month Filter
        if (selectedMonthFilter === 'julio' && !(eq.fechaLlegada || '').startsWith('2026-07')) return false;
        if (selectedMonthFilter === 'junio' && !(eq.fechaLlegada || '').startsWith('2026-06')) return false;

        // Status Filter
        if (selectedStatusFilter === 'cobrados' && !eq.cobrado) return false;
        if (selectedStatusFilter === 'pendientes' && eq.cobrado) return false;

        // Search text
        const text = financeSearch.toLowerCase();
        return (
          eq.nombreEquipo.toLowerCase().includes(text) ||
          eq.numeroSerie.toLowerCase().includes(text) ||
          eq.hospital.toLowerCase().includes(text)
        );
      })
      .sort((a, b) => (b.fechaLlegada || '').localeCompare(a.fechaLlegada || ''));
  }, [equipos, selectedMonthFilter, selectedStatusFilter, financeSearch]);

  // --- PASSWORD CHANGE STATES ---
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changeSuccess, setChangeSuccess] = useState('');
  const [changeError, setChangeError] = useState('');

  const handleChangePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newPassword.trim();
    if (!trimmed) {
      setChangeError('La contraseña nueva no puede estar vacía.');
      setChangeSuccess('');
      return;
    }
    if (trimmed !== confirmPassword.trim()) {
      setChangeError('Las contraseñas ingresadas no coinciden.');
      setChangeSuccess('');
      return;
    }
    
    onUpdatePassword(trimmed);
    setNewPassword('');
    setConfirmPassword('');
    setChangeSuccess('¡Contraseña actualizada exitosamente!');
    setChangeError('');
    setTimeout(() => {
      setChangeSuccess('');
      setShowChangePassword(false);
    }, 4000);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  // --- RENDERING RESTRICTED GATE (PASSWORD PROMPT) ---
  if (!isUnlocked) {
    return (
      <div id="restricted-lock-screen" className="max-w-md mx-auto my-12 bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden p-8 space-y-6 animate-in fade-in zoom-in-98">
        <div className="text-center space-y-2">
          <div className="mx-auto w-14 h-14 bg-red-50 text-red-700 rounded-full flex items-center justify-center border border-red-100">
            <Lock className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Módulo Financiero Protegido</h2>
          <p className="text-xs text-gray-500">
            Para ver los ingresos mensuales, servicios cobrados y comparativas de APB, ingresa la contraseña designada.
          </p>
        </div>

        <form onSubmit={handleUnlockSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Contraseña de Acceso</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="Ingresa la contraseña..."
                className="w-full pl-3 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-center tracking-widest font-bold"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errorMsg && <p className="text-xs text-red-500 mt-1 text-center font-semibold">{errorMsg}</p>}
          </div>

          <button
            type="submit"
            className="w-full bg-red-700 hover:bg-red-800 text-white font-bold py-2.5 rounded-lg text-sm shadow-sm transition-all cursor-pointer flex items-center justify-center space-x-2"
          >
            <Unlock className="h-4 w-4" />
            <span>Desbloquear Acceso</span>
          </button>
        </form>


      </div>
    );
  }

  // --- RENDERING FINANCIAL DATA (SUCCESSFULLY UNLOCKED) ---
  return (
    <div id="unlocked-finances-container" className="space-y-6 animate-in fade-in zoom-in-98 duration-150">
      
      {/* Upper Status Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
            <Unlock className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide bg-emerald-50 px-2 py-0.5 rounded-sm border border-emerald-100 inline-block">SESIÓN FINANCIERA ACTIVA</span>
            <p className="text-xs text-gray-500 mt-0.5">La información de ingresos y cobros se recalcula al momento.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowChangePassword(!showChangePassword)}
            className="px-4 py-2 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition-all cursor-pointer"
          >
            🔑 Cambiar Contraseña
          </button>
          <button
            onClick={onLock}
            className="px-4 py-2 text-xs font-bold text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-all cursor-pointer"
          >
            🔒 Cerrar Módulo
          </button>
        </div>
      </div>

      {/* Change Password Form Drawer */}
      {showChangePassword && (
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-md space-y-4 animate-in slide-in-from-top duration-200">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
              <Lock className="h-4 w-4 text-red-600 animate-pulse" /> Configurar Contraseña de Seguridad
            </h3>
            <button
              onClick={() => { setShowChangePassword(false); setChangeError(''); setChangeSuccess(''); }}
              className="text-xs font-bold text-gray-400 hover:text-gray-600"
            >
              Cerrar ✕
            </button>
          </div>

          <form onSubmit={handleChangePasswordSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Nueva Contraseña de Acceso</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Ingresa la nueva clave..."
                className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-bold text-center"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Confirmar Nueva Contraseña</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirma la misma clave..."
                className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-bold text-center"
              />
            </div>
            <button
              type="submit"
              className="bg-red-700 hover:bg-red-800 text-white font-bold py-2 px-4 rounded-lg text-sm transition-all shadow-sm h-[38px] cursor-pointer"
            >
              Guardar Contraseña
            </button>
          </form>
          {changeSuccess && <p className="text-xs text-emerald-600 font-bold mt-1">✓ {changeSuccess}</p>}
          {changeError && <p className="text-xs text-red-500 font-bold mt-1">✗ {changeError}</p>}
        </div>
      )}

      {/* THREE CARDS: CURRENT MONTH, PREVIOUS MONTH, COMPARISON */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Card 1: Current Month (July 2026) */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-red-600" />
              <h3 className="font-bold text-gray-900 text-base">Julio 2026 (Mes Actual)</h3>
            </div>
            <span className="text-[10px] bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full uppercase">En curso</span>
          </div>

          <div className="space-y-3">
            {/* Total Invoiced */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase">Total Facturado</p>
              <p className="text-2xl font-black text-gray-900 mt-0.5">${stats.current.total.toLocaleString()} <span className="text-xs text-gray-400 font-normal">({stats.current.totalCount} servicios)</span></p>
            </div>

            {/* Paid / Unpaid Progress split */}
            <div className="pt-2 space-y-1">
              <div className="w-full bg-red-100 h-2.5 rounded-full overflow-hidden flex">
                <div 
                  className="bg-emerald-500 h-full" 
                  style={{ width: `${stats.current.pctCobrado}%` }} 
                  title="Cobrado"
                />
              </div>
              <div className="flex justify-between text-[11px] font-semibold text-gray-500">
                <span>Cobrado: {Math.round(stats.current.pctCobrado)}%</span>
                <span>Pendiente: {Math.round(100 - stats.current.pctCobrado)}%</span>
              </div>
            </div>

            {/* Breakdown */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100">
                <p className="text-[10px] font-semibold text-emerald-800 uppercase">Cobrado</p>
                <p className="text-base font-bold text-emerald-900 mt-1">${stats.current.cobrado.toLocaleString()}</p>
                <p className="text-[9px] text-emerald-600 font-medium">{stats.current.cobradoCount} de {stats.current.totalCount} cobrados</p>
              </div>
              <div className="bg-amber-50/50 p-2.5 rounded-lg border border-amber-100">
                <p className="text-[10px] font-semibold text-amber-800 uppercase">Pendiente</p>
                <p className="text-base font-bold text-amber-950 mt-1">${stats.current.pendiente.toLocaleString()}</p>
                <p className="text-[9px] text-amber-700 font-medium">{stats.current.totalCount - stats.current.cobradoCount} por cobrar</p>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Previous Month (June 2026) */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-gray-500" />
              <h3 className="font-bold text-gray-900 text-base">Junio 2026 (Mes Anterior)</h3>
            </div>
            <span className="text-[10px] bg-gray-100 text-gray-600 font-bold px-2 py-0.5 rounded-full uppercase">Cerrado</span>
          </div>

          <div className="space-y-3">
            {/* Total Invoiced */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase">Total Facturado</p>
              <p className="text-2xl font-black text-gray-900 mt-0.5">${stats.prev.total.toLocaleString()} <span className="text-xs text-gray-400 font-normal">({stats.prev.totalCount} servicios)</span></p>
            </div>

            {/* Paid / Unpaid Progress split */}
            <div className="pt-2 space-y-1">
              <div className="w-full bg-red-100 h-2.5 rounded-full overflow-hidden flex">
                <div 
                  className="bg-emerald-500 h-full" 
                  style={{ width: `${stats.prev.pctCobrado}%` }} 
                  title="Cobrado"
                />
              </div>
              <div className="flex justify-between text-[11px] font-semibold text-gray-500">
                <span>Cobrado: {Math.round(stats.prev.pctCobrado)}%</span>
                <span>Pendiente: {Math.round(100 - stats.prev.pctCobrado)}%</span>
              </div>
            </div>

            {/* Breakdown */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100">
                <p className="text-[10px] font-semibold text-emerald-800 uppercase">Cobrado</p>
                <p className="text-base font-bold text-emerald-900 mt-1">${stats.prev.cobrado.toLocaleString()}</p>
                <p className="text-[9px] text-emerald-600 font-medium">{stats.prev.cobradoCount} de {stats.prev.totalCount} cobrados</p>
              </div>
              <div className="bg-amber-50/50 p-2.5 rounded-lg border border-amber-100">
                <p className="text-[10px] font-semibold text-amber-800 uppercase">Pendiente</p>
                <p className="text-base font-bold text-amber-950 mt-1">${stats.prev.pendiente.toLocaleString()}</p>
                <p className="text-[9px] text-amber-700 font-medium">{stats.prev.totalCount - stats.prev.cobradoCount} por cobrar</p>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Comparison Analysis */}
        <div className="bg-gradient-to-br from-[#0A122C] via-[#121E42] to-[#1E2E5C] text-white p-5 rounded-xl border-b-4 border-red-600 shadow-md flex flex-col justify-between">
          <div className="border-b border-white/10 pb-3">
            <h3 className="font-bold text-white text-base">Comparativa Mensual</h3>
            <p className="text-xs text-blue-200">Análisis porcentual: Julio vs Junio 2026</p>
          </div>

          <div className="space-y-4 my-4 flex-1 flex flex-col justify-center">
            {/* Facturado comparison */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-blue-100 font-medium uppercase">Ingresos Totales (Facturado)</p>
                <p className="text-lg font-extrabold mt-0.5">
                  ${(stats.current.total - stats.prev.total) >= 0 ? '+' : ''}
                  {(stats.current.total - stats.prev.total).toLocaleString()} MXN
                </p>
              </div>
              
              <div className={`p-2.5 rounded-xl flex items-center space-x-1 ${
                stats.comparisons.isTotalUp ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
              }`}>
                {stats.comparisons.isTotalUp ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                <span className="text-sm font-black">{Math.abs(Math.round(stats.comparisons.totalDiffPct))}%</span>
              </div>
            </div>

            <hr className="border-white/10" />

            {/* Efectivo cobrado comparison */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-blue-100 font-medium uppercase">Flujo Cobrado (Efectivo)</p>
                <p className="text-lg font-extrabold mt-0.5">
                  ${(stats.current.cobrado - stats.prev.cobrado) >= 0 ? '+' : ''}
                  {(stats.current.cobrado - stats.prev.cobrado).toLocaleString()} MXN
                </p>
              </div>

              <div className={`p-2.5 rounded-xl flex items-center space-x-1 ${
                stats.comparisons.isCobradoUp ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
              }`}>
                {stats.comparisons.isCobradoUp ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                <span className="text-sm font-black">{Math.abs(Math.round(stats.comparisons.cobradoDiffPct))}%</span>
              </div>
            </div>
          </div>

          <p className="text-[10px] text-slate-400 text-center italic">
            * El total de servicios facturados aumentó debido a un mayor ingreso de equipos de alta tecnología en Julio.
          </p>
        </div>
      </div>

      {/* LEDGER DETAILS: TABULAR VIEW OF REVENUE */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-5 space-y-4">
        
        {/* Ledger Header with filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div>
            <h3 className="font-bold text-gray-900 text-lg">Libro Mayor de Servicios APB</h3>
            <p className="text-xs text-gray-500">Consulta de costos de reparación y control instantáneo de cobro</p>
          </div>

          {/* Table Filters */}
          <div className="flex flex-wrap gap-2.5 items-center">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar equipo/serie..."
                value={financeSearch}
                onChange={(e) => setFinanceSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 border border-gray-300 rounded-md text-xs bg-gray-50 focus:bg-white focus:outline-none"
              />
            </div>

            {/* Month Filter */}
            <select
              value={selectedMonthFilter}
              onChange={(e) => setSelectedMonthFilter(e.target.value as any)}
              className="text-xs border border-gray-300 rounded-md bg-white px-2 py-1.5 focus:outline-none cursor-pointer font-semibold"
            >
              <option value="todos">Todos los meses</option>
              <option value="julio">Julio 2026 (Actual)</option>
              <option value="junio">Junio 2026 (Anterior)</option>
            </select>

            {/* Paid status Filter */}
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value as any)}
              className="text-xs border border-gray-300 rounded-md bg-white px-2 py-1.5 focus:outline-none cursor-pointer font-semibold"
            >
              <option value="todos">Todos los cobros</option>
              <option value="cobrados">Solo Cobrados</option>
              <option value="pendientes">Solo Pendientes</option>
            </select>
          </div>
        </div>

        {/* Table itself */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="p-3">Fecha Ingreso</th>
                <th className="p-3">Equipo</th>
                <th className="p-3">Hospital de Procedencia</th>
                <th className="p-3">Estado Operativo</th>
                <th className="p-3">Costo de Servicio ($)</th>
                <th className="p-3 text-center">Estado de Cobro</th>
                <th className="p-3 text-right">Interruptor de Cobro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredLedger.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-400 text-xs font-semibold">
                    No se encontraron registros financieros con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredLedger.map((eq) => (
                  <tr key={eq.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Date */}
                    <td className="p-3 font-mono text-xs text-gray-600">
                      {formatDate(eq.fechaLlegada)}
                    </td>

                    {/* Equipment Name & Serial */}
                    <td className="p-3">
                      <div className="font-bold text-gray-900">{eq.nombreEquipo}</div>
                      <div className="font-mono text-[10px] text-gray-400 mt-0.5">{eq.numeroSerie}</div>
                    </td>

                    {/* Hospital */}
                    <td className="p-3 font-semibold text-gray-700">
                      🏢 {eq.hospital}
                    </td>

                    {/* State */}
                    <td className="p-3">
                      <span className="text-[10px] font-bold uppercase tracking-wide bg-gray-100 text-gray-700 px-2 py-0.5 rounded-sm">
                        {eq.estado}
                      </span>
                    </td>

                    {/* Cost */}
                    <td className="p-3">
                      <span className="font-bold text-gray-900 text-base">
                        ${eq.costoServicio.toLocaleString()}
                      </span>
                    </td>

                    {/* Paid/Unpaid Status Label */}
                    <td className="p-3 text-center">
                      {eq.cobrado ? (
                        <span className="inline-flex items-center space-x-1 bg-emerald-100 text-emerald-800 text-xs font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-200">
                          <Check className="h-3 w-3" />
                          <span>Cobrado</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 bg-amber-100 text-amber-800 text-xs font-extrabold px-2.5 py-0.5 rounded-full border border-amber-200">
                          <AlertCircle className="h-3 w-3" />
                          <span>Pendiente</span>
                        </span>
                      )}
                    </td>

                    {/* Fast toggle checkbox row */}
                    <td className="p-3 text-right">
                      <button
                        onClick={() => onQuickPaymentToggle(eq.id)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                          eq.cobrado
                            ? 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100'
                        }`}
                        title="Haz clic para alternar el cobro"
                      >
                        {eq.cobrado ? 'Marcar Pendiente' : 'Marcar Cobrado'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex justify-between items-center text-xs text-gray-400 font-semibold pt-4">
          <span>Mostrando {filteredLedger.length} transacciones registradas.</span>
          <span className="text-gray-600 font-bold">Flujo total listado: ${(filteredLedger.reduce((sum, e) => sum + e.costoServicio, 0)).toLocaleString()} MXN</span>
        </div>
      </div>
    </div>
  );
}
