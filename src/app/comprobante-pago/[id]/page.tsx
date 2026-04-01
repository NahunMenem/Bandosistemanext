'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Printer, MessageCircle, ShoppingBag } from 'lucide-react';

interface PagoData {
  id: number;
  fecha: string;
  monto: number;
  metodo_pago: string;
  cliente: {
    id: number;
    nombre: string;
    documento: string | null;
    domicilio: string | null;
    localidad: string | null;
    telefono: string | null;
  };
}

export default function ComprobantePagoPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<PagoData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/pagos/${id}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); });
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center text-gray-400">
      Cargando comprobante...
    </div>
  );

  if (!data) return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center text-gray-400">
      Comprobante no encontrado
    </div>
  );

  const fmtPeso = (n: number) =>
    n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 });

  const fmtFecha = (d: string) =>
    new Date(d).toLocaleString('es-AR', { dateStyle: 'long', timeStyle: 'short' });

  const shareWhatsApp = () => {
    const msg = encodeURIComponent(
      `Comprobante de pago - Rodeo Calzados\nCliente: ${data.cliente.nombre}\nMonto abonado: ${fmtPeso(data.monto)}\nMétodo: ${data.metodo_pago}\nFecha: ${fmtFecha(data.fecha)}`
    );
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg overflow-hidden print:shadow-none print:rounded-none">
        {/* Header */}
        <div className="bg-green-700 text-white px-6 py-5">
          <div className="flex items-center gap-3 mb-1">
            <ShoppingBag size={22} />
            <span className="font-bold text-lg">Rodeo Calzados</span>
          </div>
          <p className="text-green-200 text-sm">Comprobante de Pago N° {data.id}</p>
          <p className="text-green-200 text-sm">{fmtFecha(data.fecha)}</p>
        </div>

        {/* Client info */}
        <div className="px-6 py-4 border-b border-gray-100">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Cliente</p>
          <p className="font-semibold text-gray-900">{data.cliente.nombre}</p>
          {data.cliente.documento && <p className="text-sm text-gray-600">DNI: {data.cliente.documento}</p>}
          {data.cliente.domicilio && (
            <p className="text-sm text-gray-600">
              {data.cliente.domicilio}{data.cliente.localidad ? `, ${data.cliente.localidad}` : ''}
            </p>
          )}
        </div>

        {/* Payment details */}
        <div className="px-6 py-5 space-y-3">
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
            <p className="text-sm text-green-700 mb-1">Monto abonado</p>
            <p className="text-3xl font-bold text-green-800">{fmtPeso(data.monto)}</p>
            <p className="text-sm text-green-600 mt-1 capitalize">Método: {data.metodo_pago}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-4 text-center">
          <p className="text-xs text-gray-400">Gracias por su pago</p>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3 print:hidden">
          <button
            onClick={() => window.print()}
            className="flex-1 flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            <Printer size={16} />
            Imprimir
          </button>
          <button
            onClick={shareWhatsApp}
            className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            <MessageCircle size={16} />
            WhatsApp
          </button>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body { background: white; }
          .print\\:hidden { display: none !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:rounded-none { border-radius: 0 !important; }
        }
      `}</style>
    </div>
  );
}
