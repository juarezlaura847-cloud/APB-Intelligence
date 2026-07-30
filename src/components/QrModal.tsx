import React, { useState, useEffect } from 'react';
import { X, Printer, Download, QrCode, Clipboard, Check, Heart, ShieldAlert, FileText, Share2, Link } from 'lucide-react';
import QRCode from 'qrcode';
import { Equipo } from '../types';

interface QrModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipo: Equipo | null;
}

export default function QrModal({ isOpen, onClose, equipo }: QrModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Generate a URL that contains all equipment data so it loads from any device!
  const getQrUrl = (eq: Equipo) => {
    const origin = window.location.origin + window.location.pathname;
    const params = new URLSearchParams();
    params.set('eq_qr', '1');
    params.set('id', eq.id || '');
    params.set('nom', eq.nombreEquipo || '');
    params.set('mar', eq.marca || 'Por definir');
    params.set('hos', eq.hospital || '');
    params.set('sn', eq.numeroSerie || 'S/N');
    params.set('rec', eq.recibidoPor || '');
    params.set('fal', eq.falla || '');
    params.set('acc', eq.accesorios || 'Ninguno');
    params.set('fec', eq.fechaLlegada || '');
    if (eq.estado) params.set('est', eq.estado);
    if (eq.observaciones) params.set('obs', eq.observaciones);
    return `${origin}?${params.toString()}`;
  };

  const getQrText = (eq: Equipo) => {
    return `*** APB ***
Equipo: ${eq.nombreEquipo}
Marca: ${eq.marca || 'Por definir'}
Hospital: ${eq.hospital}
S/N: ${eq.numeroSerie}
Recibido por: ${eq.recibidoPor}
Falla: ${eq.falla}
Accesorios: ${eq.accesorios}
Fecha Ingreso: ${eq.fechaLlegada}`;
  };

  useEffect(() => {
    if (isOpen && equipo) {
      const qrUrl = getQrUrl(equipo);
      QRCode.toDataURL(qrUrl, {
        width: 400,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      })
        .then((url) => {
          setQrDataUrl(url);
        })
        .catch((err) => {
          console.error('Error generating QR code', err);
        });
    }
  }, [isOpen, equipo]);

  if (!isOpen || !equipo) return null;

  const handleCopyText = () => {
    const text = getQrText(equipo);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopyLink = () => {
    const link = getQrUrl(equipo);
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handlePrintLabel = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Etiqueta APB - ${equipo.numeroSerie}</title>
          <style>
            body {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              padding: 20px;
              margin: 0;
              background-color: #ffffff;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
            }
            .sticker-card {
              border: 3px solid #1e293b;
              border-radius: 12px;
              padding: 20px;
              width: 380px;
              background: #fff;
              box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #e2e8f0;
              padding-bottom: 10px;
              margin-bottom: 15px;
            }
            .header .brand {
              font-size: 24px;
              font-weight: 800;
              color: #dc2626;
              letter-spacing: -0.5px;
              margin: 0;
            }
            .header .sub {
              font-size: 10px;
              color: #64748b;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin: 2px 0 0 0;
            }
            .qr-wrapper {
              display: flex;
              justify-content: center;
              margin-bottom: 15px;
            }
            .qr-image {
              width: 180px;
              height: 180px;
              display: block;
            }
            .info-grid {
              font-size: 11px;
              line-height: 1.5;
              color: #1e293b;
            }
            .info-row {
              display: flex;
              padding: 4px 0;
              border-bottom: 1px dashed #f1f5f9;
            }
            .info-row:last-child {
              border-bottom: none;
            }
            .info-label {
              font-weight: 700;
              width: 110px;
              color: #475569;
              flex-shrink: 0;
            }
            .info-value {
              font-weight: 600;
              color: #0f172a;
              word-break: break-word;
            }
            .footer-tag {
              text-align: center;
              margin-top: 15px;
              font-size: 9px;
              font-weight: 700;
              color: #94a3b8;
              text-transform: uppercase;
            }
            @media print {
              body {
                background: none;
                padding: 0;
                margin: 0;
                min-height: auto;
              }
              .sticker-card {
                border: 2px solid #000000;
                box-shadow: none;
                width: 100%;
                max-width: 100%;
                box-sizing: border-box;
                page-break-inside: avoid;
              }
            }
          </style>
        </head>
        <body>
          <div class="sticker-card">
            <div class="header">
              <h1 class="brand">APB</h1>
              <div class="sub">Asesoría y Pluriservicios Biomédicos</div>
            </div>
            <div class="qr-wrapper">
              <img class="qr-image" src="${qrDataUrl}" alt="Código QR" />
            </div>
            <div class="info-grid">
              <div class="info-row">
                <span class="info-label">Equipo:</span>
                <span class="info-value">${equipo.nombreEquipo}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Marca:</span>
                <span class="info-value">${equipo.marca || 'Por definir'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Hospital:</span>
                <span class="info-value">${equipo.hospital}</span>
              </div>
              <div class="info-row">
                <span class="info-label">N/S:</span>
                <span class="info-value">${equipo.numeroSerie}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Ingreso:</span>
                <span class="info-value">${equipo.fechaLlegada}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Recibido por:</span>
                <span class="info-value">${equipo.recibidoPor}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Falla Reportada:</span>
                <span class="info-value">${equipo.falla}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Accesorios:</span>
                <span class="info-value">${equipo.accesorios}</span>
              </div>
            </div>
            <div class="footer-tag">APB BIOMÉDICA - Control de Equipos</div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `QR_${equipo.numeroSerie || 'equipo'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div 
        id="qr-modal-container"
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col my-8 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-red-700 to-red-800 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center space-x-2.5">
            <div className="p-1 bg-white/10 rounded-md">
              <QrCode className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Etiqueta de Control QR</h2>
              <p className="text-[10px] text-red-100 font-medium">Asesoría y Pluriservicios Biomédicos</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/15 text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Main Visual QR Area */}
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 flex flex-col items-center justify-center space-y-4">
            {qrDataUrl ? (
              <img 
                src={qrDataUrl} 
                alt="Código QR del Equipo" 
                className="w-48 h-48 bg-white p-3 rounded-xl shadow-xs border border-gray-200 transition-all hover:scale-[1.02]"
              />
            ) : (
              <div className="w-48 h-48 bg-white border border-dashed border-gray-300 rounded-xl flex items-center justify-center">
                <span className="text-xs text-gray-400 font-medium">Generando Código...</span>
              </div>
            )}
            <div className="text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Identificador de Serie</span>
              <p className="text-sm font-extrabold text-gray-800 tracking-wide font-mono mt-0.5">{equipo.numeroSerie}</p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={handlePrintLabel}
              className="flex flex-col items-center justify-center p-3 border border-slate-200 hover:border-red-200 bg-white hover:bg-red-50/20 text-slate-700 hover:text-red-700 rounded-xl transition-all cursor-pointer group"
            >
              <Printer className="h-5 w-5 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-bold">Imprimir Etiqueta</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex flex-col items-center justify-center p-3 border border-slate-200 hover:border-red-200 bg-white hover:bg-red-50/20 text-slate-700 hover:text-red-700 rounded-xl transition-all cursor-pointer group"
            >
              <Download className="h-5 w-5 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-bold">Descargar Imagen</span>
            </button>

            <button
              onClick={handleCopyLink}
              className="flex flex-col items-center justify-center p-3 border border-slate-200 hover:border-red-200 bg-white hover:bg-red-50/20 text-slate-700 hover:text-red-700 rounded-xl transition-all cursor-pointer group"
            >
              {copiedLink ? (
                <>
                  <Check className="h-5 w-5 mb-1 text-emerald-600 scale-110 animate-bounce" />
                  <span className="text-[10px] font-bold text-emerald-600 font-sans">¡Enlace Copiado!</span>
                </>
              ) : (
                <>
                  <Link className="h-5 w-5 mb-1 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-bold">Copiar Enlace</span>
                </>
              )}
            </button>

            <button
              onClick={handleCopyText}
              className="flex flex-col items-center justify-center p-3 border border-slate-200 hover:border-red-200 bg-white hover:bg-red-50/20 text-slate-700 hover:text-red-700 rounded-xl transition-all cursor-pointer group"
            >
              {copied ? (
                <>
                  <Check className="h-5 w-5 mb-1 text-emerald-600 scale-110 animate-bounce" />
                  <span className="text-[10px] font-bold text-emerald-600">¡Resumen Copiado!</span>
                </>
              ) : (
                <>
                  <Clipboard className="h-5 w-5 mb-1 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-bold">Copiar Resumen</span>
                </>
              )}
            </button>
          </div>

          {/* Metadata Accordion/Box */}
          <div className="border border-slate-100 rounded-xl overflow-hidden divide-y divide-slate-100 bg-slate-50/40 text-xs">
            <div className="px-4 py-2.5 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Contenido codificado en el QR
            </div>
            
            <div className="p-3 grid grid-cols-3 gap-2">
              <span className="font-semibold text-slate-500">Nombre:</span>
              <span className="col-span-2 font-bold text-slate-800">{equipo.nombreEquipo}</span>
            </div>

            <div className="p-3 grid grid-cols-3 gap-2">
              <span className="font-semibold text-slate-500">Marca:</span>
              <span className="col-span-2 font-bold text-slate-800">{equipo.marca || 'Por definir'}</span>
            </div>

            <div className="p-3 grid grid-cols-3 gap-2">
              <span className="font-semibold text-slate-500">Hospital:</span>
              <span className="col-span-2 font-bold text-slate-800">{equipo.hospital}</span>
            </div>

            <div className="p-3 grid grid-cols-3 gap-2">
              <span className="font-semibold text-slate-500">Serie (SN):</span>
              <span className="col-span-2 font-mono font-bold text-slate-800">{equipo.numeroSerie}</span>
            </div>

            <div className="p-3 grid grid-cols-3 gap-2">
              <span className="font-semibold text-slate-500">Falla:</span>
              <span className="col-span-2 text-slate-700 font-medium">{equipo.falla}</span>
            </div>

            <div className="p-3 grid grid-cols-3 gap-2">
              <span className="font-semibold text-slate-500">Accesorios:</span>
              <span className="col-span-2 text-slate-700 font-medium">{equipo.accesorios}</span>
            </div>

            <div className="p-3 grid grid-cols-3 gap-2">
              <span className="font-semibold text-slate-500">Fecha Ingreso:</span>
              <span className="col-span-2 font-bold text-slate-800">{equipo.fechaLlegada || 'Sin registrar'}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Heart className="h-3 w-3 text-red-500 fill-red-500" /> Control Biomédico APB
          </span>
          <button
            onClick={onClose}
            className="font-bold text-slate-700 hover:text-slate-900 cursor-pointer"
          >
            Cerrar Ventana
          </button>
        </div>
      </div>
    </div>
  );
}
