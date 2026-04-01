'use client';

import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, Users, MessageCircle, FileSpreadsheet, FileText } from 'lucide-react';

interface Moroso {
  id: number;
  nombre: string;
  documento: string | null;
  telefono: string | null;
  saldo_deudor: number;
}

export default function MorososPage() {
  const [morosos, setMorosos] = useState<Moroso[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportingXlsx, setExportingXlsx] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  useEffect(() => {
    fetch('/api/morosos')
      .then((r) => r.json())
      .then((data) => {
        setMorosos(data);
        setLoading(false);
      });
  }, []);

  const totalDeuda = morosos.reduce((a, m) => a + m.saldo_deudor, 0);

  const fmtPeso = (n: number) =>
    n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 });

  const exportExcel = useCallback(async () => {
    setExportingXlsx(true);
    try {
      const XLSX = (await import('xlsx')).default;

      const rows = morosos.map((m) => ({
        Nombre: m.nombre,
        Documento: m.documento || '',
        Teléfono: m.telefono || '',
        'Saldo Adeudado ($)': m.saldo_deudor,
      }));

      rows.push({
        Nombre: 'TOTAL',
        Documento: '',
        Teléfono: '',
        'Saldo Adeudado ($)': totalDeuda,
      });

      const ws = XLSX.utils.json_to_sheet(rows);

      // Column widths
      ws['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 20 }];

      // Bold header row
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
      for (let C = range.s.c; C <= range.e.c; C++) {
        const addr = XLSX.utils.encode_cell({ r: 0, c: C });
        if (ws[addr]) {
          ws[addr].s = { font: { bold: true } };
        }
      }

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Morosos');

      const fecha = new Date().toISOString().split('T')[0];
      XLSX.writeFile(wb, `clientes_morosos_${fecha}.xlsx`);
    } finally {
      setExportingXlsx(false);
    }
  }, [morosos, totalDeuda]);

  const exportPDF = useCallback(async () => {
    setExportingPdf(true);
    try {
      const [{ jsPDF }, autoTableModule] = await Promise.all([
        import('jspdf/dist/jspdf.umd.min.js'),
        import('jspdf-autotable'),
      ]);
      const autoTable = autoTableModule.default;

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      // Title
      doc.setFontSize(18);
      doc.setTextColor(255, 255, 255);
      doc.setFillColor(30, 58, 138);
      doc.rect(0, 0, 210, 28, 'F');
      doc.text('Rodeo Calzados', 14, 12);
      doc.setFontSize(11);
      doc.text('Reporte de Clientes Morosos', 14, 21);

      // Metadata
      doc.setTextColor(60, 60, 60);
      doc.setFontSize(9);
      const fecha = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
      doc.text(`Fecha de emisión: ${fecha}`, 14, 34);
      doc.text(`Total de morosos: ${morosos.length}`, 14, 39);
      doc.text(`Deuda total: ${fmtPeso(totalDeuda)}`, 14, 44);

      // Table
      autoTable(doc, {
        startY: 50,
        head: [['Nombre', 'Documento', 'Teléfono', 'Saldo Adeudado']],
        body: morosos.map((m) => [
          m.nombre,
          m.documento || '-',
          m.telefono || '-',
          fmtPeso(m.saldo_deudor),
        ]),
        foot: [['', '', 'TOTAL', fmtPeso(totalDeuda)]],
        headStyles: {
          fillColor: [30, 58, 138],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 9,
        },
        footStyles: {
          fillColor: [51, 65, 85],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 9,
        },
        bodyStyles: { fontSize: 9, textColor: [30, 30, 30] },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        columnStyles: {
          0: { cellWidth: 70 },
          1: { cellWidth: 30 },
          2: { cellWidth: 35 },
          3: { cellWidth: 40, halign: 'right' },
        },
        margin: { left: 14, right: 14 },
      });

      const fechaFile = new Date().toISOString().split('T')[0];
      doc.save(`clientes_morosos_${fechaFile}.pdf`);
    } finally {
      setExportingPdf(false);
    }
  }, [morosos, totalDeuda, fmtPeso]);

  const sendWhatsApp = (m: Moroso) => {
    const tel = (m.telefono || '').replace(/\D/g, '');
    const msg = encodeURIComponent(
      `Hola ${m.nombre}, le informamos que tiene un saldo pendiente de ${fmtPeso(m.saldo_deudor)} en Rodeo Calzados. Por favor comuníquese con nosotros para regularizar su situación. ¡Gracias!`
    );
    window.open(`https://wa.me/${tel}?text=${msg}`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        Cargando...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <AlertTriangle size={24} className="text-red-400" />
            Clientes Morosos
          </h1>
          <p className="text-gray-400 mt-1">
            {morosos.length === 0
              ? 'No hay clientes con deuda pendiente'
              : `${morosos.length} cliente${morosos.length !== 1 ? 's' : ''} con deuda pendiente`}
          </p>
        </div>

        {/* Export buttons */}
        {morosos.length > 0 && (
          <div className="flex flex-wrap gap-3 shrink-0">
            <button
              onClick={exportExcel}
              disabled={exportingXlsx}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-wait text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
              title="Descargar listado en Excel"
            >
              <FileSpreadsheet size={16} />
              {exportingXlsx ? 'Generando...' : 'Descargar Excel'}
            </button>
            <button
              onClick={exportPDF}
              disabled={exportingPdf}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-wait text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
              title="Descargar listado en PDF"
            >
              <FileText size={16} />
              {exportingPdf ? 'Generando...' : 'Descargar PDF'}
            </button>
          </div>
        )}
      </div>

      {/* Total card */}
      {morosos.length > 0 && (
        <div className="bg-red-950/50 border border-red-800/60 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <Users size={22} className="text-red-400" />
            <div>
              <p className="text-red-300 text-sm">Deuda total acumulada</p>
              <p className="text-3xl font-bold text-white mt-0.5">{fmtPeso(totalDeuda)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {morosos.length === 0 ? (
        <div className="bg-gray-800 rounded-xl p-12 text-center">
          <AlertTriangle size={40} className="text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No hay clientes morosos</p>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-700 text-gray-300 text-sm">
                <th className="text-left px-5 py-3">Nombre</th>
                <th className="text-left px-5 py-3 hidden sm:table-cell">Documento</th>
                <th className="text-left px-5 py-3 hidden md:table-cell">Teléfono</th>
                <th className="text-right px-5 py-3">Monto adeudado</th>
                <th className="text-center px-5 py-3">WhatsApp</th>
              </tr>
            </thead>
            <tbody>
              {morosos.map((m, idx) => (
                <tr
                  key={m.id}
                  className={`border-t border-gray-700 ${idx % 2 === 0 ? '' : 'bg-gray-750'} hover:bg-gray-700 transition-colors`}
                >
                  <td className="px-5 py-3 font-medium text-white">{m.nombre}</td>
                  <td className="px-5 py-3 text-gray-300 hidden sm:table-cell">{m.documento || '-'}</td>
                  <td className="px-5 py-3 text-gray-300 hidden md:table-cell">{m.telefono || '-'}</td>
                  <td className="px-5 py-3 text-right font-bold text-red-400">{fmtPeso(m.saldo_deudor)}</td>
                  <td className="px-5 py-3 text-center">
                    <button
                      onClick={() => sendWhatsApp(m)}
                      disabled={!m.telefono}
                      className="text-green-400 hover:text-green-300 disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
                      title={m.telefono ? `Enviar recordatorio a ${m.nombre}` : 'Sin teléfono registrado'}
                    >
                      <MessageCircle size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-600 bg-gray-700">
                <td colSpan={3} className="px-5 py-3 text-gray-300 font-semibold hidden md:table-cell">
                  Total ({morosos.length} clientes)
                </td>
                <td colSpan={3} className="px-5 py-3 text-gray-300 font-semibold md:hidden">
                  Total
                </td>
                <td className="px-5 py-3 text-right font-bold text-red-400 hidden md:table-cell">
                  {fmtPeso(totalDeuda)}
                </td>
                <td className="px-5 py-3 text-right font-bold text-red-400 md:hidden" colSpan={2}>
                  {fmtPeso(totalDeuda)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
