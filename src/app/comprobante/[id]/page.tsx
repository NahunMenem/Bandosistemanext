'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Printer, MessageCircle, ShoppingBag } from 'lucide-react';

interface VentaData {
  id: number;
  fecha: string;
  total: number;
  pago_a_cuenta: number;
  saldo_resultante: number;
  metodo_pago: string;
  descripcion: string | null;
  deuda_anterior: number;
  cliente: {
    id: number;
    nombre: string;
    domicilio: string | null;
    localidad: string | null;
    documento: string | null;
    telefono: string | null;
  };
  items: {
    id: number;
    cantidad: number;
    descripcion: string;
    precio_unitario: number;
    total: number;
  }[];
}

export default function ComprobantePage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<VentaData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/ventas/${id}`)
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

  const deudaTotal = data.deuda_anterior + data.total - data.pago_a_cuenta;

  const shareWhatsApp = () => {
    const url = window.location.href;
    const msg = encodeURIComponent(
      `Comprobante de venta Rodeo Calzados\nCliente: ${data.cliente.nombre}\nTotal: ${fmtPeso(data.total)}\nPagó: ${fmtPeso(data.pago_a_cuenta)}\nSaldo: ${fmtPeso(data.saldo_resultante)}\n${url}`
    );
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg overflow-hidden print:shadow-none print:rounded-none">
        {/* Header */}
        <div className="bg-blue-700 text-white px-6 py-5">
          <div className="flex items-center gap-3 mb-1">
            <ShoppingBag size={22} />
            <span className="font-bold text-lg">Rodeo Calzados</span>
          </div>
          <p className="text-blue-200 text-sm">Comprobante de Venta N° {data.id}</p>
          <p className="text-blue-200 text-sm">{fmtFecha(data.fecha)}</p>
        </div>

        {/* Client info */}
        <div className="px-6 py-4 border-b border-gray-100">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Cliente</p>
          <p className="font-semibold text-gray-900">{data.cliente.nombre}</p>
          {data.cliente.documento && <p className="text-sm text-gray-600">DNI: {data.cliente.documento}</p>}
          {data.cliente.domicilio && <p className="text-sm text-gray-600">{data.cliente.domicilio}{data.cliente.localidad ? `, ${data.cliente.localidad}` : ''}</p>}
        </div>

        {/* Items */}
        <div className="px-6 py-4 border-b border-gray-100">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">Artículos</p>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 text-xs border-b border-gray-100">
                <th className="text-left pb-2">Desc.</th>
                <th className="text-center pb-2">Cant.</th>
                <th className="text-right pb-2">P. Unit.</th>
                <th className="text-right pb-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item) => (
                <tr key={item.id} className="border-b border-gray-50">
                  <td className="py-1.5 pr-2 text-gray-800">{item.descripcion}</td>
                  <td className="py-1.5 text-center text-gray-600">{item.cantidad}</td>
                  <td className="py-1.5 text-right text-gray-600">{fmtPeso(item.precio_unitario)}</td>
                  <td className="py-1.5 text-right font-medium text-gray-900">{fmtPeso(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="px-6 py-4 space-y-1.5 text-sm border-b border-gray-100">
          <div className="flex justify-between text-gray-700">
            <span>Total operación</span>
            <span className="font-semibold">{fmtPeso(data.total)}</span>
          </div>
          {data.deuda_anterior > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>Deuda anterior</span>
              <span className="text-red-600">+ {fmtPeso(data.deuda_anterior)}</span>
            </div>
          )}
          <div className="flex justify-between text-gray-700">
            <span>Pago a cuenta ({data.metodo_pago})</span>
            <span className="text-green-700">- {fmtPeso(data.pago_a_cuenta)}</span>
          </div>
          <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-2 mt-1">
            <span>Saldo resultante</span>
            <span className={deudaTotal > 0 ? 'text-red-600' : 'text-green-600'}>{fmtPeso(data.saldo_resultante)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 flex gap-3 print:hidden">
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
