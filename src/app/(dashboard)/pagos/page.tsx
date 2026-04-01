'use client';

import { useState, useEffect } from 'react';
import { CreditCard, CheckCircle } from 'lucide-react';
import type { Cliente } from '@/types';

const metodoPagoOpts = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'debito', label: 'Débito' },
  { value: 'credito', label: 'Crédito' },
  { value: 'transferencia', label: 'Transferencia' },
];

export default function PagosPage() {
  const [clientes, setClientes] = useState<(Cliente & { saldo_deudor: number })[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [monto, setMonto] = useState('');
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch('/api/clientes').then((r) => r.json()).then((data) => {
      setClientes(data);
    });
  }, []);

  const selectedCliente = clientes.find((c) => c.id === parseInt(selectedId));

  const handleSave = async () => {
    if (!selectedId || !monto) return;
    setSaving(true);
    const res = await fetch('/api/pagos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cliente_id: selectedId, monto, metodo_pago: metodoPago }),
    });
    const data = await res.json();
    setSaving(false);
    if (data.redirectUrl) {
      setSuccess(true);
      window.open(data.redirectUrl, '_blank');
      setMonto('');
      setTimeout(() => setSuccess(false), 4000);
    }
  };

  const fmtPeso = (n: number) =>
    n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 });

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        <CreditCard size={24} className="text-blue-400" />
        Registrar Pago
      </h1>

      {success && (
        <div className="flex items-center gap-2 bg-green-900/40 border border-green-700 text-green-300 rounded-lg p-4">
          <CheckCircle size={18} />
          Pago registrado. El comprobante se abrió en una nueva pestaña.
        </div>
      )}

      <div className="bg-gray-800 rounded-xl p-6 space-y-5">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Cliente</label>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-blue-500"
          >
            <option value="">Seleccionar cliente...</option>
            {clientes
              .filter((c) => (c.saldo_deudor || 0) > 0)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} — Saldo: {fmtPeso(c.saldo_deudor || 0)}
                </option>
              ))}
          </select>
          {clientes.filter((c) => (c.saldo_deudor || 0) === 0).length > 0 && (
            <p className="text-xs text-gray-500 mt-1">Solo se muestran clientes con deuda pendiente</p>
          )}
        </div>

        {selectedCliente && (
          <div className="bg-gray-700 rounded-lg p-3">
            <p className="text-xs text-gray-400">Saldo deudor actual</p>
            <p className="text-xl font-bold text-red-400">{fmtPeso(selectedCliente.saldo_deudor || 0)}</p>
          </div>
        )}

        <div>
          <label className="block text-sm text-gray-400 mb-1">Monto a pagar</label>
          <input
            type="number"
            min={0}
            step={0.01}
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-blue-500"
            placeholder="0.00"
          />
          {selectedCliente && monto && (
            <p className="text-xs text-gray-400 mt-1">
              Saldo tras pago:{' '}
              <span className={((selectedCliente.saldo_deudor || 0) - parseFloat(monto)) > 0 ? 'text-red-400' : 'text-green-400'}>
                {fmtPeso((selectedCliente.saldo_deudor || 0) - parseFloat(monto))}
              </span>
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">Método de pago</label>
          <div className="flex flex-wrap gap-2">
            {metodoPagoOpts.map((o) => (
              <button
                key={o.value}
                onClick={() => setMetodoPago(o.value)}
                className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                  metodoPago === o.value ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving || !selectedId || !monto}
          className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl transition-colors"
        >
          {saving ? 'Registrando...' : 'Registrar pago'}
        </button>
      </div>
    </div>
  );
}
