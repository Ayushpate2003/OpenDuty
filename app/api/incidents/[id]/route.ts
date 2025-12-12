import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const incident = await prisma.incident.findUnique({
    where: { id: params.id },
  });

  if (!incident) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(incident);
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();
  
  const incident = await prisma.incident.update({
    where: { id: params.id },
    data: {
      status: body.status,
    },
  });

  if (body.status) {
    await prisma.timelineEvent.create({
      data: {
        incidentId: incident.id,
        type: 'STATUS_CHANGE',
        content: `Status updated to ${body.status}`,
        author: 'System',
      },
    });
  }

  return NextResponse.json(incident);
}