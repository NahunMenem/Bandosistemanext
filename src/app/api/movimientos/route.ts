import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { toNumber } from '@/lib/db-normalizers';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const cliente_id = searchParams.get('cliente_id');

  if (!cliente_id) return NextResponse.json([]);

  const id = parseInt(cliente_id);

  const [ventas, pagos] = await Promise.all([
    prisma.venta.findMany({
      where: { cliente_id: id },
      include: { items: true },
      orderBy: { fecha: 'desc' },
    }),
    prisma.pagoCliente.findMany({
      where: { cliente_id: id },
      orderBy: { fecha: 'desc' },
    }),
  ]);

  const movimientos = [
    ...ventas.map((v) => ({
      tipo: 'venta' as const,
      ...v,
      fecha: v.fecha?.toISOString() ?? new Date(0).toISOString(),
      total: toNumber(v.total),
      pago_a_cuenta: toNumber(v.pago_a_cuenta),
      saldo_resultante: toNumber(v.saldo_resultante),
      metodo_pago: v.metodo_pago ?? 'efectivo',
      items: v.items.map((item) => ({
        ...item,
        cantidad: item.cantidad ?? 0,
        descripcion: item.descripcion ?? '',
        precio_unitario: toNumber(item.precio_unitario),
        total: toNumber(item.total),
      })),
    })),
    ...pagos.map((p) => ({
      tipo: 'pago' as const,
      ...p,
      fecha: p.fecha?.toISOString() ?? new Date(0).toISOString(),
      monto: toNumber(p.monto),
      metodo_pago: p.metodo_pago ?? 'efectivo',
    })),
  ].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  return NextResponse.json(movimientos);
}
