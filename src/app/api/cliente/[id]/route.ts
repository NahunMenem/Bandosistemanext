import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { toNumber } from '@/lib/db-normalizers';
import { getClientBalanceMaps } from '@/lib/client-balances';

// Quick lookup endpoint used by ventas page (same as Flask /api/cliente/<id>)
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const cliente = await prisma.cliente.findUnique({
    where: { id: parseInt(params.id) },
  });

  if (!cliente) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  const saldos = await getClientBalanceMaps([cliente.id]);
  const saldo = saldos.get(cliente.id) ?? 0;

  return NextResponse.json({
    id: cliente.id,
    nombre: cliente.nombre,
    monto_autorizado: toNumber(cliente.monto_autorizado),
    saldo,
  });
}
