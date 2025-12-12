import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const events = await prisma.timelineEvent.findMany({
    where: { incidentId: params.id },
    orderBy: { createdAt: 'desc' }, // Latest first
  });

  return NextResponse.json(events);
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();
  
  const event = await prisma.timelineEvent.create({
    data: {
      incidentId: params.id,
      type: body.type,
      content: body.content,
      author: body.author,
    },
  });

  return NextResponse.json(event);
}