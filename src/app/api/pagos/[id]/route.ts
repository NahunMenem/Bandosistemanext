import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { toNumber } from '@/lib/db-normalizers';
import { getClientBalanceMaps } from '@/lib/client-balances';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const pago = await prisma.pagoCliente.findUnique({
    where: { id: parseInt(params.id) },
    include: { cliente: true },
  });

  if (!pago) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  const saldos = await getClientBalanceMaps([pago.cliente_id]);

  return NextResponse.json({
    ...pago,
    fecha: pago.fecha?.toISOString() ?? new Date(0).toISOString(),
    monto: toNumber(pago.monto),
    metodo_pago: pago.metodo_pago ?? 'efectivo',
    saldo_posterior: saldos.get(pago.cliente_id) ?? 0,
  });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  await prisma.pagoCliente.delete({ where: { id: parseInt(params.id) } });
  return NextResponse.json({ ok: true });
}
