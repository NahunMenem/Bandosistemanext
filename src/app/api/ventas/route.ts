import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { toNumber } from '@/lib/db-normalizers';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const body = await req.json();
  const { cliente_id, items, pago_a_cuenta, metodo_pago, descripcion } = body;

  const total = items.reduce(
    (acc: number, item: { cantidad: number; precio_unitario: number }) =>
      acc + item.cantidad * item.precio_unitario,
    0
  );

  // Calculate previous debt
  const clienteData = await prisma.cliente.findUnique({
    where: { id: parseInt(cliente_id) },
    include: { ventas: true, pagos: true },
  });
  if (!clienteData) return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });

  const totalVentasAnt = clienteData.ventas.reduce((a, v) => a + toNumber(v.total), 0);
  const totalPagosACuenta = clienteData.ventas.reduce((a, v) => a + toNumber(v.pago_a_cuenta), 0);
  const totalPagos = clienteData.pagos.reduce((a, p) => a + toNumber(p.monto), 0);
  const saldo_anterior = totalVentasAnt - totalPagosACuenta - totalPagos;

  const pagoACuenta = parseFloat(pago_a_cuenta) || 0;
  const saldo_resultante = total - pagoACuenta + saldo_anterior;

  const venta = await prisma.venta.create({
    data: {
      cliente_id: parseInt(cliente_id),
      total,
      pago_a_cuenta: pagoACuenta,
      saldo_resultante,
      descripcion: descripcion || null,
      metodo_pago: metodo_pago || 'efectivo',
      fecha: new Date(),
      items: {
        create: items.map((item: { cantidad: number; descripcion: string; precio_unitario: number }) => ({
          cantidad: item.cantidad,
          descripcion: item.descripcion,
          precio_unitario: item.precio_unitario,
          total: item.cantidad * item.precio_unitario,
        })),
      },
    },
    include: { items: true, cliente: true },
  });

  return NextResponse.json({ id: venta.id, redirectUrl: `/comprobante/${venta.id}` }, { status: 201 });
}
