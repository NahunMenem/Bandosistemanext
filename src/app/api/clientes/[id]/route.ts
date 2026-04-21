import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { toNumber } from '@/lib/db-normalizers';

function cleanText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function parseOptionalDecimal(value: unknown) {
  const cleanValue = cleanText(value);
  if (!cleanValue) return null;

  const parsed = Number(cleanValue);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const cliente = await prisma.cliente.findUnique({
    where: { id: parseInt(params.id) },
    include: { garante: true, ventas: true, pagos: true },
  });

  if (!cliente) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

  const totalVentas = cliente.ventas.reduce((a, v) => a + toNumber(v.total), 0);
  const totalPagosACuenta = cliente.ventas.reduce((a, v) => a + toNumber(v.pago_a_cuenta), 0);
  const totalPagos = cliente.pagos.reduce((a, p) => a + toNumber(p.monto), 0);
  const saldo_deudor = totalVentas - totalPagosACuenta - totalPagos;

  const { ventas, pagos, ...rest } = cliente;
  void ventas; void pagos;
  return NextResponse.json({
    ...rest,
    ingresos: cliente.ingresos ? toNumber(cliente.ingresos) : null,
    monto_autorizado: cliente.monto_autorizado ? toNumber(cliente.monto_autorizado) : null,
    garante: cliente.garante[0] ?? null,
    saldo_deudor,
  });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const body = await req.json();
  const { garante: garanteData, ...clienteData } = body;
  const id = parseInt(params.id);
  const nombre = cleanText(clienteData.nombre);
  const documento = cleanText(clienteData.documento);

  if (!nombre || !documento) {
    return NextResponse.json(
      { error: 'Nombre y documento son obligatorios.' },
      { status: 400 }
    );
  }

  const clienteExistente = await prisma.cliente.findFirst({
    where: {
      documento,
      NOT: { id },
    },
    select: { id: true, nombre: true },
  });

  if (clienteExistente) {
    return NextResponse.json(
      { error: `Ya existe un cliente con el documento ${documento}: ${clienteExistente.nombre || 'sin nombre'}.` },
      { status: 409 }
    );
  }

  const cliente = await prisma.cliente.update({
    where: { id },
    data: {
      nombre,
      domicilio: cleanText(clienteData.domicilio) || null,
      localidad: cleanText(clienteData.localidad) || null,
      documento,
      telefono: cleanText(clienteData.telefono) || null,
      ingresos: parseOptionalDecimal(clienteData.ingresos),
      lugar_trabajo: cleanText(clienteData.lugar_trabajo) || null,
      monto_autorizado: parseOptionalDecimal(clienteData.monto_autorizado),
    },
    include: { garante: true },
  });

  if (garanteData) {
    const garanteExistente = await prisma.garante.findFirst({
      where: { cliente_id: id },
      orderBy: { id: 'asc' },
    });

    await prisma.garante.upsert({
      where: { id: garanteExistente?.id ?? -1 },
      update: {
        nombre: cleanText(garanteData.nombre) || null,
        domicilio: cleanText(garanteData.domicilio) || null,
        localidad: cleanText(garanteData.localidad) || null,
        documento: cleanText(garanteData.documento) || null,
        telefono: cleanText(garanteData.telefono) || null,
        ingresos: parseOptionalDecimal(garanteData.ingresos),
        lugar_trabajo: cleanText(garanteData.lugar_trabajo) || null,
      },
      create: {
        cliente_id: id,
        nombre: cleanText(garanteData.nombre) || null,
        domicilio: cleanText(garanteData.domicilio) || null,
        localidad: cleanText(garanteData.localidad) || null,
        documento: cleanText(garanteData.documento) || null,
        telefono: cleanText(garanteData.telefono) || null,
        ingresos: parseOptionalDecimal(garanteData.ingresos),
        lugar_trabajo: cleanText(garanteData.lugar_trabajo) || null,
      },
    });
  }

  return NextResponse.json(cliente);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const id = parseInt(params.id);

  await prisma.$transaction([
    prisma.ventaItem.deleteMany({ where: { venta: { cliente_id: id } } }),
    prisma.venta.deleteMany({ where: { cliente_id: id } }),
    prisma.pagoCliente.deleteMany({ where: { cliente_id: id } }),
    prisma.garante.deleteMany({ where: { cliente_id: id } }),
    prisma.cliente.delete({ where: { id } }),
  ]);

  return NextResponse.json({ ok: true });
}
