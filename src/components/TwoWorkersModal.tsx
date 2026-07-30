import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle2, AlertCircle, Link2, Copy, Shield, Sparkles, Key, Globe, ArrowRight, X } from 'lucide-react';

interface TwoWorkersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncSuccess?: () => void;
}

export default function TwoWorkersModal({ isOpen, onClose, onSyncSuccess }: TwoWorkersModalProps) {
  const [apiKey, setApiKey] = useState('');
  const [apiToken, setApiToken] = useState('');
  const [autoSync, setAutoSync] = useState(true);
  const [syncTarget, setSyncTarget] = useState<'showroom' | 'taller' | 'both'>('showroom');

  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [testMessage, setTestMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [lastSyncStatus, setLastSyncStatus] = useState<string | null>(null);
  const [syncedCount, setSyncedCount] = useState<number>(0);
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  const webhookUrl = `${window.location.origin}/api/2workers/webhook`;

  // Fetch current config on load
  useEffect(() => {
    if (isOpen) {
      fetchConfig();
    }
  }, [isOpen]);

  const fetchConfig = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/2workers/config');
      if (res.ok) {
        const data = await res.json();
        if (data.config) {
          setApiKey(data.config.apiKey || '');
          setApiToken(data.config.apiToken || '');
          setAutoSync(data.config.autoSync !== false);
          setSyncTarget(data.config.syncTarget || 'showroom');
          if (data.config.lastSyncTime) {
            setLastSyncTime(new Date(data.config.lastSyncTime).toLocaleString());
          }
          setLastSyncStatus(data.config.lastSyncStatus || null);
          setSyncedCount(data.config.syncedCount || 0);
        }
      }
    } catch (e) {
      console.error('Error cargando configuración 2Workers:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    if (!apiKey.trim() || !apiToken.trim()) {
      setTestMessage({ type: 'error', text: 'Por favor ingrese tanto la API Key como el API Token.' });
      return;
    }

    setIsLoading(true);
    setTestMessage(null);
    try {
      const res = await fetch('/api/2workers/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: apiKey.trim(), apiToken: apiToken.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setTestMessage({ type: 'success', text: '¡Conexión exitosa con API 2Workers!' });
        // Auto-save on successful test
        await saveConfig();
      } else {
        setTestMessage({ type: 'error', text: data.error || 'No se pudo conectar con 2Workers. Verifique las credenciales.' });
      }
    } catch (e) {
      setTestMessage({ type: 'error', text: 'Error de red al intentar conectar con la API de 2Workers.' });
    } finally {
      setIsLoading(false);
    }
  };

  const saveConfig = async () => {
    try {
      await fetch('/api/2workers/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: apiKey.trim(),
          apiToken: apiToken.trim(),
          autoSync,
          syncTarget
        })
      });
    } catch (e) {
      console.error('Error guardando configuración:', e);
    }
  };

  const handleManualSync = async () => {
    if (!apiKey.trim() || !apiToken.trim()) {
      setSyncMessage({ type: 'error', text: 'Inicie sesión primero ingresando su API Key y API Token.' });
      return;
    }

    setIsSyncing(true);
    setSyncMessage(null);
    try {
      const res = await fetch('/api/2workers/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: apiKey.trim(),
          apiToken: apiToken.trim(),
          syncTarget
        })
      });

      const data = await res.json();
      if (data.success) {
        setSyncMessage({
          type: 'success',
          text: `Sincronización completada. ${data.syncedCount || 0} equipos obtenidos de 2Workers (${data.newCount || 0} nuevos agregados).`
        });
        setLastSyncTime(new Date().toLocaleString());
        setSyncedCount(data.totalEquipmentsInDb || 0);
        if (onSyncSuccess) {
          onSyncSuccess();
        }
      } else {
        setSyncMessage({ type: 'error', text: data.error || 'Error durante la sincronización.' });
      }
    } catch (e) {
      setSyncMessage({ type: 'error', text: 'Error conectando al servidor para sincronizar.' });
    } finally {
      setIsSyncing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-[#0A122C] text-white p-6 border-b-4 border-red-600 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-red-600/20 border border-red-500/30 rounded-2xl text-red-400">
              <Link2 className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-black text-white tracking-wide">Integración API 2Workers</h3>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                  REST v2
                </span>
              </div>
              <p className="text-xs text-blue-200 font-medium">
                Vincula tus equipos registrados en 2Workers automáticamente a esta app
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Credentials Card */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Key className="h-4 w-4 text-blue-600" />
                <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider">Credenciales de Acceso 2Workers</h4>
              </div>
              <a
                href="https://2workers.me/integracao"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-blue-600 hover:text-blue-800 font-bold flex items-center space-x-1"
              >
                <span>Obtener llaves</span>
                <ArrowRight className="h-3 w-3" />
              </a>
            </div>

            <p className="text-xs text-gray-500 leading-relaxed">
              En tu cuenta de 2Workers ve a <strong className="text-gray-700">Menú &gt; Integración</strong> para copiar tu <strong>API Key</strong> y <strong>API Token</strong>.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-700">API Key *</label>
                <input
                  type="text"
                  placeholder="Ej: wJFEnm661UjsWChs..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-700">API Token *</label>
                <input
                  type="password"
                  placeholder="Ej: wJFEnm661Uj0pwDJ..."
                  value={apiToken}
                  onChange={(e) => setApiToken(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                />
              </div>
            </div>

            {testMessage && (
              <div className={`p-3 rounded-xl text-xs font-bold flex items-center space-x-2 ${
                testMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {testMessage.type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
                <span>{testMessage.text}</span>
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isLoading}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50 cursor-pointer flex items-center space-x-1.5"
              >
                {isLoading ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Shield className="h-3.5 w-3.5 text-blue-400" />
                )}
                <span>Probar y Guardar Conexión</span>
              </button>
            </div>
          </div>

          {/* Sync Preferences & Manual Sync */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider">Opciones de Sincronización</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-700">Destino de Equipos Importados</label>
                <select
                  value={syncTarget}
                  onChange={(e) => setSyncTarget(e.target.value as any)}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white cursor-pointer"
                >
                  <option value="showroom">Show Room (Catálogo comercial)</option>
                  <option value="taller">Seguimiento (Taller de Servicio)</option>
                  <option value="both">Ambos (Show Room + Seguimiento)</option>
                </select>
              </div>

              <div className="space-y-1 flex flex-col justify-end">
                <label className="flex items-center space-x-2.5 cursor-pointer p-2 bg-white rounded-xl border border-gray-200 hover:bg-slate-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={autoSync}
                    onChange={(e) => setAutoSync(e.target.checked)}
                    className="h-4 w-4 text-blue-600 rounded-md border-gray-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-gray-800">
                    Sincronización Automática (Cada 3 min)
                  </span>
                </label>
              </div>
            </div>

            {/* Sync trigger button & Status */}
            <div className="pt-2 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-gray-500 space-y-0.5">
                <p>Última sincronización: <span className="font-bold text-gray-800">{lastSyncTime || 'Nunca'}</span></p>
                {syncedCount > 0 && (
                  <p className="text-[11px] text-emerald-600 font-bold">✓ {syncedCount} equipos sincronizados actualmente en esta app</p>
                )}
              </div>

              <button
                type="button"
                onClick={handleManualSync}
                disabled={isSyncing}
                className="w-full sm:w-auto px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer flex items-center justify-center space-x-2"
              >
                <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Sincronizando de 2Workers...' : '⚡ Sincronizar Equipos Ahora'}</span>
              </button>
            </div>

            {syncMessage && (
              <div className={`p-3 rounded-xl text-xs font-bold flex items-center space-x-2 ${
                syncMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {syncMessage.type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
                <span>{syncMessage.text}</span>
              </div>
            )}
          </div>

          {/* Webhook Configuration */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center space-x-2">
              <Globe className="h-4 w-4 text-emerald-600" />
              <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider">Webhook en Tiempo Real (Respuesta Instantánea)</h4>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Configura este URL en la sección de <strong>Webhooks</strong> de 2Workers para que cuando alguien agregue o edite un equipo en 2Workers, aparezca <strong>inmediatamente en tiempo real</strong> en esta aplicación en todos los dispositivos:
            </p>

            <div className="flex items-center space-x-2">
              <input
                type="text"
                readOnly
                value={webhookUrl}
                className="flex-1 px-3.5 py-2 border border-slate-300 bg-white rounded-xl text-xs font-mono text-gray-700 select-all focus:outline-none"
              />
              <button
                type="button"
                onClick={() => copyToClipboard(webhookUrl)}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center space-x-1.5 shrink-0"
              >
                <Copy className="h-3.5 w-3.5" />
                <span>{copiedWebhook ? '¡Copiado!' : 'Copiar URL'}</span>
              </button>
            </div>
            <p className="text-[10px] text-gray-400 font-medium">
              Nota: Selecciona la entidad <strong className="text-gray-600">Equipamentos / Tarefas</strong> y la acción <strong className="text-gray-600">Inclusão</strong> al crear el webhook en 2Workers.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-gray-500 font-semibold">API 2Workers v2 Integración Directa</span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
