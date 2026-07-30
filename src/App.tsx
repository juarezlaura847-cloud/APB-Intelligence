import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import EquipmentModal from './components/EquipmentModal';
import StatsView from './components/StatsView';
import WaitingIssues from './components/WaitingIssues';
import FinancesView from './components/FinancesView';
import BackupRestore from './components/BackupRestore';
import LocationTracker from './components/LocationTracker';
import QrModal from './components/QrModal';
import SplashScreen from './components/SplashScreen';
import { Equipo, EquipoEstado, PlantaUbicacion, ShowroomEquipo } from './types';
import ShowroomView from './components/ShowroomView';
import { SEED_EQUIPOS, SEED_SHOWROOM_EQUIPOS } from './data';
import { CheckCircle, AlertCircle, ShieldAlert, Heart, Calendar, Activity, Trash2, AlertTriangle } from 'lucide-react';

interface ScannedEquipment {
  id?: string;
  nombreEquipo: string;
  marca: string;
  hospital: string;
  numeroSerie: string;
  recibidoPor: string;
  falla: string;
  accesorios: string;
  fechaLlegada: string;
  estado?: string;
  observaciones?: string;
  ubicacion?: string;
}

export default function App() {
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [showWelcomeToast, setShowWelcomeToast] = useState<boolean>(false);
 const [equipos, setEquipos] = useState<Equipo[]>(() => {
    try {
      const saved = localStorage.getItem('apb_equipos');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showroomEquipos, setShowroomEquipos] = useState<ShowroomEquipo[]>(() => {
    try {
      const saved = localStorage.getItem('apb_showroom_equipos');
      return saved ? JSON.parse(saved) : SEED_SHOWROOM_EQUIPOS;
    } catch {
      return SEED_SHOWROOM_EQUIPOS;
    }
  });
  const [colaboradores, setColaboradores] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('apb_colaboradores');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [recibidos, setRecibidos] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('apb_recibidos');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [activeTab, setActiveTab] = useState<string>('seguimiento');
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    return sessionStorage.getItem('apb_finanzas_unlocked') === 'true';
  });
  const [isConfigUnlocked, setIsConfigUnlocked] = useState<boolean>(() => {
    return sessionStorage.getItem('apb_config_unlocked') === 'true';
  });

  const handleUnlockFinances = () => {
    setIsUnlocked(true);
    sessionStorage.setItem('apb_finanzas_unlocked', 'true');
  };

  const handleLockFinances = () => {
    setIsUnlocked(false);
    sessionStorage.removeItem('apb_finanzas_unlocked');
  };

  const handleUnlockConfig = () => {
    setIsConfigUnlocked(true);
    sessionStorage.setItem('apb_config_unlocked', 'true');
  };

  const handleLockConfig = () => {
    setIsConfigUnlocked(false);
    sessionStorage.removeItem('apb_config_unlocked');
  };
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [equipoToEdit, setEquipoToEdit] = useState<Equipo | null>(null);
  const [equipoToDelete, setEquipoToDelete] = useState<Equipo | null>(null);
  const [qrEquipment, setQrEquipment] = useState<Equipo | null>(null);
  const [scannedEquipment, setScannedEquipment] = useState<ScannedEquipment | null>(null);

  const [finanzasPassword, setFinanzasPassword] = useState<string>(() => {
    const val = localStorage.getItem('apb_finanzas_password') || 'APB12345';
    return val === 'APB2026' ? 'APB12345' : val;
  });
  const [catalogosPassword, setCatalogosPassword] = useState<string>(() => {
    const val = localStorage.getItem('apb_catalogos_password') || 'APB12345';
    return val === 'APB2026' ? 'APB12345' : val;
  });
  const [showroomPassword, setShowroomPassword] = useState<string>(() => {
    return localStorage.getItem('apb_showroom_password') || 'medica123';
  });

  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

useEffect(() => {

  const cargarEquipos = async () => {
    try {

      const respuesta = await fetch(
        "https://apb-backend-p5gt.onrender.com/equipos"
      );

      const datos = await respuesta.json();

      console.log("Equipos Render:", datos);

      setEquipos(datos);

      localStorage.setItem(
        "apb_equipos",
        JSON.stringify(datos)
      );

    } catch(error) {
      console.error("Error cargando equipos:", error);
    }
  };

  cargarEquipos();

}, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Self-healing: If there is existing data in localStorage but no sync timestamp,
    // initialize the timestamp to now so that local data has priority over an empty/stale server.
    const lastUpdate = localStorage.getItem('apb_last_local_update');
    const savedEquipos = localStorage.getItem('apb_equipos');
    if (!lastUpdate && savedEquipos) {
      try {
        const parsed = JSON.parse(savedEquipos);
        if (parsed && parsed.length > 0) {
          localStorage.setItem('apb_last_local_update', Date.now().toString());
        }
      } catch (e) {
        console.warn('Error parsing saved equipos on mount:', e);
      }
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {

  const cargarEquipos = async () => {

    try {

     const respuesta = await fetch(
  "https://apb-backend-p5gt.onrender.com/api/data"
);

const datos = await respuesta.json();

console.log("Equipos desde Render:", datos);

setEquipos(datos.apb_equipos || []);

localStorage.setItem(
  "apb_equipos",
  JSON.stringify(datos.apb_equipos || [])
);

      localStorage.setItem(
        "apb_equipos",
        JSON.stringify(datos.equipos)
      );

    } catch(error){

      console.error("Error:", error);

    }

  };

  cargarEquipos();

}, []);
  useEffect(() => {
    if (showWelcomeToast) {
      const timer = setTimeout(() => {
        setShowWelcomeToast(false);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [showWelcomeToast]);

  const stateRef = React.useRef({ equipos, showroomEquipos, colaboradores, recibidos, finanzasPassword, catalogosPassword, showroomPassword });
  stateRef.current = { equipos, showroomEquipos, colaboradores, recibidos, finanzasPassword, catalogosPassword, showroomPassword };
  const postUpdate = async (updates: Record<string, any>) => {
    try {
      const res = await fetch(
'https://apb-backend-p5gt.onrender.com/api/data',
{
method: 'POST',
headers:{
'Content-Type':'application/json'
},
body: JSON.stringify(updates)
}
);
      if (res.ok) {
        setIsOnline(true);
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const resData = await res.json();
          if (resData.success && resData.data && resData.data.updatedAt) {
            localStorage.setItem('apb_last_local_update', resData.data.updatedAt.toString());
          }
        }
      } else {
        setIsOnline(false);
      }
    } catch (err) {
      setIsOnline(false);
      console.warn('Post response failed. Saved locally to be synced when online.', err);
    }
  };

  // Sync / load from server in real-time
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('https://apb-backend-p5gt.onrender.com/api/data');
        if (res.ok) {
          setIsOnline(true);
          const contentType = res.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Response is not JSON');
          }
          const data = await res.json();
          const cur = stateRef.current;

          const localUpdate = parseInt(localStorage.getItem('apb_last_local_update') || '0', 10);
          const serverUpdate = data.updatedAt || 0;

          if (localUpdate > serverUpdate) {
            // Client has newer offline changes! Sync client data to server.
            await postUpdate({
              apb_equipos: cur.equipos,
              apb_showroom_equipos: cur.showroomEquipos,
              apb_colaboradores: cur.colaboradores,
              apb_recibidos: cur.recibidos,
              apb_finanzas_password: cur.finanzasPassword,
              apb_catalogos_password: cur.catalogosPassword,
              apb_showroom_password: cur.showroomPassword
            });
          } else {
            // Server has newer (or equal) changes. Sync server to client.
            if (data.apb_equipos && JSON.stringify(data.apb_equipos) !== JSON.stringify(cur.equipos)) {
              setEquipos(data.apb_equipos);
              localStorage.setItem('apb_equipos', JSON.stringify(data.apb_equipos));
            }

            if (data.apb_showroom_equipos && JSON.stringify(data.apb_showroom_equipos) !== JSON.stringify(cur.showroomEquipos)) {
              setShowroomEquipos(data.apb_showroom_equipos);
              localStorage.setItem('apb_showroom_equipos', JSON.stringify(data.apb_showroom_equipos));
            }

            if (data.apb_colaboradores && JSON.stringify(data.apb_colaboradores) !== JSON.stringify(cur.colaboradores)) {
              setColaboradores(data.apb_colaboradores);
              localStorage.setItem('apb_colaboradores', JSON.stringify(data.apb_colaboradores));
            }

            if (data.apb_recibidos && JSON.stringify(data.apb_recibidos) !== JSON.stringify(cur.recibidos)) {
              setRecibidos(data.apb_recibidos);
              localStorage.setItem('apb_recibidos', JSON.stringify(data.apb_recibidos));
            }

            if (data.apb_finanzas_password && data.apb_finanzas_password !== cur.finanzasPassword) {
              setFinanzasPassword(data.apb_finanzas_password);
              localStorage.setItem('apb_finanzas_password', data.apb_finanzas_password);
            }
            if (data.apb_catalogos_password && data.apb_catalogos_password !== cur.catalogosPassword) {
              setCatalogosPassword(data.apb_catalogos_password);
              localStorage.setItem('apb_catalogos_password', data.apb_catalogos_password);
            }
            if (data.apb_showroom_password && data.apb_showroom_password !== cur.showroomPassword) {
              setShowroomPassword(data.apb_showroom_password);
              localStorage.setItem('apb_showroom_password', data.apb_showroom_password);
            }
          }
        } else {
          setIsOnline(false);
        }
      } catch (err) {
        setIsOnline(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, []);

  // Check for scanned QR code on load or database load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hasQr = params.get('eq_qr');
    if (hasQr) {
      const id = params.get('id') || '';
      const nom = params.get('nom') || '';
      const mar = params.get('mar') || '';
      const hos = params.get('hos') || '';
      const sn = params.get('sn') || '';
      const rec = params.get('rec') || '';
      const fal = params.get('fal') || '';
      const acc = params.get('acc') || '';
      const fec = params.get('fec') || '';
      const est = params.get('est') || 'recibido';
      const obs = params.get('obs') || '';
      const ubi = params.get('ubi') || '';

      // Check if we already have it in local equipos database (to show updated local values!)
      const foundLocal = equipos.find(e => e.id === id);
      if (foundLocal) {
        setScannedEquipment(foundLocal);
      } else {
        // Fallback to URL-decoded parameters!
        setScannedEquipment({
          id,
          nombreEquipo: nom,
          marca: mar,
          hospital: hos,
          numeroSerie: sn,
          recibidoPor: rec,
          falla: fal,
          accesorios: acc,
          fechaLlegada: fec,
          estado: est,
          observaciones: obs,
          ubicacion: ubi
        });
      }
    }
  }, [equipos]);

  const markLocalUpdate = () => {
    const now = Date.now();
    localStorage.setItem('apb_last_local_update', now.toString());
  };

  // Sync to local storage on changes
  const saveEquipos = (updatedList: Equipo[]) => {
    setEquipos(updatedList);
    localStorage.setItem('apb_equipos', JSON.stringify(updatedList));
    markLocalUpdate();
    postUpdate({ apb_equipos: updatedList });
  };

  const saveShowroomEquipos = (updatedList: ShowroomEquipo[]) => {
    setShowroomEquipos(updatedList);
    localStorage.setItem('apb_showroom_equipos', JSON.stringify(updatedList));
    markLocalUpdate();
    postUpdate({ apb_showroom_equipos: updatedList });
  };

  const handleSaveShowroomEquipo = (eq: ShowroomEquipo) => {
    const exists = showroomEquipos.some(item => item.id === eq.id);
    let updated: ShowroomEquipo[];
    if (exists) {
      updated = showroomEquipos.map(item => item.id === eq.id ? eq : item);
    } else {
      updated = [eq, ...showroomEquipos];
    }
    saveShowroomEquipos(updated);
  };

  const handleDeleteShowroomEquipo = (id: string) => {
    const updated = showroomEquipos.filter(item => item.id !== id);
    saveShowroomEquipos(updated);
  };

  const saveColaboradores = (updatedColabs: string[]) => {
    setColaboradores(updatedColabs);
    localStorage.setItem('apb_colaboradores', JSON.stringify(updatedColabs));
    markLocalUpdate();
    postUpdate({ apb_colaboradores: updatedColabs });
  };

  const saveRecibidos = (updatedRecs: string[]) => {
    setRecibidos(updatedRecs);
    localStorage.setItem('apb_recibidos', JSON.stringify(updatedRecs));
    markLocalUpdate();
    postUpdate({ apb_recibidos: updatedRecs });
  };

  const saveFinanzasPassword = (newPass: string) => {
    setFinanzasPassword(newPass);
    localStorage.setItem('apb_finanzas_password', newPass);
    markLocalUpdate();
    postUpdate({ apb_finanzas_password: newPass });
  };

  const saveCatalogosPassword = (newPass: string) => {
    setCatalogosPassword(newPass);
    localStorage.setItem('apb_catalogos_password', newPass);
    markLocalUpdate();
    postUpdate({ apb_catalogos_password: newPass });
  };

  const saveShowroomPassword = (newPass: string) => {
    setShowroomPassword(newPass);
    localStorage.setItem('apb_showroom_password', newPass);
    markLocalUpdate();
    postUpdate({ apb_showroom_password: newPass });
  };

  // --- CRUD OPERATIONS ---
  const handleAddEquipment = () => {
    setEquipoToEdit(null);
    setIsModalOpen(true);
  };

  const handleEditEquipment = (equipo: Equipo) => {
    setEquipoToEdit(equipo);
    setIsModalOpen(true);
  };

  const handleSaveEquipment = (equipoData: Omit<Equipo, 'id'> & { id?: string }) => {
    if (equipoData.id) {
      // Edit mode
      const updated = equipos.map(eq => eq.id === equipoData.id ? (equipoData as Equipo) : eq);
      saveEquipos(updated);
      setQrEquipment(equipoData as Equipo);
    } else {
      // Add mode
      const newId = `eq-${Date.now()}`;
      const newEquipo: Equipo = {
        ...equipoData,
        id: newId
      };
      saveEquipos([newEquipo, ...equipos]);
      setQrEquipment(newEquipo);
    }
  };

  const handleDeleteEquipment = (id: string) => {
    const found = equipos.find(eq => eq.id === id);
    if (found) {
      setEquipoToDelete(found);
    }
  };

  const confirmDeleteEquipment = () => {
    if (equipoToDelete) {
      const updated = equipos.filter(eq => eq.id !== equipoToDelete.id);
      saveEquipos(updated);
      setEquipoToDelete(null);
    }
  };

  // --- QUICK WORKFLOW TRANSITIONS ---
  const handleQuickStatusChange = (id: string, nextStatus: EquipoEstado) => {
    const updated = equipos.map(eq => {
      if (eq.id === id) {
        const hasNoCompletionDate = !eq.fechaTermino;
        let finalCompletionDate = eq.fechaTermino;

        // If transitioning into finished/delivered and date is currently missing, set to today
        if ((nextStatus === 'terminado' || nextStatus === 'entregado') && hasNoCompletionDate) {
          finalCompletionDate = new Date().toISOString().split('T')[0];
        } else if (nextStatus !== 'terminado' && nextStatus !== 'entregado') {
          // If moving back to active workflow, remove termination date
          finalCompletionDate = null;
        }

        return {
          ...eq,
          estado: nextStatus,
          fechaTermino: finalCompletionDate
        };
      }
      return eq;
    });
    saveEquipos(updated);
  };

  const handleQuickLocationChange = (id: string, nextLocation: PlantaUbicacion) => {
    const updated = equipos.map(eq => eq.id === id ? { ...eq, ubicacion: nextLocation } : eq);
    saveEquipos(updated);
  };

  const handleQuickPaymentToggle = (id: string) => {
    const updated = equipos.map(eq => eq.id === id ? { ...eq, cobrado: !eq.cobrado } : eq);
    saveEquipos(updated);
  };

  const handleUpdateObservations = (id: string, newObs: string) => {
    const updated = equipos.map(eq => eq.id === id ? { ...eq, observaciones: newObs } : eq);
    saveEquipos(updated);
  };

  // --- BACKUP UTILITIES ---
  const handleImportData = (importedList: Equipo[]) => {
    saveEquipos(importedList);
  };

  const handleResetToEmpty = () => {
    saveEquipos([]);
  };

  const handleLoadDemo = () => {
    saveEquipos(SEED_EQUIPOS);
  };

  // --- HEADER ALERTS & METRICS ---
  // Active equipment (Not delivered yet)
  const totalActiveCount = useMemo(() => {
    return equipos.filter(e => e.estado !== 'entregado').length;
  }, [equipos]);

  // Delayed equipment count (In 'espera' for 7+ days relative to simulated date July 16, 2026)
  const totalDelayedCount = useMemo(() => {
    const currentDate = new Date('2026-07-16');
    return equipos.filter(eq => {
      if (eq.estado !== 'espera') return false;
      if (!eq.fechaLlegada) return false;
      const arrival = new Date(eq.fechaLlegada);
      const timeDiff = currentDate.getTime() - arrival.getTime();
      const daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24));
      return daysDiff >= 7;
    }).length;
  }, [equipos]);

  if (showSplash) {
    return (
      <SplashScreen
        onComplete={() => {
          setShowSplash(false);
          setShowWelcomeToast(true);
        }}
      />
    );
  }

  if (scannedEquipment) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between font-sans text-gray-800">
        {/* Top bar */}
        <div className="bg-white border-b border-gray-200 py-4 px-6 shadow-sm">
          <div className="max-w-xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="font-black text-2xl tracking-widest text-[#0A122C]">APB</span>
            </div>
            <button
              onClick={() => {
                // Clear URL query params and close sheet
                window.history.replaceState({}, document.title, window.location.pathname);
                setScannedEquipment(null);
              }}
              className="px-4 py-2 text-xs font-bold bg-red-700 hover:bg-red-800 text-white rounded-lg transition-all cursor-pointer shadow-xs"
            >
              Ir al Portal Principal
            </button>
          </div>
        </div>

        {/* Sheet content */}
        <div className="flex-1 max-w-xl w-full mx-auto p-4 sm:p-6 flex flex-col justify-center">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            {/* Elegant header bar */}
            <div className="h-2 bg-red-700" />

            <div className="p-6 sm:p-8 space-y-6">
              {/* Main title */}
              <div className="border-b border-gray-100 pb-4 text-center">
                <span className="text-[10px] font-black text-red-700 uppercase tracking-widest font-mono">Detalles del Equipo Recibido</span>
                <h1 className="text-2xl font-black text-gray-900 mt-1">Ficha de Ingreso</h1>
              </div>

              {/* Exact 7 requested fields */}
              <div className="space-y-4">
                
                {/* 1. Nombre del Equipo */}
                <div className="pb-3 border-b border-gray-100">
                  <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Nombre del Equipo</h3>
                  <p className="text-base font-bold text-gray-900 mt-0.5">{scannedEquipment.nombreEquipo}</p>
                </div>

                {/* 2. Marca */}
                <div className="pb-3 border-b border-gray-100">
                  <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Marca</h3>
                  <p className="text-sm font-semibold text-gray-800 mt-0.5">{scannedEquipment.marca || 'Por definir'}</p>
                </div>

                {/* 3. Hospital */}
                <div className="pb-3 border-b border-gray-100">
                  <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Hospital</h3>
                  <p className="text-sm font-semibold text-gray-800 mt-0.5">{scannedEquipment.hospital}</p>
                </div>

                {/* 4. Accesorios */}
                <div className="pb-3 border-b border-gray-100">
                  <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Accesorios</h3>
                  <p className="text-sm font-semibold text-gray-800 mt-0.5 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    {scannedEquipment.accesorios || 'Ninguno'}
                  </p>
                </div>

                {/* 5. Falla */}
                <div className="pb-3 border-b border-gray-100">
                  <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Falla</h3>
                  <p className="text-sm font-semibold text-red-700 mt-0.5 bg-red-50/50 p-2.5 rounded-lg border border-red-100/50">
                    {scannedEquipment.falla}
                  </p>
                </div>

                {/* 6. Quien lo recibió */}
                <div className="pb-3 border-b border-gray-100">
                  <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Recibido por</h3>
                  <p className="text-sm font-semibold text-gray-800 mt-0.5">{scannedEquipment.recibidoPor || 'No registrado'}</p>
                </div>

                {/* 7. Fecha de ingreso */}
                <div>
                  <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Fecha de Ingreso</h3>
                  <p className="text-sm font-bold text-gray-800 mt-0.5 inline-flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    {scannedEquipment.fechaLlegada || 'Sin registrar'}
                  </p>
                </div>

              </div>

              {/* Decorative separator */}
              <div className="border-t border-gray-100 pt-4 text-center">
                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Control Digital Certificado APB</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 py-4 text-center text-xs text-gray-500 font-semibold">
          &copy; 2026 APB. Todos los derechos reservados.
        </footer>
      </div>
    );
  }

  return (
    <div id="apb-app-root" className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      
      {/* Welcome Toast Notification */}
      <AnimatePresence>
        {showWelcomeToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="fixed bottom-6 right-6 z-[100] max-w-sm w-full bg-[#0A122C] border-l-4 border-red-600 rounded-xl shadow-2xl p-4 text-white flex items-start space-x-3.5 overflow-hidden"
          >
            {/* Ambient background accent glow */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-600/10 rounded-full blur-xl pointer-events-none" />

            <div className="p-2 bg-red-600 rounded-lg shrink-0 shadow-md">
              <CheckCircle className="h-5 w-5 text-white" />
            </div>
            
            <div className="flex-1 space-y-0.5">
              <h4 className="font-black text-[10px] tracking-wider text-red-500 uppercase font-mono">Control Interno</h4>
              <p className="text-xs text-white font-bold leading-snug">
                Bienvenido al control interno de APB
              </p>
              <p className="text-[10px] text-blue-200">
                La base de datos local y remota se encuentran sincronizadas.
              </p>
            </div>

            <button
              onClick={() => setShowWelcomeToast(false)}
              className="text-blue-300 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5 cursor-pointer shrink-0"
              aria-label="Cerrar bienvenida"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Top Header Branding & Tabs Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isUnlocked={isUnlocked}
        lockFinances={handleLockFinances}
        totalActiveCount={totalActiveCount}
        totalDelayedCount={totalDelayedCount}
        isConfigUnlocked={isConfigUnlocked}
        lockConfig={handleLockConfig}
        isOnline={isOnline}
      />

      {/* Main Container Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Render Tab Conditionally */}
        <div className="space-y-6">
          {activeTab === 'seguimiento' && (
            <Dashboard
              equipos={equipos}
              onAddEquipment={handleAddEquipment}
              onEditEquipment={handleEditEquipment}
              onDeleteEquipment={handleDeleteEquipment}
              onQuickStatusChange={handleQuickStatusChange}
              onQuickLocationChange={handleQuickLocationChange}
              onQuickPaymentToggle={handleQuickPaymentToggle}
              onShowQr={setQrEquipment}
            />
          )}

          {activeTab === 'showroom' && (
            <ShowroomView
              equipos={showroomEquipos}
              onSave={handleSaveShowroomEquipo}
              onDelete={handleDeleteShowroomEquipo}
              showroomPassword={showroomPassword}
              onUpdatePassword={saveShowroomPassword}
            />
          )}

          {activeTab === 'estadisticas' && (
            <StatsView equipos={equipos} />
          )}

          {activeTab === 'ubicacion' && (
            <LocationTracker
              equipos={equipos}
              onUpdateLocation={handleQuickLocationChange}
            />
          )}

          {activeTab === 'espera' && (
            <WaitingIssues
              equipos={equipos}
              onQuickStatusChange={handleQuickStatusChange}
              onEditEquipment={handleEditEquipment}
              onUpdateObservations={handleUpdateObservations}
            />
          )}

          {activeTab === 'finanzas' && (
            <FinancesView
              equipos={equipos}
              isUnlocked={isUnlocked}
              onUnlock={handleUnlockFinances}
              onLock={handleLockFinances}
              onQuickPaymentToggle={handleQuickPaymentToggle}
              finanzasPassword={finanzasPassword}
              onUpdatePassword={saveFinanzasPassword}
            />
          )}

          {activeTab === 'config' && (
            <BackupRestore
              equipos={equipos}
              onImportData={handleImportData}
              onResetToEmpty={handleResetToEmpty}
              onLoadDemo={handleLoadDemo}
              colaboradores={colaboradores}
              onUpdateColaboradores={saveColaboradores}
              recibidos={recibidos}
              onUpdateRecibidos={saveRecibidos}
              isUnlocked={isConfigUnlocked}
              onUnlock={handleUnlockConfig}
              onLock={handleLockConfig}
              catalogosPassword={catalogosPassword}
              onUpdatePassword={saveCatalogosPassword}
            />
          )}
        </div>
      </main>

      {/* Global Form Modal for Add/Edit */}
      <EquipmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveEquipment}
        equipoToEdit={equipoToEdit}
        colaboradores={colaboradores}
        recibidos={recibidos}
      />

      {/* QR Code viewer modal */}
      <QrModal
        isOpen={qrEquipment !== null}
        onClose={() => setQrEquipment(null)}
        equipo={qrEquipment}
      />

      {/* Custom Confirmation Modal for deletion */}
      {equipoToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-red-50 text-red-700 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-black text-gray-900">¿Eliminar registro?</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  ¿Estás seguro de que deseas eliminar permanentemente el equipo{' '}
                  <strong className="text-gray-800 font-bold">{equipoToDelete.nombreEquipo}</strong>{' '}
                  con número de serie <strong className="font-mono text-xs text-gray-800 bg-gray-100 px-1.5 py-0.5 rounded font-bold">{equipoToDelete.numeroSerie}</strong>?
                </p>
                <p className="text-xs text-red-600 font-semibold bg-red-50 p-2.5 rounded-lg border border-red-100">
                  Esta acción no se puede deshacer y borrará toda la información del historial y finanzas de este equipo.
                </p>
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-4 flex items-center justify-end space-x-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setEquipoToDelete(null)}
                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDeleteEquipment}
                className="px-5 py-2 text-sm font-semibold rounded-lg text-white bg-red-700 hover:bg-red-800 shadow-sm transition-all flex items-center space-x-1.5 cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
                <span>Eliminar registro</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer copyright */}
      <footer className="bg-white border-t border-gray-200 py-6 mt-12 text-center text-xs text-gray-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-2">
          <div className="flex items-center justify-center">
            <span className="font-bold text-gray-700">APB Asesoría & Pluriservicios Biomédicos</span>
          </div>
          <p className="text-gray-400">
            Sistema Integrado de Control Técnico e Ingresos Financieros. Todos los datos están seguros localmente.
          </p>
        </div>
      </footer>
    </div>
  );
}
