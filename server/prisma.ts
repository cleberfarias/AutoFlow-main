let prisma = null;
(async () => {
  try {
    const mod = await import('@prisma/client');
    const { PrismaClient } = mod;
    prisma = new PrismaClient();
  } catch (err) {
    // Prisma client not generated or not installed yet
    console.warn('Prisma client not available:', err?.message || err);
  }
})();

export default prisma;