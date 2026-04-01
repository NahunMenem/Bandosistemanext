'use client';

import { useState, useEffect, useCallback } from 'react';
import { History, ChevronDown, ChevronRight, Trash2, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import type { Cliente } from '@/types';

interface Movimiento {
  tipo: 'venta' | 'pago';
  id: number;
  fecha: string;
  total?: number;
  monto?: number;
  pago_a_cuenta?: number;
  saldo_resultante?: number;
  metodo_pago: string;
  items?: { id: number; cantidad: number; descripcion: string; precio_unitario: number; total: number }[];
}

export default function MovimientosPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ tipo: string; id: number } | null>(null);

  useEffect(() => {
    fetch('/api/clientes').then((r) => r.json()).then(setClientes);
  }, []);

  const fetchMovimientos = useCallback(async (id: string) => {
    if (!id) { setMovimientos([]); return; }
    setLoading(true);
    const res = await fetch(`/api/movimientos?cliente_id=${id}`);
    const data = await res.json();
    setMovimientos(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchMovimientos(selectedId); }, [selectedId, fetchMovimientos]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const url = deleteTarget.tipo === 'venta' ? `/api/ventas/${deleteTarget.id}` : `/api/pagos/${deleteTarget.id}`;
    await fetch(url, { method: 'DELETE' });
    setDeleteTarget(null);
    fetchMovimientos(selectedId);
  };

  const fmtPeso = (n: number) =>
    n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 });

  const fmtFecha = (d: string) =>
    new Date(d).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        <History size={24} className="text-blue-400" />
        Movimientos
      </h1>

      <select
        value={selectedId}
        onChange={(e) => setSelectedId(e.target.value)}
        className="w-full max-w-md bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-blue-500"
      >
        <option value="">Seleccionar cliente...</option>
        {clientes.map((c) => (
          <option key={c.id} value={c.id}>
            {c.nombre}
          </option>
        ))}
      </select>

      {loading && <div className="text-gray-400 text-center py-8">Cargando...</div>}

      {!loading && selectedId && movimientos.length === 0 && (
        <div className="text-gray-400 text-center py-8 bg-gray-800 rounded-xl">
          No hay movimientos para este cliente
        </div>
      )}

      {!loading && movimientos.length > 0 && (
        <div className="bg-gray-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-700 text-gray-300 text-sm">
                <th className="text-left px-4 py-3 w-8"></th>
                <th className="text-left px-4 py-3">Fecha</th>
                <th className="text-left px-4 py-3">Tipo</th>
                <th className="text-right px-4 py-3">Total</th>
                <th className="text-right px-4 py-3 hidden sm:table-cell">Pago</th>
                <th className="text-right px-4 py-3 hidden md:table-cell">Saldo</th>
                <th className="text-left px-4 py-3 hidden md:table-cell">Método</th>
                <th className="text-center px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {movimientos.map((m, idx) => {
                const key = `${m.tipo}-${m.id}`;
                const isExpanded = expandedId === key;
                return (
                  <>
                    <tr
                      key={key}
                      className={`border-t border-gray-700 ${idx % 2 === 0 ? '' : 'bg-gray-750'} hover:bg-gray-700 transition-colors ${m.tipo === 'venta' ? 'cursor-pointer' : ''}`}
                      onClick={() => m.tipo === 'venta' && setExpandedId(isExpanded ? null : key)}
                    >
                      <td className="px-2 py-3 text-gray-500">
                        {m.tipo === 'venta' && (isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
                      </td>
                      <td className="px-4 py-3 text-gray-300 text-sm">{fmtFecha(m.fecha)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${m.tipo === 'venta' ? 'bg-blue-900 text-blue-300' : 'bg-green-900 text-green-300'}`}>
                          {m.tipo === 'venta' ? 'Venta' : 'Pago'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-white font-medium">
                        {fmtPeso(m.tipo === 'venta' ? (m.total || 0) : (m.monto || 0))}
                      </td>
                      <td className="px-4 py-3 text-right text-green-400 hidden sm:table-cell">
                        {m.tipo === 'venta' ? fmtPeso(m.pago_a_cuenta || 0) : '-'}
                      </td>
                      <td className={`px-4 py-3 text-right hidden md:table-cell ${(m.saldo_resultante || 0) > 0 ? 'text-red-400' : 'text-gray-300'}`}>
                        {m.tipo === 'venta' ? fmtPeso(m.saldo_resultante || 0) : '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-300 text-sm capitalize hidden md:table-cell">{m.metodo_pago}</td>
                      <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-center gap-2">
                          {m.tipo === 'venta' && (
                            <Link href={`/comprobante/${m.id}`} target="_blank" className="text-blue-400 hover:text-blue-300 p-1">
                              <ExternalLink size={14} />
                            </Link>
                          )}
                          <button onClick={() => setDeleteTarget({ tipo: m.tipo, id: m.id })} className="text-red-400 hover:text-red-300 p-1">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && m.items && (
                      <tr key={`${key}-items`} className="border-t border-gray-700 bg-gray-750">
                        <td colSpan={8} className="px-8 py-3">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-gray-500 text-xs">
                                <th className="text-left pb-1">Cant.</th>
                                <th className="text-left pb-1">Descripción</th>
                                <th className="text-right pb-1">P. Unit.</th>
                                <th className="text-right pb-1">Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {m.items.map((item) => (
                                <tr key={item.id}>
                                  <td className="text-gray-300 py-0.5">{item.cantidad}</td>
                                  <td className="text-gray-200 py-0.5">{item.descripcion}</td>
                                  <td className="text-gray-300 text-right py-0.5">{fmtPeso(item.precio_unitario)}</td>
                                  <td className="text-white text-right py-0.5 font-medium">{fmtPeso(item.total)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 max-w-sm w-full border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-2">Confirmar eliminación</h3>
            <p className="text-gray-400 mb-6">¿Eliminar este {deleteTarget.tipo}?</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-gray-400 hover:text-white">Cancelar</button>
              <button onClick={handleDelete} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
