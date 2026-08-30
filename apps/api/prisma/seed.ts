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

  const buyer = await prisma.user.upsert({
    where: { phone: '+2250700000003' },
    update: {},
    create: { phone: '+2250700000003', role: Role.BUYER, country: 'CI' },
  });

  await prisma.address.upsert({
    where: { id: 'seed-address-buyer-1' },
    update: {},
    create: {
      id: 'seed-address-buyer-1',
      buyerId: buyer.id,
      label: 'Domicile',
      fullAddress: 'Cocody Angré, Rue des Jardins, Villa 12',
      city: 'Abidjan',
      isDefault: true,
    },
  });

  await prisma.coupon.upsert({
    where: { id: 'seed-coupon-buyer-1' },
    update: {},
    create: {
      id: 'seed-coupon-buyer-1',
      buyerId: buyer.id,
      label: 'Bienvenue sur Baobab',
      discountAmount: 1000,
    },
  });

  await prisma.follow.upsert({
    where: { buyerId_sellerId: { buyerId: buyer.id, sellerId: seller.id } },
    update: {},
    create: { buyerId: buyer.id, sellerId: seller.id },
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
      price: 9000,
      compareAtPrice: 12000,
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
      price: 14500,
      compareAtPrice: 18000,
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
    if (existing) {
      // Ne touche pas au stock : il reflète les vraies commandes passées en test.
      await prisma.product.update({
        where: { id: existing.id },
        data: { price: p.price, compareAtPrice: p.compareAtPrice ?? null, description: p.description },
      });
    } else {
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
