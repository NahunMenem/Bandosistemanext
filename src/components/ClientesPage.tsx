'use client';

import { Fragment, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  User,
  CreditCard,
  Home,
  MapPin,
  Phone,
  Wallet,
  Briefcase,
  BadgeDollarSign,
  Shield,
  Save,
} from 'lucide-react';
import type { Cliente } from '@/types';

const emptyCliente = {
  nombre: '',
  domicilio: '',
  localidad: '',
  documento: '',
  telefono: '',
  ingresos: '',
  lugar_trabajo: '',
  monto_autorizado: '',
};

export default function ClientesPage() {
  const router = useRouter();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...emptyCliente });
  const [garante, setGarante] = useState({ ...emptyCliente });
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [error, setError] = useState('');

  const fetchClientes = useCallback(async () => {
    const res = await fetch('/api/clientes');
    const data = await res.json();
    setClientes(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchClientes();
  }, [fetchClientes]);

  const filtered = clientes.filter(
    (c) =>
      c.nombre.toLowerCase().includes(search.toLowerCase()) ||
      (c.documento || '').includes(search) ||
      (c.telefono || '').includes(search)
  );

  const handleSave = async () => {
    setError('');
    if (!form.nombre.trim() || !form.documento.trim()) {
      setError('Completa nombre y documento del cliente.');
      return;
    }

    setSaving(true);
    const res = await fetch('/api/clientes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, garante }),
    });
    const data = await res.json().catch(() => null);
    setSaving(false);

    if (!res.ok) {
      setError(data?.error || 'No se pudo guardar el cliente. Revisa los datos e intenta nuevamente.');
      return;
    }

    setShowModal(false);
    setForm({ ...emptyCliente });
    setGarante({ ...emptyCliente });
    setError('');
    fetchClientes();
  };

  const handleDelete = async (id: number) => {
    await fetch(`/api/clientes/${id}`, { method: 'DELETE' });
    setDeleteId(null);
    fetchClientes();
  };

  const fmtPeso = (n: number) =>
    n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 });

  const clienteFields = [
    { key: 'nombre', label: 'Nombre *', type: 'text', icon: User },
    { key: 'documento', label: 'Documento *', type: 'text', icon: CreditCard },
    { key: 'telefono', label: 'Telefono', type: 'text', icon: Phone },
    { key: 'localidad', label: 'Localidad', type: 'text', icon: MapPin },
    { key: 'domicilio', label: 'Domicilio', type: 'text', icon: Home },
    { key: 'lugar_trabajo', label: 'Lugar de trabajo', type: 'text', icon: Briefcase },
    { key: 'ingresos', label: 'Ingresos', type: 'number', icon: Wallet },
    { key: 'monto_autorizado', label: 'Monto autorizado', type: 'number', icon: BadgeDollarSign },
  ];

  const garanteFields = [
    { key: 'nombre', label: 'Nombre', type: 'text', icon: User },
    { key: 'documento', label: 'Documento', type: 'text', icon: CreditCard },
    { key: 'telefono', label: 'Telefono', type: 'text', icon: Phone },
    { key: 'localidad', label: 'Localidad', type: 'text', icon: MapPin },
    { key: 'domicilio', label: 'Domicilio', type: 'text', icon: Home },
    { key: 'lugar_trabajo', label: 'Lugar de trabajo', type: 'text', icon: Briefcase },
    { key: 'ingresos', label: 'Ingresos', type: 'number', icon: Wallet },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users size={24} className="text-blue-400" />
            Clientes
          </h1>
          <p className="text-gray-400 mt-1">{clientes.length} clientes registrados</p>
        </div>
        <button
          onClick={() => {
            setError('');
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors self-start sm:self-auto"
        >
          <Plus size={16} />
          Nuevo cliente
        </button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre, documento o telefono..."
          className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-12">Cargando...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-gray-400 py-12 bg-gray-800 rounded-xl">
          No se encontraron clientes
        </div>
      ) : (
        <div className="bg-gray-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-700 text-gray-300 text-sm">
                <th className="text-left px-4 py-3">Nombre</th>
                <th className="text-left px-4 py-3 hidden sm:table-cell">Documento</th>
                <th className="text-left px-4 py-3 hidden md:table-cell">Telefono</th>
                <th className="text-left px-4 py-3 hidden lg:table-cell">Localidad</th>
                <th className="text-right px-4 py-3 hidden md:table-cell">Autorizado</th>
                <th className="text-right px-4 py-3">Saldo</th>
                <th className="text-center px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, idx) => (
                <Fragment key={c.id}>
                  <tr
                    className={`border-t border-gray-700 ${idx % 2 === 0 ? '' : 'bg-gray-750'} hover:bg-gray-700 transition-colors cursor-pointer`}
                    onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                  >
                    <td className="px-4 py-3 font-medium text-white">
                      <div className="flex items-center gap-2">
                        {expandedId === c.id ? (
                          <ChevronUp size={14} className="text-gray-400" />
                        ) : (
                          <ChevronDown size={14} className="text-gray-400" />
                        )}
                        {c.nombre}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-300 hidden sm:table-cell">{c.documento || '-'}</td>
                    <td className="px-4 py-3 text-gray-300 hidden md:table-cell">{c.telefono || '-'}</td>
                    <td className="px-4 py-3 text-gray-300 hidden lg:table-cell">{c.localidad || '-'}</td>
                    <td className="px-4 py-3 text-right text-gray-300 hidden md:table-cell">
                      {c.monto_autorizado ? fmtPeso(c.monto_autorizado) : '-'}
                    </td>
                    <td className={`px-4 py-3 text-right font-semibold ${(c.saldo_deudor || 0) > 0 ? 'text-red-400' : 'text-green-400'}`}>
                      {fmtPeso(c.saldo_deudor || 0)}
                    </td>
                    <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => router.push(`/editar/${c.id}`)}
                          className="text-blue-400 hover:text-blue-300 transition-colors p-1"
                          title="Editar"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => setDeleteId(c.id)}
                          className="text-red-400 hover:text-red-300 transition-colors p-1"
                          title="Eliminar"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedId === c.id && (
                    <tr className="border-t border-gray-700 bg-gray-750">
                      <td colSpan={7} className="px-4 py-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Domicilio</p>
                            <p className="text-gray-200">{c.domicilio || '-'}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Lugar de trabajo</p>
                            <p className="text-gray-200">{c.lugar_trabajo || '-'}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Ingresos</p>
                            <p className="text-gray-200">{c.ingresos ? fmtPeso(c.ingresos) : '-'}</p>
                          </div>
                          {c.garante && (
                            <div>
                              <p className="text-gray-500">Garante</p>
                              <p className="text-gray-200">
                                {c.garante.nombre || '-'} {c.garante.telefono ? `- ${c.garante.telefono}` : ''}
                              </p>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-3">
          <div className="bg-gray-800 rounded-2xl w-full max-w-5xl max-h-[calc(100vh-1.5rem)] border border-gray-700 shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-gray-700 shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600/15 text-blue-300">
                  <User size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Nuevo cliente</h2>
                  <p className="text-sm text-gray-400">Carga los datos principales y, si corresponde, los del garante.</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white p-1 transition-colors"
                title="Cerrar"
              >
                <X size={22} />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4 overflow-y-auto">
              <div className="flex items-start gap-3 rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-2.5 text-sm text-blue-100">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-blue-50">Campos obligatorios: Nombre y Documento del cliente.</p>
                  <p className="text-blue-100/80">El documento no puede repetirse.</p>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                  <AlertCircle size={18} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-4">
                <section className="rounded-xl border border-gray-700 bg-gray-900/40 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Users size={18} className="text-blue-400" />
                    <h3 className="text-sm font-medium text-blue-300 uppercase tracking-wide">Datos del cliente</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {clienteFields.map(({ key, label, type, icon: Icon }) => (
                      <div key={key}>
                        <label className="block text-xs text-gray-400 mb-1">{label}</label>
                        <div className="relative">
                          <Icon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                          <input
                            type={type}
                            required={key === 'nombre' || key === 'documento'}
                            value={form[key as keyof typeof form]}
                            onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-9 pr-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="rounded-xl border border-gray-700 bg-gray-900/40 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield size={18} className="text-purple-400" />
                    <h3 className="text-sm font-medium text-purple-300 uppercase tracking-wide">Datos del garante</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
                    {garanteFields.map(({ key, label, type, icon: Icon }) => (
                      <div key={key}>
                        <label className="block text-xs text-gray-400 mb-1">{label}</label>
                        <div className="relative">
                          <Icon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                          <input
                            type={type}
                            value={garante[key as keyof typeof garante]}
                            onChange={(e) => setGarante({ ...garante, [key]: e.target.value })}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-9 pr-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-gray-400">
                <div className="rounded-lg border border-gray-700 bg-gray-900/40 px-3 py-2">
                  <span className="text-white">Nombre</span> y <span className="text-white">Documento</span> son requeridos.
                </div>
                <div className="rounded-lg border border-gray-700 bg-gray-900/40 px-3 py-2">
                  El <span className="text-white">documento</span> debe ser unico.
                </div>
                <div className="rounded-lg border border-gray-700 bg-gray-900/40 px-3 py-2">
                  Los datos del <span className="text-white">garante</span> son opcionales.
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4 border-t border-gray-700 bg-gray-900/30 shrink-0">
              <p className="text-xs text-gray-500">Los campos marcados con * son obligatorios.</p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-400 hover:text-white transition-colors">
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !form.nombre.trim() || !form.documento.trim()}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors"
                >
                  <Save size={16} />
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 max-w-sm w-full border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-2">Confirmar eliminacion</h3>
            <p className="text-gray-400 mb-6">Estas seguro? Se eliminaran tambien todas las ventas y pagos del cliente.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-gray-400 hover:text-white">
                Cancelar
              </button>
              <button onClick={() => handleDelete(deleteId)} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
