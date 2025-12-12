import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const runbooks = await prisma.runbook.findMany({
    include: { steps: true },
  });
  return NextResponse.json(runbooks);
}

export async function POST(request: Request) {
  const body = await request.json();
  
  // Upsert logic for simple editing
  if (body.id && !body.id.startsWith('rb-')) { // Check if it's a real DB ID (UUID) vs mock ID
     const existing = await prisma.runbook.findUnique({ where: { id: body.id }});
     if (existing) {
        // Simple update: delete old steps and recreate (for prototype simplicity)
        await prisma.runbookStep.deleteMany({ where: { runbookId: body.id }});
        const updated = await prisma.runbook.update({
            where: { id: body.id },
            data: {
                name: body.name,
                steps: {
                    create: body.steps.map((s: any) => ({
                        title: s.title,
                        description: s.description,
                        type: s.type,
                        target: s.target,
                        autoExecute: s.autoExecute || false
                    }))
                }
            },
            include: { steps: true }
        });
        return NextResponse.json(updated);
     }
  }

  const runbook = await prisma.runbook.create({
    data: {
      name: body.name,
      steps: {
        create: body.steps.map((s: any) => ({
          title: s.title,
          description: s.description,
          type: s.type,
          target: s.target,
          autoExecute: s.autoExecute || false
        })),
      },
    },
    include: { steps: true },
  });

  return NextResponse.json(runbook);
}