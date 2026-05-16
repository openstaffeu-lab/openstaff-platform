const { PrismaClient, Role, AccountApprovalStatus, AccountLifecycleStatus } = require('@prisma/client');
const bcrypt = require('bcrypt');

async function main() {
  const prisma = new PrismaClient();
  const email = process.env.EXEC15_SUPERADMIN_EMAIL || 'exec15-backoffice@openstaff.eu';
  const password = process.env.EXEC15_SUPERADMIN_PASSWORD || 'Exec15!Backoffice2026';
  const passwordHash = bcrypt.hashSync(password, 10);

  await prisma.user.upsert({
    where: { email },
    update: {
      password: passwordHash,
      role: Role.SUPERADMIN,
      approvalStatus: AccountApprovalStatus.APPROVED,
      accountStatus: AccountLifecycleStatus.LIVE,
    },
    create: {
      email,
      password: passwordHash,
      role: Role.SUPERADMIN,
      approvalStatus: AccountApprovalStatus.APPROVED,
      accountStatus: AccountLifecycleStatus.LIVE,
    },
  });

  await prisma.$disconnect();
  console.log(JSON.stringify({ email, role: 'SUPERADMIN' }));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
