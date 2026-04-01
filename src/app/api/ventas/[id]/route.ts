import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { toNumber } from '@/lib/db-normalizers';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const venta = await prisma.venta.findUnique({
    where: { id: parseInt(params.id) },
    include: {
      items: true,
      cliente: {
        include: { ventas: true, pagos: true },
      },
    },
  });

  if (!venta) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

  // Calculate deuda_anterior (before this sale)
  const otrasVentas = venta.cliente?.ventas.filter((v) => v.id !== venta.id) ?? [];
  const totalVentasAnt = otrasVentas.reduce((a, v) => a + toNumber(v.total), 0);
  const totalPagosACuentaAnt = otrasVentas.reduce((a, v) => a + toNumber(v.pago_a_cuenta), 0);
  const totalPagosAnt = venta.cliente?.pagos.reduce((a, p) => a + toNumber(p.monto), 0) ?? 0;
  const deuda_anterior = totalVentasAnt - totalPagosACuentaAnt - totalPagosAnt;

  return NextResponse.json({
    ...venta,
    fecha: venta.fecha?.toISOString() ?? new Date(0).toISOString(),
    total: toNumber(venta.total),
    pago_a_cuenta: toNumber(venta.pago_a_cuenta),
    saldo_resultante: toNumber(venta.saldo_resultante),
    metodo_pago: venta.metodo_pago ?? 'efectivo',
    deuda_anterior,
    items: venta.items.map((item) => ({
      ...item,
      cantidad: item.cantidad ?? 0,
      descripcion: item.descripcion ?? '',
      precio_unitario: toNumber(item.precio_unitario),
      total: toNumber(item.total),
    })),
  });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  await prisma.venta.delete({ where: { id: parseInt(params.id) } });

  return NextResponse.json({ ok: true });
}
