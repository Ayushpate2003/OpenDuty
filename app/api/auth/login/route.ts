import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    // --- AUTO-SEED FOR DEMO ---
    // Check if the specific user exists, if not and DB is empty, seed defaults.
    try {
      const userCount = await prisma.user.count();
      if (userCount === 0) {
        console.log('Database empty. Seeding default users...');
        await prisma.user.createMany({
          data: [
            {
              email: 'admin@openduty.io',
              password: 'password', // In production, use bcrypt hash
              name: 'Admin User',
              role: 'ADMIN',
              teamId: 'team-platform',
            },
            {
              email: 'user@openduty.io',
              password: 'password',
              name: 'Regular Engineer',
              role: 'ENGINEER',
              teamId: 'team-platform',
            },
          ],
        });
      }
    } catch (seedError) {
      console.warn('Auto-seeding skipped due to DB error (likely migration missing):', seedError);
      // Fallthrough to attempt login, though it will likely fail if DB is down
    }
    // --------------------------

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || user.password !== password) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Exclude password from response
    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}