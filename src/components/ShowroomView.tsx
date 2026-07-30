import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Search, Tag, DollarSign, Trash2, Edit, ExternalLink, 
  ShoppingBag, Info, X, ChevronLeft, ChevronRight, Image as ImageIcon, 
  FileText, CheckCircle2, User, HelpCircle, Calendar, Package,
  LayoutGrid, List, Lock, Unlock
} from 'lucide-react';
import { ShowroomEquipo, ShowroomEstado } from '../types';

interface ShowroomViewProps {
  equipos: ShowroomEquipo[];
  onSave: (equipo: ShowroomEquipo) => void;
  onDelete: (id: string) => void;
  showroomPassword?: string;
  onUpdatePassword?: (newPass: string) => void;
}

export default function ShowroomView({ 
  equipos, 
  onSave, 
  onDelete,
  showroomPassword = 'medica123',
  onUpdatePassword
}: ShowroomViewProps) {
  // States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'available' | 'sold' | 'borrowed'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [visibleCount, setVisibleCount] = useState<number>(30);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEquipo, setEditingEquipo] = useState<ShowroomEquipo | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Reset pagination when search or filters change
  React.useEffect(() => {
    setVisibleCount(30);
  }, [searchTerm, filterStatus]);
  
  // Carousel states per equipment ID
  const [activeImageIndexes, setActiveImageIndexes] = useState<Record<string, number>>({});

  // Form Fields State
  const [nombreEquipo, setNombreEquipo] = useState('');
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [numeroSerie, setNumeroSerie] = useState('');
  const [precioDistribuidor, setPrecioDistribuidor] = useState<number | ''>('');
  const [precioPublico, setPrecioPublico] = useState<number | ''>('');
  const [accesorios, setAccesorios] = useState('');
  const [fichaTecnicaUrl, setFichaTecnicaUrl] = useState('');
  const [estado, setEstado] = useState<ShowroomEstado>('disponible');
  const [vendido, setVendido] = useState(false);
  const [vendidoA, setVendidoA] = useState('');
  const [fechaVenta, setFechaVenta] = useState('');
  const [prestadoA, setPrestadoA] = useState('');
  const [fechaPrestamo, setFechaPrestamo] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [fotos, setFotos] = useState<string[]>([]);
  const [photoUrlInput, setPhotoUrlInput] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isCompressing, setIsCompressing] = useState(false);

  // Password protection states for prices
  const [isPricesUnlocked, setIsPricesUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Password change states
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changeSuccess, setChangeSuccess] = useState('');
  const [changeError, setChangeError] = useState('');

  // Password verification function
  const handleVerifyPassword = () => {
    const cleanPwd = passwordInput.trim();
    if (cleanPwd === showroomPassword) {
      setIsPricesUnlocked(true);
      setPasswordError('');
      setPasswordInput('');
    } else {
      setPasswordError('Contraseña incorrecta. Inténtelo de nuevo.');
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
    
    if (onUpdatePassword) {
      onUpdatePassword(trimmed);
      setChangeSuccess('Contraseña de showroom actualizada exitosamente.');
      setChangeError('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setChangeSuccess(''), 4000);
    }
  };

  // KPIs Calculations
  const stats = useMemo(() => {
    const total = equipos.length;
    const disponibles = equipos.filter(e => {
      const est = e.estado || (e.vendido ? 'vendido' : 'disponible');
      return est === 'disponible';
    }).length;
    const vendidos = equipos.filter(e => {
      const est = e.estado || (e.vendido ? 'vendido' : 'disponible');
      return est === 'vendido';
    }).length;
    const prestados = equipos.filter(e => {
      const est = e.estado || (e.vendido ? 'vendido' : 'disponible');
      return est === 'prestado';
    }).length;
    const valorDistribuidor = equipos.reduce((sum, e) => sum + (e.precioDistribuidor || 0), 0);
    const valorPublico = equipos.reduce((sum, e) => sum + (e.precioPublico || 0), 0);

    return { total, disponibles, vendidos, prestados, valorDistribuidor, valorPublico };
  }, [equipos]);

  // Filtered and Searched list
  const filteredEquipos = useMemo(() => {
    return equipos
      .filter(eq => {
        // Status Filter
        const est = eq.estado || (eq.vendido ? 'vendido' : 'disponible');
        if (filterStatus === 'available' && est !== 'disponible') return false;
        if (filterStatus === 'sold' && est !== 'vendido') return false;
        if (filterStatus === 'borrowed' && est !== 'prestado') return false;

        // Search text filter
        const term = searchTerm.toLowerCase().trim();
        if (!term) return true;

        return (
          eq.nombreEquipo.toLowerCase().includes(term) ||
          eq.marca.toLowerCase().includes(term) ||
          (eq.modelo || '').toLowerCase().includes(term) ||
          eq.numeroSerie.toLowerCase().includes(term) ||
          (eq.observaciones || '').toLowerCase().includes(term) ||
          (eq.vendidoA || '').toLowerCase().includes(term) ||
          (eq.prestadoA || '').toLowerCase().includes(term) ||
          (eq.accesorios || '').toLowerCase().includes(term)
        );
      })
      .sort((a, b) => {
        // Sort items: show newest sale date if sold, or by name/id
        const dateA = a.fechaVenta || '';
        const dateB = b.fechaVenta || '';
        if (dateA && dateB) return dateB.localeCompare(dateA);
        if (dateA) return -1;
        if (dateB) return 1;
        return b.id.localeCompare(a.id);
      });
  }, [equipos, filterStatus, searchTerm]);

  // Open form to Create
  const handleOpenCreate = () => {
    setEditingEquipo(null);
    setNombreEquipo('');
    setMarca('');
    setModelo('');
    setNumeroSerie('');
    setPrecioDistribuidor('');
    setPrecioPublico('');
    setAccesorios('');
    setFichaTecnicaUrl('');
    setEstado('disponible');
    setVendido(false);
    setVendidoA('');
    setFechaVenta('');
    setPrestadoA('');
    setFechaPrestamo('');
    setObservaciones('');
    setFotos([]);
    setPhotoUrlInput('');
    setFormErrors({});
    setIsPricesUnlocked(false);
    setPasswordInput('');
    setPasswordError('');
    setIsFormOpen(true);
  };

  // Open form to Edit
  const handleOpenEdit = (eq: ShowroomEquipo) => {
    setEditingEquipo(eq);
    setNombreEquipo(eq.nombreEquipo);
    setMarca(eq.marca);
    setModelo(eq.modelo || '');
    setNumeroSerie(eq.numeroSerie);
    setPrecioDistribuidor(eq.precioDistribuidor);
    setPrecioPublico(eq.precioPublico);
    setAccesorios(eq.accesorios);
    setFichaTecnicaUrl(eq.fichaTecnicaUrl);
    const resolvedEstado = eq.estado || (eq.vendido ? 'vendido' : 'disponible');
    setEstado(resolvedEstado);
    setVendido(eq.vendido);
    setVendidoA(eq.vendidoA || '');
    setFechaVenta(eq.fechaVenta || '');
    setPrestadoA(eq.prestadoA || '');
    setFechaPrestamo(eq.fechaPrestamo || '');
    setObservaciones(eq.observaciones || '');
    setFotos(eq.fotos || []);
    setPhotoUrlInput('');
    setFormErrors({});
    setIsPricesUnlocked(false);
    setPasswordInput('');
    setPasswordError('');
    setIsFormOpen(true);
  };

  // Set state helper and handle automatic dates
  const handleSetEstado = (nextEstado: ShowroomEstado) => {
    setEstado(nextEstado);
    if (nextEstado === 'vendido') {
      setVendido(true);
      if (!fechaVenta) {
        setFechaVenta(new Date().toISOString().split('T')[0]);
      }
    } else if (nextEstado === 'prestado') {
      setVendido(false);
      if (!fechaPrestamo) {
        setFechaPrestamo(new Date().toISOString().split('T')[0]);
      }
    } else {
      setVendido(false);
    }
  };

  // Add photo via URL
  const handleAddPhotoUrl = (e: React.MouseEvent) => {
    e.preventDefault();
    const url = photoUrlInput.trim();
    if (!url) return;
    
    if (fotos.length >= 20) {
      alert('Ya has alcanzado el límite máximo de 20 fotos por equipo.');
      return;
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      alert('Por favor introduce un enlace de foto válido que comience con http:// o https://');
      return;
    }

    setFotos(prev => [...prev, url]);
    setPhotoUrlInput('');
  };

  // Form Validation and Submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!nombreEquipo.trim()) errors.nombreEquipo = 'El nombre del equipo es obligatorio';
    if (!marca.trim()) errors.marca = 'La marca es obligatoria';
    if (precioDistribuidor === '' || precioDistribuidor < 0) {
      errors.precioDistribuidor = 'Precio distribuidor debe ser un número válido';
    }
    if (precioPublico === '' || precioPublico < 0) {
      errors.precioPublico = 'Precio público debe ser un número válido';
    }
    if (estado === 'vendido') {
      if (!vendidoA.trim()) {
        errors.vendidoA = 'Escriba a quién se le vendió el equipo';
      }
      if (!fechaVenta.trim()) {
        errors.fechaVenta = 'La fecha de venta es obligatoria cuando está vendido';
      }
    }
    if (estado === 'prestado') {
      if (!prestadoA.trim()) {
        errors.prestadoA = 'Escriba a quién se le prestó el equipo';
      }
      if (!fechaPrestamo.trim()) {
        errors.fechaPrestamo = 'La fecha de préstamo es obligatoria';
      }
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const savedItem: ShowroomEquipo = {
      id: editingEquipo ? editingEquipo.id : `showroom-${Date.now()}`,
      nombreEquipo: nombreEquipo.trim(),
      marca: marca.trim(),
      modelo: modelo.trim(),
      numeroSerie: numeroSerie.trim(),
      precioDistribuidor: Number(precioDistribuidor),
      precioPublico: Number(precioPublico),
      accesorios: accesorios.trim(),
      fichaTecnicaUrl: fichaTecnicaUrl.trim(),
      estado,
      vendido: estado === 'vendido',
      vendidoA: estado === 'vendido' ? vendidoA.trim() : '',
      fechaVenta: estado === 'vendido' ? fechaVenta : '',
      prestadoA: estado === 'prestado' ? prestadoA.trim() : '',
      fechaPrestamo: estado === 'prestado' ? fechaPrestamo : '',
      observaciones: observaciones.trim(),
      fotos
    };

    onSave(savedItem);
    setIsFormOpen(false);
  };

  // Client-side image upload & high performance compression
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const remainingSlots = 20 - fotos.length;
    if (remainingSlots <= 0) {
      alert('Ya has alcanzado el límite máximo de 20 fotos por equipo.');
      return;
    }

    const filesToProcess = Array.from(files).slice(0, remainingSlots);
    setIsCompressing(true);

    const processFile = (file: File): Promise<string> => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            // High-quality canvas compression down to max 800px width/height
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            const maxDimension = 800;

            if (width > maxDimension || height > maxDimension) {
              if (width > height) {
                height = Math.round((height * maxDimension) / width);
                width = maxDimension;
              } else {
                width = Math.round((width * maxDimension) / height);
                height = maxDimension;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              // Compress to JPEG with 0.75 quality for an extremely light footprint
              const base64 = canvas.toDataURL('image/jpeg', 0.75);
              resolve(base64);
            } else {
              resolve(event.target?.result as string);
            }
          };
          img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
      });
    };

    try {
      const compressedB64s = await Promise.all(filesToProcess.map(processFile));
      setFotos(prev => [...prev, ...compressedB64s]);
    } catch (err) {
      console.error('Error compressing images:', err);
    } finally {
      setIsCompressing(false);
    }
  };

  const removeFoto = (indexToRemove: number) => {
    setFotos(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Carousel actions
  const prevImage = (eqId: string, total: number) => {
    setActiveImageIndexes(prev => {
      const current = prev[eqId] || 0;
      const next = current === 0 ? total - 1 : current - 1;
      return { ...prev, [eqId]: next };
    });
  };

  const nextImage = (eqId: string, total: number) => {
    setActiveImageIndexes(prev => {
      const current = prev[eqId] || 0;
      const next = current === total - 1 ? 0 : current + 1;
      return { ...prev, [eqId]: next };
    });
  };

  // Confirm delete
  const handleDeleteConfirm = () => {
    if (confirmDeleteId) {
      onDelete(confirmDeleteId);
      setConfirmDeleteId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters Header bar */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Package className="h-6 w-6 text-red-600" />
            Show Room de Equipos
          </h1>
          <p className="text-xs text-gray-500 font-medium">
            Visualización, consulta de precios de distribuidores y público de equipos médicos listos para la venta.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-5 py-2.5 text-sm font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 shrink-0 cursor-pointer"
        >
          <Plus className="h-4.5 w-4.5 stroke-[2.5]" />
          <span>Registrar Equipo</span>
        </button>
      </div>

      {/* KPI Stats Panel */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* KPI 1 */}
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-200/70 flex items-center space-x-3.5">
          <div className="p-3 bg-red-50 text-red-600 rounded-xl">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total Equipos</p>
            <h3 className="text-xl font-black text-gray-900 mt-0.5">{stats.total}</h3>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-200/70 flex items-center space-x-3.5">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Disponibles</p>
            <h3 className="text-xl font-black text-emerald-700 mt-0.5">{stats.disponibles}</h3>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-200/70 flex items-center space-x-3.5">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <ShoppingBag className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Vendidos</p>
            <h3 className="text-xl font-black text-blue-700 mt-0.5">{stats.vendidos}</h3>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-200/70 flex items-center space-x-3.5">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <User className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Prestados</p>
            <h3 className="text-xl font-black text-purple-700 mt-0.5">{stats.prestados}</h3>
          </div>
        </div>

        {/* KPI 5 */}
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-200/70 flex items-center space-x-3.5 col-span-2 md:col-span-1">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Val. Distribuidor</p>
            <h3 className="text-lg font-black text-gray-900 mt-0.5">
              ${stats.valorDistribuidor.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
          </div>
        </div>
      </div>

      {/* Filter and Search controls */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-200/70 flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full lg:max-w-xs xl:max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400">
            <Search className="h-4.5 w-4.5" />
          </span>
          <input
            type="text"
            placeholder="Buscar por equipo, marca, modelo, serie o accesorios..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-gray-50/50 focus:bg-white"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto self-stretch lg:self-auto">
          {/* Segmented filter buttons */}
          <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-xl w-full sm:w-auto self-stretch sm:self-auto overflow-x-auto">
            <button
              onClick={() => setFilterStatus('all')}
              className={`flex-1 sm:flex-none text-xs font-bold px-4 py-2 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                filterStatus === 'all'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Todos ({stats.total})
            </button>
            <button
              onClick={() => setFilterStatus('available')}
              className={`flex-1 sm:flex-none text-xs font-bold px-4 py-2 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                filterStatus === 'available'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Disponibles ({stats.disponibles})
            </button>
            <button
              onClick={() => setFilterStatus('sold')}
              className={`flex-1 sm:flex-none text-xs font-bold px-4 py-2 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                filterStatus === 'sold'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Vendidos ({stats.vendidos})
            </button>
            <button
              onClick={() => setFilterStatus('borrowed')}
              className={`flex-1 sm:flex-none text-xs font-bold px-4 py-2 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                filterStatus === 'borrowed'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Prestados ({stats.prestados})
            </button>
          </div>

          {/* View mode toggle */}
          <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-xl shrink-0 self-stretch sm:self-auto w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`flex-1 sm:flex-none px-3 py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 text-xs font-bold ${
                viewMode === 'grid'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
              title="Vista Cuadrícula"
            >
              <LayoutGrid className="h-4 w-4" />
              <span>Cuadrícula</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`flex-1 sm:flex-none px-3 py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 text-xs font-bold ${
                viewMode === 'list'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
              title="Vista Lista"
            >
              <List className="h-4 w-4" />
              <span>Lista</span>
            </button>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {filteredEquipos.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-200/80 shadow-xs space-y-4">
          <div className="mx-auto w-16 h-16 bg-slate-50 border border-slate-100 text-slate-400 rounded-full flex items-center justify-center">
            <Package className="h-8 w-8" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-lg font-black text-gray-800">No se encontraron equipos</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              {searchTerm 
                ? 'Intenta modificando tu término de búsqueda o filtros para encontrar el equipo médico deseado.' 
                : 'Comienza registrando equipos médicos en tu showroom haciendo clic en "Registrar Equipo".'}
            </p>
          </div>
          {!searchTerm && (
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg cursor-pointer inline-flex items-center gap-1.5 shadow-xs transition-all"
            >
              <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>Registrar Primer Equipo</span>
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEquipos.slice(0, visibleCount).map((eq) => {
              const currentImgIndex = activeImageIndexes[eq.id] || 0;
              const hasImages = eq.fotos && eq.fotos.length > 0;

            return (
              <div 
                key={eq.id}
                className="bg-white rounded-2xl shadow-sm hover:shadow-md border border-gray-200/80 overflow-hidden flex flex-col justify-between transition-all group relative"
              >
                {/* Dynamic Status Badge Header overlay */}
                {(() => {
                  const resolvedEst = eq.estado || (eq.vendido ? 'vendido' : 'disponible');
                  if (resolvedEst === 'vendido') {
                    return (
                      <div className="absolute top-3 left-3 z-10 bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
                        <ShoppingBag className="h-3 w-3" />
                        <span>Vendido</span>
                      </div>
                    );
                  } else if (resolvedEst === 'prestado') {
                    return (
                      <div className="absolute top-3 left-3 z-10 bg-purple-600 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>Prestado</span>
                      </div>
                    );
                  } else {
                    return (
                      <div className="absolute top-3 left-3 z-10 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Disponible</span>
                      </div>
                    );
                  }
                })()}

                {/* Action buttons overlay for edit/delete */}
                <div className="absolute top-3 right-3 z-10 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button
                    onClick={() => handleOpenEdit(eq)}
                    className="p-1.5 bg-white/90 backdrop-blur-xs hover:bg-white text-gray-700 hover:text-red-600 rounded-lg shadow-md border border-gray-200/50 transition-all cursor-pointer"
                    title="Editar equipo"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(eq.id)}
                    className="p-1.5 bg-white/90 backdrop-blur-xs hover:bg-red-50 text-gray-700 hover:text-red-700 rounded-lg shadow-md border border-gray-200/50 transition-all cursor-pointer"
                    title="Eliminar equipo"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Top Section: Photo Carousel */}
                <div className="relative h-48 bg-slate-100 border-b border-gray-100 flex items-center justify-center overflow-hidden shrink-0 group-hover:bg-slate-50 transition-colors">
                  {hasImages ? (
                    <>
                      <img 
                        src={eq.fotos[currentImgIndex]} 
                        alt={`${eq.nombreEquipo} preview`} 
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
                        referrerPolicy="no-referrer"
                      />
                      {/* Carousel Arrows (only if more than 1 image) */}
                      {eq.fotos.length > 1 && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              prevImage(eq.id, eq.fotos.length);
                            }}
                            className="absolute left-2 p-1 rounded-full bg-black/40 text-white hover:bg-black/60 transition-all cursor-pointer"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              nextImage(eq.id, eq.fotos.length);
                            }}
                            className="absolute right-2 p-1 rounded-full bg-black/40 text-white hover:bg-black/60 transition-all cursor-pointer"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                          
                          {/* Indicator pills */}
                          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-1 bg-black/20 px-2 py-0.5 rounded-full">
                            {eq.fotos.map((_, idx) => (
                              <span 
                                key={idx}
                                className={`h-1.5 w-1.5 rounded-full transition-all ${
                                  idx === currentImgIndex ? 'bg-white w-2.5' : 'bg-white/50'
                                }`}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="text-center p-6 space-y-2">
                      <div className="mx-auto w-12 h-12 bg-white rounded-xl border border-gray-200 flex items-center justify-center text-gray-400">
                        <ImageIcon className="h-5 w-5" />
                      </div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sin Fotografías</p>
                    </div>
                  )}
                </div>

                {/* Middle Section: Specs & Description */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-1.5">
                    {/* Brand & Model */}
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-black text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded-md uppercase tracking-wider">
                        {eq.marca}
                      </span>
                      {eq.modelo && (
                        <span className="text-xs font-bold text-gray-500">
                          Mod. {eq.modelo}
                        </span>
                      )}
                    </div>

                    {/* Name */}
                    <h2 className="text-lg font-black text-gray-900 tracking-tight leading-tight group-hover:text-red-700 transition-colors">
                      {eq.nombreEquipo}
                    </h2>

                    {/* Serial Number & Date */}
                    <div className="flex flex-wrap items-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                      {eq.numeroSerie ? (
                        <>
                          <span>S/N: {eq.numeroSerie}</span>
                        </>
                      ) : null}
                      {(() => {
                        const resolvedEst = eq.estado || (eq.vendido ? 'vendido' : 'disponible');
                        if (resolvedEst === 'vendido' && eq.fechaVenta) {
                          return (
                            <>
                              {eq.numeroSerie ? <span>•</span> : null}
                              <span className="inline-flex items-center gap-0.5 text-blue-600 font-extrabold bg-blue-50 px-1.5 py-0.5 rounded-md border border-blue-100">
                                <Calendar className="h-3.5 w-3.5" />
                                Venta: {eq.fechaVenta}
                              </span>
                            </>
                          );
                        } else if (resolvedEst === 'prestado' && eq.fechaPrestamo) {
                          return (
                            <>
                              {eq.numeroSerie ? <span>•</span> : null}
                              <span className="inline-flex items-center gap-0.5 text-purple-600 font-extrabold bg-purple-50 px-1.5 py-0.5 rounded-md border border-purple-100">
                                <Calendar className="h-3.5 w-3.5" />
                                Préstamo: {eq.fechaPrestamo}
                              </span>
                            </>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>

                  {/* Pricing block: Dealer & Public */}
                  <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl grid grid-cols-2 gap-3 shrink-0">
                    <div>
                      <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest block">Precio Distribuidor</span>
                      <p className="text-sm font-black text-slate-800 mt-0.5 inline-flex items-center">
                        <DollarSign className="h-3.5 w-3.5 text-slate-400 -mr-0.5" />
                        {eq.precioDistribuidor.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="border-l border-slate-200/60 pl-3">
                      <span className="text-[9px] text-red-500/80 font-black uppercase tracking-widest block">Precio Público</span>
                      <p className="text-sm font-black text-red-700 mt-0.5 inline-flex items-center">
                        <DollarSign className="h-3.5 w-3.5 text-red-500/60 -mr-0.5" />
                        {eq.precioPublico.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>

                  {/* Accessories */}
                  {eq.accesorios ? (
                    <div className="space-y-1">
                      <span className="text-[9px] text-gray-400 font-black uppercase tracking-wider block">Accesorios Incluidos:</span>
                      <p className="text-xs text-gray-600 bg-gray-50/50 p-2 rounded-lg border border-gray-100 line-clamp-2">
                        {eq.accesorios}
                      </p>
                    </div>
                  ) : null}

                  {/* Observations */}
                  {eq.observaciones ? (
                    <div className="space-y-1">
                      <span className="text-[9px] text-gray-400 font-black uppercase tracking-wider block">Notas/Observaciones:</span>
                      <p className="text-xs text-gray-500 italic line-clamp-2">
                        {eq.observaciones}
                      </p>
                    </div>
                  ) : null}

                  {/* Dynamic Status Extra Details (Vendido o Prestado) */}
                  {(() => {
                    const resolvedEst = eq.estado || (eq.vendido ? 'vendido' : 'disponible');
                    if (resolvedEst === 'vendido' && eq.vendidoA) {
                      return (
                        <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-2.5 flex items-start space-x-2 shrink-0">
                          <User className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                          <div>
                            <span className="text-[9px] text-blue-500 font-black uppercase tracking-wider block">Vendido a:</span>
                            <p className="text-xs font-bold text-blue-900">{eq.vendidoA}</p>
                          </div>
                        </div>
                      );
                    } else if (resolvedEst === 'prestado' && eq.prestadoA) {
                      return (
                        <div className="bg-purple-50/50 border border-purple-100 rounded-xl p-2.5 flex items-start space-x-2 shrink-0">
                          <User className="h-4 w-4 text-purple-600 mt-0.5 shrink-0" />
                          <div>
                            <span className="text-[9px] text-purple-500 font-black uppercase tracking-wider block">Prestado a:</span>
                            <p className="text-xs font-bold text-purple-900">{eq.prestadoA}</p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>

                {/* Bottom Section: Technical sheet button link */}
                {eq.fichaTecnicaUrl && (
                  <div className="bg-slate-50 border-t border-gray-100 p-3 flex items-center justify-center shrink-0">
                    <a 
                      href={eq.fichaTecnicaUrl.startsWith('http') ? eq.fichaTecnicaUrl : `https://${eq.fichaTecnicaUrl}`}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-full py-1.5 text-xs font-bold bg-white hover:bg-red-50 border border-gray-200 hover:border-red-200 text-gray-700 hover:text-red-700 rounded-lg shadow-2xs transition-all flex items-center justify-center gap-1.5"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      <span>Ficha Técnica Oficial</span>
                      <ExternalLink className="h-3 w-3 opacity-60" />
                    </a>
                  </div>
                )}
              </div>
            );
          })}
          </div>
        </>
      ) : (
        <>
          <div className="space-y-4">
            {filteredEquipos.slice(0, visibleCount).map((eq) => {
              const currentImgIndex = activeImageIndexes[eq.id] || 0;
              const hasImages = eq.fotos && eq.fotos.length > 0;

            return (
              <div 
                key={eq.id}
                className="bg-white rounded-2xl shadow-sm hover:shadow-md border border-gray-200/80 overflow-hidden flex flex-col md:flex-row transition-all group relative"
              >
                {/* Status Badge overlay for mobile */}
                <div className="md:hidden absolute top-3 left-3 z-10">
                  {(() => {
                    const resolvedEst = eq.estado || (eq.vendido ? 'vendido' : 'disponible');
                    if (resolvedEst === 'vendido') {
                      return (
                        <div className="bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
                          <ShoppingBag className="h-3 w-3" />
                          <span>Vendido</span>
                        </div>
                      );
                    } else if (resolvedEst === 'prestado') {
                      return (
                        <div className="bg-purple-600 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>Prestado</span>
                        </div>
                      );
                    } else {
                      return (
                        <div className="bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Disponible</span>
                        </div>
                      );
                    }
                  })()}
                </div>

                {/* Action buttons overlay for mobile edit/delete */}
                <div className="md:hidden absolute top-3 right-3 z-10 flex items-center space-x-1">
                  <button
                    onClick={() => handleOpenEdit(eq)}
                    className="p-1.5 bg-white/90 backdrop-blur-xs hover:bg-white text-gray-700 hover:text-red-600 rounded-lg shadow-md border border-gray-200/50 transition-all cursor-pointer"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(eq.id)}
                    className="p-1.5 bg-white/90 backdrop-blur-xs hover:bg-red-50 text-gray-700 hover:text-red-700 rounded-lg shadow-md border border-gray-200/50 transition-all cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Left Side: Thumbnail / Carousel */}
                <div className="relative w-full md:w-56 lg:w-64 h-48 md:h-auto bg-slate-100 border-b md:border-b-0 md:border-r border-gray-200/60 flex items-center justify-center overflow-hidden shrink-0 group-hover:bg-slate-50 transition-colors">
                  {/* Status Badge overlay for desktop */}
                  <div className="hidden md:block absolute top-3 left-3 z-10">
                    {(() => {
                      const resolvedEst = eq.estado || (eq.vendido ? 'vendido' : 'disponible');
                      if (resolvedEst === 'vendido') {
                        return (
                          <div className="bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
                            <ShoppingBag className="h-3 w-3" />
                            <span>Vendido</span>
                          </div>
                        );
                      } else if (resolvedEst === 'prestado') {
                        return (
                          <div className="bg-purple-600 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>Prestado</span>
                          </div>
                        );
                      } else {
                        return (
                          <div className="bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Disponible</span>
                          </div>
                        );
                      }
                    })()}
                  </div>

                  {hasImages ? (
                    <>
                      <img 
                        src={eq.fotos[currentImgIndex]} 
                        alt={`${eq.nombreEquipo} preview`} 
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
                        referrerPolicy="no-referrer"
                      />
                      {eq.fotos.length > 1 && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              prevImage(eq.id, eq.fotos.length);
                            }}
                            className="absolute left-2 p-1 rounded-full bg-black/40 text-white hover:bg-black/60 transition-all cursor-pointer"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              nextImage(eq.id, eq.fotos.length);
                            }}
                            className="absolute right-2 p-1 rounded-full bg-black/40 text-white hover:bg-black/60 transition-all cursor-pointer"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                          
                          {/* Indicator pills */}
                          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-1 bg-black/20 px-2 py-0.5 rounded-full">
                            {eq.fotos.map((_, idx) => (
                              <span 
                                key={idx}
                                className={`h-1.5 w-1.5 rounded-full transition-all ${
                                  idx === currentImgIndex ? 'bg-white w-2.5' : 'bg-white/50'
                                }`}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="text-center p-6 space-y-2">
                      <div className="mx-auto w-12 h-12 bg-white rounded-xl border border-gray-200 flex items-center justify-center text-gray-400">
                        <ImageIcon className="h-5 w-5" />
                      </div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sin Fotografías</p>
                    </div>
                  )}
                </div>

                {/* Middle & Right Content */}
                <div className="p-5 md:p-6 flex-1 flex flex-col lg:flex-row justify-between gap-6">
                  {/* Left Info Column */}
                  <div className="flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-black text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded-md uppercase tracking-wider">
                          {eq.marca}
                        </span>
                        {eq.modelo && (
                          <span className="text-xs font-bold text-gray-500">
                            Mod. {eq.modelo}
                          </span>
                        )}
                      </div>

                      <h2 className="text-xl font-black text-gray-900 tracking-tight leading-tight group-hover:text-red-700 transition-colors">
                        {eq.nombreEquipo}
                      </h2>

                      <div className="flex flex-wrap items-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                        {eq.numeroSerie ? (
                          <>
                            <span>S/N: {eq.numeroSerie}</span>
                          </>
                        ) : null}
                        {(() => {
                          const resolvedEst = eq.estado || (eq.vendido ? 'vendido' : 'disponible');
                          if (resolvedEst === 'vendido' && eq.fechaVenta) {
                            return (
                              <>
                                {eq.numeroSerie ? <span>•</span> : null}
                                <span className="inline-flex items-center gap-0.5 text-blue-600 font-extrabold bg-blue-50 px-1.5 py-0.5 rounded-md border border-blue-100">
                                  <Calendar className="h-3.5 w-3.5" />
                                  Venta: {eq.fechaVenta}
                                </span>
                              </>
                            );
                          } else if (resolvedEst === 'prestado' && eq.fechaPrestamo) {
                            return (
                              <>
                                {eq.numeroSerie ? <span>•</span> : null}
                                <span className="inline-flex items-center gap-0.5 text-purple-600 font-extrabold bg-purple-50 px-1.5 py-0.5 rounded-md border border-purple-100">
                                  <Calendar className="h-3.5 w-3.5" />
                                  Préstamo: {eq.fechaPrestamo}
                                </span>
                              </>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    </div>

                    {/* Accessories & Notes Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {eq.accesorios ? (
                        <div className="space-y-1">
                          <span className="text-[9px] text-gray-400 font-black uppercase tracking-wider block">Accesorios Incluidos:</span>
                          <p className="text-xs text-gray-600 bg-gray-50/50 p-2.5 rounded-xl border border-gray-100/80 line-clamp-2">
                            {eq.accesorios}
                          </p>
                        </div>
                      ) : null}

                      {eq.observaciones ? (
                        <div className="space-y-1">
                          <span className="text-[9px] text-gray-400 font-black uppercase tracking-wider block">Notas/Observaciones:</span>
                          <p className="text-xs text-gray-500 italic bg-slate-50/30 p-2.5 rounded-xl border border-slate-100 line-clamp-2">
                            {eq.observaciones}
                          </p>
                        </div>
                      ) : null}
                    </div>

                    {/* Dynamic Status Extra Details (Vendido o Prestado) */}
                    {(() => {
                      const resolvedEst = eq.estado || (eq.vendido ? 'vendido' : 'disponible');
                      if (resolvedEst === 'vendido' && eq.vendidoA) {
                        return (
                          <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-2.5 flex items-center space-x-2 shrink-0 self-start">
                            <User className="h-4 w-4 text-blue-600 shrink-0" />
                            <div>
                              <p className="text-xs font-bold text-blue-900">
                                <span className="text-[9px] text-blue-500 font-black uppercase tracking-wider mr-1.5">Vendido a:</span>
                                {eq.vendidoA}
                              </p>
                            </div>
                          </div>
                        );
                      } else if (resolvedEst === 'prestado' && eq.prestadoA) {
                        return (
                          <div className="bg-purple-50/50 border border-purple-100 rounded-xl p-2.5 flex items-center space-x-2 shrink-0 self-start">
                            <User className="h-4 w-4 text-purple-600 shrink-0" />
                            <div>
                              <p className="text-xs font-bold text-purple-900">
                                <span className="text-[9px] text-purple-500 font-black uppercase tracking-wider mr-1.5">Prestado a:</span>
                                {eq.prestadoA}
                              </p>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>

                  {/* Pricing and Action controls (Right Side on desktop) */}
                  <div className="w-full lg:w-64 flex flex-col justify-between space-y-4 shrink-0 lg:border-l lg:border-gray-100 lg:pl-6">
                    {/* Pricing Grid */}
                    <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl grid grid-cols-2 gap-3 shrink-0">
                      <div>
                        <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest block">Distribuidor</span>
                        <p className="text-sm font-black text-slate-800 mt-0.5 inline-flex items-center">
                          <DollarSign className="h-3.5 w-3.5 text-slate-400 -mr-0.5" />
                          {eq.precioDistribuidor.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="border-l border-slate-200/60 pl-3">
                        <span className="text-[9px] text-red-500/80 font-black uppercase tracking-widest block">Público</span>
                        <p className="text-sm font-black text-red-700 mt-0.5 inline-flex items-center">
                          <DollarSign className="h-3.5 w-3.5 text-red-500/60 -mr-0.5" />
                          {eq.precioPublico.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>

                    {/* Actions list */}
                    <div className="flex flex-col gap-2">
                      {eq.fichaTecnicaUrl && (
                        <a 
                          href={eq.fichaTecnicaUrl.startsWith('http') ? eq.fichaTecnicaUrl : `https://${eq.fichaTecnicaUrl}`}
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="w-full py-2 text-xs font-bold bg-white hover:bg-red-50 border border-gray-200 hover:border-red-200 text-gray-700 hover:text-red-700 rounded-xl shadow-2xs transition-all flex items-center justify-center gap-1.5"
                        >
                          <FileText className="h-3.5 w-3.5 text-slate-400" />
                          <span>Ficha Técnica Oficial</span>
                          <ExternalLink className="h-3 w-3 opacity-60" />
                        </a>
                      )}

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(eq)}
                          className="py-2 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-gray-700 hover:text-red-600 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Edit className="h-3.5 w-3.5" />
                          <span>Editar</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(eq.id)}
                          className="py-2 px-3 bg-red-50/50 hover:bg-red-50 border border-red-100 text-red-600 hover:text-red-700 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Eliminar</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        </>
      )}

      {/* Pagination / Load More for handling thousands of records smoothly */}
      {filteredEquipos.length > 0 && (
        <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-gray-500 font-medium">
            Mostrando <span className="font-bold text-gray-900">{Math.min(visibleCount, filteredEquipos.length)}</span> de <span className="font-bold text-gray-900">{filteredEquipos.length}</span> equipos filtrados (Total registrados: <span className="font-bold text-red-600">{stats.total}</span>)
          </div>
          {filteredEquipos.length > visibleCount && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setVisibleCount(prev => prev + 50)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-gray-800 font-bold rounded-xl transition-all cursor-pointer"
              >
                Cargar más equipos (+50)
              </button>
              <button
                type="button"
                onClick={() => setVisibleCount(filteredEquipos.length)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all shadow-2xs cursor-pointer"
              >
                Mostrar todos ({filteredEquipos.length})
              </button>
            </div>
          )}
        </div>
      )}

      {/* --- CRUD SLIDE-OVER FORM MODAL --- */}
      <AnimatePresence>
        {isFormOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFormOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 cursor-pointer"
            />

            {/* Slide over */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className="fixed top-0 right-0 h-full w-full max-w-lg bg-white border-l border-gray-200 shadow-2xl z-50 flex flex-col justify-between overflow-hidden"
            >
              {/* Form Header */}
              <div className="p-6 border-b border-gray-200/80 bg-slate-50 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-gray-900">
                    {editingEquipo ? 'Editar Equipo en Showroom' : 'Registrar Equipo en Showroom'}
                  </h2>
                  <p className="text-xs text-gray-500 font-medium">Completa los campos para catalogar este equipo médico.</p>
                </div>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="p-1.5 hover:bg-red-50 hover:text-red-600 rounded-lg border border-transparent hover:border-red-100 transition-all cursor-pointer text-gray-500"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Form Body Scrollable */}
              <form onSubmit={handleSubmit} className="flex-1 p-6 overflow-y-auto space-y-6">
                
                {/* 1. Nombre */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Nombre del Equipo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Electrocardiógrafo de 12 canales, Monitor de Signos"
                    value={nombreEquipo}
                    onChange={(e) => setNombreEquipo(e.target.value)}
                    className={`w-full px-3.5 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${
                      formErrors.nombreEquipo ? 'border-red-500 ring-2 ring-red-100 focus:ring-red-100' : 'border-gray-300 focus:ring-blue-500/20 focus:border-blue-500'
                    }`}
                  />
                  {formErrors.nombreEquipo && <p className="text-xs text-red-500 font-medium">{formErrors.nombreEquipo}</p>}
                </div>

                {/* 2. Marca y Modelo Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Marca *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Mindray, General Electric"
                      value={marca}
                      onChange={(e) => setMarca(e.target.value)}
                      className={`w-full px-3.5 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${
                        formErrors.marca ? 'border-red-500 ring-2 ring-red-100' : 'border-gray-300 focus:ring-blue-500/20'
                      }`}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Modelo</label>
                    <input
                      type="text"
                      placeholder="Ej. BeneVision N12, MAC 2000"
                      value={modelo}
                      onChange={(e) => setModelo(e.target.value)}
                      className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>

                {/* 3. Número de Serie */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Número de Serie</label>
                  <input
                    type="text"
                    placeholder="Ej. SN-984725A"
                    value={numeroSerie}
                    onChange={(e) => setNumeroSerie(e.target.value)}
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono"
                  />
                </div>

                {/* 4. PRECIOS: Distribuidor y Público con protección de contraseña */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5">
                      <DollarSign className="h-4 w-4 text-gray-500" />
                      <span className="text-xs font-black text-gray-700 uppercase tracking-wider">Asignación de Precios</span>
                    </div>
                    {isPricesUnlocked ? (
                      <button
                        type="button"
                        onClick={() => setIsPricesUnlocked(false)}
                        className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-extrabold bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-md border border-emerald-100 transition-colors cursor-pointer"
                        title="Haga clic para volver a bloquear"
                      >
                        <Unlock className="h-3 w-3" />
                        <span>Desbloqueado</span>
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 font-extrabold bg-amber-50 px-2.5 py-1 rounded-md border border-amber-100 animate-pulse">
                        <Lock className="h-3 w-3" />
                        <span>Bloqueado</span>
                      </span>
                    )}
                  </div>

                  {!isPricesUnlocked ? (
                    <div className="bg-white rounded-xl p-3 border border-amber-200/50 shadow-2xs space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
                      <div>
                        <p className="text-[11px] text-gray-600 font-bold">Se requiere contraseña para modificar o asignar precios</p>
                        <p className="text-[10px] text-gray-400 font-medium">Ingrese la contraseña administrativa para continuar.</p>
                      </div>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <input
                            type="password"
                            placeholder="Introduce contraseña..."
                            value={passwordInput}
                            onChange={(e) => {
                              setPasswordInput(e.target.value);
                              setPasswordError('');
                            }}
                            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleVerifyPassword();
                              }
                            }}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleVerifyPassword}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                        >
                          Validar
                        </button>
                      </div>
                      {passwordError && (
                        <p className="text-[10px] text-red-500 font-bold">{passwordError}</p>
                      )}
                    </div>
                  ) : null}

                  {isPricesUnlocked && (
                    <div className="pt-2 border-t border-slate-200/80">
                      {!showChangePassword ? (
                        <button
                          type="button"
                          onClick={() => setShowChangePassword(true)}
                          className="text-[10px] text-blue-600 hover:text-blue-800 font-bold transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <span>⚙️</span> Cambiar contraseña de acceso a precios
                        </button>
                      ) : (
                        <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-2xs space-y-2.5 mt-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                            <span className="text-[11px] font-bold text-gray-700">Cambiar Contraseña de Precios</span>
                            <button
                              type="button"
                              onClick={() => {
                                setShowChangePassword(false);
                                setChangeError('');
                                setChangeSuccess('');
                              }}
                              className="text-[10px] text-gray-400 hover:text-gray-600 font-bold cursor-pointer"
                            >
                              Cancelar
                            </button>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider">Nueva Contraseña</label>
                              <input
                                type="password"
                                placeholder="Nueva clave..."
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs font-mono"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider">Confirmar</label>
                              <input
                                type="password"
                                placeholder="Repite clave..."
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs font-mono"
                              />
                            </div>
                          </div>

                          {changeError && (
                            <p className="text-[10px] text-red-500 font-bold">{changeError}</p>
                          )}
                          {changeSuccess && (
                            <p className="text-[10px] text-emerald-600 font-bold">{changeSuccess}</p>
                          )}

                          <div className="flex justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={handleChangePasswordSubmit}
                              className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                            >
                              Guardar Contraseña
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className={`grid grid-cols-2 gap-4 transition-all duration-200 ${!isPricesUnlocked ? 'opacity-35 pointer-events-none' : ''}`}>
                    <div className="space-y-1">
                      <label className="block text-xs font-black text-gray-700 uppercase tracking-wider">Precio Distribuidor ($) *</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                          <DollarSign className="h-4 w-4" />
                        </span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          required
                          disabled={!isPricesUnlocked}
                          placeholder="0.00"
                          value={precioDistribuidor}
                          onChange={(e) => setPrecioDistribuidor(e.target.value !== '' ? Number(e.target.value) : '')}
                          className={`w-full pl-8 pr-3.5 py-2 border rounded-xl text-sm font-bold focus:outline-none focus:ring-2 transition-all bg-white disabled:bg-slate-50 disabled:text-gray-400 ${
                            formErrors.precioDistribuidor ? 'border-red-500 ring-2 ring-red-100' : 'border-gray-300 focus:ring-blue-500/20'
                          }`}
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-black text-red-600 uppercase tracking-wider">Precio al Público ($) *</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-red-400">
                          <DollarSign className="h-4 w-4" />
                        </span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          required
                          disabled={!isPricesUnlocked}
                          placeholder="0.00"
                          value={precioPublico}
                          onChange={(e) => setPrecioPublico(e.target.value !== '' ? Number(e.target.value) : '')}
                          className={`w-full pl-8 pr-3.5 py-2 border rounded-xl text-sm font-bold focus:outline-none focus:ring-2 transition-all bg-white disabled:bg-slate-50 disabled:text-gray-400 ${
                            formErrors.precioPublico ? 'border-red-500 ring-2 ring-red-100' : 'border-gray-300 focus:ring-blue-500/20'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 5. Accesorios */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Accesorios Incluidos</label>
                  <textarea
                    rows={2}
                    placeholder="Describe los sensores, cables, pedestales o aditamentos incluidos..."
                    value={accesorios}
                    onChange={(e) => setAccesorios(e.target.value)}
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                  />
                </div>

                {/* 6. Ficha Tecnica Link */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5 text-gray-400" />
                    <span>Link de Ficha Técnica (URL)</span>
                  </label>
                  <input
                    type="url"
                    placeholder="https://example.com/ficha-tecnica.pdf"
                    value={fichaTecnicaUrl}
                    onChange={(e) => setFichaTecnicaUrl(e.target.value)}
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder-gray-400"
                  />
                </div>

                {/* 7. Estado del Equipo Selector (Disponible, Vendido, Prestado) */}
                <div className="border border-slate-200 rounded-2xl p-4 space-y-4 bg-slate-50/50">
                  <div className="space-y-1.5">
                    <span className="text-xs font-black text-gray-900 uppercase tracking-wider block">Estado de Disponibilidad del Equipo *</span>
                    <span className="text-[10px] text-gray-500 block">Indica si el equipo médico está listo para venta, ya fue vendido o se encuentra en calidad de préstamo</span>
                    
                    {/* Segmented select or dropdown */}
                    <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-xl mt-2">
                      <button
                        type="button"
                        onClick={() => handleSetEstado('disponible')}
                        className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                          estado === 'disponible'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Disponible</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetEstado('vendido')}
                        className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                          estado === 'vendido'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        <ShoppingBag className="h-3.5 w-3.5" />
                        <span>Vendido</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetEstado('prestado')}
                        className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                          estado === 'prestado'
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        <User className="h-3.5 w-3.5" />
                        <span>Prestado</span>
                      </button>
                    </div>
                  </div>

                  {/* Vendido fields */}
                  {estado === 'vendido' && (
                    <div className="space-y-3.5 pt-2 border-t border-slate-200/60 animate-in fade-in slide-in-from-top-1 duration-200">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-blue-900 uppercase tracking-wider">¿A quién se le vendió? *</label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-blue-400">
                            <User className="h-4 w-4" />
                          </span>
                          <input
                            type="text"
                            required
                            placeholder="Ej. Hospital Civil de Guadalajara, Dr. Manuel Reyes"
                            value={vendidoA}
                            onChange={(e) => setVendidoA(e.target.value)}
                            className={`w-full pl-8 pr-3.5 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all bg-white ${
                              formErrors.vendidoA ? 'border-red-500 ring-2 ring-red-100' : 'border-blue-200 focus:ring-blue-500/20'
                            }`}
                          />
                        </div>
                        {formErrors.vendidoA && <p className="text-xs text-red-500 font-medium">{formErrors.vendidoA}</p>}
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-blue-900 uppercase tracking-wider">Fecha de Venta *</label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-blue-400">
                            <Calendar className="h-4 w-4" />
                          </span>
                          <input
                            type="date"
                            required
                            value={fechaVenta}
                            onChange={(e) => setFechaVenta(e.target.value)}
                            className={`w-full pl-8 pr-3.5 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all bg-white ${
                              formErrors.fechaVenta ? 'border-red-500 ring-2 ring-red-100' : 'border-blue-200 focus:ring-blue-500/20'
                            }`}
                          />
                        </div>
                        {formErrors.fechaVenta && <p className="text-xs text-red-500 font-medium">{formErrors.fechaVenta}</p>}
                      </div>
                    </div>
                  )}

                  {/* Prestado fields */}
                  {estado === 'prestado' && (
                    <div className="space-y-3.5 pt-2 border-t border-slate-200/60 animate-in fade-in slide-in-from-top-1 duration-200">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-purple-900 uppercase tracking-wider">¿A quién se le prestó? *</label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-purple-400">
                            <User className="h-4 w-4" />
                          </span>
                          <input
                            type="text"
                            required
                            placeholder="Ej. Dr. Armando Ramos (Demostración), Hospital San Juan"
                            value={prestadoA}
                            onChange={(e) => setPrestadoA(e.target.value)}
                            className={`w-full pl-8 pr-3.5 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all bg-white ${
                              formErrors.prestadoA ? 'border-red-500 ring-2 ring-red-100' : 'border-purple-200 focus:ring-purple-500/20'
                            }`}
                          />
                        </div>
                        {formErrors.prestadoA && <p className="text-xs text-red-500 font-medium">{formErrors.prestadoA}</p>}
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-purple-900 uppercase tracking-wider">Fecha de Préstamo *</label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-purple-400">
                            <Calendar className="h-4 w-4" />
                          </span>
                          <input
                            type="date"
                            required
                            value={fechaPrestamo}
                            onChange={(e) => setFechaPrestamo(e.target.value)}
                            className={`w-full pl-8 pr-3.5 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all bg-white ${
                              formErrors.fechaPrestamo ? 'border-red-500 ring-2 ring-red-100' : 'border-purple-200 focus:ring-purple-500/20'
                            }`}
                          />
                        </div>
                        {formErrors.fechaPrestamo && <p className="text-xs text-red-500 font-medium">{formErrors.fechaPrestamo}</p>}
                      </div>
                    </div>
                  )}
                </div>

                {/* 8. Observaciones */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Notas adicionales</label>
                  <textarea
                    rows={2}
                    placeholder="Observaciones de estado estético, garantía o entrega..."
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                  />
                </div>

                {/* 9. FOTOS: drag & drop upload up to 20 */}
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-xs font-black text-gray-700 uppercase tracking-wider">Fotos del Equipo (Hasta 20)</label>
                      <span className="text-[10px] text-gray-400">Sube fotos del equipo. Serán auto-comprimidas para mayor velocidad.</span>
                    </div>
                    <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                      {fotos.length} / 20
                    </span>
                  </div>

                  {/* Dropzone field */}
                  {fotos.length < 20 && (
                    <div className="space-y-3">
                      <div className="relative border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:bg-slate-50/50 hover:border-red-400 transition-colors cursor-pointer group">
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          disabled={isCompressing}
                          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                        />
                        <div className="space-y-2">
                          <div className="mx-auto w-10 h-10 bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center group-hover:bg-red-50 group-hover:text-red-600 transition-colors">
                            <ImageIcon className="h-5 w-5" />
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-xs font-bold text-slate-700">Haz clic o arrastra fotos aquí</p>
                            <p className="text-[10px] text-slate-400">Formatos soportados: PNG, JPG, JPEG (máx 5MB c/u)</p>
                          </div>
                        </div>
                      </div>

                      {/* Photo Link Input */}
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <input
                            type="url"
                            placeholder="O añade el enlace (URL) de la foto aquí..."
                            value={photoUrlInput}
                            onChange={(e) => setPhotoUrlInput(e.target.value)}
                            className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder-gray-400 bg-slate-50/50 focus:bg-white"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleAddPhotoUrl}
                          className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer shrink-0"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Agregar Enlace</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {isCompressing && (
                    <div className="text-xs text-red-600 font-bold animate-pulse text-center bg-red-50/50 p-2 rounded-xl border border-red-100/30">
                      Comprimiendo y optimizando imágenes...
                    </div>
                  )}

                  {/* Photos list thumbnails */}
                  {fotos.length > 0 && (
                    <div className="grid grid-cols-5 gap-3">
                      {fotos.map((imgStr, idx) => (
                        <div key={idx} className="relative h-16 rounded-xl overflow-hidden border border-slate-200 shadow-2xs group">
                          <img 
                            src={imgStr} 
                            alt={`Preview Thumbnail ${idx}`} 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <button
                            type="button"
                            onClick={() => removeFoto(idx)}
                            className="absolute top-1 right-1 p-0.5 bg-black/60 hover:bg-red-600 text-white rounded-md transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                            title="Quitar foto"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                          <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[8px] font-bold px-1.5 py-0.2 rounded-md">
                            {idx + 1}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </form>

              {/* Form Footer Actions */}
              <div className="p-4 bg-slate-50 border-t border-gray-200 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="px-5 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="h-4.5 w-4.5" />
                  <span>{editingEquipo ? 'Guardar Cambios' : 'Registrar Equipo'}</span>
                </button>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete confirmation modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center">
                <Trash2 className="h-6 w-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-black text-gray-900">¿Eliminar del Showroom?</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  ¿Estás seguro de que deseas eliminar permanentemente este equipo del catálogo?
                </p>
                <p className="text-xs text-red-600 font-bold bg-red-50 p-2.5 rounded-xl border border-red-100">
                  Esta acción eliminará de forma irreversible el equipo y todas sus fotos cargadas.
                </p>
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-4 flex items-center justify-end space-x-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-5 py-2 text-sm font-bold rounded-xl text-white bg-red-600 hover:bg-red-700 shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
                <span>Confirmar Eliminar</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
