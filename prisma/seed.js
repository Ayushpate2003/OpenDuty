import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding database...');

    const adminEmail = 'admin@openduty.io';

    const existingAdmin = await prisma.user.findUnique({
        where: { email: adminEmail }
    });

    if (!existingAdmin) {
        await prisma.user.create({
            data: {
                email: adminEmail,
                password: 'password',
                name: 'Admin User',
                role: 'ADMIN',
                teamId: 'team-platform',
            }
        });
        console.log('Created admin user: admin@openduty.io');
    }

    const engineerEmail = 'user@openduty.io';
    const existingEngineer = await prisma.user.findUnique({
        where: { email: engineerEmail }
    });

    if (!existingEngineer) {
        await prisma.user.create({
            data: {
                email: engineerEmail,
                password: 'password',
                name: 'Regular Engineer',
                role: 'ENGINEER',
                teamId: 'team-platform',
            }
        });
        console.log('Created engineer user: user@openduty.io');
    }

    console.log('Seeding complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
