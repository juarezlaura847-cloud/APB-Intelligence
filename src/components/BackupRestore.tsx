import React, { useRef, useState } from 'react';
import { Download, Upload, RotateCcw, AlertCircle, CheckCircle, Database, UserPlus, Trash2, Edit2, Check, X, Lock, Unlock, Eye, EyeOff, Key, TrendingUp, BarChart3, PieChart, DollarSign, FileSpreadsheet } from 'lucide-react';
import XLSX from 'xlsx-js-style';
import { Equipo } from '../types';

interface BackupRestoreProps {
  equipos: Equipo[];
  onImportData: (importedEquipos: Equipo[]) => void;
  onResetToEmpty: () => void;
  onLoadDemo: () => void;
  colaboradores: string[];
  onUpdateColaboradores: (colabs: string[]) => void;
  recibidos: string[];
  onUpdateRecibidos: (recs: string[]) => void;
  isUnlocked: boolean;
  onUnlock: () => void;
  onLock: () => void;
  catalogosPassword: string;
  onUpdatePassword: (newPass: string) => void;
}

export default function BackupRestore({
  equipos,
  onImportData,
  onResetToEmpty,
  onLoadDemo,
  colaboradores,
  onUpdateColaboradores,
  recibidos,
  onUpdateRecibidos,
  isUnlocked,
  onUnlock,
  onLock,
  catalogosPassword,
  onUpdatePassword
}: BackupRestoreProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // --- STATS CALCULATIONS FOR EXECUTIVE REPORT ---
  const now = new Date();
  const curYear = now.getFullYear();
  const curMonthNum = now.getMonth() + 1;
  const curMonthStr = String(curMonthNum).padStart(2, '0');
  const curMonthKey = `${curYear}-${curMonthStr}`;

  const prevDate = new Date(curYear, now.getMonth() - 1, 1);
  const prevYear = prevDate.getFullYear();
  const prevMonthNum = prevDate.getMonth() + 1;
  const prevMonthStr = String(prevMonthNum).padStart(2, '0');
  const prevMonthKey = `${prevYear}-${prevMonthStr}`;

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  const curMonthName = monthNames[now.getMonth()];
  const prevMonthName = monthNames[(now.getMonth() - 1 + 12) % 12];

  // Calculations
  const totalEquipos = equipos.length;

  const reparadosMesActual = equipos.filter(eq => 
    (eq.estado === 'terminado' || eq.estado === 'entregado') &&
    eq.fechaTermino && eq.fechaTermino.startsWith(curMonthKey)
  );
  const cantReparadosMesActual = reparadosMesActual.length;

  const reparadosMesAnterior = equipos.filter(eq => 
    (eq.estado === 'terminado' || eq.estado === 'entregado') &&
    eq.fechaTermino && eq.fechaTermino.startsWith(prevMonthKey)
  );
  const cantReparadosMesAnterior = reparadosMesAnterior.length;

  // Incomes (Ingresos)
  const ingresosPaidMesActual = equipos
    .filter(eq => eq.fechaTermino && eq.fechaTermino.startsWith(curMonthKey) && eq.cobrado)
    .reduce((sum, eq) => sum + (eq.costoServicio || 0), 0);

  const ingresosTotalMesActual = equipos
    .filter(eq => eq.fechaTermino && eq.fechaTermino.startsWith(curMonthKey))
    .reduce((sum, eq) => sum + (eq.costoServicio || 0), 0);

  const ingresosUnpaidMesActual = ingresosTotalMesActual - ingresosPaidMesActual;

  const ingresosPaidMesAnterior = equipos
    .filter(eq => eq.fechaTermino && eq.fechaTermino.startsWith(prevMonthKey) && eq.cobrado)
    .reduce((sum, eq) => sum + (eq.costoServicio || 0), 0);

  const ingresosTotalMesAnterior = equipos
    .filter(eq => eq.fechaTermino && eq.fechaTermino.startsWith(prevMonthKey))
    .reduce((sum, eq) => sum + (eq.costoServicio || 0), 0);

  const ingresosUnpaidMesAnterior = ingresosTotalMesAnterior - ingresosPaidMesAnterior;

  // Equipos en Espera
  const cantEnEspera = equipos.filter(eq => eq.estado === 'espera').length;

  // Status distribution
  const estadoCounts: Record<string, number> = {
    recepcion: 0,
    espera: 0,
    revision: 0,
    prueba: 0,
    terminado: 0,
    entregado: 0
  };
  equipos.forEach(eq => {
    if (estadoCounts[eq.estado] !== undefined) {
      estadoCounts[eq.estado]++;
    }
  });

  const handleExportExcelReport = () => {
    try {
      const createCellObj = (
        value: any,
        options: {
          bold?: boolean;
          italic?: boolean;
          size?: number;
          color?: string; // Hex color like "FFFFFF"
          bg?: string;    // Hex color like "1E3A8A"
          align?: 'left' | 'center' | 'right';
          z?: string;     // format
          border?: 'all' | 'header' | 'total' | 'none';
        } = {}
      ) => {
        const type = typeof value === 'number' ? 'n' : typeof value === 'boolean' ? 'b' : 's';
        const borderStyle = options.border === 'all' ? {
          top: { style: 'thin', color: { rgb: 'E2E8F0' } },
          bottom: { style: 'thin', color: { rgb: 'E2E8F0' } },
          left: { style: 'thin', color: { rgb: 'E2E8F0' } },
          right: { style: 'thin', color: { rgb: 'E2E8F0' } }
        } : options.border === 'header' ? {
          top: { style: 'medium', color: { rgb: '1E3A8A' } },
          bottom: { style: 'medium', color: { rgb: '1E3A8A' } },
          left: { style: 'thin', color: { rgb: 'CBD5E1' } },
          right: { style: 'thin', color: { rgb: 'CBD5E1' } }
        } : options.border === 'total' ? {
          top: { style: 'thin', color: { rgb: '94A3B8' } },
          bottom: { style: 'double', color: { rgb: '1E293B' } },
          left: { style: 'thin', color: { rgb: 'E2E8F0' } },
          right: { style: 'thin', color: { rgb: 'E2E8F0' } }
        } : undefined;

        return {
          v: value,
          t: type,
          s: {
            font: {
              name: 'Segoe UI',
              sz: options.size || 10,
              bold: options.bold || false,
              italic: options.italic || false,
              color: options.color ? { rgb: options.color } : { rgb: '1E293B' }
            },
            fill: options.bg ? {
              patternType: 'solid',
              fgColor: { rgb: options.bg }
            } : undefined,
            alignment: {
              horizontal: options.align || (type === 'n' ? 'right' : 'left'),
              vertical: 'center',
              wrapText: true
            },
            border: borderStyle
          },
          z: options.z
        };
      };

      const wb = XLSX.utils.book_new();

      const summaryRows = [
        // A1: Title Header Card
        [createCellObj('APB - ASESORÍA & PLURISERVICIOS BIOMÉDICOS', { bold: true, size: 16, color: '1E3A8A' })],
        [createCellObj('REPORTE EJECUTIVO MENSUAL DE RENDIMIENTO & INGRESOS', { bold: true, size: 11, color: '475569' })],
        [createCellObj(`Generado el: ${new Date().toLocaleString()}`, { italic: true, size: 9, color: '64748B' })],
        [], // Spacer

        // KPIs section header
        [createCellObj('INDICADORES CLAVE DE RENDIMIENTO (KPIs)', { bold: true, size: 12, color: 'FFFFFF', bg: '1E3A8A' })],
        [
          createCellObj('Concepto', { bold: true, bg: 'F1F5F9', border: 'all' }),
          createCellObj(`Mes Anterior (${prevMonthName})`, { bold: true, bg: 'F1F5F9', align: 'right', border: 'all' }),
          createCellObj(`Mes Actual (${curMonthName})`, { bold: true, bg: 'F1F5F9', align: 'right', border: 'all' }),
          createCellObj('Variación Absoluta', { bold: true, bg: 'F1F5F9', align: 'right', border: 'all' }),
          createCellObj('Variación (%)', { bold: true, bg: 'F1F5F9', align: 'right', border: 'all' })
        ],
        [
          createCellObj('Equipos Reparados (Terminados/Entregados)', { border: 'all' }),
          createCellObj(cantReparadosMesAnterior, { align: 'right', border: 'all', z: '#,##0' }),
          createCellObj(cantReparadosMesActual, { align: 'right', border: 'all', z: '#,##0' }),
          createCellObj(cantReparadosMesActual - cantReparadosMesAnterior, { align: 'right', border: 'all', z: '#,##0' }),
          createCellObj(
            cantReparadosMesAnterior > 0 
              ? (cantReparadosMesActual - cantReparadosMesAnterior) / cantReparadosMesAnterior 
              : 0, 
            { align: 'right', border: 'all', z: '0%' }
          )
        ],
        [
          createCellObj('Ingresos Cobrados (Reales)', { border: 'all' }),
          createCellObj(ingresosPaidMesAnterior, { align: 'right', border: 'all', z: '$#,##0.00' }),
          createCellObj(ingresosPaidMesActual, { align: 'right', border: 'all', z: '$#,##0.00' }),
          createCellObj(ingresosPaidMesActual - ingresosPaidMesAnterior, { align: 'right', border: 'all', z: '$#,##0.00' }),
          createCellObj(
            ingresosPaidMesAnterior > 0 
              ? (ingresosPaidMesActual - ingresosPaidMesAnterior) / ingresosPaidMesAnterior 
              : 0, 
            { align: 'right', border: 'all', z: '0%' }
          )
        ],
        [
          createCellObj('Ingresos Pendientes de Cobro', { border: 'all' }),
          createCellObj(ingresosUnpaidMesAnterior, { align: 'right', border: 'all', z: '$#,##0.00' }),
          createCellObj(ingresosUnpaidMesActual, { align: 'right', border: 'all', z: '$#,##0.00' }),
          createCellObj(ingresosUnpaidMesActual - ingresosUnpaidMesAnterior, { align: 'right', border: 'all', z: '$#,##0.00' }),
          createCellObj('-', { align: 'right', border: 'all' })
        ],
        [
          createCellObj('Total Facturado / Servicios', { bold: true, bg: 'EFF6FF', border: 'total' }),
          createCellObj(ingresosTotalMesAnterior, { bold: true, bg: 'EFF6FF', align: 'right', border: 'total', z: '$#,##0.00' }),
          createCellObj(ingresosTotalMesActual, { bold: true, bg: 'EFF6FF', align: 'right', border: 'total', z: '$#,##0.00' }),
          createCellObj(ingresosTotalMesActual - ingresosTotalMesAnterior, { bold: true, bg: 'EFF6FF', align: 'right', border: 'total', z: '$#,##0.00' }),
          createCellObj(
            ingresosTotalMesAnterior > 0 
              ? (ingresosTotalMesActual - ingresosTotalMesAnterior) / ingresosTotalMesAnterior 
              : 0, 
            { bold: true, bg: 'EFF6FF', align: 'right', border: 'total', z: '0%' }
          )
        ],
        [], // Spacer

        // Inventory status table
        [createCellObj('ESTADO ACTUAL DE EQUIPOS EN EL INVENTARIO', { bold: true, size: 12, color: 'FFFFFF', bg: '1E3A8A' })],
        [
          createCellObj('Estado del Equipo', { bold: true, bg: 'F1F5F9', border: 'all' }),
          createCellObj('Cantidad de Equipos', { bold: true, bg: 'F1F5F9', align: 'right', border: 'all' }),
          createCellObj('Porcentaje del Total (%)', { bold: true, bg: 'F1F5F9', align: 'right', border: 'all' })
        ],
        ...Object.entries(estadoCounts).map(([estado, count], index) => {
          const label = estado === 'recepcion' ? 'Recepción' :
                        estado === 'espera' ? 'En Espera' :
                        estado === 'revision' ? 'En Revisión' :
                        estado === 'prueba' ? 'En Pruebas' :
                        estado === 'terminado' ? 'Terminado' : 'Entregado';
          const percentage = totalEquipos > 0 ? count / totalEquipos : 0;
          const bgZebra = index % 2 === 1 ? 'F8FAFC' : undefined;
          return [
            createCellObj(label, { bg: bgZebra, border: 'all' }),
            createCellObj(count, { bg: bgZebra, align: 'right', border: 'all', z: '#,##0' }),
            createCellObj(percentage, { bg: bgZebra, align: 'right', border: 'all', z: '0%' })
          ];
        }),
        [
          createCellObj('Total Equipos en Inventario', { bold: true, bg: 'EFF6FF', border: 'total' }),
          createCellObj(totalEquipos, { bold: true, bg: 'EFF6FF', align: 'right', border: 'total', z: '#,##0' }),
          createCellObj(1.0, { bold: true, bg: 'EFF6FF', align: 'right', border: 'total', z: '0%' })
        ],
        [], // Spacer

        // Prolonged wait status
        [createCellObj('SITUACIÓN DE ESPERA PROLONGADA', { bold: true, size: 12, color: 'FFFFFF', bg: 'B91C1C' })],
        [
          createCellObj('Equipos en Estado de Espera (Requieren repuesto/cotización)', { border: 'all' }),
          createCellObj(cantEnEspera, { bold: true, color: cantEnEspera > 0 ? 'B91C1C' : '0F172A', align: 'right', border: 'all', z: '#,##0' })
        ],
        [], // Spacer
        [createCellObj('📊 INSTRUCCIONES PARA GENERAR GRÁFICOS EN EXCEL', { bold: true, size: 11, color: '475569' })],
        [createCellObj('1. Seleccione la tabla superior deseada (por ejemplo, "Estado del Equipo" y "Cantidad de Equipos").', { size: 9, color: '64748B' })],
        [createCellObj('2. En la barra superior de Excel, haga clic en "Insertar".', { size: 9, color: '64748B' })],
        [createCellObj('3. Seleccione el tipo de gráfico: "Gráfico de Barras" o "Gráfico de Pastel" para visualizar las métricas al instante.', { size: 9, color: '64748B' })]
      ];

      const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);

      const detailHeaders = [
        'ID Equipo', 'Equipo', 'Número de Serie', 'Hospital / Cliente', 'Llegada', 'Término',
        'Estado', 'Ubicación', 'Falla Reportada', 'Accesorios', 'Ingeniero Responsable', 'Recibido Por',
        'Costo Servicio ($)', 'Estado Cobro'
      ];

      const detailRows = [
        // Styled Blue Headers
        detailHeaders.map(h => createCellObj(h, { 
          bold: true, 
          bg: '1E3A8A', 
          color: 'FFFFFF', 
          align: h === 'Costo Servicio ($)' ? 'right' : 'center' 
        })),
        // Rows with Zebra Striping
        ...equipos.map((eq, rowIndex) => {
          const bgZebra = rowIndex % 2 === 1 ? 'F8FAFC' : undefined;
          return [
            createCellObj(eq.id, { bg: bgZebra, align: 'center', border: 'all' }),
            createCellObj(eq.nombreEquipo, { bg: bgZebra, border: 'all' }),
            createCellObj(eq.numeroSerie, { bg: bgZebra, border: 'all' }),
            createCellObj(eq.hospital, { bg: bgZebra, border: 'all' }),
            createCellObj(eq.fechaLlegada || '', { bg: bgZebra, align: 'center', border: 'all' }),
            createCellObj(eq.fechaTermino || 'Pendiente de Reparación', { bg: bgZebra, align: 'center', border: 'all' }),
            createCellObj(
              eq.estado === 'recepcion' ? 'Recepción' :
              eq.estado === 'espera' ? 'En Espera' :
              eq.estado === 'revision' ? 'En Revisión' :
              eq.estado === 'prueba' ? 'En Pruebas' :
              eq.estado === 'terminado' ? 'Terminado' : 'Entregado',
              { bg: bgZebra, align: 'center', border: 'all' }
            ),
            createCellObj(eq.ubicacion === 'planta_alta' ? 'Planta Alta' : 'Planta Baja', { bg: bgZebra, align: 'center', border: 'all' }),
            createCellObj(eq.falla, { bg: bgZebra, border: 'all' }),
            createCellObj(eq.accesorios, { bg: bgZebra, border: 'all' }),
            createCellObj(eq.colaborador, { bg: bgZebra, border: 'all' }),
            createCellObj(eq.recibidoPor, { bg: bgZebra, border: 'all' }),
            createCellObj(eq.costoServicio || 0, { bg: bgZebra, align: 'right', border: 'all', z: '$#,##0.00' }),
            createCellObj(eq.cobrado ? 'Cobrado' : 'Pendiente', { 
              bg: eq.cobrado ? 'E1F5FE' : 'FFEBEE', 
              color: eq.cobrado ? '0D47A1' : 'B71C1C', 
              bold: true, 
              align: 'center', 
              border: 'all' 
            })
          ];
        })
      ];

      const wsDetail = XLSX.utils.aoa_to_sheet(detailRows);

      wsSummary['!cols'] = [
        { wch: 48 }, { wch: 25 }, { wch: 25 }, { wch: 20 }, { wch: 18 }
      ];
      wsDetail['!cols'] = [
        { wch: 12 }, { wch: 28 }, { wch: 18 }, { wch: 28 }, { wch: 14 }, { wch: 14 },
        { wch: 15 }, { wch: 15 }, { wch: 32 }, { wch: 25 }, { wch: 24 }, { wch: 24 },
        { wch: 18 }, { wch: 14 }
      ];

      XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen Ejecutivo APB');
      XLSX.utils.book_append_sheet(wb, wsDetail, 'Inventario Completo');

      XLSX.writeFile(wb, `APB_Reporte_Rendimiento_${curMonthName}_2026.xlsx`);
      setSuccessMsg('Reporte en Excel generado y descargado exitosamente.');
      setErrorMsg('');
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err: any) {
      setErrorMsg('Error al generar el reporte de Excel: ' + (err.message || err));
      setSuccessMsg('');
    }
  };

  // Password Unlock local states
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [unlockErrorMsg, setUnlockErrorMsg] = useState('');
  // Password Unlock state backed by synchronized state
  const passwordValue = catalogosPassword;

  // Password Change local states
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changeSuccess, setChangeSuccess] = useState('');
  const [changeError, setChangeError] = useState('');

  // Collaborators edit state
  const [newColab, setNewColab] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState('');

  // Recibidos edit state
  const [newRecibido, setNewRecibido] = useState('');
  const [editingRecibidoIndex, setEditingRecibidoIndex] = useState<number | null>(null);
  const [editingRecibidoValue, setEditingRecibidoValue] = useState('');

  const handleExport = () => {
    try {
      const dataStr = JSON.stringify(equipos, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const today = new Date().toISOString().split('T')[0];
      const exportFileDefaultName = `APB_Equipos_Respaldo_${today}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      setSuccessMsg('Respaldo exportado exitosamente. Guarda este archivo en un lugar seguro.');
      setErrorMsg('');
      
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      setErrorMsg('Error al exportar los datos.');
      setSuccessMsg('');
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const file = e.target.files?.[0];
    
    if (!file) return;

    fileReader.onload = (event) => {
      try {
        const parsedData = JSON.parse(event.target?.result as string);
        
        // Basic schema validation
        if (!Array.isArray(parsedData)) {
          throw new Error('El formato del archivo debe ser un arreglo de equipos.');
        }

        if (parsedData.length > 0) {
          const firstItem = parsedData[0];
          const requiredKeys = ['id', 'nombreEquipo', 'numeroSerie', 'fechaLlegada', 'estado', 'ubicacion', 'hospital'];
          const hasAllKeys = requiredKeys.every(key => Object.prototype.hasOwnProperty.call(firstItem, key));
          
          if (!hasAllKeys) {
            throw new Error('El archivo no tiene el formato de base de datos de equipos APB válido.');
          }
        }

        onImportData(parsedData);
        setSuccessMsg(`¡Importación exitosa! Se cargaron ${parsedData.length} registros de equipos.`);
        setErrorMsg('');
        
        // Reset file input
        if (fileInputRef.current) fileInputRef.current.value = '';
        setTimeout(() => setSuccessMsg(''), 6000);
      } catch (err: any) {
        setErrorMsg(`Error al importar el archivo: ${err.message || 'Formato JSON inválido'}`);
        setSuccessMsg('');
      }
    };

    fileReader.readAsText(file);
  };

  const handleClearAllClick = () => {
    const confirmClear = window.confirm(
      '¿Estás absolutamente seguro de vaciar toda la base de datos de equipos? Se borrarán todos los registros y comenzarás desde cero sin ningún equipo registrado.'
    );
    if (confirmClear) {
      onResetToEmpty();
      setSuccessMsg('Se ha vaciado la base de datos por completo. Ahora puedes comenzar de cero.');
      setErrorMsg('');
      setTimeout(() => setSuccessMsg(''), 5000);
    }
  };

  const handleLoadDemoClick = () => {
    const confirmDemo = window.confirm(
      '¿Deseas cargar los equipos de demostración iniciales para realizar pruebas de flujo y contabilidad?'
    );
    if (confirmDemo) {
      onLoadDemo();
      setSuccessMsg('Se han cargado los equipos de demostración exitosamente.');
      setErrorMsg('');
      setTimeout(() => setSuccessMsg(''), 5000);
    }
  };

  const handleUnlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === passwordValue) {
      onUnlock();
      setPasswordInput('');
      setUnlockErrorMsg('');
    } else {
      setUnlockErrorMsg('Contraseña incorrecta. Por favor, reintente.');
      setPasswordInput('');
    }
  };

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
    setChangeSuccess('¡Contraseña de catálogo actualizada con éxito!');
    setChangeError('');
    setTimeout(() => {
      setChangeSuccess('');
      setShowChangePassword(false);
    }, 4000);
  };

  // Collaborator handlers
  const handleAddColab = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newColab.trim();
    if (!trimmed) return;
    
    if (colaboradores.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
      setErrorMsg('Este colaborador ya existe en la lista.');
      setSuccessMsg('');
      return;
    }

    const updated = [...colaboradores, trimmed];
    onUpdateColaboradores(updated);
    setNewColab('');
    setSuccessMsg(`¡Colaborador "${trimmed}" agregado con éxito!`);
    setErrorMsg('');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleStartEdit = (index: number, currentName: string) => {
    setEditingIndex(index);
    setEditingValue(currentName);
  };

  const handleSaveEdit = (index: number) => {
    const trimmed = editingValue.trim();
    if (!trimmed) return;

    if (colaboradores.some((c, idx) => idx !== index && c.toLowerCase() === trimmed.toLowerCase())) {
      setErrorMsg('Ya existe otro colaborador con ese nombre.');
      return;
    }

    const updated = [...colaboradores];
    updated[index] = trimmed;
    onUpdateColaboradores(updated);
    setEditingIndex(null);
    setSuccessMsg('Nombre de colaborador editado exitosamente.');
    setErrorMsg('');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleDeleteColab = (index: number, name: string) => {
    const confirmDelete = window.confirm(`¿Deseas eliminar a "${name}" de la lista de colaboradores?`);
    if (!confirmDelete) return;

    const updated = colaboradores.filter((_, i) => i !== index);
    onUpdateColaboradores(updated);
    setSuccessMsg('Colaborador eliminado correctamente.');
    setErrorMsg('');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // Recibidos handlers
  const handleAddRecibido = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newRecibido.trim();
    if (!trimmed) return;
    
    if (recibidos.some(r => r.toLowerCase() === trimmed.toLowerCase())) {
      setErrorMsg('Este colaborador ya existe en la lista.');
      setSuccessMsg('');
      return;
    }

    const updated = [...recibidos, trimmed];
    onUpdateRecibidos(updated);
    setNewRecibido('');
    setSuccessMsg(`¡Colaborador que recibe "${trimmed}" agregado con éxito!`);
    setErrorMsg('');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleStartEditRecibido = (index: number, currentName: string) => {
    setEditingRecibidoIndex(index);
    setEditingRecibidoValue(currentName);
  };

  const handleSaveEditRecibido = (index: number) => {
    const trimmed = editingRecibidoValue.trim();
    if (!trimmed) return;

    if (recibidos.some((r, idx) => idx !== index && r.toLowerCase() === trimmed.toLowerCase())) {
      setErrorMsg('Ya existe otro colaborador con ese nombre.');
      return;
    }

    const updated = [...recibidos];
    updated[index] = trimmed;
    onUpdateRecibidos(updated);
    setEditingRecibidoIndex(null);
    setSuccessMsg('Nombre editado exitosamente.');
    setErrorMsg('');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleDeleteRecibido = (index: number, name: string) => {
    const confirmDelete = window.confirm(`¿Deseas eliminar a "${name}" de la lista de colaboradores que recibieron el equipo?`);
    if (!confirmDelete) return;

    const updated = recibidos.filter((_, i) => i !== index);
    onUpdateRecibidos(updated);
    setSuccessMsg('Colaborador eliminado correctamente.');
    setErrorMsg('');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  if (!isUnlocked) {
    return (
      <div id="restricted-config-lock-screen" className="max-w-md mx-auto my-12 bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden p-8 space-y-6 animate-in fade-in zoom-in-98">
        <div className="text-center space-y-2">
          <div className="mx-auto w-14 h-14 bg-red-50 text-red-700 rounded-full flex items-center justify-center border border-red-100">
            <Lock className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Catálogos & Respaldos Protegidos</h2>
          <p className="text-xs text-gray-500">
            Para gestionar los catálogos de técnicos, colaboradores que recibieron el equipo y opciones de restauración del sistema, ingresa la contraseña designada.
          </p>
        </div>

        <form onSubmit={handleUnlockSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1 font-mono">CONTRASEÑA DE ACCESO</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  setUnlockErrorMsg('');
                }}
                placeholder="Ingresa la contraseña..."
                className="w-full pl-3 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-center tracking-widest font-bold text-gray-800"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {unlockErrorMsg && <p className="text-xs text-red-500 mt-1 text-center font-semibold">{unlockErrorMsg}</p>}
          </div>

          <button
            type="submit"
            className="w-full bg-[#0A122C] hover:bg-[#121E42] text-white font-bold py-2.5 rounded-lg text-sm shadow-sm transition-all cursor-pointer flex items-center justify-center space-x-2"
          >
            <Unlock className="h-4 w-4" />
            <span>Desbloquear Acceso</span>
          </button>
        </form>
      </div>
    );
  }

  return (
    <div id="backup-restore-container" className="max-w-2xl mx-auto space-y-6">
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg flex items-center space-x-2 animate-in fade-in">
          <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
          <p className="text-sm font-semibold">{successMsg}</p>
        </div>
      )}
      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg flex items-center space-x-2 animate-in fade-in">
          <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
          <p className="text-sm font-semibold">{errorMsg}</p>
        </div>
      )}
      
      {/* 1. SECCIÓN DE COLABORADORES */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <div className="flex items-center space-x-3 border-b border-gray-100 pb-4">
          <div className="p-2.5 bg-blue-50 text-blue-700 rounded-lg">
            <UserPlus className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Catálogo de Colaboradores</h2>
            <p className="text-xs text-gray-500">Agrega, edita y administra los nombres del personal técnico y bioingenieros</p>
          </div>
        </div>

        {/* Add New Collaborator Form */}
        <form onSubmit={handleAddColab} className="flex gap-2">
          <input
            type="text"
            value={newColab}
            onChange={(e) => setNewColab(e.target.value)}
            placeholder="Escribe el nombre del colaborador (Ej. Ing. Juan Pérez)..."
            className="flex-1 px-3.5 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium"
          />
          <button
            type="submit"
            className="bg-[#0A122C] hover:bg-[#121E42] text-white font-bold px-4 py-2 rounded-lg text-sm transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer"
          >
            <UserPlus className="h-4 w-4" />
            <span>Agregar</span>
          </button>
        </form>

        {/* Collaborators List */}
        <div className="border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-100 bg-gray-50/50">
          {colaboradores.length === 0 ? (
            <p className="p-4 text-center text-xs text-gray-400 font-medium">No hay colaboradores configurados.</p>
          ) : (
            colaboradores.map((colab, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white hover:bg-slate-50 transition-colors">
                {editingIndex === index ? (
                  <div className="flex items-center gap-2 flex-1 mr-2">
                    <input
                      type="text"
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      className="flex-1 px-3 py-1 border border-red-400 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20"
                      autoFocus
                    />
                    <button
                      onClick={() => handleSaveEdit(index)}
                      className="p-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-md border border-emerald-200 cursor-pointer"
                      title="Guardar"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setEditingIndex(null)}
                      className="p-1.5 bg-gray-50 text-gray-500 hover:bg-gray-100 rounded-md border border-gray-200 cursor-pointer"
                      title="Cancelar"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-red-600" />
                      <span className="text-sm font-semibold text-gray-800">{colab}</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => handleStartEdit(index, colab)}
                        className="p-1.5 text-gray-500 hover:text-red-700 hover:bg-gray-50 rounded-md border border-transparent hover:border-gray-100 transition-all cursor-pointer"
                        title="Editar nombre"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteColab(index, colab)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md border border-transparent hover:border-red-100 transition-all cursor-pointer"
                        title="Eliminar colaborador"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* 1.5. CATÁLOGO DE COLABORADORES QUE RECIBEN (RECIBIDO POR) */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <div className="flex items-center space-x-3 border-b border-gray-100 pb-4">
          <div className="p-2.5 bg-red-50 text-red-700 rounded-lg">
            <UserPlus className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Colaborador que recibió el equipo</h2>
            <p className="text-xs text-gray-500">Agrega, edita y administra los nombres del personal colaborador encargado de recibir los equipos (Recibido por)</p>
          </div>
        </div>

        {/* Add New Recibido Form */}
        <form onSubmit={handleAddRecibido} className="flex gap-2">
          <input
            type="text"
            value={newRecibido}
            onChange={(e) => setNewRecibido(e.target.value)}
            placeholder="Escribe el nombre del colaborador (Ej. Diana Ruiz)..."
            className="flex-1 px-3.5 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium"
          />
          <button
            type="submit"
            className="bg-[#0A122C] hover:bg-[#121E42] text-white font-bold px-4 py-2 rounded-lg text-sm transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer"
          >
            <UserPlus className="h-4 w-4" />
            <span>Agregar</span>
          </button>
        </form>

        {/* Recibidos List */}
        <div className="border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-100 bg-gray-50/50">
          {recibidos.length === 0 ? (
            <p className="p-4 text-center text-xs text-gray-400 font-medium">No hay colaboradores que reciben configurados.</p>
          ) : (
            recibidos.map((rec, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white hover:bg-slate-50 transition-colors">
                {editingRecibidoIndex === index ? (
                  <div className="flex items-center gap-2 flex-1 mr-2">
                    <input
                      type="text"
                      value={editingRecibidoValue}
                      onChange={(e) => setEditingRecibidoValue(e.target.value)}
                      className="flex-1 px-3 py-1 border border-red-400 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20"
                      autoFocus
                    />
                    <button
                      onClick={() => handleSaveEditRecibido(index)}
                      className="p-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-md border border-emerald-200 cursor-pointer"
                      title="Guardar"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setEditingRecibidoIndex(null)}
                      className="p-1.5 bg-gray-50 text-gray-500 hover:bg-gray-100 rounded-md border border-gray-200 cursor-pointer"
                      title="Cancelar"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-red-600" />
                      <span className="text-sm font-semibold text-gray-800">{rec}</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => handleStartEditRecibido(index, rec)}
                        className="p-1.5 text-gray-500 hover:text-red-700 hover:bg-gray-50 rounded-md border border-transparent hover:border-gray-100 transition-all cursor-pointer"
                        title="Editar nombre"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteRecibido(index, rec)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md border border-transparent hover:border-red-100 transition-all cursor-pointer"
                        title="Eliminar colaborador"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* --- REPORTE EJECUTIVO Y GRÁFICAS DE RENDIMIENTO --- */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4 flex-wrap gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-lg">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Reporte Ejecutivo e Indicadores</h2>
              <p className="text-xs text-gray-500">Métricas clave, cobros, equipos reparados y estados del mes</p>
            </div>
          </div>
          <button
            onClick={handleExportExcelReport}
            className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 px-4 rounded-lg shadow-sm transition-all cursor-pointer"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Descargar Reporte Excel (.xlsx)</span>
          </button>
        </div>

        {/* KPI Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* KPI 1: Reparados */}
          <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/25 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-blue-800 tracking-wider font-mono">Reparados este Mes</span>
              <span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 text-[9px] font-bold rounded">
                {curMonthName}
              </span>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-black text-gray-900">{cantReparadosMesActual}</span>
              <span className="text-xs text-gray-500 font-medium">equipos</span>
            </div>
            <p className="text-[11px] text-gray-500 font-medium">
              Mes anterior: <span className="font-semibold text-gray-700">{cantReparadosMesAnterior}</span>
              {cantReparadosMesAnterior > 0 && (
                <span className={`ml-1.5 font-bold ${cantReparadosMesActual >= cantReparadosMesAnterior ? 'text-emerald-600' : 'text-red-500'}`}>
                  ({cantReparadosMesActual >= cantReparadosMesAnterior ? '+' : ''}{Math.round(((cantReparadosMesActual - cantReparadosMesAnterior) / cantReparadosMesAnterior) * 100)}%)
                </span>
              )}
            </p>
          </div>

          {/* KPI 2: Ingresos Cobrados */}
          <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/25 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider font-mono">Ingresos Cobrados</span>
              <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 text-[9px] font-bold rounded">
                Real
              </span>
            </div>
            <div className="flex items-baseline space-x-1 text-emerald-700">
              <span className="text-xl font-bold">$</span>
              <span className="text-3xl font-black text-gray-900">{ingresosPaidMesActual.toLocaleString()}</span>
            </div>
            <p className="text-[11px] text-gray-500 font-medium">
              Mes anterior: <span className="font-semibold text-gray-700">${ingresosPaidMesAnterior.toLocaleString()}</span>
              {ingresosPaidMesAnterior > 0 && (
                <span className={`ml-1.5 font-bold ${ingresosPaidMesActual >= ingresosPaidMesAnterior ? 'text-emerald-600' : 'text-red-500'}`}>
                  ({ingresosPaidMesActual >= ingresosPaidMesAnterior ? '+' : ''}{Math.round(((ingresosPaidMesActual - ingresosPaidMesAnterior) / ingresosPaidMesAnterior) * 100)}%)
                </span>
              )}
            </p>
          </div>

          {/* KPI 3: En Espera */}
          <div className="p-4 rounded-xl border border-amber-100 bg-amber-50/25 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-amber-800 tracking-wider font-mono">Equipos En Espera</span>
              {cantEnEspera > 0 ? (
                <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 text-[9px] font-bold rounded uppercase tracking-wider animate-pulse">
                  Alerta
                </span>
              ) : (
                <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 text-[9px] font-bold rounded uppercase tracking-wider">
                  Al Día
                </span>
              )}
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-black text-gray-900">{cantEnEspera}</span>
              <span className="text-xs text-gray-500 font-medium">en bodega</span>
            </div>
            <p className="text-[11px] text-gray-500 font-medium">
              Requieren atención inmediata de repuesto o cotización.
            </p>
          </div>
        </div>

        {/* Charts Container */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Chart 1: Donut (Estado de Equipos) */}
          <div className="p-4 border border-gray-100 rounded-xl bg-gray-50/50 flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <PieChart className="h-4 w-4 text-gray-600" />
                <h3 className="text-xs font-black uppercase tracking-wider text-gray-700">Distribución de Equipos</h3>
              </div>
              <span className="text-[10px] font-bold text-gray-400 font-mono">
                Total: {totalEquipos}
              </span>
            </div>

            {totalEquipos === 0 ? (
              <div className="h-48 flex items-center justify-center">
                <p className="text-xs text-gray-400 font-medium">No hay registros de equipos disponibles.</p>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-around gap-4">
                {/* SVG Donut */}
                <div className="relative w-40 h-40 shrink-0">
                  <svg viewBox="0 0 200 200" width="100%" height="100%" className="transform -rotate-90">
                    {/* Render circles */}
                    {(() => {
                      let accumulatedPercent = 0;
                      return Object.entries(estadoCounts)
                        .filter(([_, count]) => count > 0)
                        .map(([estado, count], idx) => {
                          const percent = count / totalEquipos;
                          const strokeDasharray = `${percent * 376.99} 376.99`;
                          const strokeDashoffset = -accumulatedPercent * 376.99;
                          accumulatedPercent += percent;

                          const color = estado === 'recepcion' ? '#3B82F6' : // blue
                                        estado === 'espera' ? '#F59E0B' : // amber
                                        estado === 'revision' ? '#A855F7' : // purple
                                        estado === 'prueba' ? '#6366F1' : // indigo
                                        estado === 'terminado' ? '#10B981' : // emerald
                                        '#64748B'; // slate
                          return (
                            <circle
                              key={idx}
                              cx="100"
                              cy="100"
                              r="60"
                              fill="transparent"
                              stroke={color}
                              strokeWidth="22"
                              strokeDasharray={strokeDasharray}
                              strokeDashoffset={strokeDashoffset}
                              className="transition-all duration-300 hover:stroke-[26px]"
                            >
                              <title>
                                {estado === 'recepcion' ? 'Recepción' :
                                 estado === 'espera' ? 'En Espera' :
                                 estado === 'revision' ? 'En Revisión' :
                                 estado === 'prueba' ? 'En Pruebas' :
                                 estado === 'terminado' ? 'Terminado' : 'Entregado'}: {count} equipos ({Math.round(percent * 100)}%)
                              </title>
                            </circle>
                          );
                        });
                    })()}
                  </svg>
                  {/* Center Text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-xl font-black text-gray-800 leading-none">{totalEquipos}</span>
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">Equipos</span>
                  </div>
                </div>

                {/* Legend list */}
                <div className="flex-1 space-y-1.5 w-full">
                  {Object.entries(estadoCounts).map(([estado, count]) => {
                    if (count === 0) return null;
                    const label = estado === 'recepcion' ? 'Recepción' :
                                  estado === 'espera' ? 'En Espera' :
                                  estado === 'revision' ? 'En Revisión' :
                                  estado === 'prueba' ? 'En Pruebas' :
                                  estado === 'terminado' ? 'Terminado' : 'Entregado';
                    const colorBg = estado === 'recepcion' ? 'bg-blue-500' :
                                    estado === 'espera' ? 'bg-amber-500' :
                                    estado === 'revision' ? 'bg-purple-500' :
                                    estado === 'prueba' ? 'bg-indigo-500' :
                                    estado === 'terminado' ? 'bg-emerald-500' :
                                    'bg-gray-500';
                    const pct = totalEquipos > 0 ? Math.round((count / totalEquipos) * 100) : 0;
                    return (
                      <div key={estado} className="flex items-center justify-between text-[11px] font-medium bg-white px-2 py-1 rounded border border-gray-100">
                        <div className="flex items-center space-x-2 truncate">
                          <span className={`w-2.5 h-2.5 rounded-full ${colorBg} shrink-0`} />
                          <span className="text-gray-700 truncate">{label}</span>
                        </div>
                        <span className="text-gray-900 font-bold font-mono shrink-0">
                          {count} ({pct}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Chart 2: Bar (Comparación de Ingresos) */}
          <div className="p-4 border border-gray-100 rounded-xl bg-gray-50/50 flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-4 w-4 text-gray-600" />
                <h3 className="text-xs font-black uppercase tracking-wider text-gray-700">Comparativa de Ingresos</h3>
              </div>
              {/* Legends */}
              <div className="flex items-center space-x-2 text-[9px] font-bold">
                <span className="flex items-center space-x-1">
                  <span className="w-2 h-2 rounded bg-[#1E3A8A]" />
                  <span className="text-gray-500 uppercase">Facturado</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-2 h-2 rounded bg-[#10B981]" />
                  <span className="text-gray-500 uppercase">Cobrado</span>
                </span>
              </div>
            </div>

            {/* Bar Chart SVG wrapper */}
            <div className="relative h-40 w-full">
              {(() => {
                const maxVal = Math.max(
                  ingresosTotalMesAnterior || 5000,
                  ingresosTotalMesActual || 5000,
                  ingresosPaidMesAnterior || 5000,
                  ingresosPaidMesActual || 5000
                ) * 1.15; // add padding

                return (
                  <svg viewBox="0 0 400 200" width="100%" height="100%" className="font-sans">
                    {/* Grid lines */}
                    {[0, 0.33, 0.66, 1].map((ratio, idx) => {
                      const yVal = 160 - ratio * 130;
                      const label = Math.round(ratio * maxVal);
                      return (
                        <g key={idx} className="opacity-30">
                          <line x1="55" y1={yVal} x2="380" y2={yVal} stroke="#94A3B8" strokeWidth="1" strokeDasharray="3 3" />
                          <text x="0" y={yVal + 3} className="text-[10px] font-bold fill-gray-500 font-mono">${label.toLocaleString()}</text>
                        </g>
                      );
                    })}

                    {/* Group 1: Mes Anterior */}
                    <g className="transition-all duration-300 hover:opacity-95">
                      <text x="130" y="185" textAnchor="middle" className="text-xs font-black fill-gray-700">
                        {prevMonthName} (Anterior)
                      </text>

                      {/* Bar Facturado */}
                      <rect
                        x="90"
                        y={160 - (ingresosTotalMesAnterior / maxVal) * 130}
                        width="30"
                        height={Math.max(2, (ingresosTotalMesAnterior / maxVal) * 130)}
                        rx="4"
                        fill="#1E3A8A"
                      >
                        <title>Facturado Junio: ${ingresosTotalMesAnterior.toLocaleString()}</title>
                      </rect>
                      <text
                        x="105"
                        y={Math.max(15, 150 - (ingresosTotalMesAnterior / maxVal) * 130)}
                        textAnchor="middle"
                        className="text-[9px] font-bold fill-blue-900 font-mono"
                      >
                        ${Math.round(ingresosTotalMesAnterior / 100) / 10}k
                      </text>

                      {/* Bar Cobrado */}
                      <rect
                        x="125"
                        y={160 - (ingresosPaidMesAnterior / maxVal) * 130}
                        width="30"
                        height={Math.max(2, (ingresosPaidMesAnterior / maxVal) * 130)}
                        rx="4"
                        fill="#10B981"
                      >
                        <title>Cobrado Junio: ${ingresosPaidMesAnterior.toLocaleString()}</title>
                      </rect>
                      <text
                        x="140"
                        y={Math.max(15, 150 - (ingresosPaidMesAnterior / maxVal) * 130)}
                        textAnchor="middle"
                        className="text-[9px] font-bold fill-emerald-800 font-mono"
                      >
                        ${Math.round(ingresosPaidMesAnterior / 100) / 10}k
                      </text>
                    </g>

                    {/* Group 2: Mes Actual */}
                    <g className="transition-all duration-300 hover:opacity-95">
                      <text x="290" y="185" textAnchor="middle" className="text-xs font-black fill-gray-700">
                        {curMonthName} (Actual)
                      </text>

                      {/* Bar Facturado */}
                      <rect
                        x="250"
                        y={160 - (ingresosTotalMesActual / maxVal) * 130}
                        width="30"
                        height={Math.max(2, (ingresosTotalMesActual / maxVal) * 130)}
                        rx="4"
                        fill="#1E3A8A"
                      >
                        <title>Facturado Julio: ${ingresosTotalMesActual.toLocaleString()}</title>
                      </rect>
                      <text
                        x="265"
                        y={Math.max(15, 150 - (ingresosTotalMesActual / maxVal) * 130)}
                        textAnchor="middle"
                        className="text-[9px] font-bold fill-blue-900 font-mono"
                      >
                        ${Math.round(ingresosTotalMesActual / 100) / 10}k
                      </text>

                      {/* Bar Cobrado */}
                      <rect
                        x="285"
                        y={160 - (ingresosPaidMesActual / maxVal) * 130}
                        width="30"
                        height={Math.max(2, (ingresosPaidMesActual / maxVal) * 130)}
                        rx="4"
                        fill="#10B981"
                      >
                        <title>Cobrado Julio: ${ingresosPaidMesActual.toLocaleString()}</title>
                      </rect>
                      <text
                        x="300"
                        y={Math.max(15, 150 - (ingresosPaidMesActual / maxVal) * 130)}
                        textAnchor="middle"
                        className="text-[9px] font-bold fill-emerald-800 font-mono"
                      >
                        ${Math.round(ingresosPaidMesActual / 100) / 10}k
                      </text>
                    </g>

                    {/* Baseline */}
                    <line x1="50" y1="160" x2="380" y2="160" stroke="#CBD5E1" strokeWidth="1.5" />
                  </svg>
                );
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* 2. SECCIÓN DE RESPALDOS DE INFORMACIÓN */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
        <div className="flex items-center space-x-3 border-b border-gray-100 pb-4">
          <div className="p-2.5 bg-red-50 text-[#0A122C] rounded-lg">
            <Database className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Copias de Seguridad y Respaldos</h2>
            <p className="text-xs text-gray-500">Administración y resguardo de la información de APB Biomédica</p>
          </div>
        </div>

        {/* Description */}
        <div className="bg-red-50/40 p-4 rounded-xl border border-red-100 text-xs text-red-900 space-y-2 leading-relaxed">
          <p className="font-bold flex items-center gap-1 text-red-950">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-700" />
            ¿Cómo se guardan mis datos?
          </p>
          <p>
            Este sistema almacena todos los registros de seguimiento y contabilidad localmente en el navegador de este dispositivo de forma segura.
          </p>
          <p className="font-medium text-blue-950">
            Te recomendamos descargar una **Copia de Seguridad** periódicamente. Si limpias el historial de navegación, cambias de computadora o de teléfono, podrás cargar tu archivo descargado aquí mismo para restaurar instantáneamente el 100% de tu información con un clic.
          </p>
        </div>

        {/* Notifications */}
        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-lg text-xs font-semibold flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-lg text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Actions grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Export Card */}
          <div className="p-4 border border-gray-100 rounded-xl bg-gray-50 flex flex-col justify-between space-y-3">
            <div>
              <h3 className="text-sm font-bold text-gray-800">Exportar Base de Datos</h3>
              <p className="text-xs text-gray-500 mt-1">Descarga todos tus registros activos y datos de cobro como un archivo de respaldo en formato JSON.</p>
            </div>
            <button
              onClick={handleExport}
              className="w-full flex items-center justify-center space-x-2 bg-[#0A122C] hover:bg-[#121E42] text-white text-xs font-bold py-2.5 px-4 rounded-lg transition-colors cursor-pointer"
            >
              <Download className="h-4 w-4" />
              <span>Descargar Copia (.json)</span>
            </button>
          </div>

          {/* Import Card */}
          <div className="p-4 border border-gray-100 rounded-xl bg-gray-50 flex flex-col justify-between space-y-3">
            <div>
              <h3 className="text-sm font-bold text-gray-800">Restaurar Copia de Seguridad</h3>
              <p className="text-xs text-gray-500 mt-1">Sube un archivo de respaldo previamente descargado para sobrescribir y recuperar todos tus datos.</p>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportFile}
              accept=".json"
              className="hidden"
            />
            <button
              onClick={handleImportClick}
              className="w-full flex items-center justify-center space-x-2 border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 text-xs font-bold py-2.5 px-4 rounded-lg transition-colors cursor-pointer"
            >
              <Upload className="h-4 w-4" />
              <span>Subir Archivo de Respaldo</span>
            </button>
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* System Reset Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Clear DB */}
          <div className="p-4 border border-red-100 rounded-xl bg-red-50/20 flex flex-col justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold text-red-900">Vaciar Sistema (Comenzar de Cero)</h4>
              <p className="text-[11px] text-red-700 mt-0.5">Elimina todos los equipos actuales para comenzar una base de datos limpia de APB sin registros predeterminados.</p>
            </div>
            <button
              onClick={handleClearAllClick}
              className="w-full flex items-center justify-center space-x-1.5 border border-red-300 hover:bg-red-50 text-red-700 text-xs font-bold py-2 px-3 rounded-lg transition-all cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Limpiar Base de Datos</span>
            </button>
          </div>

          {/* Load Demo */}
          <div className="p-4 border border-blue-100/40 rounded-xl bg-blue-50/10 flex flex-col justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold text-gray-800">Cargar Equipos Demo</h4>
              <p className="text-[11px] text-gray-500 mt-0.5">Restablece y carga un conjunto de equipos y fallas de demostración iniciales para probar las funciones del sistema.</p>
            </div>
            <button
              onClick={handleLoadDemoClick}
              className="w-full flex items-center justify-center space-x-1.5 border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-bold py-2 px-3 rounded-lg transition-all cursor-pointer"
            >
              <Database className="h-3.5 w-3.5" />
              <span>Cargar Datos de Demostración</span>
            </button>
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* Password Management for Catalogs & Backups */}
        <div className="bg-slate-50 border border-gray-200/60 p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <Key className="h-5 w-5 text-gray-500" />
              <div>
                <h4 className="text-xs font-bold text-gray-800">Seguridad del Módulo de Configuración</h4>
                <p className="text-[11px] text-gray-500 mt-0.5">La contraseña actual es requerida para ingresar a este panel en futuras sesiones.</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowChangePassword(!showChangePassword)}
                className="text-xs font-bold px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                {showChangePassword ? 'Cancelar' : 'Cambiar Contraseña'}
              </button>
              <button
                onClick={onLock}
                className="text-xs font-bold px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition-colors cursor-pointer flex items-center space-x-1"
                title="Cerrar sesión de este módulo"
              >
                <Lock className="h-3 w-3" />
                <span>Bloquear</span>
              </button>
            </div>
          </div>

          {showChangePassword && (
            <form onSubmit={handleChangePasswordSubmit} className="mt-4 pt-4 border-t border-gray-200/60 space-y-3 max-w-sm animate-in slide-in-from-top duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Nueva Contraseña</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 4 caracteres"
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-xs bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Confirmar Contraseña</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repite la contraseña"
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-xs bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20"
                    required
                  />
                </div>
              </div>

              {changeError && <p className="text-xs text-red-600 font-semibold">{changeError}</p>}
              {changeSuccess && <p className="text-xs text-emerald-600 font-semibold">{changeSuccess}</p>}

              <button
                type="submit"
                className="bg-[#0A122C] hover:bg-[#121E42] text-white text-xs font-bold py-2 px-3 rounded-md transition-colors cursor-pointer"
              >
                Guardar Contraseña
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}
