import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const channels = await prisma.notificationChannel.findMany();
  return NextResponse.json(channels);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, type, name, config, enabled } = body;

    let channel;
    if (id) {
        channel = await prisma.notificationChannel.update({
            where: { id },
            data: { type, name, config, enabled }
        });
    } else {
        channel = await prisma.notificationChannel.create({
            data: { type, name, config, enabled }
        });
    }
    return NextResponse.json(channel);
  } catch (error) {
    console.error("Integration Save Error:", error);
    return NextResponse.json({ error: 'Failed to save integration' }, { status: 500 });
  }
}