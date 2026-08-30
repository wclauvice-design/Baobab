import { PrismaClient, Role, SellerStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.upsert({
    where: { phone: '+2250700000001' },
    update: {},
    create: { phone: '+2250700000001', role: Role.ADMIN, country: 'CI' },
  });

  const sellerUser = await prisma.user.upsert({
    where: { phone: '+2250700000002' },
    update: {},
    create: { phone: '+2250700000002', role: Role.SELLER, country: 'CI' },
  });

  const seller = await prisma.seller.upsert({
    where: { userId: sellerUser.id },
    update: {},
    create: {
      userId: sellerUser.id,
      shopName: 'Atelier Kita',
      city: 'Abidjan',
      status: SellerStatus.APPROVED,
    },
  });

  await prisma.user.upsert({
    where: { phone: '+2250700000003' },
    update: {},
    create: { phone: '+2250700000003', role: Role.BUYER, country: 'CI' },
  });

  const categories = await Promise.all(
    [
      { name: 'Mode & Accessoires', slug: 'mode-accessoires' },
      { name: 'Maison & Cuisine', slug: 'maison-cuisine' },
      { name: 'Électronique', slug: 'electronique' },
      { name: 'Beauté & Bien-être', slug: 'beaute-bien-etre' },
    ].map((c) =>
      prisma.category.upsert({ where: { slug: c.slug }, update: {}, create: c }),
    ),
  );

  const products = [
    {
      name: 'Boubou brodé homme',
      description: 'Boubou traditionnel en bazin riche, broderie artisanale.',
      price: 25000,
      stock: 12,
      categoryId: categories[0].id,
      sellerId: seller.id,
      images: [],
    },
    {
      name: 'Sac à main tissé raphia',
      description: "Sac artisanal tissé main, fabriqué par des coopératives locales.",
      price: 12000,
      stock: 20,
      categoryId: categories[0].id,
      sellerId: seller.id,
      images: [],
    },
    {
      name: 'Service à café en calebasse',
      description: 'Ensemble de service décoratif en calebasse peinte.',
      price: 8000,
      stock: 15,
      categoryId: categories[1].id,
      sellerId: null,
      images: [],
    },
    {
      name: 'Enceinte Bluetooth portable',
      description: '10h autonomie, résistante à la poussière.',
      price: 18000,
      stock: 30,
      categoryId: categories[2].id,
      sellerId: null,
      images: [],
    },
    {
      name: 'Beurre de karité pur 500g',
      description: 'Beurre de karité brut, non raffiné, origine Burkina Faso.',
      price: 3500,
      stock: 50,
      categoryId: categories[3].id,
      sellerId: seller.id,
      images: [],
    },
  ];

  for (const p of products) {
    const existing = await prisma.product.findFirst({ where: { name: p.name } });
    if (!existing) {
      await prisma.product.create({ data: p });
    }
  }

  console.log('Seed complete. Admin phone:', admin.phone, '/ Seller phone:', sellerUser.phone);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
