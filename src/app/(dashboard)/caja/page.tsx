'use client';

import { useState, useEffect, useCallback } from 'react';
import { DollarSign, TrendingUp, Wallet, Search } from 'lucide-react';

interface CajaData {
  total_ventas: number;
  total_ingresado: number;
  por_metodo: Record<string, number>;
  desde: string | null;
  hasta: string | null;
}

const metodosLabel: Record<string, string> = {
  efectivo: 'Efectivo',
  debito: 'Débito',
  credito: 'Crédito',
  transferencia: 'Transferencia',
};

export default function CajaPage() {
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [data, setData] = useState<CajaData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (desde) params.set('desde', desde);
    if (hasta) params.set('hasta', hasta);
    const res = await fetch(`/api/caja?${params}`);
    const json = await res.json();
    setData(json);
    setLoading(false);
  }, [desde, hasta]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const fmtPeso = (n: number) =>
    n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 });

  const metodos = data ? Object.entries(data.por_metodo).sort((a, b) => b[1] - a[1]) : [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        <DollarSign size={24} className="text-blue-400" />
        Caja
      </h1>

      {/* Filters */}
      <div className="bg-gray-800 rounded-xl p-5">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Desde</label>
            <input
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Hasta</label>
            <input
              type="date"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <button
            onClick={() => { setDesde(''); setHasta(''); }}
            className="flex items-center gap-1 text-sm text-gray-400 hover:text-white px-3 py-2 rounded-lg border border-gray-600 hover:border-gray-500 transition-colors"
          >
            <Search size={14} />
            Todos
          </button>
        </div>
        {(desde || hasta) && (
          <p className="text-xs text-gray-500 mt-2">
            Mostrando: {desde || '...'} → {hasta || '...'}
          </p>
        )}
      </div>

      {loading && <div className="text-center text-gray-400 py-12">Cargando...</div>}

      {!loading && data && (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp size={20} className="text-blue-400" />
                <p className="text-sm text-gray-400">Total Ventas</p>
              </div>
              <p className="text-2xl font-bold text-white">{fmtPeso(data.total_ventas)}</p>
              <p className="text-xs text-gray-500 mt-1">Monto total facturado</p>
            </div>

            <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
              <div className="flex items-center gap-3 mb-2">
                <Wallet size={20} className="text-green-400" />
                <p className="text-sm text-gray-400">Dinero Ingresado</p>
              </div>
              <p className="text-2xl font-bold text-white">{fmtPeso(data.total_ingresado)}</p>
              <p className="text-xs text-gray-500 mt-1">Pagos a cuenta + pagos directos</p>
            </div>

            <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
              <div className="flex items-center gap-3 mb-2">
                <DollarSign size={20} className="text-yellow-400" />
                <p className="text-sm text-gray-400">Métodos usados</p>
              </div>
              <p className="text-2xl font-bold text-white">{metodos.length}</p>
              <p className="text-xs text-gray-500 mt-1">{metodos.map(([m]) => metodosLabel[m] || m).join(', ')}</p>
            </div>
          </div>

          {/* Breakdown by method */}
          {metodos.length > 0 && (
            <div className="bg-gray-800 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-700">
                <h2 className="font-semibold text-white">Detalle por método de pago</h2>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-700 text-gray-300 text-sm">
                    <th className="text-left px-5 py-3">Método</th>
                    <th className="text-right px-5 py-3">Monto ingresado</th>
                    <th className="text-right px-5 py-3">% del total</th>
                  </tr>
                </thead>
                <tbody>
                  {metodos.map(([metodo, monto], idx) => (
                    <tr key={metodo} className={`border-t border-gray-700 ${idx % 2 === 0 ? '' : 'bg-gray-750'}`}>
                      <td className="px-5 py-3 text-white capitalize font-medium">
                        {metodosLabel[metodo] || metodo}
                      </td>
                      <td className="px-5 py-3 text-right text-green-400 font-semibold">{fmtPeso(monto)}</td>
                      <td className="px-5 py-3 text-right text-gray-400">
                        {data.total_ingresado > 0 ? ((monto / data.total_ingresado) * 100).toFixed(1) : 0}%
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-gray-600 bg-gray-700">
                    <td className="px-5 py-3 text-white font-bold">Total</td>
                    <td className="px-5 py-3 text-right text-white font-bold">{fmtPeso(data.total_ingresado)}</td>
                    <td className="px-5 py-3 text-right text-gray-300">100%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {metodos.length === 0 && (
            <div className="text-center text-gray-400 py-8 bg-gray-800 rounded-xl">
              No hay movimientos para el período seleccionado
            </div>
          )}
        </>
      )}
    </div>
  );
}
