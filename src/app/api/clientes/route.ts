import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { toNumber } from '@/lib/db-normalizers';
import { getClientBalanceMaps } from '@/lib/client-balances';

function cleanText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function parseOptionalDecimal(value: unknown) {
  const cleanValue = cleanText(value);
  if (!cleanValue) return null;

  const parsed = Number(cleanValue);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const clientes = await prisma.cliente.findMany({
    include: { garante: true },
    orderBy: { nombre: 'asc' },
  });
  const saldos = await getClientBalanceMaps(clientes.map((cliente) => cliente.id));

  const result = clientes.map((c) => {
    return {
      ...c,
      ingresos: c.ingresos ? toNumber(c.ingresos) : null,
      monto_autorizado: c.monto_autorizado ? toNumber(c.monto_autorizado) : null,
      garante: c.garante[0] ?? null,
      saldo_deudor: saldos.get(c.id) ?? 0,
    };
  });

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const body = await req.json();
  const { garante: garanteData, ...clienteData } = body;
  const nombre = cleanText(clienteData.nombre);
  const documento = cleanText(clienteData.documento);

  if (!nombre || !documento) {
    return NextResponse.json(
      { error: 'Nombre y documento son obligatorios.' },
      { status: 400 }
    );
  }

  const clienteExistente = await prisma.cliente.findFirst({
    where: { documento },
    select: { id: true, nombre: true },
  });

  if (clienteExistente) {
    return NextResponse.json(
      { error: `Ya existe un cliente con el documento ${documento}: ${clienteExistente.nombre || 'sin nombre'}.` },
      { status: 409 }
    );
  }

  const cliente = await prisma.cliente.create({
    data: {
      nombre,
      documento,
      domicilio: cleanText(clienteData.domicilio) || null,
      localidad: cleanText(clienteData.localidad) || null,
      telefono: cleanText(clienteData.telefono) || null,
      ingresos: parseOptionalDecimal(clienteData.ingresos),
      lugar_trabajo: cleanText(clienteData.lugar_trabajo) || null,
      monto_autorizado: parseOptionalDecimal(clienteData.monto_autorizado),
      garante: garanteData?.nombre
        ? {
          create: {
              nombre: cleanText(garanteData.nombre) || null,
              documento: cleanText(garanteData.documento) || null,
              domicilio: cleanText(garanteData.domicilio) || null,
              localidad: cleanText(garanteData.localidad) || null,
              telefono: cleanText(garanteData.telefono) || null,
              ingresos: parseOptionalDecimal(garanteData.ingresos),
              lugar_trabajo: cleanText(garanteData.lugar_trabajo) || null,
            },
          }
        : undefined,
    },
    include: { garante: true },
  });

  return NextResponse.json({ ...cliente, garante: cliente.garante[0] ?? null }, { status: 201 });
}
