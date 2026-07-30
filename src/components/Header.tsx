import React, { useState } from 'react';
import { Activity, ShieldAlert, BarChart3, Lock, Database, Menu, X, MapPin, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isUnlocked: boolean;
  lockFinances: () => void;
  totalActiveCount: number;
  totalDelayedCount: number;
  isConfigUnlocked: boolean;
  lockConfig: () => void;
  isOnline: boolean;
}

export default function Header({
  activeTab,
  setActiveTab,
  isUnlocked,
  lockFinances,
  totalActiveCount,
  totalDelayedCount,
  isConfigUnlocked,
  lockConfig,
  isOnline
}: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
    setIsOpen(false);
  };

  return (
    <header id="apb-header" className="bg-[#0A122C] border-b-4 border-red-600 sticky top-0 z-40 shadow-lg text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3.5">
          {/* Branding with Connection Badge */}
          <div className="flex items-center space-x-3.5">
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-black text-3xl tracking-widest text-white select-none">APB</span>
              </div>
              <p className="text-[10px] md:text-xs text-blue-200 font-semibold uppercase tracking-wider">
                asesoría & Pluriservicios Biomédicos
              </p>
            </div>

            {/* Elegant Status indicator */}
            <div className={`flex items-center space-x-1.5 px-2 py-1 rounded-full text-[10px] font-bold border transition-all duration-300 select-none ${
              isOnline 
                ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400' 
                : 'bg-amber-500/10 border-amber-500/25 text-amber-400 animate-pulse'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-amber-400 shadow-[0_0_8px_#fbbf24]'}`} />
              <span className="hidden sm:inline">{isOnline ? 'Sincronizado' : 'Sin conexión (Modo Local)'}</span>
              <span className="sm:hidden">{isOnline ? 'Online' : 'Local'}</span>
            </div>
          </div>

          {/* Desktop Horizontal Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1 bg-[#10193b] p-1 rounded-xl border border-blue-900/40">
            <button
              onClick={() => handleTabClick('seguimiento')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'seguimiento'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-blue-200 hover:text-white hover:bg-[#1b2857]'
              }`}
            >
              <Activity className="h-3.5 w-3.5 text-blue-300" />
              <span>Seguimiento</span>
              {totalActiveCount > 0 && (
                <span className={`px-1.5 py-0.2 text-[9px] font-bold rounded-full ${
                  activeTab === 'seguimiento' ? 'bg-white text-red-600' : 'bg-red-600 text-white'
                }`}>
                  {totalActiveCount}
                </span>
              )}
            </button>

            <button
              onClick={() => handleTabClick('showroom')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'showroom'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-blue-200 hover:text-white hover:bg-[#1b2857]'
              }`}
            >
              <Package className="h-3.5 w-3.5 text-blue-300" />
              <span>Show Room</span>
            </button>

            <button
              onClick={() => handleTabClick('estadisticas')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'estadisticas'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-blue-200 hover:text-white hover:bg-[#1b2857]'
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5 text-blue-300" />
              <span>Estadísticas</span>
            </button>

            <button
              onClick={() => handleTabClick('ubicacion')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'ubicacion'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-blue-200 hover:text-white hover:bg-[#1b2857]'
              }`}
            >
              <MapPin className="h-3.5 w-3.5 text-blue-300" />
              <span>Ubicación</span>
            </button>

            <button
              onClick={() => handleTabClick('espera')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'espera'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-blue-200 hover:text-white hover:bg-[#1b2857]'
              }`}
            >
              <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />
              <span>Espera</span>
              {totalDelayedCount > 0 && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[8px] font-bold text-white">
                  {totalDelayedCount}
                </span>
              )}
            </button>

            <button
              onClick={() => handleTabClick('finanzas')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'finanzas'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-blue-200 hover:text-white hover:bg-[#1b2857]'
              }`}
            >
              <Lock className={`h-3.5 w-3.5 ${isUnlocked ? 'text-emerald-400' : 'text-slate-400'}`} />
              <span>Finanzas</span>
              {isUnlocked && (
                <span className="px-1 py-0.2 text-[8px] bg-emerald-600 text-white rounded-xs font-bold uppercase">
                  Abierto
                </span>
              )}
            </button>

            <button
              onClick={() => handleTabClick('config')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'config'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-blue-200 hover:text-white hover:bg-[#1b2857]'
              }`}
            >
              <Lock className={`h-3.5 w-3.5 ${isConfigUnlocked ? 'text-emerald-400' : 'text-slate-400'}`} />
              <span>Catálogos</span>
              {isConfigUnlocked && (
                <span className="px-1 py-0.2 text-[8px] bg-emerald-600 text-white rounded-xs font-bold uppercase">
                  Abierto
                </span>
              )}
            </button>
          </nav>

          {/* Three Lines Hamburger Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2.5 bg-[#121E42] text-white rounded-xl border border-blue-900/50 hover:bg-red-600 hover:border-red-600 hover:text-white transition-all cursor-pointer focus:outline-none flex items-center justify-center z-50 shrink-0"
            aria-label="Menú de navegación"
            title="Menú"
          >
            {isOpen ? <X className="h-6 w-6 text-red-500" /> : <Menu className="h-6 w-6 text-blue-300" />}
          </button>
        </div>
      </div>

      {/* Side Drawer Menu Navigation */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 cursor-pointer"
            />

            {/* Slide-out Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 220 }}
              className="fixed top-0 right-0 h-full w-full max-w-sm bg-[#0C1535] border-l-4 border-red-600 z-50 shadow-2xl p-6 flex flex-col justify-between overflow-y-auto"
            >
              {/* Header inside Menu */}
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-blue-900/50 pb-4">
                  <div>
                    <span className="font-black text-2xl tracking-widest text-white">APB</span>
                    <p className="text-[9px] text-blue-300 uppercase tracking-wider">Menú de Navegación</p>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 hover:bg-red-600/20 hover:text-red-500 rounded-lg border border-transparent hover:border-red-500/20 transition-all cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Vertical Tabs navigation */}
                <div className="flex flex-col space-y-2.5">
                  <button
                    id="menu-tab-seguimiento"
                    onClick={() => handleTabClick('seguimiento')}
                    className={`flex items-center justify-between px-4 py-3 text-sm font-bold rounded-xl transition-all cursor-pointer w-full text-left ${
                      activeTab === 'seguimiento'
                        ? 'bg-red-600 text-white shadow-md'
                        : 'text-blue-100 hover:text-white hover:bg-[#121E42]'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Activity className={`h-5 w-5 ${activeTab === 'seguimiento' ? 'text-white' : 'text-blue-300'}`} />
                      <span>Seguimiento</span>
                    </div>
                    {totalActiveCount > 0 && (
                      <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                        activeTab === 'seguimiento' ? 'bg-white text-red-600' : 'bg-red-600 text-white'
                      }`}>
                        {totalActiveCount}
                      </span>
                    )}
                  </button>

                  <button
                    id="menu-tab-showroom"
                    onClick={() => handleTabClick('showroom')}
                    className={`flex items-center space-x-3 px-4 py-3 text-sm font-bold rounded-xl transition-all cursor-pointer w-full text-left ${
                      activeTab === 'showroom'
                        ? 'bg-red-600 text-white shadow-md'
                        : 'text-blue-100 hover:text-white hover:bg-[#121E42]'
                    }`}
                  >
                    <Package className={`h-5 w-5 ${activeTab === 'showroom' ? 'text-white' : 'text-blue-300'}`} />
                    <span>Show Room</span>
                  </button>

                  <button
                    id="menu-tab-estadisticas"
                    onClick={() => handleTabClick('estadisticas')}
                    className={`flex items-center space-x-3 px-4 py-3 text-sm font-bold rounded-xl transition-all cursor-pointer w-full text-left ${
                      activeTab === 'estadisticas'
                        ? 'bg-red-600 text-white shadow-md'
                        : 'text-blue-100 hover:text-white hover:bg-[#121E42]'
                    }`}
                  >
                    <BarChart3 className={`h-5 w-5 ${activeTab === 'estadisticas' ? 'text-white' : 'text-blue-300'}`} />
                    <span>Estadísticas</span>
                  </button>

                  <button
                    id="menu-tab-ubicacion"
                    onClick={() => handleTabClick('ubicacion')}
                    className={`flex items-center space-x-3 px-4 py-3 text-sm font-bold rounded-xl transition-all cursor-pointer w-full text-left ${
                      activeTab === 'ubicacion'
                        ? 'bg-red-600 text-white shadow-md'
                        : 'text-blue-100 hover:text-white hover:bg-[#121E42]'
                    }`}
                  >
                    <MapPin className={`h-5 w-5 ${activeTab === 'ubicacion' ? 'text-white' : 'text-blue-300'}`} />
                    <span>Ubicación de Equipos</span>
                  </button>

                  <button
                    id="menu-tab-espera"
                    onClick={() => handleTabClick('espera')}
                    className={`flex items-center justify-between px-4 py-3 text-sm font-bold rounded-xl transition-all cursor-pointer w-full text-left relative ${
                      activeTab === 'espera'
                        ? 'bg-red-600 text-white shadow-md'
                        : 'text-blue-100 hover:text-white hover:bg-[#121E42]'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <ShieldAlert className="h-5 w-5 text-amber-400" />
                      <span>Espera Prolongada</span>
                    </div>
                    {totalDelayedCount > 0 && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
                        {totalDelayedCount}
                      </span>
                    )}
                  </button>

                  <button
                    id="menu-tab-finanzas"
                    onClick={() => handleTabClick('finanzas')}
                    className={`flex items-center justify-between px-4 py-3 text-sm font-bold rounded-xl transition-all cursor-pointer w-full text-left ${
                      activeTab === 'finanzas'
                        ? 'bg-red-600 text-white shadow-md'
                        : 'text-blue-100 hover:text-white hover:bg-[#121E42]'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Lock className={`h-5 w-5 ${isUnlocked ? 'text-emerald-400' : 'text-slate-400'}`} />
                      <span>Área Financiera</span>
                    </div>
                    {isUnlocked && (
                      <span className="px-1.5 py-0.5 text-[9px] bg-red-600 text-white rounded-sm font-bold uppercase tracking-wider">
                        Abierto
                      </span>
                    )}
                  </button>

                  <button
                    id="menu-tab-config"
                    onClick={() => handleTabClick('config')}
                    className={`flex items-center justify-between px-4 py-3 text-sm font-bold rounded-xl transition-all cursor-pointer w-full text-left ${
                      activeTab === 'config'
                        ? 'bg-red-600 text-white shadow-md'
                        : 'text-blue-100 hover:text-white hover:bg-[#121E42]'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Lock className={`h-5 w-5 ${isConfigUnlocked ? 'text-emerald-400' : 'text-slate-400'}`} />
                      <span>Catálogos & Respaldos</span>
                    </div>
                    {isConfigUnlocked && (
                      <span className="px-1.5 py-0.5 text-[9px] bg-red-600 text-white rounded-sm font-bold uppercase tracking-wider">
                        Abierto
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Menu Footer */}
              <div className="border-t border-blue-900/50 pt-4 text-center text-[10px] text-blue-300/60 font-semibold uppercase tracking-wider space-y-1">
                <p>APB</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
