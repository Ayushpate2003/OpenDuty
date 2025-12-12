import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  const body = await request.json();
  
  const job = await prisma.job.create({
    data: {
      type: body.type,
      payload: body.payload,
      status: 'PENDING',
    },
  });

  return NextResponse.json(job);
}