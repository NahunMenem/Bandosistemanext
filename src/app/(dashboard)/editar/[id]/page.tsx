'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Edit, ArrowLeft, Save } from 'lucide-react';

export default function EditarPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nombre: '', domicilio: '', localidad: '', documento: '',
    telefono: '', ingresos: '', lugar_trabajo: '', monto_autorizado: '',
  });
  const [garante, setGarante] = useState({
    nombre: '', domicilio: '', localidad: '', documento: '',
    telefono: '', ingresos: '', lugar_trabajo: '',
  });

  useEffect(() => {
    fetch(`/api/clientes/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setForm({
          nombre: data.nombre || '',
          domicilio: data.domicilio || '',
          localidad: data.localidad || '',
          documento: data.documento || '',
          telefono: data.telefono || '',
          ingresos: data.ingresos?.toString() || '',
          lugar_trabajo: data.lugar_trabajo || '',
          monto_autorizado: data.monto_autorizado?.toString() || '',
        });
        if (data.garante) {
          setGarante({
            nombre: data.garante.nombre || '',
            domicilio: data.garante.domicilio || '',
            localidad: data.garante.localidad || '',
            documento: data.garante.documento || '',
            telefono: data.garante.telefono || '',
            ingresos: data.garante.ingresos?.toString() || '',
            lugar_trabajo: data.garante.lugar_trabajo || '',
          });
        }
        setLoading(false);
      });
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    await fetch(`/api/clientes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, garante }),
    });
    setSaving(false);
    router.push('/clientes');
  };

  if (loading) return <div className="text-center text-gray-400 py-12">Cargando...</div>;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.push('/clientes')} className="text-gray-400 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Edit size={22} className="text-blue-400" />
          Editar Cliente
        </h1>
      </div>

      <div className="bg-gray-800 rounded-xl p-6 space-y-6">
        <div>
          <h3 className="text-sm font-medium text-blue-400 mb-4 uppercase tracking-wide">Datos del cliente</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { key: 'nombre', label: 'Nombre *', type: 'text' },
              { key: 'documento', label: 'Documento', type: 'text' },
              { key: 'domicilio', label: 'Domicilio', type: 'text' },
              { key: 'localidad', label: 'Localidad', type: 'text' },
              { key: 'telefono', label: 'Teléfono', type: 'text' },
              { key: 'ingresos', label: 'Ingresos', type: 'number' },
              { key: 'lugar_trabajo', label: 'Lugar de trabajo', type: 'text' },
              { key: 'monto_autorizado', label: 'Monto autorizado', type: 'number' },
            ].map(({ key, label, type }) => (
              <div key={key}>
                <label className="block text-xs text-gray-400 mb-1">{label}</label>
                <input
                  type={type}
                  value={form[key as keyof typeof form]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-purple-400 mb-4 uppercase tracking-wide">Datos del garante</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { key: 'nombre', label: 'Nombre', type: 'text' },
              { key: 'documento', label: 'Documento', type: 'text' },
              { key: 'domicilio', label: 'Domicilio', type: 'text' },
              { key: 'localidad', label: 'Localidad', type: 'text' },
              { key: 'telefono', label: 'Teléfono', type: 'text' },
              { key: 'ingresos', label: 'Ingresos', type: 'number' },
              { key: 'lugar_trabajo', label: 'Lugar de trabajo', type: 'text' },
            ].map(({ key, label, type }) => (
              <div key={key}>
                <label className="block text-xs text-gray-400 mb-1">{label}</label>
                <input
                  type={type}
                  value={garante[key as keyof typeof garante]}
                  onChange={(e) => setGarante({ ...garante, [key]: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button onClick={() => router.push('/clientes')} className="px-4 py-2 text-gray-400 hover:text-white transition-colors">
          Cancelar
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors"
        >
          <Save size={16} />
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  );
}
