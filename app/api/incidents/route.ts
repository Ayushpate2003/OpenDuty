import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const teamId = searchParams.get('teamId');
  const role = searchParams.get('role');

  const where = (role === 'ADMIN' || !teamId) ? {} : { teamId };

  const incidents = await prisma.incident.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(incidents);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const incident = await prisma.incident.create({
      data: {
        title: body.title,
        description: body.description,
        severity: body.severity,
        commander: body.commander,
        teamId: body.teamId,
        status: 'OPEN',
      },
    });

    // Create initial timeline event
    await prisma.timelineEvent.create({
      data: {
        incidentId: incident.id,
        type: 'STATUS_CHANGE',
        content: `Incident started. Severity: ${body.severity}`,
        author: 'System',
      },
    });

    return NextResponse.json(incident);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create incident' }, { status: 500 });
  }
}