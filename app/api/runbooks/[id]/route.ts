import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const runbook = await prisma.runbook.findUnique({
    where: { id: params.id },
    include: { steps: true },
  });

  if (!runbook) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(runbook);
}