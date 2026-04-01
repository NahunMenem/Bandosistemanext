'use client';

import { useState, useEffect, useCallback } from 'react';
import { ShoppingCart, Plus, Trash2, CheckCircle } from 'lucide-react';
import type { Cliente } from '@/types';

interface Item {
  cantidad: number;
  descripcion: string;
  precio_unitario: number;
}

const metodoPagoOpts = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'debito', label: 'Débito' },
  { value: 'credito', label: 'Crédito' },
  { value: 'transferencia', label: 'Transferencia' },
];

export default function VentasPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [clienteInfo, setClienteInfo] = useState<{ nombre: string; monto_autorizado: number; saldo: number } | null>(null);
  const [items, setItems] = useState<Item[]>([{ cantidad: 1, descripcion: '', precio_unitario: 0 }]);
  const [pagoACuenta, setPagoACuenta] = useState('');
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch('/api/clientes').then((r) => r.json()).then((data) => setClientes(data));
  }, []);

  const loadCliente = useCallback(async (id: string) => {
    if (!id) { setClienteInfo(null); return; }
    const res = await fetch(`/api/cliente/${id}`);
    const data = await res.json();
    setClienteInfo(data);
  }, []);

  useEffect(() => { loadCliente(selectedId); }, [selectedId, loadCliente]);

  const totalOperacion = items.reduce((a, i) => a + i.cantidad * i.precio_unitario, 0);
  const pagoNum = parseFloat(pagoACuenta) || 0;
  const saldoAnterior = clienteInfo?.saldo || 0;
  const saldoResultante = totalOperacion - pagoNum + saldoAnterior;

  const addItem = () => setItems([...items, { cantidad: 1, descripcion: '', precio_unitario: 0 }]);
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: keyof Item, value: string | number) =>
    setItems(items.map((item, idx) => (idx === i ? { ...item, [field]: value } : item)));

  const handleSave = async () => {
    if (!selectedId || items.every((i) => !i.descripcion)) return;
    setSaving(true);
    const res = await fetch('/api/ventas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cliente_id: selectedId, items, pago_a_cuenta: pagoNum, metodo_pago: metodoPago }),
    });
    const data = await res.json();
    setSaving(false);
    if (data.redirectUrl) {
      setSuccess(true);
      window.open(data.redirectUrl, '_blank');
      setItems([{ cantidad: 1, descripcion: '', precio_unitario: 0 }]);
      setPagoACuenta('');
      loadCliente(selectedId);
      setTimeout(() => setSuccess(false), 4000);
    }
  };

  const fmtPeso = (n: number) =>
    n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 });

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        <ShoppingCart size={24} className="text-blue-400" />
        Nueva Venta
      </h1>

      {success && (
        <div className="flex items-center gap-2 bg-green-900/40 border border-green-700 text-green-300 rounded-lg p-4">
          <CheckCircle size={18} />
          Venta guardada exitosamente. El comprobante se abrió en una nueva pestaña.
        </div>
      )}

      {/* Client selector */}
      <div className="bg-gray-800 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide">Cliente</h2>
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-blue-500"
        >
          <option value="">Seleccionar cliente...</option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>

        {clienteInfo && (
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="bg-gray-700 rounded-lg p-3">
              <p className="text-xs text-gray-400">Monto autorizado</p>
              <p className="text-lg font-semibold text-green-400">{fmtPeso(clienteInfo.monto_autorizado)}</p>
            </div>
            <div className="bg-gray-700 rounded-lg p-3">
              <p className="text-xs text-gray-400">Saldo deudor actual</p>
              <p className={`text-lg font-semibold ${clienteInfo.saldo > 0 ? 'text-red-400' : 'text-green-400'}`}>
                {fmtPeso(clienteInfo.saldo)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Items */}
      <div className="bg-gray-800 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide">Artículos</h2>
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-2">
                <input
                  type="number"
                  min={1}
                  value={item.cantidad}
                  onChange={(e) => updateItem(i, 'cantidad', parseInt(e.target.value) || 1)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-2 py-2 text-white text-sm focus:outline-none focus:border-blue-500 text-center"
                  placeholder="Cant."
                />
              </div>
              <div className="col-span-6">
                <input
                  type="text"
                  value={item.descripcion}
                  onChange={(e) => updateItem(i, 'descripcion', e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                  placeholder="Descripción del artículo"
                />
              </div>
              <div className="col-span-3">
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={item.precio_unitario || ''}
                  onChange={(e) => updateItem(i, 'precio_unitario', parseFloat(e.target.value) || 0)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-2 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                  placeholder="Precio"
                />
              </div>
              <div className="col-span-1 flex justify-center">
                {items.length > 1 && (
                  <button onClick={() => removeItem(i)} className="text-red-400 hover:text-red-300">
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        <button onClick={addItem} className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm">
          <Plus size={15} /> Agregar artículo
        </button>

        {/* Totals */}
        <div className="border-t border-gray-700 pt-4 space-y-2 text-sm">
          <div className="flex justify-between text-gray-300">
            <span>Total operación</span>
            <span className="font-semibold text-white">{fmtPeso(totalOperacion)}</span>
          </div>
          {saldoAnterior > 0 && (
            <div className="flex justify-between text-gray-300">
              <span>Deuda anterior</span>
              <span className="text-red-400">{fmtPeso(saldoAnterior)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Payment */}
      <div className="bg-gray-800 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide">Pago</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Pago a cuenta</label>
            <input
              type="number"
              min={0}
              step={0.01}
              value={pagoACuenta}
              onChange={(e) => setPagoACuenta(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-blue-500"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Método de pago</label>
            <div className="flex flex-wrap gap-2">
              {metodoPagoOpts.map((o) => (
                <button
                  key={o.value}
                  onClick={() => setMetodoPago(o.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    metodoPago === o.value ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-gray-750 border border-gray-700 rounded-lg p-4 space-y-2 text-sm">
          <div className="flex justify-between text-gray-300">
            <span>Total operación</span>
            <span>{fmtPeso(totalOperacion)}</span>
          </div>
          <div className="flex justify-between text-gray-300">
            <span>Pago a cuenta</span>
            <span className="text-green-400">- {fmtPeso(pagoNum)}</span>
          </div>
          {saldoAnterior > 0 && (
            <div className="flex justify-between text-gray-300">
              <span>Deuda anterior</span>
              <span className="text-red-400">+ {fmtPeso(saldoAnterior)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-white border-t border-gray-700 pt-2">
            <span>Saldo resultante</span>
            <span className={saldoResultante > 0 ? 'text-red-400' : 'text-green-400'}>{fmtPeso(saldoResultante)}</span>
          </div>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving || !selectedId}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl transition-colors"
      >
        {saving ? 'Guardando...' : 'Guardar venta'}
      </button>
    </div>
  );
}
