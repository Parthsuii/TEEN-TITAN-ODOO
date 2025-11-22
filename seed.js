// server/seed.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Clear old data safely
  try {
    await prisma.stockMovement.deleteMany();
    await prisma.stockItem.deleteMany();
    await prisma.location.deleteMany();
    await prisma.product.deleteMany();
  } catch (e) {
    console.log("Database was clean.");
  }

  // Create Locations with specific IDs matching Frontend
  await prisma.location.create({
    data: { id: 'loc1', name: 'Main Warehouse', type: 'internal' }
  });

  await prisma.location.create({
    data: { id: 'loc2', name: 'Production Floor', type: 'internal' }
  });

  // Create Dummy Product
  const product = await prisma.product.create({
    data: {
      name: 'Steel Rods 20mm',
      sku: 'ST-2025',
      category: 'Raw Material',
      cost: 15.00,
      price: 25.00
    }
  });

  console.log("✅ Database seeded!");
  console.log("👉 Use this Product ID: " + product.id);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());;